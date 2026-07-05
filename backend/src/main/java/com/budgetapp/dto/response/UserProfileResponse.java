package com.budgetapp.dto.response;

import com.budgetapp.entity.User;
import com.budgetapp.entity.enums.AuthProvider;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id,
        String email,
        String displayName,
        String currency,
        BigDecimal monthlyIncome,
        AuthProvider authProvider,
        LocalDateTime createdAt
) {
    public static UserProfileResponse from(User u) {
        return new UserProfileResponse(
                u.getId(), u.getEmail(), u.getDisplayName(),
                u.getCurrency(), u.getMonthlyIncome(),
                u.getAuthProvider(), u.getCreatedAt()
        );
    }
}
