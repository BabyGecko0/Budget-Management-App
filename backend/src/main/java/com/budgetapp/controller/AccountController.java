package com.budgetapp.controller;

import com.budgetapp.config.CustomUserDetails;
import com.budgetapp.dto.request.AccountRequest;
import com.budgetapp.dto.response.AccountResponse;
import com.budgetapp.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAll(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(accountService.getAll(principal.getUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getById(@PathVariable Long id,
                                                   @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(accountService.getById(id, principal.getUserId()));
    }

    @PostMapping
    public ResponseEntity<AccountResponse> create(@Valid @RequestBody AccountRequest req,
                                                  @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(accountService.create(req, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody AccountRequest req,
                                                  @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(accountService.update(id, req, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails principal) {
        accountService.delete(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
