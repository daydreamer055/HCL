package com.stocksmart.dto;

import com.stocksmart.entity.LocationStatus;
import com.stocksmart.entity.LocationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LocationRequest(
        @NotBlank @Size(max = 30) String locationCode,
        @NotBlank @Size(max = 100) String name,
        @NotNull LocationType type,
        @Size(max = 500) String address,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        @Size(max = 100) String country,
        @Pattern(regexp = "^[+0-9() .-]{7,30}$", message = "must be a valid phone number")
        @Size(max = 30) String phone,
        @Size(max = 100) String managerName,
        @NotNull LocationStatus status
) {
}
