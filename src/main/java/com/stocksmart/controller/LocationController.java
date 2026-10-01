package com.stocksmart.controller;

import com.stocksmart.dto.LocationRequest;
import com.stocksmart.dto.LocationResponse;
import com.stocksmart.entity.LocationStatus;
import com.stocksmart.entity.LocationType;
import com.stocksmart.service.LocationService;
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
@RequestMapping("/api/locations")
@Validated
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @PostMapping
    public ResponseEntity<LocationResponse> create(@Valid @RequestBody LocationRequest request) {
        LocationResponse response = locationService.create(request);
        return ResponseEntity.created(ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(response.id()).toUri()).body(response);
    }

    @GetMapping
    public Page<LocationResponse> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LocationType type,
            @RequestParam(required = false) LocationStatus status,
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        return locationService.findAll(search, type, status, pageable);
    }

    @GetMapping("/{id}")
    public LocationResponse findById(@PathVariable @Positive Long id) {
        return locationService.findById(id);
    }

    @PutMapping("/{id}")
    public LocationResponse update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody LocationRequest request
    ) {
        return locationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        locationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
