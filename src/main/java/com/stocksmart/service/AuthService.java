package com.stocksmart.service;

import com.stocksmart.dto.LoginRequest;
import com.stocksmart.dto.LoginResponse;
import com.stocksmart.security.JwtService;
import com.stocksmart.security.StockSmartUserDetails;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        var authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        request.email().trim(), request.password()));
        StockSmartUserDetails user = (StockSmartUserDetails) authentication.getPrincipal();
        return new LoginResponse(
                jwtService.generateToken(user),
                "Bearer",
                jwtService.expirationSeconds(),
                new LoginResponse.AuthenticatedUser(
                        user.id(),
                        user.displayUsername(),
                        user.email(),
                        user.roles().stream().sorted().toList()
                )
        );
    }
}
