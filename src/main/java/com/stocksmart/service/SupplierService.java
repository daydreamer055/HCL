package com.stocksmart.service;

import com.stocksmart.dto.SupplierRequest;
import com.stocksmart.dto.SupplierResponse;
import com.stocksmart.entity.SupplierStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SupplierService {

    SupplierResponse create(SupplierRequest request);

    Page<SupplierResponse> findAll(String name, String supplierCode, SupplierStatus status, Pageable pageable);

    SupplierResponse findById(Long id);

    SupplierResponse update(Long id, SupplierRequest request);

    void delete(Long id);
}
