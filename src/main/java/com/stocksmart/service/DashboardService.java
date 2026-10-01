package com.stocksmart.service;

import com.stocksmart.dto.DashboardDateTotalResponse;
import com.stocksmart.dto.DashboardSummaryResponse;
import com.stocksmart.dto.InventoryByCategoryResponse;
import com.stocksmart.dto.InventoryByLocationResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.LowStockProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DashboardService {

    DashboardSummaryResponse getSummary();

    List<InventoryByCategoryResponse> getInventoryByCategory();

    List<InventoryByLocationResponse> getInventoryByLocation();

    Page<LowStockProductResponse> getLowStock(Pageable pageable);

    Page<InventoryTransactionResponse> getRecentTransactions(Pageable pageable);

    List<DashboardDateTotalResponse> getSalesSummary();

    List<DashboardDateTotalResponse> getPurchaseSummary();
}
