package com.stocksmart.dto;

import com.stocksmart.entity.BarcodeStatus;
import com.stocksmart.entity.BarcodeType;

import java.time.LocalDateTime;

public record BarcodeResponse(
        Long id,
        String barcodeNumber,
        Long productId,
        String sku,
        String productName,
        BarcodeType barcodeType,
        BarcodeStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
