package com.budgetapp.dto.request;

import com.budgetapp.entity.enums.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotNull Long accountId,
        @NotNull Long categoryId,
        @NotNull @Positive BigDecimal amount,
        @NotNull TransactionType type,
        @NotNull LocalDate date,
        String note
) {}
