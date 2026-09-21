package com.appGate.account.service;

import com.appGate.account.dto.GoogleDistanceMatrixResponse;
import com.appGate.config.GoogleMapsConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
@ConditionalOnProperty(name = "googlemaps.api.mock-enabled", havingValue = "false", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class GoogleMapsDistanceServiceImpl implements DistanceCalculationService {

    private final RestTemplate googleMapsRestTemplate;
    private final GoogleMapsConfig googleMapsConfig;

    @Override
    public Optional<BigDecimal> calculateDistanceKm(String originAddress, String destinationAddress) {
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(googleMapsConfig.getBaseUrl() + "/distancematrix/json")
                    .queryParam("origins", originAddress)
                    .queryParam("destinations", destinationAddress)
                    .queryParam("key", googleMapsConfig.getKey())
                    .toUriString();

            GoogleDistanceMatrixResponse response = googleMapsRestTemplate.getForObject(
                    url, GoogleDistanceMatrixResponse.class);

            if (response == null || !"OK".equals(response.getStatus())) {
                log.warn("Distance Matrix request failed: status={}",
                        response == null ? "null" : response.getStatus());
                return Optional.empty();
            }

            List<GoogleDistanceMatrixResponse.Row> rows = response.getRows();
            if (rows == null || rows.isEmpty() || rows.get(0).getElements() == null
                    || rows.get(0).getElements().isEmpty()) {
                log.warn("Distance Matrix response had no rows/elements for '{}' -> '{}'",
                        originAddress, destinationAddress);
                return Optional.empty();
            }

            GoogleDistanceMatrixResponse.Element element = rows.get(0).getElements().get(0);
            if (!"OK".equals(element.getStatus()) || element.getDistance() == null
                    || element.getDistance().getValue() == null) {
                log.warn("Distance Matrix element status not OK: {}", element.getStatus());
                return Optional.empty();
            }

            BigDecimal meters = BigDecimal.valueOf(element.getDistance().getValue());
            BigDecimal km = meters.divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
            return Optional.of(km);

        } catch (Exception e) {
            log.error("Unexpected error calculating distance via Google Maps", e);
            return Optional.empty();
        }
    }
}
