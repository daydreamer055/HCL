package com.stocksmart.service;

import com.stocksmart.dto.SupplierRequest;
import com.stocksmart.dto.SupplierResponse;
import com.stocksmart.entity.Supplier;
import com.stocksmart.entity.SupplierStatus;
import com.stocksmart.exception.ResourceConflictException;
import com.stocksmart.exception.ResourceNotFoundException;
import com.stocksmart.repository.SupplierRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierServiceImpl(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Override
    public SupplierResponse create(SupplierRequest request) {
        ensureCodeAvailable(request.supplierCode(), null);
        Supplier supplier = new Supplier();
        applyRequest(supplier, request);
        return toResponse(supplierRepository.save(supplier));
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<SupplierResponse> findAll(
            String name, String supplierCode, SupplierStatus status, Pageable pageable
    ) {
        Specification<Supplier> specification = (root, query, builder) -> builder.conjunction();
        if (name != null && !name.isBlank()) {
            String pattern = containsPattern(name);
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("companyName")), pattern, '\\'));
        }
        if (supplierCode != null && !supplierCode.isBlank()) {
            String pattern = containsPattern(supplierCode);
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("supplierCode")), pattern, '\\'));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("status"), status));
        }
        return supplierRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public SupplierResponse findById(Long id) {
        return toResponse(getSupplier(id));
    }

    @Override
    public SupplierResponse update(Long id, SupplierRequest request) {
        Supplier supplier = getSupplier(id);
        ensureCodeAvailable(request.supplierCode(), id);
        applyRequest(supplier, request);
        return toResponse(supplierRepository.save(supplier));
    }

    @Override
    public void delete(Long id) {
        supplierRepository.delete(getSupplier(id));
    }

    private void applyRequest(Supplier supplier, SupplierRequest request) {
        supplier.setSupplierCode(request.supplierCode().trim());
        supplier.setCompanyName(request.name().trim());
        supplier.setContactName(trimToNull(request.contactPerson()));
        supplier.setEmail(trimToNull(request.email()));
        supplier.setPhone(trimToNull(request.phone()));
        supplier.setAddress(trimToNull(request.address()));
        supplier.setCity(trimToNull(request.city()));
        supplier.setState(trimToNull(request.state()));
        supplier.setCountry(trimToNull(request.country()));
        supplier.setStatus(request.status());
    }

    private void ensureCodeAvailable(String code, Long currentSupplierId) {
        String normalizedCode = code.trim();
        boolean exists = currentSupplierId == null
                ? supplierRepository.existsBySupplierCodeIgnoreCase(normalizedCode)
                : supplierRepository.existsBySupplierCodeIgnoreCaseAndIdNot(normalizedCode, currentSupplierId);
        if (exists) {
            throw new ResourceConflictException("Supplier code is already assigned: " + normalizedCode);
        }
    }

    private Supplier getSupplier(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id " + id));
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getSupplierCode(),
                supplier.getCompanyName(),
                supplier.getContactName(),
                supplier.getEmail(),
                supplier.getPhone(),
                supplier.getAddress(),
                supplier.getCity(),
                supplier.getState(),
                supplier.getCountry(),
                supplier.getStatus(),
                supplier.getCreatedAt(),
                supplier.getUpdatedAt()
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
