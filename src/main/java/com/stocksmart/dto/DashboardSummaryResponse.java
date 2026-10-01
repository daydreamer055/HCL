package com.stocksmart.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
        long totalProducts,
        long totalCategories,
        long totalSuppliers,
        long totalLocations,
        long totalInventoryItems,
        BigDecimal totalInventoryValue,
        long lowStockCount,
        long outOfStockCount,
        long pendingPurchaseOrders,
        long pendingSalesOrders
) {
}
