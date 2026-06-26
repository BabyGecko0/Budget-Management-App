package com.budgetapp.controller;

import com.budgetapp.config.CustomUserDetails;
import com.budgetapp.dto.request.RecurringTransactionRequest;
import com.budgetapp.dto.response.RecurringTransactionResponse;
import com.budgetapp.service.RecurringTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-transactions")
@RequiredArgsConstructor
public class RecurringTransactionController {

    private final RecurringTransactionService recurringTransactionService;

    @GetMapping
    public ResponseEntity<List<RecurringTransactionResponse>> getAll(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(recurringTransactionService.getAll(principal.getUserId()));
    }

    @PostMapping
    public ResponseEntity<RecurringTransactionResponse> create(
            @Valid @RequestBody RecurringTransactionRequest req,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(recurringTransactionService.create(req, principal.getUserId()));
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<RecurringTransactionResponse> toggle(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(recurringTransactionService.toggleActive(id, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails principal) {
        recurringTransactionService.delete(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
