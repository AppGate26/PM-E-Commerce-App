package com.appGate.account.service;

import com.appGate.account.models.CompanyCard;
import com.appGate.account.repository.CompanyCardRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CompanyCardRepository cardRepository;

    public BaseResponse addPaymentCard(Map<String, Object> cardData) {
        CompanyCard card = new CompanyCard();
        card.setCardName((String) cardData.get("cardName"));
        card.setEmail((String) cardData.get("email"));
        card.setAuthorizationCode((String) cardData.getOrDefault("authorizationCode", null));
        card.setBrand((String) cardData.getOrDefault("brand", null));
        card.setLast4((String) cardData.getOrDefault("last4", null));
        card.setExpMonth((String) cardData.getOrDefault("expMonth", null));
        card.setExpYear((String) cardData.getOrDefault("expYear", null));
        card.setBankName((String) cardData.getOrDefault("bankName", null));
        card.setIsActive(true);

        CompanyCard savedCard = cardRepository.save(card);
        return new BaseResponse(HttpStatus.CREATED.value(), "Payment card added successfully", savedCard);
    }

    public BaseResponse getPaymentCards() {
        List<CompanyCard> cards = cardRepository.findByIsActiveTrueOrderByCardNameAsc();
        return new BaseResponse(HttpStatus.OK.value(), "Payment cards retrieved successfully", cards);
    }

    public BaseResponse updatePaymentCard(Long cardId, Map<String, Object> cardData) {
        CompanyCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment card not found"));

        if (cardData.containsKey("cardName")) {
            card.setCardName((String) cardData.get("cardName"));
        }
        if (cardData.containsKey("email")) {
            card.setEmail((String) cardData.get("email"));
        }
        if (cardData.containsKey("authorizationCode")) {
            card.setAuthorizationCode((String) cardData.get("authorizationCode"));
        }
        if (cardData.containsKey("brand")) {
            card.setBrand((String) cardData.get("brand"));
        }
        if (cardData.containsKey("last4")) {
            card.setLast4((String) cardData.get("last4"));
        }
        if (cardData.containsKey("expMonth")) {
            card.setExpMonth((String) cardData.get("expMonth"));
        }
        if (cardData.containsKey("expYear")) {
            card.setExpYear((String) cardData.get("expYear"));
        }
        if (cardData.containsKey("bankName")) {
            card.setBankName((String) cardData.get("bankName"));
        }

        CompanyCard updatedCard = cardRepository.save(card);
        return new BaseResponse(HttpStatus.OK.value(), "Payment card updated successfully", updatedCard);
    }

    public BaseResponse deletePaymentCard(Long cardId) {
        CompanyCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment card not found"));

        card.setIsActive(false);
        cardRepository.save(card);
        return new BaseResponse(HttpStatus.OK.value(), "Payment card deleted successfully", null);
    }
}
