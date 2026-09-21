package com.appGate.account.service;

import com.appGate.account.dto.DeliveryLineItemDto;
import com.appGate.account.models.DeliverySetup;
import com.appGate.account.repository.DeliverySetupRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Prices delivery per cart line against the admin-configured
 * {@link DeliverySetup} tiers (category + weight range + distance range),
 * using a live-computed trip distance.
 *
 * Each tier's deliveryFee is a rate per km for that weight+distance bracket,
 * not a flat total: the line's fee is the matched tier's deliveryFee
 * multiplied by the actual computed distance. Weight only selects which
 * bracket applies -- it isn't multiplied into the fee.
 *
 * Each line is priced independently by its product's category and unit weight,
 * multiplied by quantity, then summed -- so a cart mixing categories (e.g. phones
 * and a refrigerator) charges each category's own rate.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryFeeService {

    private final DeliverySetupRepository deliverySetupRepository;
    private final DistanceCalculationService distanceCalculationService;

    /**
     * @param originAddress Pickup address
     * @param destinationAddress Delivery address
     * @param lineItems One entry per cart line (category, unit weight, quantity)
     * @return Total delivery fee across all lines
     */
    public BigDecimal calculateDeliveryFee(String originAddress, String destinationAddress,
                                            List<DeliveryLineItemDto> lineItems) {
        if (lineItems == null || lineItems.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal distanceKm = distanceCalculationService
                .calculateDistanceKm(originAddress, destinationAddress)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "Unable to determine delivery distance for the supplied address; cannot compute delivery fee."));

        BigDecimal total = BigDecimal.ZERO;
        for (DeliveryLineItemDto line : lineItems) {
            int quantity = line.getQuantity() != null ? line.getQuantity() : 1;
            DeliverySetup tier = findTier(line, distanceKm);
            BigDecimal lineFee = tier.getDeliveryFee()
                    .multiply(distanceKm)
                    .setScale(2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(quantity));

            log.debug("Line item category={} weight={}kg qty={} distance={}km matched tier id={} rate(₦/km)={} -> lineFee={}",
                    line.getCategoryId(), line.getUnitWeightKg(), quantity, distanceKm,
                    tier.getId(), tier.getDeliveryFee(), lineFee);

            total = total.add(lineFee);
        }
        return total;
    }

    /** Finds the tier whose weight range and distance range the line falls into. */
    private DeliverySetup findTier(DeliveryLineItemDto line, BigDecimal distanceKm) {
        if (line.getCategoryId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Product has no category assigned; cannot compute delivery fee.");
        }

        String categoryLabel = line.getCategoryName() != null
                ? line.getCategoryName()
                : String.valueOf(line.getCategoryId());

        BigDecimal weightKg = line.getUnitWeightKg() != null ? line.getUnitWeightKg() : BigDecimal.ZERO;

        List<DeliverySetup> categoryTiers = deliverySetupRepository
                .findByIsActiveTrueAndCategoryId(line.getCategoryId());

        Optional<DeliverySetup> match = categoryTiers.stream()
                .filter(s -> withinRange(weightKg, s.getWeightMinKg(), s.getWeightMaxKg()))
                .filter(s -> withinRange(distanceKm, s.getDistanceMinKm(), s.getDistanceMaxKm()))
                .min(Comparator.comparing(DeliverySetup::getId));

        return match.orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                "No delivery fee tier configured for category '" + categoryLabel + "' at weight " + weightKg
                        + "kg and distance " + distanceKm + "km. Please contact an administrator."));
    }

    private boolean withinRange(BigDecimal value, BigDecimal min, BigDecimal max) {
        boolean aboveMin = min == null || value.compareTo(min) >= 0;
        boolean belowMax = max == null || value.compareTo(max) <= 0;
        return aboveMin && belowMax;
    }
}
