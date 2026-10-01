package com.stocksmart.dto;

import java.math.BigDecimal;

public record InventoryByCategoryResponse(
        Long categoryId,
        String categoryName,
        BigDecimal inventoryQuantity
) {
}
