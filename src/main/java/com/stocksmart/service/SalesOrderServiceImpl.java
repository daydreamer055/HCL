package com.stocksmart.service;

import com.stocksmart.dto.CreateSalesOrderRequest;
import com.stocksmart.dto.SalesOrderItemRequest;
import com.stocksmart.dto.SalesOrderItemResponse;
import com.stocksmart.dto.SalesOrderResponse;
import com.stocksmart.dto.UpdateSalesOrderStatusRequest;
import com.stocksmart.entity.Inventory;
import com.stocksmart.entity.InventoryTransaction;
import com.stocksmart.entity.InventoryTransactionType;
import com.stocksmart.entity.Location;
import com.stocksmart.entity.Product;
import com.stocksmart.entity.SalesOrder;
import com.stocksmart.entity.SalesOrderItem;
import com.stocksmart.entity.SalesOrderStatus;
import com.stocksmart.exception.InsufficientStockException;
import com.stocksmart.exception.InvalidInventoryOperationException;
import com.stocksmart.exception.ResourceConflictException;
import com.stocksmart.exception.ResourceNotFoundException;
import com.stocksmart.repository.InventoryRepository;
import com.stocksmart.repository.InventoryTransactionRepository;
import com.stocksmart.repository.LocationRepository;
import com.stocksmart.repository.ProductRepository;
import com.stocksmart.repository.SalesOrderRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;

