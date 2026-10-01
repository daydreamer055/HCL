package com.stocksmart.service;

import com.stocksmart.dto.LocationRequest;
import com.stocksmart.dto.LocationResponse;
import com.stocksmart.entity.Location;
import com.stocksmart.entity.LocationStatus;
import com.stocksmart.entity.LocationType;
import com.stocksmart.exception.ResourceConflictException;
import com.stocksmart.exception.ResourceNotFoundException;
import com.stocksmart.repository.LocationRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@Transactional
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;

    public LocationServiceImpl(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Override
    public LocationResponse create(LocationRequest request) {
        ensureCodeAvailable(request.locationCode(), null);
        Location location = new Location();
        applyRequest(location, request);
        return toResponse(locationRepository.save(location));
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<LocationResponse> findAll(
            String search, LocationType type, LocationStatus status, Pageable pageable
    ) {
        Specification<Location> specification = (root, query, builder) -> builder.conjunction();
        if (search != null && !search.isBlank()) {
            String pattern = containsPattern(search);
            specification = specification.and((root, query, builder) -> builder.or(
                    builder.like(builder.lower(root.get("name")), pattern, '\\'),
                    builder.like(builder.lower(root.get("code")), pattern, '\\')
            ));
        }
        if (type != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("locationType"), type));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("status"), status));
        }
        return locationRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public LocationResponse findById(Long id) {
        return toResponse(getLocation(id));
    }

    @Override
    public LocationResponse update(Long id, LocationRequest request) {
        Location location = getLocation(id);
        ensureCodeAvailable(request.locationCode(), id);
        applyRequest(location, request);
        return toResponse(locationRepository.save(location));
    }

    @Override
    public void delete(Long id) {
        locationRepository.delete(getLocation(id));
    }

    private void applyRequest(Location location, LocationRequest request) {
        location.setCode(request.locationCode().trim());
        location.setName(request.name().trim());
        location.setLocationType(request.type());
        location.setAddress(trimToNull(request.address()));
        location.setCity(trimToNull(request.city()));
        location.setState(trimToNull(request.state()));
        location.setCountry(trimToNull(request.country()));
        location.setPhone(trimToNull(request.phone()));
        location.setManagerName(trimToNull(request.managerName()));
        location.setStatus(request.status());
    }

    private void ensureCodeAvailable(String code, Long currentLocationId) {
        String normalizedCode = code.trim();
        boolean exists = currentLocationId == null
                ? locationRepository.existsByCodeIgnoreCase(normalizedCode)
                : locationRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, currentLocationId);
        if (exists) {
            throw new ResourceConflictException("Location code is already assigned: " + normalizedCode);
        }
    }

    private Location getLocation(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id " + id));
    }

    private LocationResponse toResponse(Location location) {
        return new LocationResponse(
                location.getId(),
                location.getCode(),
                location.getName(),
                location.getLocationType(),
                location.getAddress(),
                location.getCity(),
                location.getState(),
                location.getCountry(),
                location.getPhone(),
                location.getManagerName(),
                location.getStatus(),
                location.getCreatedAt(),
                location.getUpdatedAt()
        );
    }

    private String containsPattern(String value) {
        String escaped = value.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
