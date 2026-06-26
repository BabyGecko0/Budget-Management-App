package com.budgetapp.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record BudgetRequest(
        @NotNull Long categoryId,
        @NotNull @Positive BigDecimal monthlyLimit,
        @NotNull @Min(1) @Max(12) int month,
        @NotNull @Min(2000) int year
) {}