@Service
@Transactional
public class SalesOrderServiceImpl implements SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;

    public SalesOrderServiceImpl(
            SalesOrderRepository salesOrderRepository,
            ProductRepository productRepository,
            LocationRepository locationRepository,
            InventoryRepository inventoryRepository,
            InventoryTransactionRepository transactionRepository
    ) {
        this.salesOrderRepository = salesOrderRepository;
        this.productRepository = productRepository;
        this.locationRepository = locationRepository;
        this.inventoryRepository = inventoryRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public SalesOrderResponse create(CreateSalesOrderRequest request) {
        String orderNumber = request.orderNumber().trim();
        if (salesOrderRepository.existsByOrderNumberIgnoreCase(orderNumber)) {
            throw new ResourceConflictException("Sales order number is already assigned: " + orderNumber);
        }
        Location location = locationRepository.findById(request.locationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Location not found with id " + request.locationId()));
        validateUniqueProducts(request.items());

        SalesOrder order = new SalesOrder();
        order.setOrderNumber(orderNumber);
        order.setLocation(location);
        order.setOrderDate(request.orderDate() == null ? LocalDateTime.now() : request.orderDate());
        order.setCustomerName(trimToNull(request.customerName()));
        order.setStatus(SalesOrderStatus.PENDING);

        BigDecimal total = BigDecimal.ZERO;
        for (SalesOrderItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with id " + itemRequest.productId()));
            ensureStockAvailable(product, location, itemRequest.quantity());

            BigDecimal subtotal = itemRequest.quantity()
                    .multiply(itemRequest.unitPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            SalesOrderItem item = new SalesOrderItem();
            item.setProduct(product);
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(itemRequest.unitPrice());
            item.setSubtotal(subtotal);
            order.addItem(item);
            total = total.add(subtotal);
        }
        order.setTotalAmount(total);
        return toResponse(salesOrderRepository.save(order));
    }

    @Override
    public Page<SalesOrderResponse> findAll(
            String orderNumber, Long locationId, SalesOrderStatus status, Pageable pageable
    ) {
        Specification<SalesOrder> specification = (root, query, builder) -> builder.conjunction();
        if (orderNumber != null && !orderNumber.isBlank()) {
            String pattern = containsPattern(orderNumber);
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("orderNumber")), pattern, '\\'));
        }
        if (locationId != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("location").get("id"), locationId));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("status"), status));
        }
        return salesOrderRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    public SalesOrderResponse findById(Long id) {
        return toResponse(getOrder(id));
    }

    @Override
    public SalesOrderResponse updateStatus(Long id, UpdateSalesOrderStatusRequest request) {
        SalesOrder order = getOrderForUpdate(id);
        SalesOrderStatus newStatus = request.status();
        if (newStatus == SalesOrderStatus.COMPLETED) {
            throw new InvalidInventoryOperationException(
                    "Use the complete endpoint so inventory is deducted with the order.");
        }
        boolean validTransition = order.getStatus() == newStatus
                || (order.getStatus() == SalesOrderStatus.PENDING
                && (newStatus == SalesOrderStatus.CONFIRMED || newStatus == SalesOrderStatus.CANCELLED))
                || (order.getStatus() == SalesOrderStatus.CONFIRMED
                && newStatus == SalesOrderStatus.CANCELLED);
        if (!validTransition) {
            throw new InvalidInventoryOperationException(
                    "Sales order status cannot change from " + order.getStatus() + " to " + newStatus + ".");
        }
        order.setStatus(newStatus);
        return toResponse(salesOrderRepository.save(order));
    }

    @Override
    public SalesOrderResponse cancel(Long id) {
        SalesOrder order = getOrderForUpdate(id);
        if (order.getStatus() == SalesOrderStatus.COMPLETED) {
            throw new InvalidInventoryOperationException("A completed sales order cannot be cancelled.");
        }
        order.setStatus(SalesOrderStatus.CANCELLED);
        return toResponse(salesOrderRepository.save(order));
    }

    @Override
    public SalesOrderResponse complete(Long id) {
        SalesOrder order = getOrderForUpdate(id);
        if (order.getStatus() == SalesOrderStatus.COMPLETED) {
            return toResponse(order);
        }
        if (order.getStatus() != SalesOrderStatus.CONFIRMED) {
            throw new InvalidInventoryOperationException("Only a confirmed sales order can be completed.");
        }

        List<SalesOrderItem> items = order.getItems();
        List<Inventory> inventoryRows = new ArrayList<>();
        Set<Long> productIds = new TreeSet<>();
        items.forEach(item -> productIds.add(item.getProduct().getId()));

        for (Long productId : productIds) {
            Inventory inventory = inventoryRepository
                    .findByProductAndLocationForUpdate(productId, order.getLocation().getId())
                    .orElseThrow(() -> new InsufficientStockException(
                            "No inventory exists for product " + productId + " at location "
                                    + order.getLocation().getId()));
            inventoryRows.add(inventory);
        }

        for (SalesOrderItem item : items) {
            Inventory inventory = inventoryRows.stream()
                    .filter(row -> row.getProduct().getId().equals(item.getProduct().getId()))
                    .findFirst()
                    .orElseThrow();
            BigDecimal available = inventory.getQuantityOnHand().subtract(inventory.getReservedQuantity());
            if (available.compareTo(item.getQuantity()) < 0) {
                throw new InsufficientStockException("Insufficient available stock for product "
                        + item.getProduct().getId() + " at location " + order.getLocation().getId());
            }
        }

        for (SalesOrderItem item : items) {
            Inventory inventory = inventoryRows.stream()
                    .filter(row -> row.getProduct().getId().equals(item.getProduct().getId()))
                    .findFirst()
                    .orElseThrow();
            inventory.setQuantityOnHand(inventory.getQuantityOnHand().subtract(item.getQuantity()));

            InventoryTransaction transaction = new InventoryTransaction();
            transaction.setProduct(item.getProduct());
            transaction.setLocation(order.getLocation());
            transaction.setTransactionType(InventoryTransactionType.SALE);
            transaction.setQuantity(item.getQuantity());
            transaction.setNotes("Completed sales order " + order.getOrderNumber());
            transactionRepository.save(transaction);
        }
        inventoryRepository.saveAll(inventoryRows);
        order.setStatus(SalesOrderStatus.COMPLETED);
        return toResponse(salesOrderRepository.save(order));
    }

    private void ensureStockAvailable(Product product, Location location, BigDecimal requested) {
        Inventory inventory = inventoryRepository.findByProductAndLocation(product.getId(), location.getId())
                .orElseThrow(() -> new InsufficientStockException(
                        "No inventory exists for product " + product.getId() + " at location " + location.getId()));
        BigDecimal available = inventory.getQuantityOnHand().subtract(inventory.getReservedQuantity());
        if (available.compareTo(requested) < 0) {
            throw new InsufficientStockException("Insufficient available stock for product "
                    + product.getId() + " at location " + location.getId());
        }
    }

    private SalesOrder getOrder(Long id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id " + id));
    }

    private SalesOrder getOrderForUpdate(Long id) {
        return salesOrderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id " + id));
    }

    private SalesOrderResponse toResponse(SalesOrder order) {
        List<SalesOrderItemResponse> items = order.getItems().stream()
                .map(item -> new SalesOrderItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getSku(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()
                ))
                .toList();
        return new SalesOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getLocation().getId(),
                order.getLocation().getName(),
                order.getOrderDate(),
                order.getStatus(),
                order.getTotalAmount(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    private void validateUniqueProducts(List<SalesOrderItemRequest> items) {
        Set<Long> productIds = new HashSet<>();
        for (SalesOrderItemRequest item : items) {
            if (!productIds.add(item.productId())) {
                throw new InvalidInventoryOperationException(
                        "Each product may appear only once in a sales order.");
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
