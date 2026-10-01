package com.stocksmart.dto;

import java.math.BigDecimal;

public record SupplierReportResponse(
        Long supplierId,
        String supplierCode,
        String supplierName,
        String email,
        String phone,
        Long purchaseOrderCount,
        BigDecimal purchaseAmount
) {
}
