package com.budgetapp.dto.response;

import com.budgetapp.entity.Category;
import com.budgetapp.entity.enums.CategoryType;

public record CategoryResponse(
        Long id,
        String name,
        CategoryType type,
        String icon,
        String color,
        boolean isDefault
) {
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(
                c.getId(), c.getName(), c.getType(),
                c.getIcon(), c.getColor(), c.isDefault()
        );
    }
}
