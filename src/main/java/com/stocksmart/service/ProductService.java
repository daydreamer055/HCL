package com.stocksmart.service;

import com.stocksmart.dto.ProductRequest;
import com.stocksmart.dto.ProductResponse;
import com.stocksmart.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    ProductResponse create(ProductRequest request);

    Page<ProductResponse> findAll(String name, String sku, Long categoryId, ProductStatus status, Pageable pageable);

    ProductResponse findById(Long id);

    ProductResponse update(Long id, ProductRequest request);

    void delete(Long id);
}
