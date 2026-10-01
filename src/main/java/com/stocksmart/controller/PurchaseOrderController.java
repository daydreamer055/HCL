package com.stocksmart.controller;

import com.stocksmart.dto.CreatePurchaseOrderRequest;
import com.stocksmart.dto.PurchaseOrderResponse;
import com.stocksmart.dto.UpdatePurchaseOrderStatusRequest;
import com.stocksmart.entity.PurchaseOrderStatus;
import com.stocksmart.service.PurchaseOrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/purchase-orders")
@Validated
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> create(
            @Valid @RequestBody CreatePurchaseOrderRequest request
    ) {
        PurchaseOrderResponse response = purchaseOrderService.create(request);
        return ResponseEntity.created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(response.id()).toUri()).body(response);
    }

    @GetMapping
    public Page<PurchaseOrderResponse> findAll(
            @RequestParam(required = false) String orderNumber,
            @RequestParam(required = false) @Positive Long supplierId,
            @RequestParam(required = false) @Positive Long locationId,
            @RequestParam(required = false) PurchaseOrderStatus status,
            @PageableDefault(size = 20, sort = "orderDate") Pageable pageable
    ) {
        return purchaseOrderService.findAll(orderNumber, supplierId, locationId, status, pageable);
    }

    @GetMapping("/{id}")
    public PurchaseOrderResponse findById(@PathVariable @Positive Long id) {
        return purchaseOrderService.findById(id);
    }

    @PatchMapping("/{id}/status")
    public PurchaseOrderResponse updateStatus(
            @PathVariable @Positive Long id,
            @Valid @RequestBody UpdatePurchaseOrderStatusRequest request
    ) {
        return purchaseOrderService.updateStatus(id, request);
    }

    @PostMapping("/{id}/cancel")
    public PurchaseOrderResponse cancel(@PathVariable @Positive Long id) {
        return purchaseOrderService.cancel(id);
    }

    @PostMapping("/{id}/receive")
    public PurchaseOrderResponse receive(@PathVariable @Positive Long id) {
        return purchaseOrderService.receive(id);
    }
}
