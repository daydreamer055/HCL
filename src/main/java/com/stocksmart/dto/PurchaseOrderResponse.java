package com.stocksmart.dto;

import com.stocksmart.entity.PurchaseOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PurchaseOrderResponse(
        Long id,
        String orderNumber,
        Long supplierId,
        String supplierName,
        Long locationId,
        String locationName,
        LocalDateTime orderDate,
        LocalDateTime expectedDate,
        PurchaseOrderStatus status,
        BigDecimal totalAmount,
        List<PurchaseOrderItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
