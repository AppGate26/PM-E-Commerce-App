package com.appGate.account.service;

import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.models.Installment;
import com.appGate.account.models.InstallmentPlan;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Spreads an installment plan's delivery fee across the installments that make up the
 * first 50% of the plan, rather than loading it all onto the first payment.
 *
 * <p>E.g. a 100,000 fan over 4 monthly periods of 25,000: the first half of the plan is
 * installments #1-#2 (50,000), so a 3,000 delivery fee adds 1,500 to each of those two and
 * leaves #3-#4 at 25,000. With an odd number of periods the half rounds up (5 periods ->
 * #1-#3), so the fee is always cleared by the time half the plan is paid.
 *
 * <p>Each row's share is kept in {@link Installment#getDeliveryFeePortion()} and is already
 * included in its {@code amountDue}, so every repayment path (wallet, pay-next, pay-full)
 * collects it without knowing about delivery at all. {@code plan.grandTotal},
 * {@code plan.downPayment} and {@code plan.installmentAmount} stay delivery-free.
 *
 * <p>Rows created before this existed carry a null portion: their delivery fee was
 * collected in full with the down payment, and {@link #deliveryDueWithDownPayment} still
 * charges it that way.
 */
public final class InstallmentDeliveryFeeSpread {

    private InstallmentDeliveryFeeSpread() {
    }

    /** How many leading installments make up the first half of a plan of {@code totalPeriods}. */
    public static int firstHalfCount(int totalPeriods) {
        return Math.max(1, (totalPeriods + 1) / 2);
    }

    /**
     * Sets the plan's delivery fee to {@code deliveryFee} and re-spreads whatever of it is
     * not already collected across the unpaid installments in the first half of the plan.
     * Paid rows keep their portion untouched. If every first-half row is already paid, the
     * remainder lands on the earliest unpaid row instead of being lost.
     *
     * @param rows             the plan's installment rows (all of them)
     * @param alreadyCollected delivery fee already collected by paid rows / the down payment
     */
    public static void respread(InstallmentPlan plan, List<Installment> rows, double deliveryFee,
                                double alreadyCollected) {
        List<Installment> sorted = rows.stream()
                .sorted(Comparator.comparing(Installment::getInstallmentNumber))
                .collect(Collectors.toList());
        int half = firstHalfCount(sorted.size());

        List<Installment> unpaid = sorted.stream()
                .filter(row -> row.getStatus() != InstallmentStatus.PAID)
                .collect(Collectors.toList());
        List<Installment> targets = unpaid.stream()
                .filter(row -> row.getInstallmentNumber() <= half)
                .collect(Collectors.toList());
        if (targets.isEmpty() && !unpaid.isEmpty()) {
            targets = List.of(unpaid.get(0));
        }

        // Clear every unpaid row's old share first, so a row that drops out of the targets
        // doesn't keep charging delivery.
        for (Installment row : unpaid) {
            setPortion(row, 0.0);
        }

        long remainingKobo = Math.max(0L, Math.round((deliveryFee - alreadyCollected) * 100));
        if (!targets.isEmpty() && remainingKobo > 0) {
            long perRowKobo = remainingKobo / targets.size();
            long leftoverKobo = remainingKobo - perRowKobo * targets.size();
            for (int i = 0; i < targets.size(); i++) {
                // Rounding leftover goes on the first row so the shares add up exactly.
                long kobo = perRowKobo + (i == 0 ? leftoverKobo : 0);
                setPortion(targets.get(i), kobo / 100.0);
            }
        }

        plan.setDeliveryFee(deliveryFee);
        plan.setRemainingBalance(unpaid.stream()
                .mapToDouble(row -> row.getAmountDue() != null ? row.getAmountDue() : 0.0)
                .sum());
    }

    /** Replaces a row's delivery share, keeping amountDue = principal + share. */
    private static void setPortion(Installment row, double portion) {
        double oldPortion = portionOf(row);
        double amountDue = row.getAmountDue() != null ? row.getAmountDue() : 0.0;
        row.setAmountDue(amountDue - oldPortion + portion);
        row.setDeliveryFeePortion(portion);
    }

    /** A row's delivery share, treating the legacy null as 0. */
    public static double portionOf(Installment row) {
        return row != null && row.getDeliveryFeePortion() != null ? row.getDeliveryFeePortion() : 0.0;
    }

    /**
     * The delivery fee an order-level down-payment charge must collect on top of
     * {@code plan.downPayment}: the order's delivery fee minus what the down payment
     * already collected and minus what later installments are scheduled to collect.
     * For a spread plan that is exactly installment #1's share (or 0 once the down payment
     * is paid); for a legacy plan with no shares it is the whole outstanding fee, as before.
     */
    public static double deliveryDueWithDownPayment(InstallmentPlan plan, List<Installment> rows,
                                                    double orderDeliveryFee) {
        double collected = plan.getDownPaymentDeliveryFee() != null ? plan.getDownPaymentDeliveryFee() : 0.0;
        double scheduledLater = rows.stream()
                .filter(row -> row.getInstallmentNumber() != null && row.getInstallmentNumber() > 1)
                .mapToDouble(InstallmentDeliveryFeeSpread::portionOf)
                .sum();
        return Math.max(0.0, orderDeliveryFee - collected - scheduledLater);
    }
}
