package com.stocksmart.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "STORE_LOCATION")
@Getter
@Setter
@NoArgsConstructor
public class Location extends AuditedEntity {

    @NotBlank
    @Size(max = 30)
    @Column(name = "LOCATION_CODE", nullable = false, unique = true, length = 30)
    private String code;

    @NotBlank
    @Size(max = 100)
    @Column(name = "LOCATION_NAME", nullable = false, length = 100)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "LOCATION_TYPE", nullable = false, length = 20)
    private LocationType locationType;

    @Size(max = 500)
    @Column(name = "ADDRESS", length = 500)
    private String address;

    @Size(max = 100)
    @Column(name = "CITY", length = 100)
    private String city;

    @Size(max = 100)
    @Column(name = "STATE_REGION", length = 100)
    private String state;

    @Size(max = 100)
    @Column(name = "COUNTRY", length = 100)
    private String country;

    @Pattern(regexp = "^[+0-9() .-]{7,30}$", message = "must be a valid phone number")
    @Size(max = 30)
    @Column(name = "PHONE", length = 30)
    private String phone;

    @Size(max = 100)
    @Column(name = "MANAGER_NAME", length = 100)
    private String managerName;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "LOCATION_STATUS", nullable = false, length = 20)
    private LocationStatus status = LocationStatus.ACTIVE;
}
