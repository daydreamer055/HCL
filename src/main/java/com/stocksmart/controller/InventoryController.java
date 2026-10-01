package com.stocksmart.controller;

import com.stocksmart.dto.InventoryResponse;
import com.stocksmart.dto.InventoryTransactionResponse;
import com.stocksmart.dto.InventoryValuationResponse;
import com.stocksmart.dto.StockAdjustmentRequest;
import com.stocksmart.dto.StockChangeRequest;
import com.stocksmart.dto.StockTransferRequest;
import com.stocksmart.service.InventoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/inventory")
@Validated
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public Page<InventoryResponse> getInventory(
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long locationId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean lowStock,
            @RequestParam(defaultValue = "false") boolean outOfStock,
            @PageableDefault(size = 20, sort = "product.name") Pageable pageable
    ) {
        return inventoryService.findInventory(productId, locationId, search, lowStock, outOfStock, pageable);
    }

    @GetMapping("/product/{productId}")
    public Page<InventoryResponse> getByProduct(
            @PathVariable @Positive Long productId,
            @PageableDefault(size = 20, sort = "location.name") Pageable pageable
    ) {
        return inventoryService.findInventory(productId, null, null, false, false, pageable);
    }

    @GetMapping("/location/{locationId}")
    public Page<InventoryResponse> getByLocation(
            @PathVariable @Positive Long locationId,
            @PageableDefault(size = 20, sort = "product.name") Pageable pageable
    ) {
        return inventoryService.findInventory(null, locationId, null, false, false, pageable);
    }

    @GetMapping("/low-stock")
    public Page<InventoryResponse> getLowStock(@PageableDefault(size = 20) Pageable pageable) {
        return inventoryService.findInventory(null, null, null, true, false, pageable);
    }

    @GetMapping("/out-of-stock")
    public Page<InventoryResponse> getOutOfStock(@PageableDefault(size = 20) Pageable pageable) {
        return inventoryService.findInventory(null, null, null, false, true, pageable);
    }

    @PostMapping("/purchases")
    @ResponseStatus(HttpStatus.OK)
    public InventoryResponse purchase(@Valid @RequestBody StockChangeRequest request) {
        return inventoryService.purchase(request);
    }

    @PostMapping("/sales")
    public InventoryResponse sell(@Valid @RequestBody StockChangeRequest request) {
        return inventoryService.sell(request);
    }

    @PostMapping("/adjustments")
    public InventoryResponse adjust(@Valid @RequestBody StockAdjustmentRequest request) {
        return inventoryService.adjust(request);
    }

    @PostMapping("/transfers")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void transfer(@Valid @RequestBody StockTransferRequest request) {
        inventoryService.transfer(request);
    }

    @GetMapping("/transactions")
    public Page<InventoryTransactionResponse> transactions(
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long locationId,
            @PageableDefault(size = 20, sort = "transactionAt") Pageable pageable
    ) {
        return inventoryService.findTransactions(productId, locationId, pageable);
    }

    @GetMapping("/valuation")
    public InventoryValuationResponse valuation(
            @RequestParam(required = false) @Positive Long productId,
            @RequestParam(required = false) @Positive Long locationId
    ) {
        return inventoryService.valuation(productId, locationId);
    }
}
