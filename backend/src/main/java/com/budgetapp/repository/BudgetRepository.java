package com.budgetapp.repository;

import com.budgetapp.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserIdAndMonthAndYear(Long userId, int month, int year);
    Optional<Budget> findByCategoryIdAndMonthAndYear(Long categoryId, int month, int year);
    Optional<Budget> findByIdAndUserId(Long id, Long userId);
    List<Budget> findByUserId(Long userId);
}
