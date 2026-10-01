package com.stocksmart.dto;

import java.math.BigDecimal;

public record InventoryValuationReportResponse(
        Long productId,
        String sku,
        String productName,
        Long categoryId,
        String categoryName,
        Long locationId,
        String locationName,
        BigDecimal quantity,
        BigDecimal unitCost,
        BigDecimal totalValue
) {
}
