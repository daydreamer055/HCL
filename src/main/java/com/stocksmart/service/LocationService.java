package com.stocksmart.service;

import com.stocksmart.dto.LocationRequest;
import com.stocksmart.dto.LocationResponse;
import com.stocksmart.entity.LocationStatus;
import com.stocksmart.entity.LocationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LocationService {

    LocationResponse create(LocationRequest request);

    Page<LocationResponse> findAll(
            String search, LocationType type, LocationStatus status, Pageable pageable
    );

    LocationResponse findById(Long id);

    LocationResponse update(Long id, LocationRequest request);

    void delete(Long id);
}
