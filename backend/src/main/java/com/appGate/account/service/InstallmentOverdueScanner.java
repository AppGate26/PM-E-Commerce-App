package com.appGate.account.service;

import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.models.Installment;
import com.appGate.account.repository.InstallmentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Marks missed installments OVERDUE and keeps {@code daysOverdue} current.
 *
 * <p>Nothing ever computed this: {@code InstallmentStatus.OVERDUE} existed, the mobile
 * app had an "Overdue" badge and the notification types were defined, but no code ever
 * moved a row out of PENDING. A customer could stop paying indefinitely and every screen
 * still showed the plan as healthy, with nothing to collect against.
 *
 * <p>Overdue rows are still collectable - {@code InstallmentService.collectableInstallments}
 * charges them alongside PENDING ones, so this only changes what the state is called, never
 * whether the money is owed.
 */
@Service
@RequiredArgsConstructor
public class InstallmentOverdueScanner {

    private static final Logger log = LoggerFactory.getLogger(InstallmentOverdueScanner.class);

    private final InstallmentRepository installmentRepository;

    @Value("${installments.overdue-scanner-enabled:true}")
    private boolean enabled;

    /** Daily, shortly after midnight: due dates are whole days, so there is nothing finer to see. */
    @Scheduled(cron = "${installments.overdue-scan-cron:0 15 0 * * *}")
    @Transactional
    public void markOverdueInstallments() {
        if (!enabled) {
            return;
        }
        LocalDate today = LocalDate.now();

        List<Installment> candidates = installmentRepository.findByStatusIn(
                List.of(InstallmentStatus.PENDING, InstallmentStatus.OVERDUE));

        int newlyOverdue = 0;
        for (Installment installment : candidates) {
            if (installment.getDueDate() == null || !installment.getDueDate().isBefore(today)) {
                continue;
            }
            if (installment.getStatus() == InstallmentStatus.PENDING) {
                installment.setStatus(InstallmentStatus.OVERDUE);
                newlyOverdue++;
            }
            installment.setDaysOverdue((int) ChronoUnit.DAYS.between(installment.getDueDate(), today));
            installmentRepository.save(installment);
        }

        if (newlyOverdue > 0) {
            log.info("Marked {} installment(s) overdue", newlyOverdue);
        }
    }
}
