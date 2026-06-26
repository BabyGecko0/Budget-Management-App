package com.budgetapp.controller;

import com.budgetapp.config.CustomUserDetails;
import com.budgetapp.dto.request.SavingsGoalRequest;
import com.budgetapp.dto.response.SavingsGoalResponse;
import com.budgetapp.service.SavingsGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/savings-goals")
@RequiredArgsConstructor
public class SavingsGoalController {

    private final SavingsGoalService savingsGoalService;

    @GetMapping
    public ResponseEntity<List<SavingsGoalResponse>> getAll(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(savingsGoalService.getAll(principal.getUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavingsGoalResponse> getById(@PathVariable Long id,
                                                       @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(savingsGoalService.getById(id, principal.getUserId()));
    }

    @PostMapping
    public ResponseEntity<SavingsGoalResponse> create(@Valid @RequestBody SavingsGoalRequest req,
                                                      @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(savingsGoalService.create(req, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingsGoalResponse> update(@PathVariable Long id,
                                                      @Valid @RequestBody SavingsGoalRequest req,
                                                      @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(savingsGoalService.update(id, req, principal.getUserId()));
    }

    @PostMapping("/{id}/contribute")
    public ResponseEntity<SavingsGoalResponse> contribute(@PathVariable Long id,
                                                          @RequestParam BigDecimal amount,
                                                          @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(savingsGoalService.contribute(id, amount, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails principal) {
        savingsGoalService.delete(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
