package com.budgetapp.dto.response;

import com.budgetapp.entity.SavingsGoal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

public record SavingsGoalResponse(
        Long id,
        String name,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        BigDecimal progressPercent,
        LocalDate deadline,
        String note,
        Long accountId,
        String accountName
) {
    public static SavingsGoalResponse from(SavingsGoal g) {
        BigDecimal progress = g.getTargetAmount().compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : g.getCurrentAmount()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(g.getTargetAmount(), 2, RoundingMode.HALF_UP);
        return new SavingsGoalResponse(
                g.getId(), g.getName(), g.getTargetAmount(),
                g.getCurrentAmount(), progress, g.getDeadline(), g.getNote(),
                g.getAccount() != null ? g.getAccount().getId() : null,
                g.getAccount() != null ? g.getAccount().getName() : null
        );
    }
}
