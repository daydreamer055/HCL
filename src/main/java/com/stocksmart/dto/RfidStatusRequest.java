package com.stocksmart.dto;

import com.stocksmart.entity.RfidTagStatus;
import jakarta.validation.constraints.NotNull;

public record RfidStatusRequest(@NotNull RfidTagStatus status) {
}
