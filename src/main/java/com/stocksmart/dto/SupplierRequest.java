package com.stocksmart.dto;

import com.stocksmart.entity.SupplierStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank @Size(max = 30) String supplierCode,
        @NotBlank @Size(max = 150) String name,
        @Size(max = 100) String contactPerson,
        @Email @Size(max = 254) String email,
        @Pattern(regexp = "^[+0-9() .-]{7,30}$", message = "must be a valid phone number")
        @Size(max = 30) String phone,
        @Size(max = 500) String address,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        @Size(max = 100) String country,
        @NotNull SupplierStatus status
) {
}
