package com.stocksmart.dto;

import java.math.BigDecimal;

public record InventoryReportResponse(
        Long inventoryId,
        Long productId,
        String sku,
        String productName,
        Long categoryId,
        String categoryName,
        Long supplierId,
        String supplierName,
        Long locationId,
        String locationName,
        BigDecimal quantity,
        BigDecimal reservedQuantity,
        BigDecimal availableQuantity,
        BigDecimal reorderLevel,
        BigDecimal unitCost,
        BigDecimal inventoryValue
) {
}
