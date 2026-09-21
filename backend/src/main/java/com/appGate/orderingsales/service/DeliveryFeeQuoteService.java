package com.appGate.orderingsales.service;

import com.appGate.account.dto.DeliveryLineItemDto;
import com.appGate.inventory.models.Product;
import com.appGate.inventory.repository.ProductRepository;
import com.appGate.orderingsales.enums.FulfillmentType;
import com.appGate.orderingsales.models.Cart;
import com.appGate.orderingsales.repository.CartRepository;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.State;
import com.appGate.rbac.repository.BranchRepository;
import com.appGate.rbac.repository.LGARepository;
import com.appGate.rbac.repository.StateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Prices a delivery fee for a user's current cart against a candidate delivery
 * destination, without creating an order. Extracted out of OrderService so it can
 * also be called from PaymentGatewayService's pre-checkout payment-initialize flow
 * (see PaymentGatewayService.maybeIncludeDeliveryFeeForDownPayment) - those live in
 * the account package and OrderService already depends on PaymentGatewayService, so
 * reusing OrderService's own logic there directly would form a circular bean
 * dependency.
 *
 * Mirrors OrderService.calculateDeliveryFeeQuote's line-item building, origin-branch
 * resolution and address joining exactly, so a quote taken here and one taken from
 * that endpoint (or from OrderService.checkout() itself) agree for the same cart and
 * destination. OrderService.calculateDeliveryFeeQuote now delegates its own pricing to
 * this class instead of duplicating it, specifically so every quote the mobile app asks
 * for (POST /orders/calculate-delivery-fee) also lands in the cache below.
 *
 * <p><b>Cache / workaround:</b> the mobile app's pre-order payment charge
 * (POST /api/payments/card/initialize et al.) is observed in production never sending a
 * delivery address at all - it quotes the fee earlier (via calculate-delivery-fee, to
 * show the customer a total) but doesn't carry that quote into the payment-initialize
 * call, and there's no order yet for the fee to live on. This cache lets
 * PaymentGatewayService recover "the last fee this user was quoted" at charge time and
 * fold it into what's actually sent to Paystack. In-memory and per-instance (not shared
 * across a multi-instance deployment) and best-effort by nature - same trade-off as the
 * existing orphaned-payment matching this sits alongside (see
 * PaymentGatewayService.resolveOrphanedDownPaymentPlan).
 */
@Service
@RequiredArgsConstructor
public class DeliveryFeeQuoteService {

    /**
     * How long a quote stays usable to backfill a payment-initialize call that follows it.
     * Kept short (rather than, say, 30 minutes) because a stale quote is actively dangerous
     * here, not just unhelpful: PICKUP fulfillment never re-quotes (see
     * OrderService.calculateDeliveryFeeQuote/the checkout page's own fetchDeliveryFee, which
     * both skip the call entirely for PICKUP), so a DELIVERY quote left over from earlier in
     * the session could otherwise get folded into a down payment the customer actually
     * intends to pick up in-store. A short window keeps this to "the quote from the
     * screen the customer is looking at right now", and consumeRecentDeliveryFee below
     * additionally pops the entry on use so it can never be reapplied to a second, unrelated
     * payment attempt.
     */
    private static final Duration QUOTE_TTL = Duration.ofMinutes(10);

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final BranchRepository branchRepository;
    private final StateRepository stateRepository;
    private final LGARepository lgaRepository;
    private final com.appGate.account.service.DeliveryFeeService deliveryFeeService;

    private record CachedQuote(BigDecimal deliveryFee, Instant quotedAt) {
    }

    private final java.util.Map<Long, CachedQuote> recentQuotesByUserId = new ConcurrentHashMap<>();

