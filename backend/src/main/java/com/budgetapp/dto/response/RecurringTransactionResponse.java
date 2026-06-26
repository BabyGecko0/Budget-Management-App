package com.budgetapp.dto.response;

import com.budgetapp.entity.RecurringTransaction;
import com.budgetapp.entity.enums.Frequency;
import com.budgetapp.entity.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionResponse(
        Long id,
        Long accountId,
        String accountName,
        Long categoryId,
        String categoryName,
        BigDecimal amount,
        TransactionType type,
        Frequency frequency,
        LocalDate nextRunDate,
        boolean active,
        String note
) {
    public static RecurringTransactionResponse from(RecurringTransaction rt) {
        return new RecurringTransactionResponse(
                rt.getId(),
                rt.getAccount().getId(),
                rt.getAccount().getName(),
                rt.getCategory().getId(),
                rt.getCategory().getName(),
                rt.getAmount(),
                rt.getType(),
                rt.getFrequency(),
                rt.getNextRunDate(),
                rt.isActive(),
                rt.getNote()
        );
    }
}
