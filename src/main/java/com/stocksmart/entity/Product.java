package com.stocksmart.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "PRODUCT")
@Getter
@Setter
@NoArgsConstructor
public class Product extends AuditedEntity {

    @NotBlank
    @Size(max = 50)
    @Column(name = "SKU", nullable = false, unique = true, length = 50)
    private String sku;

    @NotBlank
    @Size(max = 150)
    @Column(name = "PRODUCT_NAME", nullable = false, length = 150)
    private String name;

    @Size(max = 1000)
    @Column(name = "DESCRIPTION", length = 1000)
    private String description;

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "UNIT_PRICE", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "COST_PRICE", nullable = false, precision = 12, scale = 2)
    private BigDecimal costPrice;

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "REORDER_LEVEL", nullable = false, precision = 12, scale = 3)
    private BigDecimal reorderLevel = BigDecimal.ZERO;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "PRODUCT_STATUS", nullable = false, length = 20)
    private ProductStatus status = ProductStatus.ACTIVE;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CATEGORY_ID", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID")
    private Supplier supplier;

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private Barcode barcode;
}
