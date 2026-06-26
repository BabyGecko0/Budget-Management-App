package com.budgetapp.dto.request;

import com.budgetapp.entity.enums.Frequency;
import com.budgetapp.entity.enums.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionRequest(
        @NotNull Long accountId,
        @NotNull Long categoryId,
        @NotNull @Positive BigDecimal amount,
        @NotNull TransactionType type,
        @NotNull Frequency frequency,
        @NotNull LocalDate startDate,
        String note
) {}
