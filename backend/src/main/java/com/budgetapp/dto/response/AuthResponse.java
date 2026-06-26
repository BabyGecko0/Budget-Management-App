package com.budgetapp.dto.response;

public record AuthResponse(
        String token,
        String email,
        String displayName,
        String currency
) {}
