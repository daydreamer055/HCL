package com.stocksmart.dto;

import java.math.BigDecimal;

public record LowStockProductResponse(
        Long productId,
        String sku,
        String productName,
        Long locationId,
        String locationName,
        BigDecimal quantity,
        BigDecimal reservedQuantity,
        BigDecimal availableQuantity,
        BigDecimal reorderLevel
) {
}
