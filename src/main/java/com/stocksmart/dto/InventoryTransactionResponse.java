package com.stocksmart.dto;

import com.stocksmart.entity.InventoryTransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InventoryTransactionResponse(
        Long id,
        Long productId,
        String sku,
        String productName,
        Long locationId,
        String locationName,
        Long destinationLocationId,
        String destinationLocationName,
        InventoryTransactionType type,
        BigDecimal quantity,
        LocalDateTime transactionAt,
        String notes
) {
}
