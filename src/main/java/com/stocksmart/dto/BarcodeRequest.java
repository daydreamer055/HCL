package com.stocksmart.dto;

import com.stocksmart.entity.BarcodeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BarcodeRequest(
        @NotBlank @Size(max = 100) String barcodeNumber,
        @NotNull BarcodeType barcodeType
) {
}
