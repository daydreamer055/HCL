package com.stocksmart.controller;

import com.stocksmart.dto.CreateSalesOrderRequest;
import com.stocksmart.dto.SalesOrderResponse;
import com.stocksmart.dto.UpdateSalesOrderStatusRequest;
import com.stocksmart.entity.SalesOrderStatus;
import com.stocksmart.service.SalesOrderService;
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
@RequestMapping("/api/sales-orders")
@Validated
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @PostMapping
    public ResponseEntity<SalesOrderResponse> create(@Valid @RequestBody CreateSalesOrderRequest request) {
        SalesOrderResponse response = salesOrderService.create(request);
        return ResponseEntity.created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(response.id()).toUri()).body(response);
    }

    @GetMapping
    public Page<SalesOrderResponse> findAll(
            @RequestParam(required = false) String orderNumber,
            @RequestParam(required = false) @Positive Long locationId,
            @RequestParam(required = false) SalesOrderStatus status,
            @PageableDefault(size = 20, sort = "orderDate") Pageable pageable
    ) {
        return salesOrderService.findAll(orderNumber, locationId, status, pageable);
    }

    @GetMapping("/{id}")
    public SalesOrderResponse findById(@PathVariable @Positive Long id) {
        return salesOrderService.findById(id);
    }

    @PatchMapping("/{id}/status")
    public SalesOrderResponse updateStatus(
            @PathVariable @Positive Long id,
            @Valid @RequestBody UpdateSalesOrderStatusRequest request
    ) {
        return salesOrderService.updateStatus(id, request);
    }

    @PostMapping("/{id}/cancel")
    public SalesOrderResponse cancel(@PathVariable @Positive Long id) {
        return salesOrderService.cancel(id);
    }

    @PostMapping("/{id}/complete")
    public SalesOrderResponse complete(@PathVariable @Positive Long id) {
        return salesOrderService.complete(id);
    }
}
