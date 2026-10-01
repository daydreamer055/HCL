package com.stocksmart.service;

import com.stocksmart.dto.InventoryReportResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.InventoryValuationReportResponse;
import com.stocksmart.dto.PurchaseReportResponse;
import com.stocksmart.dto.SalesReportResponse;
import com.stocksmart.dto.SupplierReportResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {

    Page<InventoryReportResponse> inventory(
            Long productId, Long categoryId, Long supplierId, Long locationId, Pageable pageable
    );

    Page<InventoryReportResponse> lowStock(
            Long productId, Long categoryId, Long supplierId, Long locationId, Pageable pageable
    );

    Page<InventoryReportResponse> outOfStock(
            Long productId, Long categoryId, Long supplierId, Long locationId, Pageable pageable
    );

    List<SalesReportResponse> sales(
            LocalDate startDate, LocalDate endDate, Long productId, Long categoryId,
            Long supplierId, Long locationId
    );

    List<PurchaseReportResponse> purchases(
            LocalDate startDate, LocalDate endDate, Long productId, Long categoryId,
            Long supplierId, Long locationId
    );

    List<SupplierReportResponse> suppliers(
            LocalDate startDate, LocalDate endDate, Long productId, Long categoryId,
            Long supplierId, Long locationId
    );

    Page<InventoryTransactionResponse> stockMovements(
            LocalDate startDate, LocalDate endDate, Long productId, Long categoryId,
            Long supplierId, Long locationId, Pageable pageable
    );

    Page<InventoryValuationReportResponse> inventoryValuation(
            Long productId, Long categoryId, Long locationId, Pageable pageable
    );
}
