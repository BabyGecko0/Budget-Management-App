package com.budgetapp.controller;

import com.budgetapp.config.CustomUserDetails;
import com.budgetapp.dto.request.CategoryRequest;
import com.budgetapp.dto.response.CategoryResponse;
import com.budgetapp.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(categoryService.getAll(principal.getUserId()));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest req,
                                                   @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(categoryService.create(req, principal.getUserId(), principal.getUser()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody CategoryRequest req,
                                                   @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(categoryService.update(id, req, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails principal) {
        categoryService.delete(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
