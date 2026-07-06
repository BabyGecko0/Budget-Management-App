package com.budgetapp.service;

import com.budgetapp.dto.request.SavingsGoalRequest;
import com.budgetapp.dto.response.SavingsGoalResponse;
import com.budgetapp.entity.SavingsGoal;
import com.budgetapp.entity.User;
import com.budgetapp.exception.BadRequestException;
import com.budgetapp.exception.ResourceNotFoundException;
import com.budgetapp.repository.SavingsGoalRepository;
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
public class SavingsGoalService {

    private final SavingsGoalRepository savingsGoalRepository;
    private final UserRepository userRepository;
    private final AccountService accountService;

    public List<SavingsGoalResponse> getAll(Long userId) {
        return savingsGoalRepository.findByUserId(userId).stream()
                .map(SavingsGoalResponse::from)
                .toList();
    }

    public SavingsGoalResponse getById(Long id, Long userId) {
        SavingsGoal goal = findOwned(id, userId);
        return SavingsGoalResponse.from(goal);
    }

    @Transactional
    public SavingsGoalResponse create(SavingsGoalRequest req, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        SavingsGoal goal = new SavingsGoal();
        goal.setUser(user);
        goal.setName(req.name());
        goal.setTargetAmount(req.targetAmount());
        goal.setCurrentAmount(req.currentAmount() != null ? req.currentAmount() : BigDecimal.ZERO);
        goal.setDeadline(req.deadline());
        goal.setNote(req.note());
        goal.setAccount(req.accountId() != null
                ? accountService.findOwnedEntity(req.accountId(), userId) : null);

        SavingsGoal saved = savingsGoalRepository.save(goal);
        log.info("Created savings goal id={} name={} userId={}", saved.getId(), saved.getName(), userId);
        return SavingsGoalResponse.from(saved);
    }

    @Transactional
    public SavingsGoalResponse update(Long id, SavingsGoalRequest req, Long userId) {
        SavingsGoal goal = findOwned(id, userId);
        goal.setName(req.name());
        goal.setTargetAmount(req.targetAmount());
        if (req.currentAmount() != null) goal.setCurrentAmount(req.currentAmount());
        goal.setDeadline(req.deadline());
        goal.setNote(req.note());
        goal.setAccount(req.accountId() != null
                ? accountService.findOwnedEntity(req.accountId(), userId) : null);

        SavingsGoal saved = savingsGoalRepository.save(goal);
        log.info("Updated savings goal id={} userId={}", id, userId);
        return SavingsGoalResponse.from(saved);
    }

    @Transactional
    public SavingsGoalResponse contribute(Long id, BigDecimal amount, Long userId) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Contribution amount must be positive");
        }
        SavingsGoal goal = findOwned(id, userId);

        // funded goal: money moves out of the linked account
        if (goal.getAccount() != null) {
            if (goal.getAccount().getBalance().compareTo(amount) < 0) {
                throw new BadRequestException(
                        "Not enough balance in account '" + goal.getAccount().getName() + "'");
            }
            accountService.adjustBalance(goal.getAccount(), amount.negate());
        }

        goal.setCurrentAmount(goal.getCurrentAmount().add(amount));

        SavingsGoal saved = savingsGoalRepository.save(goal);
        log.info("Contributed {} to savings goal id={} userId={}", amount, id, userId);
        return SavingsGoalResponse.from(saved);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        SavingsGoal goal = findOwned(id, userId);
        savingsGoalRepository.delete(goal);
        log.info("Deleted savings goal id={} userId={}", id, userId);
    }

    private SavingsGoal findOwned(Long id, Long userId) {
        return savingsGoalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found"));
    }
}
