package com.budgetapp.service;

import com.budgetapp.dto.request.AccountRequest;
import com.budgetapp.dto.response.AccountResponse;
import com.budgetapp.entity.Account;
import com.budgetapp.entity.User;
import com.budgetapp.exception.ResourceNotFoundException;
import com.budgetapp.repository.AccountRepository;
import com.budgetapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public List<AccountResponse> getAll(Long userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(AccountResponse::from)
                .toList();
    }

    public AccountResponse getById(Long id, Long userId) {
        return AccountResponse.from(findOwned(id, userId));
    }

    @Transactional
    public AccountResponse create(AccountRequest req, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Account account = new Account();
        account.setUser(user);
        account.setName(req.name());
        account.setType(req.type());
        account.setBalance(req.initialBalance() != null ? req.initialBalance() : BigDecimal.ZERO);
        account.setColor(req.color());
        account.setIcon(req.icon());

        Account saved = accountRepository.save(account);
        log.info("Created account id={} name={} userId={}", saved.getId(), saved.getName(), userId);
        return AccountResponse.from(saved);
    }

    @Transactional
    public AccountResponse update(Long id, AccountRequest req, Long userId) {
        Account account = findOwned(id, userId);
        account.setName(req.name());
        account.setType(req.type());
        account.setColor(req.color());
        account.setIcon(req.icon());
        if (req.initialBalance() != null) {
            account.setBalance(req.initialBalance());
        }

        Account saved = accountRepository.save(account);
        log.info("Updated account id={} userId={}", id, userId);
        return AccountResponse.from(saved);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Account account = findOwned(id, userId);
        accountRepository.delete(account);
        log.info("Deleted account id={} userId={}", id, userId);
    }

    private Account findOwned(Long id, Long userId) {
        return accountRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    }

    public Account findOwnedEntity(Long id, Long userId) {
        return findOwned(id, userId);
    }

    @Transactional
    public void adjustBalance(Account account, BigDecimal delta) {
        account.setBalance(account.getBalance().add(delta));
        accountRepository.save(account);
    }
}
