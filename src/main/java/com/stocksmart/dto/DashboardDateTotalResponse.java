package com.stocksmart.dto;

import java.math.BigDecimal;

public record DashboardDateTotalResponse(
        String date,
        BigDecimal totalAmount
) {
}
