package com.budgetapp.dto.response;

import java.math.BigDecimal;

public record TrendPoint(
        int month,
        int year,
        BigDecimal totalIncome,
        BigDecimal totalExpenses,
        BigDecimal netBalance
) {}
