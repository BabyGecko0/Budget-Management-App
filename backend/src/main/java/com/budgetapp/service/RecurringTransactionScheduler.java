package com.budgetapp.service;

import com.budgetapp.entity.RecurringTransaction;
import com.budgetapp.repository.RecurringTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionScheduler {

    private final RecurringTransactionRepository recurringRepo;
    private final TransactionService transactionService;

    @Scheduled(cron = "0 5 0 * * *")
    public void runDueRecurringTransactions() {
        List<RecurringTransaction> due = recurringRepo
                .findByActiveTrueAndNextRunDateLessThanEqual(LocalDate.now());

        log.info("Recurring job: {} due transaction(s) found", due.size());

        for (RecurringTransaction rt : due) {
            try {
                transactionService.createFromRecurring(rt);
                rt.setNextRunDate(computeNextRun(rt));
                recurringRepo.save(rt);
            } catch (Exception e) {
                log.error("Failed to process recurring transaction id={}: {}", rt.getId(), e.getMessage(), e);
            }
        }
    }

    private LocalDate computeNextRun(RecurringTransaction rt) {
        return switch (rt.getFrequency()) {
            case DAILY -> rt.getNextRunDate().plusDays(1);
            case WEEKLY -> rt.getNextRunDate().plusWeeks(1);
            case MONTHLY -> rt.getNextRunDate().plusMonths(1);
        };
    }
}
