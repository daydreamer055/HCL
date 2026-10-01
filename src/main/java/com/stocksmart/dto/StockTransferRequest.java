package com.stocksmart.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record StockTransferRequest(
        @NotNull @Positive Long productId,
        @NotNull @Positive Long sourceLocationId,
        @NotNull @Positive Long destinationLocationId,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal quantity,
        @Size(max = 500) String notes
) {
}
