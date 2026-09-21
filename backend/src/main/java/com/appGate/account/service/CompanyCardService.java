package com.appGate.account.service;

import com.appGate.account.dto.CompanyCardDto;
import com.appGate.account.models.CompanyCard;
import com.appGate.account.repository.CompanyCardRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CompanyCardService {

    private final CompanyCardRepository companyCardRepository;

    public BaseResponse listActiveCards() {
        return BaseResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Company cards retrieved successfully")
                .data(companyCardRepository.findByIsActiveTrueOrderByCardNameAsc())
                .build();
    }

    public BaseResponse addCard(CompanyCardDto dto) {
        if (dto.getCardName() == null || dto.getCardName().isBlank()) {
            return BaseResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message("Card name is required")
                    .build();
        }

        CompanyCard card = new CompanyCard();
        card.setCardName(dto.getCardName().trim());
        card.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : null);
        card.setLast4(dto.getLast4() != null ? dto.getLast4().trim() : null);
        card.setBankName(dto.getBankName() != null ? dto.getBankName().trim() : null);
        card.setIsActive(true);

        CompanyCard saved = companyCardRepository.save(card);

        return BaseResponse.builder()
                .status(HttpStatus.CREATED.value())
                .message("Company card added successfully")
                .data(saved)
                .build();
    }
}
