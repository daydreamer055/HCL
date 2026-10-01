package com.stocksmart.dto;

import com.stocksmart.entity.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 50) String sku,
        @NotBlank @Size(max = 150) String name,
        @Size(max = 1000) String description,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotNull @DecimalMin("0.0") BigDecimal costPrice,
        @NotNull @DecimalMin("0.0") BigDecimal reorderLevel,
        @NotNull @Positive Long categoryId,
        @Positive Long supplierId,
        @Size(max = 100) String barcode,
        @Size(max = 30) String barcodeSymbology,
        @NotNull ProductStatus status
) {
}
