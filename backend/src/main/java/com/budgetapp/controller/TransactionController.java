package com.budgetapp.controller;

import com.budgetapp.config.CustomUserDetails;
import com.budgetapp.dto.request.TransactionRequest;
import com.budgetapp.dto.response.TransactionResponse;
import com.budgetapp.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAll(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(transactionService.getAll(principal.getUserId(), month, year));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> getById(@PathVariable Long id,
                                                       @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(transactionService.getById(id, principal.getUserId()));
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(@Valid @RequestBody TransactionRequest req,
                                                      @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(transactionService.create(req, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> update(@PathVariable Long id,
                                                      @Valid @RequestBody TransactionRequest req,
                                                      @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(transactionService.update(id, req, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails principal) {
        transactionService.delete(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
