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

    public LoanNotificationService(LoanNotificationRepository loanNotificationRepository) {
        this.loanNotificationRepository = loanNotificationRepository;
    }

    public BaseResponse getAllLoanNotifications() {
        return new BaseResponse(HttpStatus.OK.value(), "successful", loanNotificationRepository.findAll());
    }

    public BaseResponse getLoanNotificationById(Long id) {
        LoanNotification notification = loanNotificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan notification not found"));
        return new BaseResponse(HttpStatus.OK.value(), "successful", notification);
    }

    public BaseResponse getLoanNotificationsByCustomer(Long customerId) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                loanNotificationRepository.findByCustomerIdOrderByNotificationDateDesc(customerId));
    }

    public BaseResponse getUnsentNotifications() {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                loanNotificationRepository.findByIsSent(false));
    }

    public BaseResponse getNotificationsByType(String notificationType) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                loanNotificationRepository.findByNotificationType(notificationType));
    }
}
