package com.stocksmart.controller;

import com.stocksmart.dto.InventoryReportResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.InventoryValuationReportResponse;
import com.stocksmart.dto.PurchaseReportResponse;
import com.stocksmart.dto.SalesReportResponse;
import com.stocksmart.dto.SupplierReportResponse;
import com.stocksmart.service.ReportService;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@Validated
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/inventory")
    public Page<InventoryReportResponse> inventory(
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long categoryId,
            @RequestParam(required = false) @Positive Long supplierId,
            @RequestParam(required = false) @Positive Long locationId,
            @PageableDefault(size = 50, sort = "product.name") Pageable pageable
    ) {
        return reportService.inventory(productId, categoryId, supplierId, locationId, pageable);
    }

    @GetMapping("/low-stock")
    public Page<InventoryReportResponse> lowStock(
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long categoryId,
            @RequestParam(required = false) @Positive Long supplierId,
            @RequestParam(required = false) @Positive Long locationId,
            @PageableDefault(size = 50, sort = "product.name") Pageable pageable
    ) {
        return reportService.lowStock(productId, categoryId, supplierId, locationId, pageable);
    }

    @GetMapping("/out-of-stock")
    public Page<InventoryReportResponse> outOfStock(
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long categoryId,
            @RequestParam(required = false) @Positive Long supplierId,
            @RequestParam(required = false) @Positive Long locationId,
            @PageableDefault(size = 50, sort = "product.name") Pageable pageable
    ) {
        return reportService.outOfStock(productId, categoryId, supplierId, locationId, pageable);
    }

    @GetMapping("/sales")
    public List<SalesReportResponse> sales(
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @RequestParam(required = false) LocalDate startDate,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long categoryId,
            @RequestParam(required = false) @Positive Long supplierId,
            @RequestParam(required = false) @Positive Long locationId
    ) {
        return reportService.sales(startDate, endDate, productId, categoryId, supplierId, locationId);
    }

    @GetMapping("/purchases")
    public List<PurchaseReportResponse> purchases(
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @RequestParam(required = false) LocalDate startDate,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long categoryId,
            @RequestParam(required = false) @Positive Long supplierId,
            @RequestParam(required = false) @Positive Long locationId
    ) {
        return reportService.purchases(startDate, endDate, productId, categoryId, supplierId, locationId);
    }

    @GetMapping("/suppliers")
    public List<SupplierReportResponse> suppliers(
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @RequestParam(required = false) LocalDate startDate,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long categoryId,
            @RequestParam(required = false) @Positive Long supplierId,
            @RequestParam(required = false) @Positive Long locationId
    ) {
        return reportService.suppliers(startDate, endDate, productId, categoryId, supplierId, locationId);
    }

    @GetMapping("/stock-movements")
    public Page<InventoryTransactionResponse> stockMovements(
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @RequestParam(required = false) LocalDate startDate,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long categoryId,
            @RequestParam(required = false) @Positive Long supplierId,
            @RequestParam(required = false) @Positive Long locationId,
            @PageableDefault(size = 50, sort = "transactionAt") Pageable pageable
    ) {
        return reportService.stockMovements(
                startDate, endDate, productId, categoryId, supplierId, locationId, pageable);
    }

    @GetMapping("/inventory-valuation")
    public Page<InventoryValuationReportResponse> inventoryValuation(
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long categoryId,
            @RequestParam(required = false) @Positive Long locationId,
            @PageableDefault(size = 50, sort = "product.name") Pageable pageable
    ) {
        return reportService.inventoryValuation(productId, categoryId, locationId, pageable);
    }
}
