package com.budgetapp.dto.request;

import com.budgetapp.entity.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AccountRequest(
        @NotBlank String name,
        @NotNull AccountType type,
        BigDecimal initialBalance,
        String color,
        String icon
) {}
