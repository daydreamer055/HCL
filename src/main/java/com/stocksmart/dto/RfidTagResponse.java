package com.stocksmart.dto;

import com.stocksmart.entity.RfidTagStatus;

import java.time.LocalDateTime;

public record RfidTagResponse(
        Long id,
        String tagCode,
        Long productId,
        String sku,
        String productName,
        Long locationId,
        String locationCode,
        String locationName,
        RfidTagStatus status,
        LocalDateTime assignedAt,
        LocalDateTime lastSeenAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
