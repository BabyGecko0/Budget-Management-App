package com.budgetapp.dto.request;

import com.budgetapp.entity.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CategoryRequest(
        @NotBlank String name,
        @NotNull CategoryType type,
        String icon,
        String color
) {}
