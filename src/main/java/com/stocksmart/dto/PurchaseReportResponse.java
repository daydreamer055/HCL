package com.stocksmart.dto;

import java.math.BigDecimal;

public record PurchaseReportResponse(
        String date,
        Long orderCount,
        BigDecimal itemQuantity,
        BigDecimal totalAmount
) {
}
