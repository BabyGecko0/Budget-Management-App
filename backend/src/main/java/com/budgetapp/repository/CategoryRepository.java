package com.budgetapp.repository;

import com.budgetapp.entity.Category;
import com.budgetapp.entity.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserIdOrUserIsNull(Long userId);
    List<Category> findByUserIdOrUserIsNullAndType(Long userId, CategoryType type);
    Optional<Category> findByIdAndUserId(Long id, Long userId);
}
