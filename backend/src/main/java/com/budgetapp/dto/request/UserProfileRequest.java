package com.budgetapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record UserProfileRequest(
        @NotBlank String displayName,
        @NotBlank String currency,
        @PositiveOrZero BigDecimal monthlyIncome
) {}
