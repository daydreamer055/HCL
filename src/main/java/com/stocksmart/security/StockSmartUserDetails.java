package com.stocksmart.security;

import com.stocksmart.entity.RoleName;
import com.stocksmart.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

public final class StockSmartUserDetails implements UserDetails {

    private final Long id;
    private final String username;
    private final String email;
    private final String passwordHash;
    private final boolean active;
    private final Set<String> roles;

    private StockSmartUserDetails(User user) {
        id = user.getId();
        username = user.getUsername();
        email = user.getEmail();
        passwordHash = user.getPasswordHash();
        active = user.isActive();
        roles = user.getRoles().stream()
                .map(role -> canonicalRole(role.getRoleName()).name())
                .collect(Collectors.toUnmodifiableSet());
    }

    public static StockSmartUserDetails from(User user) {
        return new StockSmartUserDetails(user);
    }

    public Long id() {
        return id;
    }

    public String email() {
        return email;
    }

    public Set<String> roles() {
        return roles;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    public String displayUsername() {
        return username;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }

    private static RoleName canonicalRole(RoleName role) {
        return switch (role) {
            case ADMIN -> RoleName.ADMIN;
            case MANAGER, INVENTORY_MANAGER -> RoleName.INVENTORY_MANAGER;
            case STAFF, INVENTORY_STAFF, SALES_STAFF -> RoleName.STAFF;
        };
    }
}
