package com.stocksmart.dto;

import com.stocksmart.entity.SupplierStatus;

import java.time.LocalDateTime;

public record SupplierResponse(
        Long id,
        String supplierCode,
        String name,
        String contactPerson,
        String email,
        String phone,
        String address,
        String city,
        String state,
        String country,
        SupplierStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
