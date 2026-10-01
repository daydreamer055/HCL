package com.stocksmart.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RfidProductAssignmentRequest(@NotNull @Positive Long productId) {
}
