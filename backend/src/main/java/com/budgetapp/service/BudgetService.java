package com.budgetapp.service;

import com.budgetapp.dto.request.BudgetRequest;
import com.budgetapp.dto.response.BudgetResponse;
import com.budgetapp.entity.Budget;
import com.budgetapp.entity.Category;
import com.budgetapp.entity.User;
import com.budgetapp.exception.BadRequestException;
import com.budgetapp.exception.ResourceNotFoundException;
import com.budgetapp.repository.BudgetRepository;
import com.budgetapp.repository.CategoryRepository;
import com.budgetapp.repository.TransactionRepository;
import com.budgetapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public List<BudgetResponse> getByMonth(Long userId, int month, int year) {
        return budgetRepository.findByUserIdAndMonthAndYear(userId, month, year).stream()
                .map(b -> {
                    BigDecimal spent = transactionRepository.sumExpensesForCategoryAndMonth(
                            b.getCategory().getId(), month, year);
                    return BudgetResponse.from(b, spent);
                })
                .toList();
    }

    public List<BudgetResponse> getAll(Long userId) {
        return budgetRepository.findByUserId(userId).stream()
                .map(b -> {
                    BigDecimal spent = transactionRepository.sumExpensesForCategoryAndMonth(
                            b.getCategory().getId(), b.getMonth(), b.getYear());
                    return BudgetResponse.from(b, spent);
                })
                .toList();
    }

    @Transactional
    public BudgetResponse create(BudgetRequest req, Long userId) {
        if (budgetRepository.findByCategoryIdAndMonthAndYear(req.categoryId(), req.month(), req.year()).isPresent()) {
            throw new BadRequestException("Budget already exists for this category and month");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(category);
        budget.setMonthlyLimit(req.monthlyLimit());
        budget.setMonth(req.month());
        budget.setYear(req.year());

        Budget saved = budgetRepository.save(budget);
        BigDecimal spent = transactionRepository.sumExpensesForCategoryAndMonth(
                category.getId(), req.month(), req.year());
        log.info("Created budget id={} category={} limit={} userId={}", saved.getId(), category.getName(), req.monthlyLimit(), userId);
        return BudgetResponse.from(saved, spent);
    }

    @Transactional
    public BudgetResponse update(Long id, BudgetRequest req, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        budget.setMonthlyLimit(req.monthlyLimit());

        Budget saved = budgetRepository.save(budget);
        BigDecimal spent = transactionRepository.sumExpensesForCategoryAndMonth(
                saved.getCategory().getId(), saved.getMonth(), saved.getYear());
        log.info("Updated budget id={} userId={}", id, userId);
        return BudgetResponse.from(saved, spent);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        budgetRepository.delete(budget);
        log.info("Deleted budget id={} userId={}", id, userId);
    }
}
