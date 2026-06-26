package com.budgetapp.service;

import com.budgetapp.config.CustomUserDetails;
import com.budgetapp.dto.request.LoginRequest;
import com.budgetapp.dto.request.RegisterRequest;
import com.budgetapp.dto.response.AuthResponse;
import com.budgetapp.entity.User;
import com.budgetapp.exception.BadRequestException;
import com.budgetapp.repository.UserRepository;
import com.budgetapp.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final CategoryService categoryService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email already in use");
        }

        User user = new User();
        user.setEmail(req.email());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setDisplayName(req.displayName());
        userRepository.save(user);

        categoryService.seedDefaultCategories(user);

        log.info("Registered new user: {}", user.getEmail());
        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getDisplayName(), user.getCurrency());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}", req.email());
                    return new BadCredentialsException("Invalid credentials");
                });

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            log.warn("Login failed - wrong password for: {}", req.email());
            throw new BadCredentialsException("Invalid credentials");
        }

        log.info("User logged in: {}", user.getEmail());
        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getDisplayName(), user.getCurrency());
    }
}
