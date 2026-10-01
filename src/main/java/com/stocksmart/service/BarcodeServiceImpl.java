package com.stocksmart.service;

import com.stocksmart.dto.BarcodeRequest;
import com.stocksmart.dto.BarcodeResponse;
import com.stocksmart.dto.BarcodeAssignmentRequest;
import com.stocksmart.dto.BarcodeStatusRequest;
import com.stocksmart.dto.ProductResponse;
import com.stocksmart.entity.Barcode;
import com.stocksmart.entity.BarcodeStatus;
import com.stocksmart.entity.Category;
import com.stocksmart.entity.Product;
import com.stocksmart.entity.Supplier;
import com.stocksmart.exception.InvalidInventoryOperationException;
import com.stocksmart.exception.ResourceConflictException;
import com.stocksmart.exception.ResourceNotFoundException;
import com.stocksmart.repository.BarcodeRepository;
import com.stocksmart.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@Transactional
public class BarcodeServiceImpl implements BarcodeService {

    private final BarcodeRepository barcodeRepository;
    private final ProductRepository productRepository;

    public BarcodeServiceImpl(BarcodeRepository barcodeRepository, ProductRepository productRepository) {
        this.barcodeRepository = barcodeRepository;
        this.productRepository = productRepository;
    }

    @Override
    public BarcodeResponse create(BarcodeRequest request) {
        String number = request.barcodeNumber().trim();
        if (barcodeRepository.existsByBarcodeNumberIgnoreCase(number)) {
            throw new ResourceConflictException("Barcode number is already registered: " + number);
        }
        Barcode barcode = new Barcode();
        barcode.setBarcodeNumber(number);
        barcode.setBarcodeType(request.barcodeType());
        return toResponse(barcodeRepository.save(barcode));
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<BarcodeResponse> findAll(String barcodeNumber, BarcodeStatus status, Pageable pageable) {
        Specification<Barcode> specification = (root, query, builder) -> builder.conjunction();
        if (barcodeNumber != null && !barcodeNumber.isBlank()) {
            String pattern = containsPattern(barcodeNumber);
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("barcodeNumber")), pattern, '\\'));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("status"), status));
        }
        return barcodeRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public BarcodeResponse findById(Long id) {
        return toResponse(getBarcode(id));
    }

    @Override
    public BarcodeResponse assignProduct(Long id, BarcodeAssignmentRequest request) {
        Barcode barcode = getBarcode(id);
        Product product = getProduct(request.productId());
        if (barcodeRepository.existsByProductId(product.getId())
                && (barcode.getProduct() == null
                || !barcode.getProduct().getId().equals(product.getId()))) {
            throw new ResourceConflictException("Product already has a barcode.");
        }
        barcode.setProduct(product);
        return toResponse(barcodeRepository.save(barcode));
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public ProductResponse findProductByBarcode(String barcodeNumber) {
        Barcode barcode = barcodeRepository.findByBarcodeNumberIgnoreCase(barcodeNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Barcode not found: " + barcodeNumber));
        if (barcode.getStatus() != BarcodeStatus.ACTIVE) {
            throw new InvalidInventoryOperationException("Barcode is inactive.");
        }
        if (barcode.getProduct() == null) {
            throw new ResourceNotFoundException("Barcode is not assigned to a product.");
        }
        return toProductResponse(barcode.getProduct(), barcode);
    }

    @Override
    public BarcodeResponse updateStatus(Long id, BarcodeStatusRequest request) {
        Barcode barcode = getBarcode(id);
        barcode.setStatus(request.status());
        return toResponse(barcodeRepository.save(barcode));
    }

    private Barcode getBarcode(Long id) {
        return barcodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Barcode not found with id " + id));
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    private BarcodeResponse toResponse(Barcode barcode) {
        Product product = barcode.getProduct();
        return new BarcodeResponse(
                barcode.getId(),
                barcode.getBarcodeNumber(),
                product == null ? null : product.getId(),
                product == null ? null : product.getSku(),
                product == null ? null : product.getName(),
                barcode.getBarcodeType(),
                barcode.getStatus(),
                barcode.getCreatedAt(),
                barcode.getUpdatedAt()
        );
    }

    private ProductResponse toProductResponse(Product product, Barcode barcode) {
        Category category = product.getCategory();
        Supplier supplier = product.getSupplier();
        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getDescription(),
                category.getId(),
                category.getName(),
                supplier == null ? null : supplier.getId(),
                supplier == null ? null : supplier.getCompanyName(),
                product.getUnitPrice(),
                product.getCostPrice(),
                product.getReorderLevel(),
                barcode.getBarcodeNumber(),
                product.getStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt()
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
