package com.stocksmart.dto;

import com.stocksmart.entity.SalesOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SalesOrderResponse(
        Long id,
        String orderNumber,
        Long locationId,
        String locationName,
        LocalDateTime orderDate,
        SalesOrderStatus status,
        BigDecimal totalAmount,
        List<SalesOrderItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
