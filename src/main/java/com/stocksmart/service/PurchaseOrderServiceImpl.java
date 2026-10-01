package com.stocksmart.service;

import com.stocksmart.dto.CreatePurchaseOrderRequest;
import com.stocksmart.dto.PurchaseOrderItemRequest;
import com.stocksmart.dto.PurchaseOrderItemResponse;
import com.stocksmart.dto.PurchaseOrderResponse;
import com.stocksmart.dto.UpdatePurchaseOrderStatusRequest;
import com.stocksmart.entity.Inventory;
import com.stocksmart.entity.InventoryTransaction;
import com.stocksmart.entity.InventoryTransactionType;
import com.stocksmart.entity.Location;
import com.stocksmart.entity.Product;
import com.stocksmart.entity.PurchaseOrder;
import com.stocksmart.entity.PurchaseOrderItem;
import com.stocksmart.entity.PurchaseOrderStatus;
import com.stocksmart.entity.Supplier;
import com.stocksmart.exception.InvalidInventoryOperationException;
import com.stocksmart.exception.ResourceConflictException;
import com.stocksmart.exception.ResourceNotFoundException;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.InventoryTransactionRepository;
import com.stocksmart.repository.LocationRepository;
import com.stocksmart.repository.ProductRepository;
import com.stocksmart.repository.PurchaseOrderRepository;
import com.stocksmart.repository.SupplierRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;

    public PurchaseOrderServiceImpl(
            PurchaseOrderRepository purchaseOrderRepository,
            ProductRepository productRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            InventoryRepository inventoryRepository,
            InventoryTransactionRepository transactionRepository
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.inventoryRepository = inventoryRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public PurchaseOrderResponse create(CreatePurchaseOrderRequest request) {
        String orderNumber = request.orderNumber().trim();
        if (purchaseOrderRepository.existsByOrderNumberIgnoreCase(orderNumber)) {
            throw new ResourceConflictException("Purchase order number is already assigned: " + orderNumber);
        }
        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Supplier not found with id " + request.supplierId()));
        Location location = locationRepository.findById(request.locationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Location not found with id " + request.locationId()));
        validateUniqueProducts(request.items());

        PurchaseOrder order = new PurchaseOrder();
        order.setOrderNumber(orderNumber);
        order.setSupplier(supplier);
        order.setLocation(location);
        order.setOrderDate(request.orderDate() == null ? LocalDateTime.now() : request.orderDate());
        order.setExpectedDate(request.expectedDate());
        order.setNotes(trimToNull(request.notes()));
        order.setStatus(PurchaseOrderStatus.DRAFT);

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseOrderItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with id " + itemRequest.productId()));
            BigDecimal subtotal = itemRequest.quantity().multiply(itemRequest.unitPrice());
            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setProduct(product);
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(itemRequest.unitPrice());
            item.setSubtotal(subtotal);
            order.addItem(item);
            total = total.add(subtotal);
        }
        order.setTotalAmount(total);
        return toResponse(purchaseOrderRepository.save(order));
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<PurchaseOrderResponse> findAll(
            String orderNumber, Long supplierId, Long locationId,
            PurchaseOrderStatus status, Pageable pageable
    ) {
        Specification<PurchaseOrder> specification =
                (root, query, builder) -> builder.conjunction();
        if (orderNumber != null && !orderNumber.isBlank()) {
            String pattern = containsPattern(orderNumber);
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("orderNumber")), pattern, '\\'));
        }
        if (supplierId != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("supplier").get("id"), supplierId));
        }
        if (locationId != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("location").get("id"), locationId));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("status"), status));
        }
        return purchaseOrderRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public PurchaseOrderResponse findById(Long id) {
        return toResponse(getOrder(id));
    }

    @Override
    public PurchaseOrderResponse updateStatus(Long id, UpdatePurchaseOrderStatusRequest request) {
        PurchaseOrder order = getOrderForUpdate(id);
        PurchaseOrderStatus newStatus = request.status();
        if (newStatus == PurchaseOrderStatus.RECEIVED) {
            throw new InvalidInventoryOperationException(
                    "Use the receive endpoint so inventory is updated with the order.");
        }
        boolean validTransition = order.getStatus() == newStatus
                || (order.getStatus() == PurchaseOrderStatus.DRAFT
                && (newStatus == PurchaseOrderStatus.PLACED || newStatus == PurchaseOrderStatus.CANCELLED))
                || (order.getStatus() == PurchaseOrderStatus.PLACED
                && newStatus == PurchaseOrderStatus.CANCELLED);
        if (!validTransition) {
            throw new InvalidInventoryOperationException(
                    "Purchase order status cannot change from " + order.getStatus() + " to " + newStatus + ".");
        }
        order.setStatus(newStatus);
        return toResponse(purchaseOrderRepository.save(order));
    }

    @Override
    public PurchaseOrderResponse cancel(Long id) {
        PurchaseOrder order = getOrderForUpdate(id);
        if (order.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new InvalidInventoryOperationException("A received purchase order cannot be cancelled.");
        }
        order.setStatus(PurchaseOrderStatus.CANCELLED);
        return toResponse(purchaseOrderRepository.save(order));
    }

    @Override
    public PurchaseOrderResponse receive(Long id) {
        PurchaseOrder order = getOrderForUpdate(id);
        if (order.getStatus() == PurchaseOrderStatus.RECEIVED) {
            return toResponse(order);
        }
        if (order.getStatus() != PurchaseOrderStatus.PLACED) {
            throw new InvalidInventoryOperationException("Only a placed purchase order can be received.");
        }

        List<Inventory> inventoryRows = new ArrayList<>();
        for (PurchaseOrderItem item : order.getItems()) {
            Inventory inventory = inventoryRepository
                    .findByProductAndLocationForUpdate(item.getProduct().getId(), order.getLocation().getId())
                    .orElseGet(() -> newInventory(item.getProduct(), order.getLocation()));
            inventory.setQuantityOnHand(inventory.getQuantityOnHand().add(item.getQuantity()));
            inventoryRows.add(inventory);

            InventoryTransaction transaction = new InventoryTransaction();
            transaction.setProduct(item.getProduct());
            transaction.setLocation(order.getLocation());
            transaction.setTransactionType(InventoryTransactionType.PURCHASE);
            transaction.setQuantity(item.getQuantity());
            transaction.setNotes("Received purchase order " + order.getOrderNumber());
            transactionRepository.save(transaction);
        }
        inventoryRepository.saveAll(inventoryRows);
        order.setStatus(PurchaseOrderStatus.RECEIVED);
        return toResponse(purchaseOrderRepository.save(order));
    }

    private Inventory newInventory(Product product, Location location) {
        Inventory inventory = new Inventory();
        inventory.setProduct(product);
        inventory.setLocation(location);
        inventory.setQuantityOnHand(BigDecimal.ZERO);
        inventory.setReservedQuantity(BigDecimal.ZERO);
        inventory.setReorderLevel(product.getReorderLevel());
        return inventory;
    }

    private PurchaseOrder getOrder(Long id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id " + id));
    }

    private PurchaseOrder getOrderForUpdate(Long id) {
        return purchaseOrderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id " + id));
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder order) {
        List<PurchaseOrderItemResponse> items = order.getItems().stream()
                .map(item -> new PurchaseOrderItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getSku(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()
                ))
                .toList();
        return new PurchaseOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getSupplier().getId(),
                order.getSupplier().getCompanyName(),
                order.getLocation().getId(),
                order.getLocation().getName(),
                order.getOrderDate(),
                order.getExpectedDate(),
                order.getStatus(),
                order.getTotalAmount(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    private void validateUniqueProducts(List<PurchaseOrderItemRequest> items) {
        Set<Long> productIds = new HashSet<>();
        for (PurchaseOrderItemRequest item : items) {
            if (!productIds.add(item.productId())) {
                throw new InvalidInventoryOperationException(
                        "Each product may appear only once in a purchase order.");
            }
        }
    }

    private String containsPattern(String value) {
        String escaped = value.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
