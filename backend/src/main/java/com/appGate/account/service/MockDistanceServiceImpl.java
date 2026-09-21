package com.appGate.account.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@ConditionalOnProperty(name = "googlemaps.api.mock-enabled", havingValue = "true", matchIfMissing = false)
@Slf4j
public class MockDistanceServiceImpl implements DistanceCalculationService {

    @Override
    public Optional<BigDecimal> calculateDistanceKm(String originAddress, String destinationAddress) {
        log.debug("MOCK: Distance calculation skipped (no Google Maps API key configured yet)");
        return Optional.empty();
    }
}
