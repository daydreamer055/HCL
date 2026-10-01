package com.stocksmart.dto;

import com.stocksmart.entity.SalesOrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateSalesOrderStatusRequest(
        @NotNull SalesOrderStatus status
) {
}
