package com.stocksmart.service;

import com.stocksmart.dto.BarcodeRequest;
import com.stocksmart.dto.BarcodeResponse;
import com.stocksmart.dto.BarcodeAssignmentRequest;
import com.stocksmart.dto.BarcodeStatusRequest;
import com.stocksmart.dto.ProductResponse;
import com.stocksmart.entity.BarcodeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BarcodeService {

    BarcodeResponse create(BarcodeRequest request);

    Page<BarcodeResponse> findAll(String barcodeNumber, BarcodeStatus status, Pageable pageable);

    BarcodeResponse findById(Long id);

    BarcodeResponse assignProduct(Long id, BarcodeAssignmentRequest request);

    ProductResponse findProductByBarcode(String barcodeNumber);

    BarcodeResponse updateStatus(Long id, BarcodeStatusRequest request);
}
