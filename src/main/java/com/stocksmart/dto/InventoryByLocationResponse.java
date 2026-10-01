package com.stocksmart.dto;

import java.math.BigDecimal;

public record InventoryByLocationResponse(
        Long locationId,
        String locationCode,
        String locationName,
        BigDecimal inventoryQuantity
) {
}
