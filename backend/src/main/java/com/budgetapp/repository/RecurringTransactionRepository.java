package com.budgetapp.repository;

import com.budgetapp.entity.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {
    List<RecurringTransaction> findByActiveTrueAndNextRunDateLessThanEqual(LocalDate date);
    List<RecurringTransaction> findByAccountUserId(Long userId);
    Optional<RecurringTransaction> findByIdAndAccountUserId(Long id, Long userId);
}
