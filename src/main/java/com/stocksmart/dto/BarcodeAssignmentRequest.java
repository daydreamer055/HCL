package com.stocksmart.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BarcodeAssignmentRequest(@NotNull @Positive Long productId) {
}
