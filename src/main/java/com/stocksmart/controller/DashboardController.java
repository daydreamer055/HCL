package com.stocksmart.controller;

import com.stocksmart.dto.DashboardDateTotalResponse;
import com.stocksmart.dto.DashboardSummaryResponse;
import com.stocksmart.dto.InventoryByCategoryResponse;
import com.stocksmart.dto.InventoryByLocationResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.LowStockProductResponse;
import com.stocksmart.service.DashboardService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse getSummary() {
        return dashboardService.getSummary();
    }

    @GetMapping("/inventory-by-category")
    public List<InventoryByCategoryResponse> getInventoryByCategory() {
        return dashboardService.getInventoryByCategory();
    }

    @GetMapping("/inventory-by-location")
    public List<InventoryByLocationResponse> getInventoryByLocation() {
        return dashboardService.getInventoryByLocation();
    }

    @GetMapping("/low-stock")
    public Page<LowStockProductResponse> getLowStock(
            @PageableDefault(size = 20, sort = "product.name", direction = Sort.Direction.ASC)
            Pageable pageable
    ) {
        return dashboardService.getLowStock(pageable);
    }

    @GetMapping("/recent-transactions")
    public Page<InventoryTransactionResponse> getRecentTransactions(
            @PageableDefault(size = 10, sort = "transactionAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return dashboardService.getRecentTransactions(pageable);
    }

    @GetMapping("/sales-summary")
    public List<DashboardDateTotalResponse> getSalesSummary() {
        return dashboardService.getSalesSummary();
    }

    @GetMapping("/purchase-summary")
    public List<DashboardDateTotalResponse> getPurchaseSummary() {
        return dashboardService.getPurchaseSummary();
    }
}
