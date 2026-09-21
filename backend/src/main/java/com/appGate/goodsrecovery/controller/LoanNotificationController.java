package com.appGate.goodsrecovery.controller;

import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.goodsrecovery.service.LoanNotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/loan-notifications")
@Tag(name = "Goods Recovery", description = "Goods recovery from defaulting customers")
public class LoanNotificationController {

    private final LoanNotificationService loanNotificationService;

    public LoanNotificationController(LoanNotificationService loanNotificationService) {
        this.loanNotificationService = loanNotificationService;
    }

    @GetMapping
    public BaseResponse getAllLoanNotifications() {
        return loanNotificationService.getAllLoanNotifications();
    }

    @GetMapping("/{id}")
    public BaseResponse getLoanNotificationById(@PathVariable Long id) {
        return loanNotificationService.getLoanNotificationById(id);
    }

    @GetMapping("/customer/{customerId}")
    public BaseResponse getLoanNotificationsByCustomer(@PathVariable Long customerId) {
        return loanNotificationService.getLoanNotificationsByCustomer(customerId);
    }

    @GetMapping("/unsent")
    public BaseResponse getUnsentNotifications() {
        return loanNotificationService.getUnsentNotifications();
    }

    @GetMapping("/type/{notificationType}")
    public BaseResponse getNotificationsByType(@PathVariable String notificationType) {
        return loanNotificationService.getNotificationsByType(notificationType);
    }
}
