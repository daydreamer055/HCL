package com.stocksmart.service;

import com.stocksmart.dto.RfidLocationAssignmentRequest;
import com.stocksmart.dto.RfidProductAssignmentRequest;
import com.stocksmart.dto.RfidStatusRequest;
import com.stocksmart.dto.RfidTagRequest;
import com.stocksmart.dto.RfidTagResponse;
import com.stocksmart.entity.Location;
import com.stocksmart.entity.Product;
import com.stocksmart.entity.RfidTag;
import com.stocksmart.entity.RfidTagStatus;
import com.stocksmart.exception.InvalidInventoryOperationException;
import com.stocksmart.exception.ResourceConflictException;
import com.stocksmart.exception.ResourceNotFoundException;
import com.stocksmart.repository.LocationRepository;
import com.stocksmart.repository.ProductRepository;
import com.stocksmart.repository.RfidTagRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@Transactional
public class RfidTagServiceImpl implements RfidTagService {

    private final RfidTagRepository rfidTagRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;

    public RfidTagServiceImpl(
            RfidTagRepository rfidTagRepository,
            ProductRepository productRepository,
            LocationRepository locationRepository
    ) {
        this.rfidTagRepository = rfidTagRepository;
        this.productRepository = productRepository;
        this.locationRepository = locationRepository;
    }

    @Override
    public RfidTagResponse register(RfidTagRequest request) {
        String code = request.tagCode().trim();
        if (rfidTagRepository.existsByTagCodeIgnoreCase(code)) {
            throw new ResourceConflictException("RFID tag is already registered: " + code);
        }
        RfidTag tag = new RfidTag();
        tag.setTagCode(code);
        tag.setStatus(RfidTagStatus.UNASSIGNED);
        return toResponse(rfidTagRepository.save(tag));
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<RfidTagResponse> findAll(String tagCode, RfidTagStatus status, Pageable pageable) {
        Specification<RfidTag> specification = (root, query, builder) -> builder.conjunction();
        if (tagCode != null && !tagCode.isBlank()) {
            String pattern = containsPattern(tagCode);
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("tagCode")), pattern, '\\'));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("status"), status));
        }
        return rfidTagRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public RfidTagResponse findById(Long id) {
        return toResponse(getTag(id));
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public RfidTagResponse findByTagCode(String tagCode) {
        return toResponse(getTagByCode(tagCode));
    }

    @Override
    public RfidTagResponse assignProduct(Long id, RfidProductAssignmentRequest request) {
        RfidTag tag = getTag(id);
        ensureAssignable(tag);
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product not found with id " + request.productId()));
        tag.setProduct(product);
        markAssigned(tag);
        return toResponse(rfidTagRepository.save(tag));
    }

    @Override
    public RfidTagResponse assignLocation(Long id, RfidLocationAssignmentRequest request) {
        RfidTag tag = getTag(id);
        ensureAssignable(tag);
        Location location = locationRepository.findById(request.locationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Location not found with id " + request.locationId()));
        tag.setLocation(location);
        markAssigned(tag);
        return toResponse(rfidTagRepository.save(tag));
    }

    @Override
    public RfidTagResponse updateStatus(Long id, RfidStatusRequest request) {
        RfidTag tag = getTag(id);
        RfidTagStatus newStatus = request.status();
        if (newStatus == RfidTagStatus.UNASSIGNED
                && (tag.getProduct() != null || tag.getLocation() != null)) {
            throw new InvalidInventoryOperationException(
                    "Remove the tag assignment before setting status to UNASSIGNED.");
        }
        if (newStatus == RfidTagStatus.ACTIVE
                && tag.getProduct() == null && tag.getLocation() == null) {
            throw new InvalidInventoryOperationException(
                    "An RFID tag needs a product or location assignment to be active.");
        }
        tag.setStatus(newStatus);
        return toResponse(rfidTagRepository.save(tag));
    }

    @Override
    public RfidTagResponse markLost(Long id) {
        RfidTag tag = getTag(id);
        tag.setStatus(RfidTagStatus.LOST);
        return toResponse(rfidTagRepository.save(tag));
    }

    @Override
    public RfidTagResponse removeAssignment(Long id) {
        RfidTag tag = getTag(id);
        tag.setProduct(null);
        tag.setLocation(null);
        tag.setAssignedAt(null);
        tag.setStatus(RfidTagStatus.UNASSIGNED);
        return toResponse(rfidTagRepository.save(tag));
    }

    @Override
    public RfidTagResponse scan(String tagCode) {
        RfidTag tag = getTagByCode(tagCode);
        if (tag.getStatus() != RfidTagStatus.ACTIVE) {
            throw new InvalidInventoryOperationException("Only active RFID tags can be scanned.");
        }
        if (tag.getProduct() == null && tag.getLocation() == null) {
            throw new InvalidInventoryOperationException("RFID tag has no product or location assignment.");
        }
        tag.setLastSeenAt(LocalDateTime.now());
        return toResponse(rfidTagRepository.save(tag));
    }

    private void ensureAssignable(RfidTag tag) {
        if (tag.getStatus() == RfidTagStatus.LOST || tag.getStatus() == RfidTagStatus.INACTIVE) {
            throw new InvalidInventoryOperationException(
                    "Reactivate the RFID tag before assigning it.");
        }
    }

    private void markAssigned(RfidTag tag) {
        if (tag.getAssignedAt() == null) {
            tag.setAssignedAt(LocalDateTime.now());
        }
        tag.setStatus(RfidTagStatus.ACTIVE);
    }

    private RfidTag getTag(Long id) {
        return rfidTagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RFID tag not found with id " + id));
    }

    private RfidTag getTagByCode(String tagCode) {
        return rfidTagRepository.findByTagCodeIgnoreCase(tagCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("RFID tag not found: " + tagCode));
    }

    private RfidTagResponse toResponse(RfidTag tag) {
        Product product = tag.getProduct();
        Location location = tag.getLocation();
        return new RfidTagResponse(
                tag.getId(),
                tag.getTagCode(),
                product == null ? null : product.getId(),
                product == null ? null : product.getSku(),
                product == null ? null : product.getName(),
                location == null ? null : location.getId(),
                location == null ? null : location.getCode(),
                location == null ? null : location.getName(),
                tag.getStatus(),
                tag.getAssignedAt(),
                tag.getLastSeenAt(),
                tag.getCreatedAt(),
                tag.getUpdatedAt()
        );
    }

    private String containsPattern(String value) {
        String escaped = value.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
