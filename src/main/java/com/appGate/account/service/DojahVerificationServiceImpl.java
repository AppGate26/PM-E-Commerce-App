package com.appGate.account.service;

import com.appGate.account.dto.DojahApiResponse;
import com.appGate.account.dto.VerificationResponse;
import com.appGate.account.exception.VerificationException;
import com.appGate.config.DojahConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
@ConditionalOnProperty(name = "dojah.api.mock-enabled", havingValue = "false", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class DojahVerificationServiceImpl implements VerificationService {

    private final RestTemplate dojahRestTemplate;
    private final DojahConfig dojahConfig;

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", dojahConfig.getSecretKey());
        headers.set("AppId", dojahConfig.getAppId());
        return headers;
    }

    @Override
    public VerificationResponse verifyBvn(String bvn) {
        log.info("Verifying BVN: {}", maskSensitiveData(bvn));

        try {
            String url = String.format("%s/api/v1/kyc/bvn?bvn=%s",
                dojahConfig.getBaseUrl(), bvn);

            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());

            ResponseEntity<DojahApiResponse> response = dojahRestTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                DojahApiResponse.class
            );

            return mapToVerificationResponse(response.getBody(), "BVN");

        } catch (HttpClientErrorException e) {
            log.error("BVN verification failed: {} - {}", e.getStatusCode(), e.getMessage());

            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new VerificationException("BVN not found or invalid");
            } else if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new VerificationException("Invalid API credentials");
            }

            throw new VerificationException("BVN verification failed: " + e.getStatusCode());

        } catch (Exception e) {
            log.error("Unexpected error during BVN verification", e);
            throw new VerificationException("BVN verification error: " + e.getMessage());
        }
    }

    @Override
    public VerificationResponse verifyNin(String nin) {
        log.info("Verifying NIN: {}", maskSensitiveData(nin));

        try {
            String url = String.format("%s/api/v1/kyc/nin?nin=%s",
                dojahConfig.getBaseUrl(), nin);

            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());

            ResponseEntity<DojahApiResponse> response = dojahRestTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                DojahApiResponse.class
            );

            return mapToVerificationResponse(response.getBody(), "NIN");

        } catch (HttpClientErrorException e) {
            log.error("NIN verification failed: {} - {}", e.getStatusCode(), e.getMessage());

            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new VerificationException("NIN not found or invalid");
            } else if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new VerificationException("Invalid API credentials");
            }

            throw new VerificationException("NIN verification failed: " + e.getStatusCode());

        } catch (Exception e) {
            log.error("Unexpected error during NIN verification", e);
            throw new VerificationException("NIN verification error: " + e.getMessage());
        }
    }

    private VerificationResponse mapToVerificationResponse(DojahApiResponse apiResponse, String type) {
        if (apiResponse == null || apiResponse.getEntity() == null) {
            return VerificationResponse.builder()
                    .success(false)
                    .message("No data returned from verification service")
                    .verificationType(type)
                    .build();
        }

        DojahApiResponse.Entity entity = apiResponse.getEntity();

        VerificationResponse.PersonData personData = VerificationResponse.PersonData.builder()
                .bvn(entity.getBvn())
                .nin(entity.getNin())
                .firstName(entity.getFirstName())
                .middleName(entity.getMiddleName())
                .lastName(entity.getLastName())
                .fullName(buildFullName(entity))
                .dateOfBirth(entity.getDateOfBirth())
                .phoneNumber(entity.getPhoneNumber())
                .phoneNumber2(entity.getPhoneNumber2())
                .email(entity.getEmail())
                .gender(entity.getGender())
                .address(entity.getResidentialAddress())
                .state(entity.getState())
                .stateOfOrigin(entity.getStateOfOrigin())
                .lga(entity.getLga())
                .lgaOfOrigin(entity.getLgaOfOrigin())
                .nationality(entity.getNationality())
                .image(entity.getImage())
                .enrollmentBank(entity.getEnrollmentBank())
                .enrollmentBranch(entity.getEnrollmentBranch())
                .registrationDate(entity.getRegistrationDate())
                .maritalStatus(entity.getMaritalStatus())
                .watchListed(entity.getWatchListed())
                .build();

        return VerificationResponse.builder()
                .success(true)
                .message(type + " verification successful")
                .verificationType(type)
                .data(personData)
                .build();
    }

    private String buildFullName(DojahApiResponse.Entity entity) {
        StringBuilder fullName = new StringBuilder();

        if (entity.getFirstName() != null) {
            fullName.append(entity.getFirstName());
        }

        if (entity.getMiddleName() != null) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(entity.getMiddleName());
        }

        if (entity.getLastName() != null) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(entity.getLastName());
        }

        return fullName.toString();
    }

    private String maskSensitiveData(String data) {
        if (data == null || data.length() < 4) {
            return "****";
        }
        return data.substring(0, 3) + "****" + data.substring(data.length() - 2);
    }
}
