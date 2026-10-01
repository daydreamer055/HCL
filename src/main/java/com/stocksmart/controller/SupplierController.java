package com.stocksmart.controller;

import com.stocksmart.dto.SupplierRequest;
import com.stocksmart.dto.SupplierResponse;
import com.stocksmart.entity.SupplierStatus;
import com.stocksmart.service.SupplierService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/suppliers")
@Validated
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @PostMapping
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
        SupplierResponse response = supplierService.create(request);
        return ResponseEntity.created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(response.id()).toUri()).body(response);
    }

    @GetMapping
    public Page<SupplierResponse> findAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String supplierCode,
            @RequestParam(required = false) SupplierStatus status,
            @PageableDefault(size = 20, sort = "companyName") Pageable pageable
    ) {
        return supplierService.findAll(name, supplierCode, status, pageable);
    }

    @GetMapping("/{id}")
    public SupplierResponse findById(@PathVariable @Positive Long id) {
        return supplierService.findById(id);
    }

    @PutMapping("/{id}")
    public SupplierResponse update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody SupplierRequest request
    ) {
        return supplierService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
