package com.budgetapp.repository;

import com.budgetapp.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByAccountUserIdAndDateBetweenOrderByDateDesc(
            Long userId, LocalDate from, LocalDate to);

    List<Transaction> findByAccountIdAndDateBetweenOrderByDateDesc(
            Long accountId, LocalDate from, LocalDate to);

    List<Transaction> findByAccountUserIdOrderByDateDesc(Long userId);

    Optional<Transaction> findByIdAndAccountUserId(Long id, Long userId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.category.id = :categoryId " +
           "AND t.type = 'EXPENSE' " +
           "AND MONTH(t.date) = :month " +
           "AND YEAR(t.date) = :year")
    BigDecimal sumExpensesForCategoryAndMonth(
            @Param("categoryId") Long categoryId,
            @Param("month") int month,
            @Param("year") int year);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.account.user.id = :userId " +
           "AND t.type = :type " +
           "AND MONTH(t.date) = :month " +
           "AND YEAR(t.date) = :year")
    BigDecimal sumByUserAndTypeAndMonth(
            @Param("userId") Long userId,
            @Param("type") String type,
            @Param("month") int month,
            @Param("year") int year);

    @Query("SELECT t FROM Transaction t " +
           "WHERE t.account.user.id = :userId " +
           "AND MONTH(t.date) = :month " +
           "AND YEAR(t.date) = :year " +
           "ORDER BY t.date DESC")
    List<Transaction> findByUserAndMonth(
            @Param("userId") Long userId,
            @Param("month") int month,
            @Param("year") int year);
}
