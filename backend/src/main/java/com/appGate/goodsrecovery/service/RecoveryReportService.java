package com.appGate.goodsrecovery.service;

import com.appGate.goodsrecovery.enums.GoodsRecoveryStatus;
import com.appGate.goodsrecovery.enums.RecoveryBoxStatusEnum;
import com.appGate.goodsrecovery.models.GoodsRecovery;
import com.appGate.goodsrecovery.models.LoanNotification;
import com.appGate.goodsrecovery.models.RecoveryAgent;
import com.appGate.goodsrecovery.models.RecoveryBox;
import com.appGate.goodsrecovery.repository.GoodsRecoveryRepository;
import com.appGate.goodsrecovery.repository.LoanNotificationRepository;
import com.appGate.goodsrecovery.repository.RecoveryAgentRepository;
import com.appGate.goodsrecovery.repository.RecoveryBoxRepository;
import com.appGate.goodsrecovery.response.BaseResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecoveryReportService {

    private final GoodsRecoveryRepository goodsRecoveryRepository;
    private final RecoveryBoxRepository recoveryBoxRepository;
    private final RecoveryAgentRepository recoveryAgentRepository;
    private final LoanNotificationRepository loanNotificationRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    public RecoveryReportService(GoodsRecoveryRepository goodsRecoveryRepository,
                                 RecoveryBoxRepository recoveryBoxRepository,
                                 RecoveryAgentRepository recoveryAgentRepository,
                                 LoanNotificationRepository loanNotificationRepository,
                                 com.appGate.rbac.service.BranchScopeService branchScopeService) {
        this.goodsRecoveryRepository = goodsRecoveryRepository;
        this.recoveryBoxRepository = recoveryBoxRepository;
        this.recoveryAgentRepository = recoveryAgentRepository;
        this.loanNotificationRepository = loanNotificationRepository;
        this.branchScopeService = branchScopeService;
    }

    public BaseResponse getRecoveryReport() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<GoodsRecovery> allRecoveries = branchId == null
                ? goodsRecoveryRepository.findAll()
                : goodsRecoveryRepository.findByBranchId(branchId);
        List<RecoveryBox> allBoxes = branchId == null
                ? recoveryBoxRepository.findAll()
                : recoveryBoxRepository.findByBranchId(branchId);

        // Count by status
        long notYetRecovered = allRecoveries.stream()
                .filter(r -> r.getStatus() == GoodsRecoveryStatus.NOT_YET_RECOVERED)
                .count();
        long partiallyRecovered = allRecoveries.stream()
                .filter(r -> r.getStatus() == GoodsRecoveryStatus.PARTIALLY_RECOVERED)
                .count();
        long fullyRecovered = allRecoveries.stream()
                .filter(r -> r.getStatus() == GoodsRecoveryStatus.RECOVERED)
                .count();

        // Recovery boxes by status
        long pendingBoxes = allBoxes.stream()
                .filter(b -> b.getStatus() == RecoveryBoxStatusEnum.PENDING)
                .count();
        long acceptedBoxes = allBoxes.stream()
                .filter(b -> b.getStatus() == RecoveryBoxStatusEnum.ACCEPTED)
                .count();
        long recoveredBoxes = allBoxes.stream()
                .filter(b -> b.getStatus() == RecoveryBoxStatusEnum.RECOVERED)
                .count();
        long failedBoxes = allBoxes.stream()
                .filter(b -> b.getStatus() == RecoveryBoxStatusEnum.FAILED)
                .count();

        // Calculate success rate
        double successRate = allRecoveries.isEmpty() ? 0 :
                (double) fullyRecovered / allRecoveries.size() * 100;

        Map<String, Object> report = new HashMap<>();
        report.put("totalRecoveries", allRecoveries.size());
        report.put("notYetRecovered", notYetRecovered);
        report.put("partiallyRecovered", partiallyRecovered);
        report.put("fullyRecovered", fullyRecovered);
        report.put("successRate", String.format("%.2f%%", successRate));

        report.put("totalBoxes", allBoxes.size());
        report.put("pendingBoxes", pendingBoxes);
        report.put("acceptedBoxes", acceptedBoxes);
        report.put("recoveredBoxes", recoveredBoxes);
        report.put("failedBoxes", failedBoxes);

        report.put("allRecoveries", allRecoveries);
        report.put("allBoxes", allBoxes);

        return new BaseResponse(HttpStatus.OK.value(), "Recovery report retrieved successfully", report);
    }

    public BaseResponse getRecoveryReportByAgent(Long recoveryAgentId) {
        RecoveryAgent agent = recoveryAgentRepository.findById(recoveryAgentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery agent not found"));
        branchScopeService.assertCanAccess(agent.getBranchId());

        List<RecoveryBox> agentBoxes = recoveryBoxRepository.findByRecoveryAgentId(recoveryAgentId);

        long pendingBoxes = agentBoxes.stream()
                .filter(b -> b.getStatus() == RecoveryBoxStatusEnum.PENDING)
                .count();
        long acceptedBoxes = agentBoxes.stream()
                .filter(b -> b.getStatus() == RecoveryBoxStatusEnum.ACCEPTED)
                .count();
        long recoveredBoxes = agentBoxes.stream()
                .filter(b -> b.getStatus() == RecoveryBoxStatusEnum.RECOVERED)
                .count();
        long failedBoxes = agentBoxes.stream()
                .filter(b -> b.getStatus() == RecoveryBoxStatusEnum.FAILED)
                .count();

        double successRate = agentBoxes.isEmpty() ? 0 :
                (double) recoveredBoxes / agentBoxes.size() * 100;

        Map<String, Object> report = new HashMap<>();
        report.put("recoveryAgentId", recoveryAgentId);
        report.put("agentName", agent.getFirstName() + " " + agent.getLastName());
        report.put("totalBoxes", agentBoxes.size());
        report.put("pendingBoxes", pendingBoxes);
        report.put("acceptedBoxes", acceptedBoxes);
        report.put("recoveredBoxes", recoveredBoxes);
        report.put("failedBoxes", failedBoxes);
        report.put("successRate", String.format("%.2f%%", successRate));
        report.put("boxes", agentBoxes);

        return new BaseResponse(HttpStatus.OK.value(), "Agent recovery report retrieved successfully", report);
    }

    public BaseResponse getLoanReport() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<LoanNotification> allNotifications = branchId == null
                ? loanNotificationRepository.findAll()
                : loanNotificationRepository.findByBranchId(branchId);

        // Count by notification type
        long paymentDue = allNotifications.stream()
                .filter(n -> "PAYMENT_DUE".equals(n.getNotificationType()))
                .count();
        long paymentOverdue = allNotifications.stream()
                .filter(n -> "PAYMENT_OVERDUE".equals(n.getNotificationType()))
                .count();
        long finalWarning = allNotifications.stream()
                .filter(n -> "FINAL_WARNING".equals(n.getNotificationType()))
                .count();
        long defaulted = allNotifications.stream()
                .filter(n -> "DEFAULT".equals(n.getNotificationType()))
                .count();

        // Calculate total amounts
        BigDecimal totalLoanAmount = allNotifications.stream()
                .map(LoanNotification::getLoanAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmountDue = allNotifications.stream()
                .map(LoanNotification::getAmountDue)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Count sent vs unsent
        long sentNotifications = allNotifications.stream()
                .filter(LoanNotification::getIsSent)
                .count();
        long unsentNotifications = allNotifications.stream()
                .filter(n -> !n.getIsSent())
                .count();

        Map<String, Object> report = new HashMap<>();
        report.put("totalNotifications", allNotifications.size());
        report.put("paymentDue", paymentDue);
        report.put("paymentOverdue", paymentOverdue);
        report.put("finalWarning", finalWarning);
        report.put("defaulted", defaulted);
        report.put("totalLoanAmount", totalLoanAmount);
        report.put("totalAmountDue", totalAmountDue);
        report.put("sentNotifications", sentNotifications);
        report.put("unsentNotifications", unsentNotifications);
        report.put("allNotifications", allNotifications);

        return new BaseResponse(HttpStatus.OK.value(), "Loan report retrieved successfully", report);
    }

    public BaseResponse getLoanReportByCustomer(Long customerId) {
        Long branchId = branchScopeService.getScopedBranchId();
        List<LoanNotification> customerNotifications =
                loanNotificationRepository.findByCustomerIdOrderByNotificationDateDesc(customerId);
        if (branchId != null) {
            customerNotifications = customerNotifications.stream()
                    .filter(n -> branchId.equals(n.getBranchId()))
                    .collect(java.util.stream.Collectors.toList());
        }

        if (customerNotifications.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No loan notifications found for this customer");
        }

        // Get customer info from first notification
        LoanNotification firstNotification = customerNotifications.get(0);

        // Count by notification type
        long paymentDue = customerNotifications.stream()
                .filter(n -> "PAYMENT_DUE".equals(n.getNotificationType()))
                .count();
        long paymentOverdue = customerNotifications.stream()
                .filter(n -> "PAYMENT_OVERDUE".equals(n.getNotificationType()))
                .count();
        long finalWarning = customerNotifications.stream()
                .filter(n -> "FINAL_WARNING".equals(n.getNotificationType()))
                .count();
        long defaulted = customerNotifications.stream()
                .filter(n -> "DEFAULT".equals(n.getNotificationType()))
                .count();

        // Calculate total amounts
        BigDecimal totalLoanAmount = customerNotifications.stream()
                .map(LoanNotification::getLoanAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmountDue = customerNotifications.stream()
                .map(LoanNotification::getAmountDue)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> report = new HashMap<>();
        report.put("customerId", customerId);
        report.put("customerName", firstNotification.getCustomerName());
        report.put("customerEmail", firstNotification.getCustomerEmail());
        report.put("customerPhone", firstNotification.getCustomerPhone());
        report.put("totalNotifications", customerNotifications.size());
        report.put("paymentDue", paymentDue);
        report.put("paymentOverdue", paymentOverdue);
        report.put("finalWarning", finalWarning);
        report.put("defaulted", defaulted);
        report.put("totalLoanAmount", totalLoanAmount);
        report.put("totalAmountDue", totalAmountDue);
        report.put("notifications", customerNotifications);

        return new BaseResponse(HttpStatus.OK.value(), "Customer loan report retrieved successfully", report);
    }
}
