package com.stocksmart;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.security.SecureRandom;
import java.util.Base64;

@SpringBootTest
class StockSmartApplicationTests {

    @DynamicPropertySource
    static void configureDevelopmentCredentials(DynamicPropertyRegistry registry) {
        SecureRandom random = new SecureRandom();
        byte[] jwtKey = new byte[32];
        byte[] adminPassword = new byte[32];
        random.nextBytes(jwtKey);
        random.nextBytes(adminPassword);

        registry.add("app.jwt.secret", () -> Base64.getEncoder().encodeToString(jwtKey));
        registry.add("app.dev-admin.password", () -> Base64.getEncoder().encodeToString(adminPassword));
    }

    @Test
    void contextLoads() {
    }
}
