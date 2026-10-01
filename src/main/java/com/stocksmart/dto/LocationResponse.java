package com.stocksmart.dto;

import com.stocksmart.entity.LocationStatus;
import com.stocksmart.entity.LocationType;

import java.time.LocalDateTime;

public record LocationResponse(
        Long id,
        String locationCode,
        String name,
        LocationType type,
        String address,
        String city,
        String state,
        String country,
        String phone,
        String managerName,
        LocationStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
