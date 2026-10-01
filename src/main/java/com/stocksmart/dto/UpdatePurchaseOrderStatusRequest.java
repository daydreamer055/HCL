package com.stocksmart.dto;

import com.stocksmart.entity.PurchaseOrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePurchaseOrderStatusRequest(
        @NotNull PurchaseOrderStatus status
) {
}
