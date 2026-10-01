package com.stocksmart.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "INVENTORY", uniqueConstraints = {
        @UniqueConstraint(name = "UK_INV_PRODUCT_LOCATION", columnNames = {"PRODUCT_ID", "LOCATION_ID"})
})
@Getter
@Setter
@NoArgsConstructor
public class Inventory extends AuditedEntity {

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "QUANTITY_ON_HAND", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityOnHand = BigDecimal.ZERO;

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "RESERVED_QUANTITY", nullable = false, precision = 12, scale = 3)
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "REORDER_LEVEL", nullable = false, precision = 12, scale = 3)
    private BigDecimal reorderLevel = BigDecimal.ZERO;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "PRODUCT_ID", nullable = false)
    private Product product;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "LOCATION_ID", nullable = false)
    private Location location;
}
