package com.stocksmart.controller;

import com.stocksmart.dto.BarcodeRequest;
import com.stocksmart.dto.BarcodeResponse;
import com.stocksmart.dto.BarcodeAssignmentRequest;
import com.stocksmart.dto.BarcodeStatusRequest;
import com.stocksmart.dto.ProductResponse;
import com.stocksmart.entity.BarcodeStatus;
import com.stocksmart.service.BarcodeService;
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
@RequestMapping("/api/barcodes")
@Validated
public class BarcodeController {

    private final BarcodeService barcodeService;

    public BarcodeController(BarcodeService barcodeService) {
        this.barcodeService = barcodeService;
    }

    @PostMapping
    public ResponseEntity<BarcodeResponse> create(@Valid @RequestBody BarcodeRequest request) {
        BarcodeResponse response = barcodeService.create(request);
        return ResponseEntity.created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(response.id()).toUri()).body(response);
    }

    @GetMapping
    public Page<BarcodeResponse> findAll(
            @RequestParam(required = false) String barcodeNumber,
            @RequestParam(required = false) BarcodeStatus status,
            @PageableDefault(size = 20, sort = "barcodeNumber") Pageable pageable
    ) {
        return barcodeService.findAll(barcodeNumber, status, pageable);
    }

    @GetMapping("/scan/{barcodeNumber}")
    public ProductResponse findProductByBarcode(@PathVariable String barcodeNumber) {
        return barcodeService.findProductByBarcode(barcodeNumber);
    }

    @GetMapping("/{id}")
    public BarcodeResponse findById(@PathVariable @Positive Long id) {
        return barcodeService.findById(id);
    }

    @PatchMapping("/{id}/product")
    public BarcodeResponse assignProduct(
            @PathVariable @Positive Long id,
            @Valid @RequestBody BarcodeAssignmentRequest request
    ) {
        return barcodeService.assignProduct(id, request);
    }

    @PatchMapping("/{id}/status")
    public BarcodeResponse updateStatus(
            @PathVariable @Positive Long id,
            @Valid @RequestBody BarcodeStatusRequest request
    ) {
        return barcodeService.updateStatus(id, request);
    }
}
