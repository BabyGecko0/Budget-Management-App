package com.budgetapp.dto.response;

import com.budgetapp.entity.Account;
import com.budgetapp.entity.enums.AccountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponse(
        Long id,
        String name,
        AccountType type,
        BigDecimal balance,
        String color,
        String icon,
        LocalDateTime createdAt
) {
    public static AccountResponse from(Account a) {
        return new AccountResponse(
                a.getId(), a.getName(), a.getType(),
                a.getBalance(), a.getColor(), a.getIcon(), a.getCreatedAt()
        );
    }
}
