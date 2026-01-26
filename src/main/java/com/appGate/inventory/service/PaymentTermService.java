package com.appGate.inventory.service;

import com.appGate.inventory.dto.PaymentTermDto;
import com.appGate.inventory.models.PaymentTerm;
import com.appGate.inventory.repository.PaymentTermRepository;
import com.appGate.inventory.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentTermService {

    private final PaymentTermRepository paymentTermRepository;

    @Transactional
    public BaseResponse createPaymentTerm(PaymentTermDto dto) {
        try {
            PaymentTerm paymentTerm = new PaymentTerm();
            paymentTerm.setInvoiceNumber(dto.getInvoiceNumber());
            paymentTerm.setInvoiceAmount(dto.getInvoiceAmount());
            paymentTerm.setSupplierId(dto.getSupplierId());
            paymentTerm.setPeriodOfPayment(dto.getPeriodOfPayment());
            paymentTerm.setRulesForPayment(dto.getRulesForPayment());
            paymentTerm.setAdvancePaymentDetails(dto.getAdvancePaymentDetails());
            paymentTerm.setPercentageMade(dto.getPercentageMade());
            paymentTerm.setTenureOfDelivery(dto.getTenureOfDelivery());
            paymentTerm.setProcessIncaseOfNondelivery(dto.getProcessIncaseOfNondelivery());
            paymentTerm.setTimelineOfDelivery(dto.getTimelineOfDelivery());
            paymentTerm.setAcceptedPaymentMethods(dto.getAcceptedPaymentMethods());
            paymentTerm.setDiscountOnOrder(dto.getDiscountOnOrder());
            paymentTerm.setPaymentDate(dto.getPaymentDate());

            PaymentTerm savedTerm = paymentTermRepository.save(paymentTerm);
            return new BaseResponse(HttpStatus.CREATED.value(), "Payment term created successfully", savedTerm);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating payment term: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllPaymentTerms() {
        List<PaymentTerm> terms = paymentTermRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Payment terms retrieved successfully", terms);
    }

    public BaseResponse getPaymentTermById(Long id) {
        PaymentTerm term = paymentTermRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment term not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Payment term retrieved successfully", term);
    }

    public BaseResponse getPaymentTermByInvoiceNumber(String invoiceNumber) {
        PaymentTerm term = paymentTermRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new RuntimeException("Payment term not found for this invoice"));
        return new BaseResponse(HttpStatus.OK.value(), "Payment term retrieved successfully", term);
    }

    public BaseResponse getPaymentTermsBySupplier(Long supplierId) {
        List<PaymentTerm> terms = paymentTermRepository.findBySupplierId(supplierId);
        return new BaseResponse(HttpStatus.OK.value(), "Supplier payment terms retrieved successfully", terms);
    }

    @Transactional
    public BaseResponse updatePaymentTerm(Long id, PaymentTermDto dto) {
        try {
            PaymentTerm term = paymentTermRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment term not found"));

            if (dto.getInvoiceAmount() != null) {
                term.setInvoiceAmount(dto.getInvoiceAmount());
            }
            if (dto.getPeriodOfPayment() != null) {
                term.setPeriodOfPayment(dto.getPeriodOfPayment());
            }
            if (dto.getRulesForPayment() != null) {
                term.setRulesForPayment(dto.getRulesForPayment());
            }
            if (dto.getAdvancePaymentDetails() != null) {
                term.setAdvancePaymentDetails(dto.getAdvancePaymentDetails());
            }
            if (dto.getPercentageMade() != null) {
                term.setPercentageMade(dto.getPercentageMade());
            }
            if (dto.getTenureOfDelivery() != null) {
                term.setTenureOfDelivery(dto.getTenureOfDelivery());
            }
            if (dto.getProcessIncaseOfNondelivery() != null) {
                term.setProcessIncaseOfNondelivery(dto.getProcessIncaseOfNondelivery());
            }
            if (dto.getTimelineOfDelivery() != null) {
                term.setTimelineOfDelivery(dto.getTimelineOfDelivery());
            }
            if (dto.getAcceptedPaymentMethods() != null) {
                term.setAcceptedPaymentMethods(dto.getAcceptedPaymentMethods());
            }
            if (dto.getDiscountOnOrder() != null) {
                term.setDiscountOnOrder(dto.getDiscountOnOrder());
            }
            if (dto.getPaymentDate() != null) {
                term.setPaymentDate(dto.getPaymentDate());
            }

            PaymentTerm updatedTerm = paymentTermRepository.save(term);
            return new BaseResponse(HttpStatus.OK.value(), "Payment term updated successfully", updatedTerm);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating payment term: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deletePaymentTerm(Long id) {
        try {
            PaymentTerm term = paymentTermRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment term not found"));
            paymentTermRepository.delete(term);
            return new BaseResponse(HttpStatus.OK.value(), "Payment term deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting payment term: " + e.getMessage(), null);
        }
    }
}