    /**
     * @return the delivery fee for the user's current cart, or ZERO when fulfillmentType
     * is null (caller hasn't opted into a delivery-fee quote at this step) or PICKUP.
     * Throws BAD_REQUEST if fulfillmentType is DELIVERY but the address/state/LGA needed
     * to price it weren't supplied - same validation as OrderService.calculateDeliveryFeeQuote.
     * Every non-null-fulfillmentType call (DELIVERY or PICKUP) updates the recent-quote
     * cache for this user - see {@link #recentDeliveryFee}.
     */
    public BigDecimal quoteDeliveryFee(Long userId, FulfillmentType fulfillmentType,
                                        String deliveryAddress, Long deliveryStateId,
                                        Long deliveryLgaId, String deliveryCountry) {
        if (fulfillmentType == null) {
            return BigDecimal.ZERO;
        }
        if (fulfillmentType == FulfillmentType.PICKUP) {
            cacheQuote(userId, BigDecimal.ZERO);
            return BigDecimal.ZERO;
        }
        if (deliveryAddress == null || deliveryAddress.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery address is required for DELIVERY orders");
        }
        if (deliveryStateId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery state is required for DELIVERY orders");
        }
        if (deliveryLgaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery LGA is required for DELIVERY orders");
        }

        List<Cart> cartItems = cartRepository.findByUserIdAndStatus(userId, true);
        if (cartItems.isEmpty()) {
            return BigDecimal.ZERO;
        }

        List<DeliveryLineItemDto> deliveryLineItems = new ArrayList<>();
        for (Cart cartItem : cartItems) {
            Product product = productRepository.findById(cartItem.getProductId()).orElse(null);
            Long categoryId = (product != null) ? product.getCategoryId() : null;
            String categoryName = (product != null && product.getCategory() != null)
                    ? product.getCategory().getName() : null;
            BigDecimal unitWeightKg = (product != null) ? product.getWeightKg() : null;
            deliveryLineItems.add(new DeliveryLineItemDto(categoryId, categoryName, unitWeightKg, cartItem.getQuantity()));
        }

        Branch branch = branchRepository.findByHeadOfficeTrue()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Head Office branch not found"));
        String originAddress = buildAddress(branch.getAddress(),
                branch.getLga() != null ? branch.getLga().getName() : null,
                branch.getState() != null ? branch.getState().getName() : null,
                "Nigeria");

        State state = stateRepository.findById(deliveryStateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery State not found"));
        LGA lga = lgaRepository.findById(deliveryLgaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery LGA not found"));
        String destinationAddress = buildAddress(deliveryAddress, lga.getName(), state.getName(), deliveryCountry);

        BigDecimal fee = deliveryFeeService.calculateDeliveryFee(originAddress, destinationAddress, deliveryLineItems);
        cacheQuote(userId, fee);
        return fee;
    }

    private void cacheQuote(Long userId, BigDecimal deliveryFee) {
        if (userId == null) {
            return;
        }
        recentQuotesByUserId.put(userId, new CachedQuote(deliveryFee, Instant.now()));
    }

    /**
     * Atomically reads and removes this user's cached quote (via {@link #quoteDeliveryFee}),
     * returning it only if it's still within {@link #QUOTE_TTL} <b>and</b> was taken at or
     * after {@code notBefore} - empty otherwise (never quoted, too stale, or - the case that
     * matters most - quoted before {@code notBefore} and therefore almost certainly belonging
     * to an earlier, unrelated cart/session rather than the one this call is about).
     *
     * <p>Single-use by design: whatever is returned here is removed from the cache in the
     * same atomic step, whether or not the caller ends up folding it into a charge, so a
     * cached quote can never be reused across two different payment attempts. Callers should
     * pass the creation time of whatever they're matching this quote against (e.g. an
     * InstallmentPlan's createdAt) as {@code notBefore} - see
     * PaymentGatewayService.matchDownPaymentDeliveryFee.
     */
    public Optional<BigDecimal> consumeRecentDeliveryFee(Long userId, LocalDateTime notBefore) {
        if (userId == null) {
            return Optional.empty();
        }
        Instant cutoff = notBefore != null ? notBefore.atZone(ZoneId.systemDefault()).toInstant() : null;
        AtomicReference<BigDecimal> result = new AtomicReference<>();
        recentQuotesByUserId.computeIfPresent(userId, (id, cached) -> {
            boolean expired = Duration.between(cached.quotedAt(), Instant.now()).compareTo(QUOTE_TTL) > 0;
            boolean tooOldForThisSession = cutoff != null && cached.quotedAt().isBefore(cutoff);
            if (!expired && !tooOldForThisSession) {
                result.set(cached.deliveryFee());
            }
            return null; // always remove - single-use, see javadoc
        });
        return Optional.ofNullable(result.get());
    }

    /** Joins the non-blank parts into a single address string for the distance lookup. */
    private String buildAddress(String baseAddress, String lgaName, String stateName, String country) {
        StringBuilder sb = new StringBuilder();
        for (String part : new String[]{baseAddress, lgaName, stateName, country}) {
            if (part != null && !part.isBlank()) {
                if (sb.length() > 0) {
                    sb.append(", ");
                }
                sb.append(part);
            }
        }
        return sb.toString();
    }
}
