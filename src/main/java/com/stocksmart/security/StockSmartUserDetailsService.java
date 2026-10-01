package com.stocksmart.security;

import com.stocksmart.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockSmartUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public StockSmartUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmailIgnoreCase(email)
                .map(StockSmartUserDetails::from)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password."));
    }
}
