package com.stocksmart.service;

import com.stocksmart.dto.CreatePurchaseOrderRequest;
import com.stocksmart.dto.PurchaseOrderResponse;
import com.stocksmart.dto.UpdatePurchaseOrderStatusRequest;
import com.stocksmart.entity.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PurchaseOrderService {

    PurchaseOrderResponse create(CreatePurchaseOrderRequest request);

    Page<PurchaseOrderResponse> findAll(
            String orderNumber, Long supplierId, Long locationId,
            PurchaseOrderStatus status, Pageable pageable
    );

    PurchaseOrderResponse findById(Long id);

    PurchaseOrderResponse updateStatus(Long id, UpdatePurchaseOrderStatusRequest request);

    PurchaseOrderResponse cancel(Long id);

    PurchaseOrderResponse receive(Long id);
}
