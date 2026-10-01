package com.stocksmart.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "BARCODE")
@Getter
@Setter
@NoArgsConstructor
public class Barcode extends AuditedEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "BARCODE_NUMBER", nullable = false, unique = true, length = 100)
    private String barcodeNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "BARCODE_TYPE", nullable = false, length = 20)
    private BarcodeType barcodeType = BarcodeType.OTHER;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "BARCODE_STATUS", nullable = false, length = 20)
    private BarcodeStatus status = BarcodeStatus.ACTIVE;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCT_ID", unique = true)
    private Product product;
}
