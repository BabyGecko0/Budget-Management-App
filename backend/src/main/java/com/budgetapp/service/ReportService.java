package com.budgetapp.service;

import com.budgetapp.dto.response.BudgetResponse;
import com.budgetapp.dto.response.SummaryResponse;
import com.budgetapp.dto.response.TrendPoint;
import com.budgetapp.entity.Transaction;
import com.budgetapp.entity.enums.TransactionType;
import com.budgetapp.repository.BudgetRepository;
import com.budgetapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    public SummaryResponse getMonthlySummary(Long userId, int month, int year) {
        List<Transaction> transactions = transactionRepository.findByUserAndMonth(userId, month, year);

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<SummaryResponse.CategorySummary> expenseByCategory =
                buildCategorySummary(transactions, TransactionType.EXPENSE, totalExpenses);
        List<SummaryResponse.CategorySummary> incomeByCategory =
                buildCategorySummary(transactions, TransactionType.INCOME, totalIncome);

        List<BudgetResponse> budgets = budgetRepository.findByUserIdAndMonthAndYear(userId, month, year).stream()
                .map(b -> {
                    BigDecimal spent = transactionRepository.sumExpensesForCategoryAndMonth(
                            b.getCategory().getId(), month, year);
                    return BudgetResponse.from(b, spent);
                })
                .toList();

        log.debug("Monthly summary for userId={} month={}/{} income={} expenses={}", userId, month, year, totalIncome, totalExpenses);

        return new SummaryResponse(
                month, year, totalIncome, totalExpenses,
                totalIncome.subtract(totalExpenses),
                expenseByCategory, incomeByCategory, budgets
        );
    }

    public List<TrendPoint> getTrend(Long userId, int months) {
        List<TrendPoint> result = new ArrayList<>();
        LocalDate cursor = LocalDate.now().withDayOfMonth(1);

        for (int i = 0; i < months; i++) {
            int m = cursor.getMonthValue();
            int y = cursor.getYear();

            BigDecimal income = transactionRepository.sumByUserAndTypeAndMonth(userId, "INCOME", m, y);
            BigDecimal expenses = transactionRepository.sumByUserAndTypeAndMonth(userId, "EXPENSE", m, y);

            result.add(0, new TrendPoint(m, y, income, expenses, income.subtract(expenses)));
            cursor = cursor.minusMonths(1);
        }

        return result;
    }

    private List<SummaryResponse.CategorySummary> buildCategorySummary(
            List<Transaction> transactions, TransactionType type, BigDecimal total) {

        Map<Long, List<Transaction>> grouped = transactions.stream()
                .filter(t -> t.getType() == type)
                .collect(Collectors.groupingBy(t -> t.getCategory().getId()));

        return grouped.entrySet().stream().map(entry -> {
            Transaction sample = entry.getValue().get(0);
            BigDecimal catTotal = entry.getValue().stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal pct = total.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                    : catTotal.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);

            return new SummaryResponse.CategorySummary(
                    sample.getCategory().getId(),
                    sample.getCategory().getName(),
                    sample.getCategory().getIcon(),
                    sample.getCategory().getColor(),
                    catTotal, pct
            );
        }).sorted((a, b) -> b.total().compareTo(a.total())).toList();
    }
}
