package com.budgetapp.dto.response;

import com.budgetapp.entity.Budget;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String categoryIcon,
        String categoryColor,
        BigDecimal monthlyLimit,
        BigDecimal spent,
        int month,
        int year,
        boolean overspent
) {
    public static BudgetResponse from(Budget b, BigDecimal spent) {
        return new BudgetResponse(
                b.getId(),
                b.getCategory().getId(),
                b.getCategory().getName(),
                b.getCategory().getIcon(),
                b.getCategory().getColor(),
                b.getMonthlyLimit(),
                spent,
                b.getMonth(),
                b.getYear(),
                spent.compareTo(b.getMonthlyLimit()) > 0
        );
    }
}
