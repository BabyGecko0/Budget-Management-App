package com.budgetapp.service;

import com.budgetapp.dto.request.RecurringTransactionRequest;
import com.budgetapp.dto.response.RecurringTransactionResponse;
import com.budgetapp.entity.Account;
import com.budgetapp.entity.Category;
import com.budgetapp.entity.RecurringTransaction;
import com.budgetapp.exception.ResourceNotFoundException;
import com.budgetapp.repository.AccountRepository;
import com.budgetapp.repository.CategoryRepository;
import com.budgetapp.repository.RecurringTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionService {

    private final RecurringTransactionRepository recurringRepo;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    public List<RecurringTransactionResponse> getAll(Long userId) {
        return recurringRepo.findByAccountUserId(userId).stream()
                .map(RecurringTransactionResponse::from)
                .toList();
    }

    @Transactional
    public RecurringTransactionResponse create(RecurringTransactionRequest req, Long userId) {
        Account account = accountRepository.findByIdAndUserId(req.accountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        RecurringTransaction rt = new RecurringTransaction();
        rt.setAccount(account);
        rt.setCategory(category);
        rt.setAmount(req.amount());
        rt.setType(req.type());
        rt.setFrequency(req.frequency());
        rt.setNextRunDate(req.startDate());
        rt.setNote(req.note());
        rt.setActive(true);

        RecurringTransaction saved = recurringRepo.save(rt);
        log.info("Created recurring transaction id={} frequency={} userId={}", saved.getId(), saved.getFrequency(), userId);
        return RecurringTransactionResponse.from(saved);
    }

    @Transactional
    public RecurringTransactionResponse toggleActive(Long id, Long userId) {
        RecurringTransaction rt = recurringRepo.findByIdAndAccountUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring transaction not found"));
        rt.setActive(!rt.isActive());
        RecurringTransaction saved = recurringRepo.save(rt);
        log.info("Toggled recurring transaction id={} active={} userId={}", id, saved.isActive(), userId);
        return RecurringTransactionResponse.from(saved);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        RecurringTransaction rt = recurringRepo.findByIdAndAccountUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring transaction not found"));
        recurringRepo.delete(rt);
        log.info("Deleted recurring transaction id={} userId={}", id, userId);
    }
}
