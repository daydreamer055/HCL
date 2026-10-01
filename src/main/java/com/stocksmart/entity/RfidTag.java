package com.stocksmart.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "RFID_TAG")
@Getter
@Setter
@NoArgsConstructor
public class RfidTag extends AuditedEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "TAG_CODE", nullable = false, unique = true, length = 100)
    private String tagCode;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "TAG_STATUS", nullable = false, length = 20)
    private RfidTagStatus status = RfidTagStatus.UNASSIGNED;

    @Column(name = "ASSIGNED_AT")
    private LocalDateTime assignedAt;

    @Column(name = "LAST_SEEN_AT")
    private LocalDateTime lastSeenAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCT_ID")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "LOCATION_ID")
    private Location location;
}
