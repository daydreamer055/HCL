package com.stocksmart.service;

import com.stocksmart.dto.CreateSalesOrderRequest;
import com.stocksmart.dto.SalesOrderResponse;
import com.stocksmart.dto.UpdateSalesOrderStatusRequest;
import com.stocksmart.entity.SalesOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SalesOrderService {

    SalesOrderResponse create(CreateSalesOrderRequest request);

    Page<SalesOrderResponse> findAll(
            String orderNumber, Long locationId, SalesOrderStatus status, Pageable pageable
    );

    SalesOrderResponse findById(Long id);

    SalesOrderResponse updateStatus(Long id, UpdateSalesOrderStatusRequest request);

    SalesOrderResponse cancel(Long id);

    SalesOrderResponse complete(Long id);
}
