package com.budgetapp.service;

import com.budgetapp.dto.request.TransactionRequest;
import com.budgetapp.dto.response.TransactionResponse;
import com.budgetapp.entity.Account;
import com.budgetapp.entity.Category;
import com.budgetapp.entity.RecurringTransaction;
import com.budgetapp.entity.Transaction;
import com.budgetapp.entity.enums.TransactionType;
import com.budgetapp.exception.ResourceNotFoundException;
import com.budgetapp.repository.AccountRepository;
import com.budgetapp.repository.CategoryRepository;
import com.budgetapp.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    public List<TransactionResponse> getAll(Long userId, Integer month, Integer year) {
        if (month != null && year != null) {
            return transactionRepository.findByUserAndMonth(userId, month, year).stream()
                    .map(TransactionResponse::from)
                    .toList();
        }
        return transactionRepository.findByAccountUserIdOrderByDateDesc(userId).stream()
                .map(TransactionResponse::from)
                .toList();
    }

    public List<TransactionResponse> getByAccount(Long accountId, Integer month, Integer year) {
        LocalDate from;
        LocalDate to;
        if (month != null && year != null) {
            YearMonth ym = YearMonth.of(year, month);
            from = ym.atDay(1);
            to = ym.atEndOfMonth();
        } else {
            from = LocalDate.of(2000, 1, 1);
            to = LocalDate.now();
        }
        return transactionRepository.findByAccountIdAndDateBetweenOrderByDateDesc(accountId, from, to).stream()
                .map(TransactionResponse::from)
                .toList();
    }

    public TransactionResponse getById(Long id, Long userId) {
        Transaction tx = transactionRepository.findByIdAndAccountUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        return TransactionResponse.from(tx);
    }

    @Transactional
    public TransactionResponse create(TransactionRequest req, Long userId) {
        Account account = accountRepository.findByIdAndUserId(req.accountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Transaction tx = buildTransaction(account, category, req.amount(), req.type(), req.date(), req.note());
        applyBalanceDelta(account, req.amount(), req.type());

        Transaction saved = transactionRepository.save(tx);
        log.info("Created transaction id={} amount={} type={} accountId={}", saved.getId(), saved.getAmount(), saved.getType(), account.getId());
        return TransactionResponse.from(saved);
    }

    @Transactional
    public TransactionResponse update(Long id, TransactionRequest req, Long userId) {
        Transaction tx = transactionRepository.findByIdAndAccountUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        // reverse old effect
        reverseBalanceDelta(tx.getAccount(), tx.getAmount(), tx.getType());

        Account newAccount = accountRepository.findByIdAndUserId(req.accountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        Category newCategory = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        tx.setAccount(newAccount);
        tx.setCategory(newCategory);
        tx.setAmount(req.amount());
        tx.setType(req.type());
        tx.setDate(req.date());
        tx.setNote(req.note());

        applyBalanceDelta(newAccount, req.amount(), req.type());

        Transaction saved = transactionRepository.save(tx);
        log.info("Updated transaction id={} userId={}", id, userId);
        return TransactionResponse.from(saved);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Transaction tx = transactionRepository.findByIdAndAccountUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        reverseBalanceDelta(tx.getAccount(), tx.getAmount(), tx.getType());
        transactionRepository.delete(tx);
        log.info("Deleted transaction id={} userId={}", id, userId);
    }

    @Transactional
    public void createFromRecurring(RecurringTransaction rt) {
        Transaction tx = buildTransaction(
                rt.getAccount(), rt.getCategory(),
                rt.getAmount(), rt.getType(),
                LocalDate.now(), rt.getNote()
        );
        tx.setRecurringTransactionId(rt.getId());
        applyBalanceDelta(rt.getAccount(), rt.getAmount(), rt.getType());
        transactionRepository.save(tx);
        log.info("Auto-created transaction from recurring id={} accountId={}", rt.getId(), rt.getAccount().getId());
    }

    private Transaction buildTransaction(Account account, Category category,
                                         BigDecimal amount, TransactionType type,
                                         LocalDate date, String note) {
        Transaction tx = new Transaction();
        tx.setAccount(account);
        tx.setCategory(category);
        tx.setAmount(amount);
        tx.setType(type);
        tx.setDate(date);
        tx.setNote(note);
        return tx;
    }

    private void applyBalanceDelta(Account account, BigDecimal amount, TransactionType type) {
        BigDecimal delta = type == TransactionType.INCOME ? amount : amount.negate();
        account.setBalance(account.getBalance().add(delta));
        accountRepository.save(account);
    }

    private void reverseBalanceDelta(Account account, BigDecimal amount, TransactionType type) {
        BigDecimal delta = type == TransactionType.INCOME ? amount.negate() : amount;
        account.setBalance(account.getBalance().add(delta));
        accountRepository.save(account);
    }
}
