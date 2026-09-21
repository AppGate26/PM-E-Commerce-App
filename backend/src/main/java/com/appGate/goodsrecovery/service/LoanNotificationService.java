package com.appGate.goodsrecovery.service;

import com.appGate.goodsrecovery.models.LoanNotification;
import com.appGate.goodsrecovery.repository.LoanNotificationRepository;
import com.appGate.goodsrecovery.response.BaseResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LoanNotificationService {

    private final LoanNotificationRepository loanNotificationRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    public LoanNotificationService(LoanNotificationRepository loanNotificationRepository,
                                   com.appGate.rbac.service.BranchScopeService branchScopeService) {
        this.loanNotificationRepository = loanNotificationRepository;
        this.branchScopeService = branchScopeService;
    }

    public BaseResponse getAllLoanNotifications() {
        Long branchId = branchScopeService.getScopedBranchId();
        return new BaseResponse(HttpStatus.OK.value(), "successful", branchId == null
                ? loanNotificationRepository.findAll()
                : loanNotificationRepository.findByBranchId(branchId));
    }

    public BaseResponse getLoanNotificationById(Long id) {
        LoanNotification notification = loanNotificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan notification not found"));
        branchScopeService.assertCanAccess(notification.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "successful", notification);
    }

    public BaseResponse getLoanNotificationsByCustomer(Long customerId) {
        // Filtered in memory: the list is one customer's, so it is short by construction.
        Long branchId = branchScopeService.getScopedBranchId();
        java.util.List<LoanNotification> rows =
                loanNotificationRepository.findByCustomerIdOrderByNotificationDateDesc(customerId);
        if (branchId != null) {
            rows = rows.stream()
                    .filter(n -> branchId.equals(n.getBranchId()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return new BaseResponse(HttpStatus.OK.value(), "successful", rows);
    }

    public BaseResponse getUnsentNotifications() {
        Long branchId = branchScopeService.getScopedBranchId();
        return new BaseResponse(HttpStatus.OK.value(), "successful", branchId == null
                ? loanNotificationRepository.findByIsSent(false)
                : loanNotificationRepository.findByIsSentAndBranchId(false, branchId));
    }

    public BaseResponse getNotificationsByType(String notificationType) {
        Long branchId = branchScopeService.getScopedBranchId();
        return new BaseResponse(HttpStatus.OK.value(), "successful", branchId == null
                ? loanNotificationRepository.findByNotificationType(notificationType)
                : loanNotificationRepository.findByNotificationTypeAndBranchId(notificationType, branchId));
    }
}
