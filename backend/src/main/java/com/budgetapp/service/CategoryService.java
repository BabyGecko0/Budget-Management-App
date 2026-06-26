package com.budgetapp.service;

import com.budgetapp.dto.request.CategoryRequest;
import com.budgetapp.dto.response.CategoryResponse;
import com.budgetapp.entity.Category;
import com.budgetapp.entity.User;
import com.budgetapp.entity.enums.CategoryType;
import com.budgetapp.exception.ResourceNotFoundException;
import com.budgetapp.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getAll(Long userId) {
        return categoryRepository.findByUserIdOrUserIsNull(userId).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req, Long userId, User user) {
        Category category = new Category();
        category.setUser(user);
        category.setName(req.name());
        category.setType(req.type());
        category.setIcon(req.icon());
        category.setColor(req.color());

        Category saved = categoryRepository.save(category);
        log.info("Created category id={} name={} userId={}", saved.getId(), saved.getName(), userId);
        return CategoryResponse.from(saved);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req, Long userId) {
        Category category = findOwned(id, userId);
        category.setName(req.name());
        category.setType(req.type());
        category.setIcon(req.icon());
        category.setColor(req.color());

        Category saved = categoryRepository.save(category);
        log.info("Updated category id={} userId={}", id, userId);
        return CategoryResponse.from(saved);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Category category = findOwned(id, userId);
        categoryRepository.delete(category);
        log.info("Deleted category id={} userId={}", id, userId);
    }

    public Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private Category findOwned(Long id, Long userId) {
        return categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found or not editable"));
    }

    @Transactional
    public void seedDefaultCategories(User user) {
        record Seed(String name, CategoryType type, String icon, String color) {}

        List<Seed> seeds = List.of(
                new Seed("Salary", CategoryType.INCOME, "💼", "#4CAF50"),
                new Seed("Freelance", CategoryType.INCOME, "💻", "#8BC34A"),
                new Seed("Investment", CategoryType.INCOME, "📈", "#009688"),
                new Seed("Other Income", CategoryType.INCOME, "💰", "#00BCD4"),
                new Seed("Food & Dining", CategoryType.EXPENSE, "🍔", "#FF5722"),
                new Seed("Rent", CategoryType.EXPENSE, "🏠", "#F44336"),
                new Seed("Transport", CategoryType.EXPENSE, "🚗", "#FF9800"),
                new Seed("Utilities", CategoryType.EXPENSE, "💡", "#FFC107"),
                new Seed("Healthcare", CategoryType.EXPENSE, "🏥", "#E91E63"),
                new Seed("Entertainment", CategoryType.EXPENSE, "🎬", "#9C27B0"),
                new Seed("Shopping", CategoryType.EXPENSE, "🛍️", "#3F51B5"),
                new Seed("Education", CategoryType.EXPENSE, "📚", "#2196F3"),
                new Seed("Savings", CategoryType.EXPENSE, "🏦", "#607D8B"),
                new Seed("Other Expense", CategoryType.EXPENSE, "📦", "#795548")
        );

        for (Seed s : seeds) {
            Category c = new Category();
            c.setUser(user);
            c.setName(s.name());
            c.setType(s.type());
            c.setIcon(s.icon());
            c.setColor(s.color());
            c.setDefault(true);
            categoryRepository.save(c);
        }

        log.info("Seeded {} default categories for user {}", seeds.size(), user.getEmail());
    }
}
