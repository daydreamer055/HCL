package com.stocksmart.service;

import com.stocksmart.dto.InventoryResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.InventoryValuationResponse;
import com.stocksmart.dto.StockAdjustmentRequest;
import com.stocksmart.dto.StockChangeRequest;
import com.stocksmart.dto.StockTransferRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InventoryService {

    Page<InventoryResponse> findInventory(Long productId, Long locationId, String search,
                                          boolean lowStock, boolean outOfStock, Pageable pageable);

    InventoryResponse adjust(StockAdjustmentRequest request);

    InventoryResponse purchase(StockChangeRequest request);

    InventoryResponse sell(StockChangeRequest request);

    void transfer(StockTransferRequest request);

    Page<InventoryTransactionResponse> findTransactions(Long productId, Long locationId, Pageable pageable);

    InventoryValuationResponse valuation(Long productId, Long locationId);
}
