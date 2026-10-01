package com.stocksmart.dto;

import com.stocksmart.entity.ProductStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String sku,
        String name,
        String description,
        Long categoryId,
        String category,
        Long supplierId,
        String supplier,
        BigDecimal price,
        BigDecimal costPrice,
        BigDecimal reorderLevel,
        String barcode,
        ProductStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
