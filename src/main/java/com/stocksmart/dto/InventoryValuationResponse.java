package com.stocksmart.dto;

import java.math.BigDecimal;

public record InventoryValuationResponse(
        Long locationId,
        Long productId,
        BigDecimal totalValue
) {
}
