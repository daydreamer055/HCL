package com.stocksmart.controller;

import com.stocksmart.dto.RfidLocationAssignmentRequest;
import com.stocksmart.dto.RfidProductAssignmentRequest;
import com.stocksmart.dto.RfidStatusRequest;
import com.stocksmart.dto.RfidTagRequest;
import com.stocksmart.dto.RfidTagResponse;
import com.stocksmart.entity.RfidTagStatus;
import com.stocksmart.service.RfidTagService;
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
@RequestMapping("/api/rfid")
@Validated
public class RfidTagController {

    private final RfidTagService rfidTagService;

    public RfidTagController(RfidTagService rfidTagService) {
        this.rfidTagService = rfidTagService;
    }

    @PostMapping("/tags")
    public ResponseEntity<RfidTagResponse> register(@Valid @RequestBody RfidTagRequest request) {
        RfidTagResponse response = rfidTagService.register(request);
        return ResponseEntity.created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(response.id()).toUri()).body(response);
    }

    @GetMapping("/tags")
    public Page<RfidTagResponse> findAll(
            @RequestParam(required = false) String tagCode,
            @RequestParam(required = false) RfidTagStatus status,
            @PageableDefault(size = 20, sort = "tagCode") Pageable pageable
    ) {
        return rfidTagService.findAll(tagCode, status, pageable);
    }

    @GetMapping("/tags/{id}")
    public RfidTagResponse findById(@PathVariable @Positive Long id) {
        return rfidTagService.findById(id);
    }

    @GetMapping("/tag-code/{tagCode}")
    public RfidTagResponse findByTagCode(@PathVariable String tagCode) {
        return rfidTagService.findByTagCode(tagCode);
    }

    @PostMapping("/scan/{tagCode}")
    public RfidTagResponse scan(@PathVariable String tagCode) {
        return rfidTagService.scan(tagCode);
    }

    @PatchMapping("/tags/{id}/product")
    public RfidTagResponse assignProduct(
            @PathVariable @Positive Long id,
            @Valid @RequestBody RfidProductAssignmentRequest request
    ) {
        return rfidTagService.assignProduct(id, request);
    }

    @PatchMapping("/tags/{id}/location")
    public RfidTagResponse assignLocation(
            @PathVariable @Positive Long id,
            @Valid @RequestBody RfidLocationAssignmentRequest request
    ) {
        return rfidTagService.assignLocation(id, request);
    }

    @PatchMapping("/tags/{id}/status")
    public RfidTagResponse updateStatus(
            @PathVariable @Positive Long id,
            @Valid @RequestBody RfidStatusRequest request
    ) {
        return rfidTagService.updateStatus(id, request);
    }

    @PostMapping("/tags/{id}/lost")
    public RfidTagResponse markLost(@PathVariable @Positive Long id) {
        return rfidTagService.markLost(id);
    }

    @PostMapping("/tags/{id}/remove-assignment")
    public RfidTagResponse removeAssignment(@PathVariable @Positive Long id) {
        return rfidTagService.removeAssignment(id);
    }
}
