package com.budgetapp.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record SummaryResponse(
        int month,
        int year,
        BigDecimal totalIncome,
        BigDecimal totalExpenses,
        BigDecimal netBalance,
        List<CategorySummary> expenseByCategory,
        List<CategorySummary> incomeByCategory,
        List<BudgetResponse> budgets
) {
    public record CategorySummary(
            Long categoryId,
            String categoryName,
            String categoryIcon,
            String categoryColor,
            BigDecimal total,
            BigDecimal percentage
    ) {}
}
