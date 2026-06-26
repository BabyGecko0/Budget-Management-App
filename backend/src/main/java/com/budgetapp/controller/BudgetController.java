package com.budgetapp.controller;

import com.budgetapp.config.CustomUserDetails;
import com.budgetapp.dto.request.BudgetRequest;
import com.budgetapp.dto.response.BudgetResponse;
import com.budgetapp.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAll(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @AuthenticationPrincipal CustomUserDetails principal) {
        if (month != null && year != null) {
            return ResponseEntity.ok(budgetService.getByMonth(principal.getUserId(), month, year));
        }
        return ResponseEntity.ok(budgetService.getAll(principal.getUserId()));
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> create(@Valid @RequestBody BudgetRequest req,
                                                 @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(budgetService.create(req, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody BudgetRequest req,
                                                 @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(budgetService.update(id, req, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails principal) {
        budgetService.delete(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
