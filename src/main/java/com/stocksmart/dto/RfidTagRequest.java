package com.stocksmart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RfidTagRequest(
        @NotBlank @Size(max = 100) String tagCode
) {
}
