package com.budgetapp.config;

import com.budgetapp.service.RecurringTransactionScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class StartupRecurringCheck implements ApplicationRunner {

    private final RecurringTransactionScheduler scheduler;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Running startup check for due recurring transactions...");
        scheduler.runDueRecurringTransactions();
    }
}
