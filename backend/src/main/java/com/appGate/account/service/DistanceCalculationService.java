package com.appGate.account.service;

import java.math.BigDecimal;
import java.util.Optional;

public interface DistanceCalculationService {

    /**
     * @return the road distance in kilometers between the two addresses, or
     *         {@link Optional#empty()} if it could not be determined (no live
     *         provider configured, or the provider call failed).
     */
    Optional<BigDecimal> calculateDistanceKm(String originAddress, String destinationAddress);
}
