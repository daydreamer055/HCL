package com.stocksmart.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public record CreatePurchaseOrderRequest(
        @NotBlank @Size(max = 40) String orderNumber,
        @NotNull @Positive Long supplierId,
        @NotNull @Positive Long locationId,
        LocalDateTime orderDate,
        LocalDateTime expectedDate,
        @Size(max = 500) String notes,
        @NotEmpty List<@Valid PurchaseOrderItemRequest> items
) {
}
