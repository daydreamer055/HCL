package com.stocksmart.dto;

import java.util.List;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        AuthenticatedUser user
) {
    public record AuthenticatedUser(
            Long id,
            String username,
            String email,
            List<String> roles
    ) {
    }
}
