package com.stocksmart.service;

import com.stocksmart.dto.ProductRequest;
import com.stocksmart.dto.ProductResponse;
import com.stocksmart.entity.Barcode;
import com.stocksmart.entity.BarcodeType;
import com.stocksmart.entity.Category;
import com.stocksmart.entity.Product;
import com.stocksmart.entity.ProductStatus;
import com.stocksmart.entity.Supplier;
import com.stocksmart.exception.ResourceConflictException;
import com.stocksmart.exception.ResourceNotFoundException;
import com.stocksmart.repository.BarcodeRepository;
import com.stocksmart.repository.CategoryRepository;
import com.stocksmart.repository.ProductRepository;
import com.stocksmart.repository.SupplierRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final BarcodeRepository barcodeRepository;

    public ProductServiceImpl(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository,
            BarcodeRepository barcodeRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.barcodeRepository = barcodeRepository;
    }

    @Override
    public ProductResponse create(ProductRequest request) {
        ensureSkuAvailable(request.sku(), null);
        Product product = new Product();
        applyRequest(product, request);
        productRepository.save(product);
        saveBarcode(product, request, null);
        return toResponse(product);
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<ProductResponse> findAll(
            String name, String sku, Long categoryId, ProductStatus status, Pageable pageable
    ) {
        Specification<Product> specification = (root, query, builder) -> builder.conjunction();
        if (name != null && !name.isBlank()) {
            String pattern = containsPattern(name);
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("name")), pattern, '\\'));
        }
        if (sku != null && !sku.isBlank()) {
            String pattern = containsPattern(sku);
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("sku")), pattern, '\\'));
        }
        if (categoryId != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("category").get("id"), categoryId));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("status"), status));
        }
        return productRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public ProductResponse findById(Long id) {
        return toResponse(getProduct(id));
    }

    @Override
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getProduct(id);
        ensureSkuAvailable(request.sku(), id);
        applyRequest(product, request);
        saveBarcode(product, request, id);
        return toResponse(productRepository.save(product));
    }

    @Override
    public void delete(Long id) {
        Product product = getProduct(id);
        barcodeRepository.findByProductId(id).ifPresent(barcodeRepository::delete);
        productRepository.delete(product);
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setSku(request.sku().trim());
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setUnitPrice(request.price());
        product.setCostPrice(request.costPrice());
        product.setReorderLevel(request.reorderLevel());
        product.setStatus(request.status());

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Category not found with id " + request.categoryId()));
        product.setCategory(category);

        Supplier supplier = request.supplierId() == null ? null
                : supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Supplier not found with id " + request.supplierId()));
        product.setSupplier(supplier);
    }

    private void saveBarcode(Product product, ProductRequest request, Long productId) {
        String value = request.barcode();
        Barcode existing = productId == null ? null
                : barcodeRepository.findByProductId(productId).orElse(null);
        if (value == null || value.isBlank()) {
            if (existing != null) {
                barcodeRepository.delete(existing);
            }
            product.setBarcode(null);
            return;
        }

        String normalizedValue = value.trim();
        boolean duplicate = existing == null
                ? barcodeRepository.existsByBarcodeNumberIgnoreCase(normalizedValue)
                : barcodeRepository.existsByBarcodeNumberIgnoreCaseAndIdNot(normalizedValue, existing.getId());
        if (duplicate) {
            throw new ResourceConflictException("Barcode is already assigned: " + normalizedValue);
        }

        Barcode barcode = existing == null ? new Barcode() : existing;
        barcode.setBarcodeNumber(normalizedValue);
        barcode.setBarcodeType(toBarcodeType(request.barcodeSymbology()));
        barcode.setProduct(product);
        product.setBarcode(barcode);
        barcodeRepository.save(barcode);
    }

    private BarcodeType toBarcodeType(String value) {
        if (value == null || value.isBlank()) {
            return BarcodeType.OTHER;
        }
        try {
            return BarcodeType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return BarcodeType.OTHER;
        }
    }

    private void ensureSkuAvailable(String sku, Long currentProductId) {
        boolean exists = currentProductId == null
                ? productRepository.existsBySkuIgnoreCase(sku.trim())
                : productRepository.existsBySkuIgnoreCaseAndIdNot(sku.trim(), currentProductId);
        if (exists) {
            throw new ResourceConflictException("SKU is already assigned: " + sku.trim());
        }
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    private ProductResponse toResponse(Product product) {
        Barcode barcode = product.getBarcode();
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
                barcode == null ? null : barcode.getBarcodeNumber(),
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
