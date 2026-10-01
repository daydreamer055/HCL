package com.stocksmart.service;

import com.stocksmart.dto.InventoryResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.InventoryValuationResponse;
import com.stocksmart.dto.StockAdjustmentRequest;
import com.stocksmart.dto.StockChangeRequest;
import com.stocksmart.dto.StockTransferRequest;
import com.stocksmart.entity.Inventory;
import com.stocksmart.entity.InventoryTransaction;
import com.stocksmart.entity.InventoryTransactionType;
import com.stocksmart.entity.Location;
import com.stocksmart.entity.Product;
import com.stocksmart.exception.InsufficientStockException;
import com.stocksmart.exception.InvalidInventoryOperationException;
import com.stocksmart.exception.ResourceNotFoundException;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.InventoryTransactionRepository;
import com.stocksmart.repository.LocationRepository;
import com.stocksmart.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Locale;

@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;

    public InventoryServiceImpl(
            InventoryRepository inventoryRepository,
            InventoryTransactionRepository transactionRepository,
            ProductRepository productRepository,
            LocationRepository locationRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.transactionRepository = transactionRepository;
        this.productRepository = productRepository;
        this.locationRepository = locationRepository;
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<InventoryResponse> findInventory(
            Long productId, Long locationId, String search,
            boolean lowStock, boolean outOfStock, Pageable pageable
    ) {
        Specification<Inventory> specification = (root, query, builder) -> builder.conjunction();
        if (productId != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("product").get("id"), productId));
        }
        if (locationId != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("location").get("id"), locationId));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, builder) -> builder.or(
                    builder.like(builder.lower(root.get("product").get("name")), pattern),
                    builder.like(builder.lower(root.get("product").get("sku")), pattern),
                    builder.like(builder.lower(root.get("location").get("name")), pattern),
                    builder.like(builder.lower(root.get("location").get("code")), pattern)
            ));
        }
        if (lowStock) {
            specification = specification.and((root, query, builder) -> {
                var available = builder.diff(
                        root.<BigDecimal>get("quantityOnHand"),
                        root.<BigDecimal>get("reservedQuantity")
                );
                return builder.and(
                        builder.greaterThan(available, BigDecimal.ZERO),
                        builder.lessThanOrEqualTo(available, root.<BigDecimal>get("reorderLevel"))
                );
            });
        }
        if (outOfStock) {
            specification = specification.and((root, query, builder) -> builder.equal(
                    builder.diff(
                            root.<BigDecimal>get("quantityOnHand"),
                            root.<BigDecimal>get("reservedQuantity")
                    ),
                    BigDecimal.ZERO
            ));
        }
        return inventoryRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    public InventoryResponse purchase(StockChangeRequest request) {
        Inventory inventory = getOrCreateInventory(request.productId(), request.locationId());
        inventory.setQuantityOnHand(inventory.getQuantityOnHand().add(request.quantity()));
        saveTransaction(inventory, InventoryTransactionType.PURCHASE, request.quantity(), request.notes(), null);
        return toResponse(inventoryRepository.save(inventory));
    }

    @Override
    public InventoryResponse sell(StockChangeRequest request) {
        Inventory inventory = getLockedInventory(request.productId(), request.locationId());
        decreaseAvailable(inventory, request.quantity());
        saveTransaction(inventory, InventoryTransactionType.SALE, request.quantity(), request.notes(), null);
        return toResponse(inventoryRepository.save(inventory));
    }

    @Override
    public InventoryResponse adjust(StockAdjustmentRequest request) {
        if (request.quantityDelta().compareTo(BigDecimal.ZERO) == 0) {
            throw new InvalidInventoryOperationException("Adjustment quantity must not be zero.");
        }
        Inventory inventory = getOrCreateInventory(request.productId(), request.locationId());
        BigDecimal delta = request.quantityDelta();
        if (delta.signum() < 0) {
            decreaseAvailable(inventory, delta.abs());
        } else {
            inventory.setQuantityOnHand(inventory.getQuantityOnHand().add(delta));
        }
        saveTransaction(inventory, InventoryTransactionType.ADJUSTMENT, delta, request.notes(), null);
        return toResponse(inventoryRepository.save(inventory));
    }

    @Override
    public void transfer(StockTransferRequest request) {
        if (request.sourceLocationId().equals(request.destinationLocationId())) {
            throw new InvalidInventoryOperationException("Source and destination locations must differ.");
        }
        Inventory source;
        Inventory destination;
        if (request.sourceLocationId() < request.destinationLocationId()) {
            source = getLockedInventory(request.productId(), request.sourceLocationId());
            destination = getOrCreateInventory(request.productId(), request.destinationLocationId());
        } else {
            destination = getOrCreateInventory(request.productId(), request.destinationLocationId());
            source = getLockedInventory(request.productId(), request.sourceLocationId());
        }
        decreaseAvailable(source, request.quantity());
        destination.setQuantityOnHand(destination.getQuantityOnHand().add(request.quantity()));
        inventoryRepository.save(source);
        inventoryRepository.save(destination);
        saveTransaction(source, InventoryTransactionType.TRANSFER, request.quantity(),
                request.notes(), destination.getLocation());
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<InventoryTransactionResponse> findTransactions(
            Long productId, Long locationId, Pageable pageable
    ) {
        Specification<InventoryTransaction> specification =
                (root, query, builder) -> builder.conjunction();
        if (productId != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("product").get("id"), productId));
        }
        if (locationId != null) {
            specification = specification.and((root, query, builder) -> builder.or(
                    builder.equal(root.get("location").get("id"), locationId),
                    builder.equal(root.get("destinationLocation").get("id"), locationId)
            ));
        }
        return transactionRepository.findAll(specification, pageable).map(this::toTransactionResponse);
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public InventoryValuationResponse valuation(Long productId, Long locationId) {
        if (productId != null && !productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id " + productId);
        }
        if (locationId != null && !locationRepository.existsById(locationId)) {
            throw new ResourceNotFoundException("Location not found with id " + locationId);
        }
        BigDecimal total = inventoryRepository.calculateValuation(locationId, productId);
        return new InventoryValuationResponse(locationId, productId, total);
    }

    private Inventory getOrCreateInventory(Long productId, Long locationId) {
        return inventoryRepository.findByProductAndLocationForUpdate(productId, locationId)
                .orElseGet(() -> {
                    Product product = getProduct(productId);
                    Location location = getLocation(locationId);
                    Inventory inventory = new Inventory();
                    inventory.setProduct(product);
                    inventory.setLocation(location);
                    inventory.setQuantityOnHand(BigDecimal.ZERO);
                    inventory.setReservedQuantity(BigDecimal.ZERO);
                    inventory.setReorderLevel(product.getReorderLevel());
                    return inventory;
                });
    }

    private Inventory getLockedInventory(Long productId, Long locationId) {
        return inventoryRepository.findByProductAndLocationForUpdate(productId, locationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No inventory exists for product " + productId + " at location " + locationId));
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    private Location getLocation(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id " + id));
    }

    private void decreaseAvailable(Inventory inventory, BigDecimal amount) {
        BigDecimal available = inventory.getQuantityOnHand().subtract(inventory.getReservedQuantity());
        if (available.compareTo(amount) < 0) {
            throw new InsufficientStockException("Insufficient available stock for product "
                    + inventory.getProduct().getId() + " at location " + inventory.getLocation().getId());
        }
        inventory.setQuantityOnHand(inventory.getQuantityOnHand().subtract(amount));
    }

    private void saveTransaction(
            Inventory inventory, InventoryTransactionType type, BigDecimal quantity, String notes,
            Location destination
    ) {
        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setProduct(inventory.getProduct());
        transaction.setLocation(inventory.getLocation());
        transaction.setDestinationLocation(destination);
        transaction.setTransactionType(type);
        transaction.setQuantity(quantity);
        transaction.setNotes(notes);
        transactionRepository.save(transaction);
    }

    private InventoryResponse toResponse(Inventory inventory) {
        BigDecimal quantity = inventory.getQuantityOnHand();
        BigDecimal reserved = inventory.getReservedQuantity();
        return new InventoryResponse(
                inventory.getId(),
                inventory.getProduct().getId(),
                inventory.getProduct().getSku(),
                inventory.getProduct().getName(),
                inventory.getLocation().getId(),
                inventory.getLocation().getCode(),
                inventory.getLocation().getName(),
                quantity,
                reserved,
                quantity.subtract(reserved),
                inventory.getReorderLevel(),
                inventory.getUpdatedAt()
        );
    }

    private InventoryTransactionResponse toTransactionResponse(InventoryTransaction transaction) {
        Location destination = transaction.getDestinationLocation();
        return new InventoryTransactionResponse(
                transaction.getId(),
                transaction.getProduct().getId(),
                transaction.getProduct().getSku(),
                transaction.getProduct().getName(),
                transaction.getLocation().getId(),
                transaction.getLocation().getName(),
                destination == null ? null : destination.getId(),
                destination == null ? null : destination.getName(),
                transaction.getTransactionType(),
                transaction.getQuantity(),
                transaction.getTransactionAt(),
                transaction.getNotes()
        );
    }
}
