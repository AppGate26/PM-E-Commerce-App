package com.appGate.account.service;

import com.appGate.account.dto.CreateDisputeDto;
import com.appGate.account.dto.DisputeFilterDto;
import com.appGate.account.dto.ResolveDisputeDto;
import com.appGate.account.enums.DisputeResolution;
import com.appGate.account.enums.DisputeStatus;
import com.appGate.account.models.Dispute;
import com.appGate.account.repository.DisputeRepository;
import com.appGate.account.repository.DisputeSpecification;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final WalletService walletService;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    @Transactional
    public BaseResponse createDispute(CreateDisputeDto dto) {
        Dispute dispute = new Dispute();
        dispute.setUserId(dto.getUserId());
        dispute.setPaymentId(dto.getPaymentId());
        dispute.setTransactionReference(dto.getTransactionReference());
        dispute.setCategory(dto.getCategory());
        dispute.setDisputedAmount(dto.getDisputedAmount());
        dispute.setDescription(dto.getDescription());
        dispute.setStatus(DisputeStatus.OPEN);

        disputeRepository.save(dispute);

        return BaseResponse.builder()
                .status(201)
                .message("Dispute created successfully")
                .data(dispute)
                .build();
    }

    public BaseResponse getDisputeById(Long id) {
        Dispute dispute = disputeRepository.findById(id)
                .orElse(null);

        if (dispute == null) {
            return BaseResponse.builder()
                    .status(404)
                    .message("Dispute not found")
                    .build();
        }

        branchScopeService.assertCanAccess(dispute.getBranchId());

        return BaseResponse.builder()
                .status(200)
                .message("Dispute retrieved successfully")
                .data(dispute)
                .build();
    }

    public BaseResponse filterDisputes(DisputeFilterDto filter, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        // Compose the branch filter into the existing search spec so it is applied
        // in SQL, before pagination.
        Page<Dispute> disputes = disputeRepository.findAll(
                DisputeSpecification.withFilters(filter)
                        .and(com.appGate.rbac.context.BranchSpecs.ownedBy(
                                branchScopeService.getScopedBranchId())),
                pageRequest);

        return BaseResponse.builder()
                .status(200)
                .message("Disputes retrieved successfully")
                .data(disputes)
                .build();
    }

    public BaseResponse getUserDisputes(Long userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Dispute> disputes = disputeRepository.findByUserId(userId, pageRequest);

        return BaseResponse.builder()
                .status(200)
                .message("User disputes retrieved successfully")
                .data(disputes)
                .build();
    }

    @Transactional
    public BaseResponse resolveDispute(Long id, ResolveDisputeDto dto) {
        Dispute dispute = disputeRepository.findById(id)
                .orElse(null);

        if (dispute == null) {
            return BaseResponse.builder()
                    .status(404)
                    .message("Dispute not found")
                    .build();
        }

        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.REJECTED) {
            return BaseResponse.builder()
                    .status(400)
                    .message("Dispute has already been " + dispute.getStatus().name().toLowerCase())
                    .build();
        }

        dispute.setResolution(dto.getResolution());
        dispute.setAdminNotes(dto.getAdminNotes());
        dispute.setResolvedBy(dto.getResolvedBy());
        dispute.setResolvedAt(LocalDateTime.now());

        if (dto.getResolution() == DisputeResolution.DENIED) {
            dispute.setStatus(DisputeStatus.REJECTED);
        } else {
            dispute.setStatus(DisputeStatus.RESOLVED);
        }

        // If resolution involves a refund, credit the user's wallet
        if (dto.getResolution() == DisputeResolution.REFUNDED || dto.getResolution() == DisputeResolution.REVERSED) {
            walletService.creditWallet(dispute.getUserId(), dispute.getDisputedAmount(),
                    "Dispute refund - #" + dispute.getId());
        } else if (dto.getResolution() == DisputeResolution.PARTIALLY_REFUNDED) {
            // For partial refund, credit half the disputed amount
            walletService.creditWallet(dispute.getUserId(), dispute.getDisputedAmount() / 2,
                    "Partial dispute refund - #" + dispute.getId());
        }

        disputeRepository.save(dispute);

        return BaseResponse.builder()
                .status(200)
                .message("Dispute resolved successfully")
                .data(dispute)
                .build();
    }
}
