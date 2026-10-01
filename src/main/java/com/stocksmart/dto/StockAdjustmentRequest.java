package com.stocksmart.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record StockAdjustmentRequest(
        @NotNull @Positive Long productId,
        @NotNull @Positive Long locationId,
        @NotNull BigDecimal quantityDelta,
        @Size(max = 500) String notes
) {
}
