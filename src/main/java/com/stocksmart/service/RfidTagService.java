package com.stocksmart.service;

import com.stocksmart.dto.RfidLocationAssignmentRequest;
import com.stocksmart.dto.RfidProductAssignmentRequest;
import com.stocksmart.dto.RfidStatusRequest;
import com.stocksmart.dto.RfidTagRequest;
import com.stocksmart.dto.RfidTagResponse;
import com.stocksmart.entity.RfidTagStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RfidTagService {

    RfidTagResponse register(RfidTagRequest request);

    Page<RfidTagResponse> findAll(String tagCode, RfidTagStatus status, Pageable pageable);

    RfidTagResponse findById(Long id);

    RfidTagResponse findByTagCode(String tagCode);

    RfidTagResponse assignProduct(Long id, RfidProductAssignmentRequest request);

    RfidTagResponse assignLocation(Long id, RfidLocationAssignmentRequest request);

    RfidTagResponse updateStatus(Long id, RfidStatusRequest request);

    RfidTagResponse markLost(Long id);

    RfidTagResponse removeAssignment(Long id);

    RfidTagResponse scan(String tagCode);
}
