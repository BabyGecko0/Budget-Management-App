package com.budgetapp.dto.response;

import com.budgetapp.entity.Transaction;
import com.budgetapp.entity.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TransactionResponse(
        Long id,
        Long accountId,
        String accountName,
        Long categoryId,
        String categoryName,
        String categoryIcon,
        String categoryColor,
        BigDecimal amount,
        TransactionType type,
        LocalDate date,
        String note,
        Long recurringTransactionId,
        LocalDateTime createdAt
) {
    public static TransactionResponse from(Transaction t) {
        return new TransactionResponse(
                t.getId(),
                t.getAccount().getId(),
                t.getAccount().getName(),
                t.getCategory().getId(),
                t.getCategory().getName(),
                t.getCategory().getIcon(),
                t.getCategory().getColor(),
                t.getAmount(),
                t.getType(),
                t.getDate(),
                t.getNote(),
                t.getRecurringTransactionId(),
                t.getCreatedAt()
        );
    }
}
