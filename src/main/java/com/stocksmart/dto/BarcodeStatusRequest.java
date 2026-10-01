package com.stocksmart.dto;

import com.stocksmart.entity.BarcodeStatus;
import jakarta.validation.constraints.NotNull;

public record BarcodeStatusRequest(@NotNull BarcodeStatus status) {
}
