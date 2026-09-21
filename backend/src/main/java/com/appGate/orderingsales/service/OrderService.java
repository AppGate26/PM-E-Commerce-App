package com.appGate.orderingsales.service;

import com.appGate.account.dto.InstallmentResponseDto;
import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.models.Installment;
import com.appGate.account.models.InstallmentPlan;
import com.appGate.account.repository.InstallmentPlanRepository;
import com.appGate.account.repository.InstallmentRepository;
import com.appGate.inventory.models.Product;
import com.appGate.inventory.models.Stock;
import com.appGate.inventory.repository.ProductRepository;
import com.appGate.inventory.repository.StockRepository;
import com.appGate.orderingsales.dto.CheckoutDto;
import com.appGate.orderingsales.dto.DeliveryFeeQuoteRequestDto;
import com.appGate.orderingsales.dto.DeliveryFeeQuoteResponseDto;
import com.appGate.orderingsales.dto.OrderDto;
import com.appGate.orderingsales.dto.OrderItemDto;
import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.enums.FulfillmentType;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.enums.PaymentType;
import com.appGate.orderingsales.models.Cart;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.repository.CartRepository;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.repository.OrderItemRepository;
import com.appGate.orderingsales.response.BaseResponse;
import com.appGate.rbac.models.State;
import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.Ward;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.repository.StateRepository;
import com.appGate.rbac.repository.LGARepository;
import com.appGate.rbac.repository.WardRepository;
import com.appGate.rbac.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import com.appGate.account.dto.DeliveryLineItemDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final StateRepository stateRepository;
    private final LGARepository lgaRepository;
    private final WardRepository wardRepository;
    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final com.appGate.account.service.PaymentGatewayService paymentGatewayService;
    private final com.appGate.account.service.WalletService walletService;
    private final com.appGate.account.repository.PaymentRepository paymentRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;
    private final BranchRepository branchRepository;
    private final com.appGate.account.service.DeliveryFeeService deliveryFeeService;
    private final DeliveryFeeQuoteService deliveryFeeQuoteService;
    private final InstallmentPlanRepository installmentPlanRepository;
    private final InstallmentRepository installmentRepository;
    private final MobileSalesOrderSyncService mobileSalesOrderSyncService;

    /**
     * OrderDto.from(order) alone only knows about columns on Order itself, so an
     * INSTALLMENT order comes back with the isPaid-based totalAmountPaid/
     * totalAmountRemaining fallback (effectively "0 paid" since isPaid only flips once
     * the whole order is settled) and no installment breakdown. This fills in the real
     * figures from the linked InstallmentPlan/Installment rows.
     *
     * <p>Deliberately sums each Installment's actual amountPaid (rather than trusting
     * InstallmentPlan.remainingBalance) because remainingBalance is only set once, at
     * plan creation (grandTotal - downPayment) - see InstallmentService - and is never
     * decremented as installments get paid off, so it doesn't reflect progress. The
     * down payment IS installment #1 (see InstallmentService.buildPlan) - its amount is
     * already included in this sum once PaymentGatewayService.applyDownPaymentCollected
     * marks that row paid, so it must never be added again via plan.getDownPayment().
     */
    private OrderDto toOrderDto(Order order) {
        OrderDto dto = OrderDto.from(order);
        if (dto == null || order.getInstallmentPlanId() == null) {
            return dto;
        }

        installmentPlanRepository.findById(order.getInstallmentPlanId()).ifPresent(plan -> {
            List<Installment> installments = installmentRepository.findByInstallmentPlanId(plan.getId());
            installments.sort(java.util.Comparator.comparing(Installment::getInstallmentNumber));

            double totalPaid = installments.stream()
                    .mapToDouble(i -> i.getAmountPaid() != null ? i.getAmountPaid() : 0.0)
                    .sum();
            double grandTotal = plan.getGrandTotal() != null ? plan.getGrandTotal() : 0.0;

            dto.setTotalAmountPaid(totalPaid);
            dto.setTotalAmountRemaining(Math.max(grandTotal - totalPaid, 0.0));
            dto.setInstallments(installments.stream()
                    .map(InstallmentResponseDto::from)
                    .collect(java.util.stream.Collectors.toList()));
        });

        return dto;
    }

    /**
     * Load an order, refusing one that belongs to another branch.
     *
     * <p>A no-op for shoppers and head office (both are unscoped), so this can sit
     * on the paths a customer and a branch staffer both use.
     */
    private Order loadOrderInScope(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        branchScopeService.assertCanAccess(order.getBranchId());
        return order;
    }

    /**
     * The branch whose address is the delivery origin: always the Head Office
     * {@link Branch} row (flagged by {@code Branch#isHeadOffice}), regardless of which
     * branch fulfills the order -- deliveries are dispatched from Head Office, not from
     * whichever branch's stock was decremented.
     */
    private Branch resolveOriginBranch() {
        return branchRepository.findByHeadOfficeTrue()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Head Office branch not found"));
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

    /**
     * Sums the caller's current cart at real product prices -- no delivery fee.
     * Used to price what an installment plan finances: delivery is billed
     * separately and always paid in full up front, never financed.
     */
    public BaseResponse calculateCartSubtotal(Long userId) {
        List<Cart> cartItems = cartRepository.findByUserIdAndStatus(userId, true);
        if (cartItems.isEmpty()) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Cart is empty", null);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (Cart cartItem : cartItems) {
            Product product = productRepository.findById(cartItem.getProductId()).orElse(null);
            double unitPrice = (product != null) ? product.getSellingPrice() : 0.0;
            subtotal = subtotal.add(BigDecimal.valueOf(unitPrice * cartItem.getQuantity()));
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", subtotal);
    }

    /**
     * Prices the caller's current cart against a candidate delivery address without
     * creating an order -- used to show an accurate delivery fee/grand total before
     * the customer commits to checkout. Shared by the web and mobile clients.
     */
    public BaseResponse calculateDeliveryFeeQuote(DeliveryFeeQuoteRequestDto request) {
        List<Cart> cartItems = cartRepository.findByUserIdAndStatus(request.getUserId(), true);
        if (cartItems.isEmpty()) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Cart is empty", null);
        }

        FulfillmentType fulfillmentType = request.getFulfillmentType() != null
                ? request.getFulfillmentType() : FulfillmentType.DELIVERY;

        BigDecimal subtotal = BigDecimal.ZERO;
        for (Cart cartItem : cartItems) {
            Product product = productRepository.findById(cartItem.getProductId()).orElse(null);
            double unitPrice = (product != null) ? product.getSellingPrice() : 0.0;
            subtotal = subtotal.add(BigDecimal.valueOf(unitPrice * cartItem.getQuantity()));
        }

        // Delegates the actual pricing (PICKUP short-circuit, origin/destination address
        // building, distance-based fee) to DeliveryFeeQuoteService - besides removing the
        // duplication that used to live here, every quote made through this endpoint now
        // also lands in that service's recent-quote cache (keyed by userId), which
        // PaymentGatewayService's pre-order payment-initialize endpoints read to recover a
        // delivery fee the mobile app's payment-initialize call itself never sends - see
        // DeliveryFeeQuoteService's class javadoc.
        BigDecimal deliveryFee = deliveryFeeQuoteService.quoteDeliveryFee(
                request.getUserId(), fulfillmentType, request.getDeliveryAddress(),
                request.getDeliveryStateId(), request.getDeliveryLgaId(), request.getDeliveryCountry());

        BigDecimal grandTotal = subtotal.add(deliveryFee);

        DeliveryFeeQuoteResponseDto response =
                new DeliveryFeeQuoteResponseDto(subtotal, deliveryFee, grandTotal);
        return new BaseResponse(HttpStatus.OK.value(), "successful", response);
    }

    // ORDERING #1: products are a universal, company-wide catalogue (see Product's own
    // class comment) - a branch having no stock row of its own for a product must not
    // block a sale of it. Try the chosen branch's stock first, then fall back to central
    // (branchId IS NULL) stock, so "product not available at the selected branch" only
    // fires when nobody, anywhere, has any of it.
    private Stock resolveSellableStock(Long productId, Long branchId) {
        return stockRepository.findByProductIdAndBranchId(productId, branchId)
                .or(() -> stockRepository.findByProductIdAndBranchIdIsNull(productId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Product " + productId + " is not in stock."));
    }

    // Locked equivalent of resolveSellableStock, for the checkout step that decrements
    // quantity under a pessimistic write lock (see findByProductIdAndBranchIdForUpdate).
    private Stock resolveSellableStockForUpdate(Long productId, Long branchId) {
        return stockRepository.findByProductIdAndBranchIdForUpdate(productId, branchId)
                .or(() -> stockRepository.findByProductIdAndBranchIdIsNullForUpdate(productId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Product " + productId + " is not in stock."));
    }

    @Transactional
    public BaseResponse checkout(CheckoutDto checkoutDto) {
        try {
            // 1. Get user's cart items
            List<Cart> cartItems = cartRepository.findByUserIdAndStatus(checkoutDto.getUserId(), true);
            if (cartItems.isEmpty()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Cart is empty", null);
            }

            // 2. Validate stock availability at the chosen branch before creating the order.
            // Branch is determined by the logged-in user's context: shoppers use head office,
            // branch staffers use their assigned branch.
            Long branchId = branchScopeService.resolveWriteBranchId(null);
            for (Cart cartItem : cartItems) {
                Stock branchStock = resolveSellableStock(cartItem.getProductId(), branchId);
                if (branchStock.getQuantity() < cartItem.getQuantity()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Insufficient stock for product " + cartItem.getProductId()
                                    + ". Available: " + branchStock.getQuantity()
                                    + ", Requested: " + cartItem.getQuantity());
                }
            }

            // 3. Build the order
            FulfillmentType fulfillmentType = checkoutDto.getFulfillmentType() != null
                    ? checkoutDto.getFulfillmentType() : FulfillmentType.DELIVERY;
            if (fulfillmentType == FulfillmentType.DELIVERY) {
                if (checkoutDto.getDeliveryAddress() == null || checkoutDto.getDeliveryAddress().isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery address is required for DELIVERY orders");
                }
                if (checkoutDto.getDeliveryStateId() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery state is required for DELIVERY orders");
                }
                if (checkoutDto.getDeliveryLgaId() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery LGA is required for DELIVERY orders");
                }
            }

            Order order = new Order();
            order.setOrderNumber(generateOrderNumber());
            order.setUserId(checkoutDto.getUserId());
            order.setPaymentType(checkoutDto.getPaymentType());
            order.setOrderStatus(OrderStatus.PENDING);
            order.setDeliveryStatus(DeliveryStatus.NOT_SHIPPED);
            order.setFulfillmentType(fulfillmentType);
            order.setBranchId(branchId); // tag to the chosen branch

            // Delivery information - left null/unset for PICKUP orders
            order.setDeliveryAddress(checkoutDto.getDeliveryAddress());
            if (checkoutDto.getDeliveryStateId() != null) {
                State state = stateRepository.findById(checkoutDto.getDeliveryStateId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery State not found"));
                order.setDeliveryState(state);
            }
            if (checkoutDto.getDeliveryLgaId() != null) {
                LGA lga = lgaRepository.findById(checkoutDto.getDeliveryLgaId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery LGA not found"));
                order.setDeliveryLga(lga);
            }
            if (checkoutDto.getDeliveryWardId() != null) {
                Ward ward = wardRepository.findById(checkoutDto.getDeliveryWardId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery Ward not found"));
                order.setDeliveryWard(ward);
            }
            order.setDeliveryCountry(checkoutDto.getDeliveryCountry());
            order.setDeliveryPostalCode(checkoutDto.getDeliveryPostalCode());
            order.setDeliveryPhone(checkoutDto.getDeliveryPhone());
            order.setDeliveryNotes(checkoutDto.getDeliveryNotes());
            order.setNotes(checkoutDto.getNotes());

            // Resolve and validate the installment plan up front (before touching
            // stock) so a bad plan reference fails fast; the plan is actually
            // linked to the order below once the order has a real id.
            InstallmentPlan installmentPlan = null;
            if (checkoutDto.getPaymentType() == PaymentType.INSTALLMENT) {
                if (checkoutDto.getInstallmentPlanId() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "installmentPlanId is required for INSTALLMENT checkout. Call POST /api/installments first.");
                }
                installmentPlan = installmentPlanRepository.findById(checkoutDto.getInstallmentPlanId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Installment plan not found for installmentPlanId " + checkoutDto.getInstallmentPlanId()));
                if (!installmentPlan.getUserId().equals(checkoutDto.getUserId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "This installment plan does not belong to the requesting user");
                }
                if (installmentPlan.getOrderId() != null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "This installment plan is already attached to an order");
                }
                order.setInstallmentPlanId(installmentPlan.getId());
            }

            // 4. Calculate totals using real product prices, and collect each line's
            // category/weight so delivery can be priced per category (a cart mixing
            // e.g. phones and a refrigerator charges each category's own rate).
            double totalAmount = 0.0;
            List<DeliveryLineItemDto> deliveryLineItems = new ArrayList<>();
            for (Cart cartItem : cartItems) {
                Product product = productRepository.findById(cartItem.getProductId()).orElse(null);
                double unitPrice = (product != null) ? product.getSellingPrice() : 0.0;
                totalAmount += unitPrice * cartItem.getQuantity();

                Long categoryId = (product != null) ? product.getCategoryId() : null;
                String categoryName = (product != null && product.getCategory() != null)
                        ? product.getCategory().getName() : null;
                BigDecimal unitWeightKg = (product != null) ? product.getWeightKg() : null;
                deliveryLineItems.add(new DeliveryLineItemDto(
                        categoryId, categoryName, unitWeightKg, cartItem.getQuantity()));
            }

            // Determine the delivery fee from the admin-configured DeliverySetup tiers.
            // PICKUP orders skip this entirely - no address was collected to geocode,
            // and there's no trip to price.
            BigDecimal deliveryFee = BigDecimal.ZERO;
            if (fulfillmentType == FulfillmentType.DELIVERY) {
                Branch branch = resolveOriginBranch();
                String originAddress = buildAddress(branch.getAddress(),
                        branch.getLga() != null ? branch.getLga().getName() : null,
                        branch.getState() != null ? branch.getState().getName() : null,
                        "Nigeria");
                String destinationAddress = buildAddress(checkoutDto.getDeliveryAddress(),
                        order.getDeliveryLga() != null ? order.getDeliveryLga().getName() : null,
                        order.getDeliveryState() != null ? order.getDeliveryState().getName() : null,
                        checkoutDto.getDeliveryCountry());
                deliveryFee = deliveryFeeService.calculateDeliveryFee(originAddress, destinationAddress, deliveryLineItems);
            }

            order.setTotalAmount(totalAmount);
            order.setDiscountAmount(0.0);
            order.setDeliveryFee(deliveryFee.doubleValue());
            // For an INSTALLMENT order, grandTotal must match the linked InstallmentPlan's
            // grandTotal (product subtotal + insurance) plus delivery - otherwise the order
            // shows a smaller "total" than what the plan's own down payment/installments
            // actually add up to (InstallmentService bakes a 10% insurance premium into the
            // plan's grandTotal that this order's raw totalAmount never included).
            double orderGrandTotal = installmentPlan != null
                    ? installmentPlan.getGrandTotal() + deliveryFee.doubleValue()
                    : totalAmount + deliveryFee.doubleValue();
            order.setGrandTotal(orderGrandTotal);

            Order savedOrder = orderRepository.save(order);

            if (installmentPlan != null) {
                installmentPlan.setOrderId(savedOrder.getId());
                installmentPlanRepository.save(installmentPlan);
            }

            // 5. Create order items and decrement branch stock.
            // Lock rows in a consistent (productId) order across all checkouts so two
            // concurrent checkouts sharing several products can't deadlock on each other's locks.
            cartItems.sort(Comparator.comparing(Cart::getProductId));
            for (Cart cartItem : cartItems) {
                Product product = productRepository.findById(cartItem.getProductId()).orElse(null);
                double unitPrice = (product != null) ? product.getSellingPrice() : 0.0;
                String productName = (product != null) ? product.getProductName() : "Product " + cartItem.getProductId();
                String productImage = (product != null) ? product.getProductImage() : null;

                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(savedOrder);
                orderItem.setProductId(cartItem.getProductId());
                orderItem.setProductName(productName);
                orderItem.setProductImage(productImage);
                orderItem.setUnitPrice(unitPrice);
                orderItem.setQuantity(cartItem.getQuantity());
                orderItem.setSubtotal(unitPrice * cartItem.getQuantity());
                orderItem.setDiscount(0.0);
                orderItem.setTotal(unitPrice * cartItem.getQuantity());
                orderItemRepository.save(orderItem);

                // Decrement branch stock. This re-fetches under a pessimistic write lock and
                // re-validates the quantity rather than trusting the earlier check-loop's read
                // (step 2), which is the only way to close the race where two concurrent
                // checkouts both pass that check before either decrements.
                Stock branchStock = resolveSellableStockForUpdate(cartItem.getProductId(), branchId);
                if (branchStock.getQuantity() < cartItem.getQuantity()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Insufficient stock for product " + cartItem.getProductId()
                                    + ". Available: " + branchStock.getQuantity()
                                    + ", Requested: " + cartItem.getQuantity());
                }
                branchStock.setQuantity(branchStock.getQuantity() - cartItem.getQuantity());
                stockRepository.save(branchStock);
            }

            // Mirror this checkout onto the admin-facing SalesOrder model so it shows up on the
            // "Orderlist"/"Mark as Paid" screens, which never read the mobile Order model directly.
            mobileSalesOrderSyncService.createMirror(savedOrder, installmentPlan);

            // The mobile app pays an installment plan's down payment BEFORE calling this
            // endpoint (see PaymentGatewayService.initializeDownPaymentBankTransfer) - there's
            // no order to mark paid at that point, so the plan itself carries the record.
            // Reflect it on the order now instead of waiting for a payOrderByWallet-style
            // call that will never come for this flow.
            if (installmentPlan != null && Boolean.TRUE.equals(installmentPlan.getDownPaymentPaid())) {
                savedOrder.setPaidAt(installmentPlan.getDownPaymentPaidAt() != null
                        ? installmentPlan.getDownPaymentPaidAt() : LocalDateTime.now());
                savedOrder.setPaymentReference(installmentPlan.getDownPaymentReference());
                orderRepository.save(savedOrder);
                mobileSalesOrderSyncService.syncDownPaymentCollected(savedOrder.getId());

                // SAFETY NET for PaymentGatewayService.matchDownPaymentDeliveryFee: that
                // workaround guesses a delivery fee (from a cached calculate-delivery-fee
                // quote) to fold into the down-payment charge BEFORE this order - and its
                // real fulfillmentType/deliveryFee, computed fresh just above - exists. For
                // a PICKUP order deliveryFee is always 0, so if the guess folded in a
                // (nonzero, stale) delivery fee anyway, the customer was over-charged.
                // Refund the difference to the wallet the moment the truth is known, rather
                // than require mobile-app changes or leave the customer short-changed.
                // Never the reverse (under-collection is never auto-charged here) - a
                // refund needs no customer consent, a charge does.
                double collectedAsDeliveryFee = installmentPlan.getDownPaymentDeliveryFee() != null
                        ? installmentPlan.getDownPaymentDeliveryFee() : 0.0;
                double actualDeliveryFee = deliveryFee.doubleValue();
                if (collectedAsDeliveryFee > actualDeliveryFee) {
                    double refundAmount = collectedAsDeliveryFee - actualDeliveryFee;
                    com.appGate.account.response.BaseResponse refundResponse = walletService.creditWallet(
                            savedOrder.getUserId(), refundAmount,
                            "Refund: delivery fee adjustment for order " + savedOrder.getOrderNumber());
                    if (refundResponse.getStatus() == HttpStatus.OK.value()) {
                        installmentPlan.setDownPaymentDeliveryFee(actualDeliveryFee);
                        installmentPlanRepository.save(installmentPlan);
                    } else {
                        log.warn("Could not refund over-collected delivery fee ({}) for order {} (installment plan {}): {}",
                                refundAmount, savedOrder.getId(), installmentPlan.getId(), refundResponse.getMessage());
                    }
                }
            }

            // TEMPORARY WORKAROUND - remove once the mobile app can pass orderId on its card
            // charge (or simply check out before paying). For a FULL_PAYMENT order the app
            // charges the card BEFORE this order exists: POST /api/payments/card/initialize with
            // no orderId, GET /api/payments/verify/{ref}, then this checkout carrying
            // "Payment Reference: PM-XXXXXXXX" in notes (production, 2026-09-10: order 1,
            // PM-F97CB284, 45,000). Every automatic link therefore misses - Payment.orderId
            // stays null, PaymentGatewayService.resolveOrphanedOrderPayment has no order to
            // adopt it onto because none exists at verify time, and the app's follow-up
            // PUT /orders/{id}/status?status=PAYMENT_CONFIRMED is refused by
            // assertPaymentBacksConfirmation for having no payment behind it. A genuinely paid
            // order would sit isPaid=false / 0% forever, on the Order and on its mirror alike.
            // Adopt that payment here, the same way the installment branch above reflects a
            // plan's pre-checkout down payment.
            if (installmentPlan == null) {
                reflectPreCheckoutPayment(savedOrder, checkoutDto.getNotes());
            }

            // 6. Clear cart
            cartItems.forEach(item -> item.setStatus(false));
            cartRepository.saveAll(cartItems);

            Map<String, Object> response = new HashMap<>();
            response.put("order", toOrderDto(savedOrder));
            response.put("orderNumber", savedOrder.getOrderNumber());
            response.put("grandTotal", savedOrder.getGrandTotal());
            response.put("message", "Order created successfully. Proceed to payment.");

            return new BaseResponse(HttpStatus.CREATED.value(), "Checkout successful", response);

        } catch (ResponseStatusException e) {
            return new BaseResponse(e.getStatusCode().value(), e.getReason(), null);
        } catch (RuntimeException e) {
            // A repository write above (order/orderItem/stock/cart save) may already have
            // thrown from inside its own transactional proxy and marked this shared
            // transaction rollback-only before bubbling up here. If we swallow it and
            // return a normal response, Spring's commit at method exit finds rollback-only
            // set and throws UnexpectedRollbackException instead - masking the real cause.
            // Rethrow in that case so Spring rolls back cleanly and the actual error reaches
            // the client via GlobalExceptionHandler.
            if (TransactionAspectSupport.currentTransactionStatus().isRollbackOnly()) {
                throw e;
            }
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Checkout failed: " + e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Checkout failed: " + e.getMessage(), null);
        }
    }

    // Reference the mobile app embeds in CheckoutDto.notes for a payment it collected before
    // checking out, e.g. "Payment Reference: PM-F97CB284" - the shape
    // PaymentGatewayService.generatePaymentReference produces.
    private static final Pattern PRE_CHECKOUT_PAYMENT_REFERENCE = Pattern.compile("PM-[A-Za-z0-9]+");

    /**
     * TEMPORARY WORKAROUND (see the call site in checkout) - adopts a card/bank payment the
     * customer completed BEFORE this order existed, then reflects it on the order and its mirror.
     *
     * <p>Deliberately conservative: the payment is adopted only when the checkout's own notes
     * name its reference, and it must be a COMPLETED payment belonging to this same user that
     * isn't already linked to an order or an installment plan. Nothing is ever guessed from the
     * amount alone - a wallet top-up is also a COMPLETED, unlinked payment, and adopting one of
     * those would mark an unpaid order paid. Anything that doesn't line up leaves the order
     * unpaid and logs why, which is exactly the behaviour before this workaround existed.
     */
    private void reflectPreCheckoutPayment(Order order, String notes) {
        if (notes == null) {
            return;
        }
        Matcher matcher = PRE_CHECKOUT_PAYMENT_REFERENCE.matcher(notes);
        if (!matcher.find()) {
            return;
        }
        String reference = matcher.group();

        com.appGate.account.models.Payment payment =
                paymentRepository.findByPaymentReference(reference).orElse(null);
        if (payment == null) {
            log.warn("Checkout for order {} quoted payment reference {}, but no such payment exists - "
                    + "order left unpaid.", order.getId(), reference);
            return;
        }
        if (!order.getUserId().equals(payment.getUserId())
                || payment.getStatus() != com.appGate.account.enums.PaymentStatus.COMPLETED
                || payment.getOrderId() != null
                || payment.getInstallmentPlanId() != null) {
            log.warn("Not adopting payment {} onto order {} - payment user {} (order user {}), status {}, "
                            + "orderId {}, installmentPlanId {}. Order left unpaid.",
                    reference, order.getId(), payment.getUserId(), order.getUserId(),
                    payment.getStatus(), payment.getOrderId(), payment.getInstallmentPlanId());
            return;
        }

        payment.setOrderId(order.getId());
        paymentRepository.save(payment);

        order.setIsPaid(true);
        order.setPaidAt(payment.getPaidAt() != null ? payment.getPaidAt() : LocalDateTime.now());
        order.setPaymentReference(payment.getPaymentReference());
        order.setOrderStatus(OrderStatus.PAYMENT_CONFIRMED);
        orderRepository.save(order);

        double grandTotal = order.getGrandTotal() != null ? order.getGrandTotal() : 0.0;
        if (payment.getAmount() + 0.01 < grandTotal) {
            log.warn("Pre-checkout payment {} covers only {} of order {}'s {} - the card was charged "
                            + "before this order (and its delivery fee) was priced server-side. Marked paid "
                            + "anyway, matching resolveOrphanedOrderPayment's best-effort policy.",
                    reference, payment.getAmount(), order.getId(), grandTotal);
        }

        mobileSalesOrderSyncService.syncFullPaymentCollected(order.getId());
        log.info("Adopted pre-checkout payment {} ({}) onto order {} and marked it paid.",
                reference, payment.getAmount(), order.getId());
    }

    /**
     * Pay for an order (goods bought) with a card via Paystack. Delegates to the payment gateway,
     * which charges the order's authoritative grandTotal, links the payment to the order, and marks
     * the order paid once Paystack confirms (via verify endpoint or webhook).
     */
    public BaseResponse payOrderByCard(Long orderId, String callbackUrl) {
        return toOrderingResponse(paymentGatewayService.initializeOrderCardPayment(orderId, callbackUrl));
    }

    /** Bridge the account module's BaseResponse to this module's BaseResponse. */
    private BaseResponse toOrderingResponse(com.appGate.account.response.BaseResponse src) {
        return new BaseResponse(src.getStatus(), src.getMessage(), src.getData());
    }

    /**
     * Pay for an order (goods bought) by debiting the customer's wallet. Settles immediately:
     * on a successful debit the order is marked paid and confirmed.
     */
    @Transactional
    public BaseResponse payOrderByWallet(Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            if (Boolean.TRUE.equals(order.getIsPaid())) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Order has already been paid", null);
            }

            // ORDERING #3: a Payment row linked to this orderId only ever gets created by
            // this method (or the card-payment path) actually charging against the order -
            // the pre-checkout down-payment flow (initializeDownPaymentBankTransfer) leaves
            // Payment.orderId null and links to the installmentPlanId instead, since no order
            // exists yet at that point. So "has an order-level charge already run" is exactly
            // "does any Payment exist for this orderId" - unlike order.getPaidAt(), it isn't
            // also set by OrderService.checkout() merely reflecting a pre-paid plan's down
            // payment (see checkout()'s installmentPlan.getDownPaymentPaid() branch), which
            // used to make this method refuse outright and leave the delivery fee portion of
            // an installment order's down-payment-stage charge never collected at all.
            boolean hasOrderLevelPayment = !paymentRepository.findByOrderId(orderId).isEmpty();
            if (hasOrderLevelPayment) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Down payment has already been collected for this order", null);
            }

            // Determine amount to debit: for installment orders, the delivery fee is never
            // financed - it's charged in full up front alongside the plan's down payment
            // (which itself covers only the product subtotal + insurance, per InstallmentService).
            // If the down payment was already collected via the pre-checkout Paystack flow,
            // only whatever delivery fee wasn't already folded into that charge (see
            // InstallmentPlan.downPaymentDeliveryFee and PaymentGatewayService.
            // initializeDownPaymentBankTransfer/Card) is still outstanding here.
            Double amountToDebit = order.getGrandTotal();
            boolean isInstallmentPayment = order.getPaymentType() == PaymentType.INSTALLMENT;
            InstallmentPlan plan = null;
            Double outstandingDeliveryFee = null;
            if (isInstallmentPayment) {
                plan = installmentPlanRepository.findById(order.getInstallmentPlanId())
                        .orElseThrow(() -> new RuntimeException("Installment plan not found for order " + order.getId()));
                double alreadyCollectedDeliveryFee = plan.getDownPaymentDeliveryFee() != null
                        ? plan.getDownPaymentDeliveryFee() : 0.0;
                outstandingDeliveryFee = Math.max(0.0, order.getDeliveryFee() - alreadyCollectedDeliveryFee);
                amountToDebit = Boolean.TRUE.equals(plan.getDownPaymentPaid())
                        ? outstandingDeliveryFee
                        : outstandingDeliveryFee + plan.getDownPayment();
            }

            // Debit the customer's wallet
            com.appGate.account.response.BaseResponse debitResponse = walletService.debitWallet(
                    order.getUserId(),
                    amountToDebit,
                    "Payment for order " + order.getOrderNumber());
            if (debitResponse.getStatus() != HttpStatus.OK.value()) {
                return toOrderingResponse(debitResponse); // e.g. insufficient balance / wallet not found
            }

            // Record a completed wallet payment linked to the order for reporting/audit.
            com.appGate.account.models.Payment payment = new com.appGate.account.models.Payment();
            payment.setOrderId(order.getId());
            payment.setUserId(order.getUserId());
            payment.setAmount(amountToDebit);
            payment.setDeliveryFeeAmount(outstandingDeliveryFee);
            payment.setPaymentMethod(com.appGate.account.enums.PaymentMethod.WALLET);
            payment.setStatus(com.appGate.account.enums.PaymentStatus.COMPLETED);
            payment.setPaymentReference("WALL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            payment.setPaidAt(LocalDateTime.now());
            payment.setIsInstallmentPayment(isInstallmentPayment);
            paymentRepository.save(payment);

            // Mark the order status: PAYMENT_CONFIRMED for full payment, PENDING for installment (awaiting remaining payments)
            order.setIsPaid(!isInstallmentPayment); // Only mark fully paid if not installment
            order.setPaidAt(LocalDateTime.now());
            order.setPaymentReference(payment.getPaymentReference());
            order.setOrderStatus(isInstallmentPayment ? OrderStatus.PENDING : OrderStatus.PAYMENT_CONFIRMED);
            Order updatedOrder = orderRepository.save(order);

            if (isInstallmentPayment) {
                // This is the down payment the very first time it's collected - a plan
                // whose down payment was already paid elsewhere only gets charged its
                // delivery fee here, and applyDownPaymentCollected's own idempotency
                // guard no-ops for that case (see the matching comment in
                // PaymentGatewayService.markOrderPaid).
                paymentGatewayService.applyDownPaymentCollected(plan, payment);
                mobileSalesOrderSyncService.syncDownPaymentCollected(order.getId());
            } else {
                mobileSalesOrderSyncService.syncFullPaymentCollected(order.getId());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("order", toOrderDto(updatedOrder));
            result.put("paymentReference", payment.getPaymentReference());
            result.put("amountPaid", amountToDebit);

            return new BaseResponse(HttpStatus.OK.value(), "Order paid from wallet successfully", result);

        } catch (RuntimeException e) {
            // mobileSalesOrderSyncService.syncDownPaymentCollected/syncFullPaymentCollected
            // above may have already marked this transaction rollback-only before throwing.
            // Swallowing that here and returning a normal response would make Spring's
            // commit-time check find rollback-only set and throw UnexpectedRollbackException
            // instead - masking the real cause. Rethrow in that case so Spring rolls back
            // cleanly (including the wallet debit already applied in-memory) and the actual
            // error reaches the client via GlobalExceptionHandler.
            if (TransactionAspectSupport.currentTransactionStatus().isRollbackOnly()) {
                throw e;
            }
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Wallet payment failed: " + e.getMessage(), null);
        }
    }

    public BaseResponse getOrderByOrderNumber(String orderNumber) {
        try {
            Order order = orderRepository.findByOrderNumber(orderNumber)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            branchScopeService.assertCanAccess(order.getBranchId());

            List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("order", toOrderDto(order));
            response.put("orderItems", orderItems.stream().map(OrderItemDto::from).collect(java.util.stream.Collectors.toList()));

            return new BaseResponse(HttpStatus.OK.value(), "Order retrieved successfully", response);

        } catch (AccessDeniedException e) {
            throw e;
        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve order: " + e.getMessage(), null);
        }
    }

    public BaseResponse getUserOrders(Long userId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Order> orders = orderRepository.findByUserId(userId, pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Orders retrieved successfully", orders.map(this::toOrderDto));

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve orders: " + e.getMessage(), null);
        }
    }

    public BaseResponse getUserOrdersByStatus(Long userId, OrderStatus status, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Order> orders = orderRepository.findByUserIdAndOrderStatus(userId, status, pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Orders retrieved successfully", orders.map(this::toOrderDto));

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve orders: " + e.getMessage(), null);
        }
    }

    public BaseResponse getOrderDetails(Long orderId) {
        try {
            Order order = loadOrderInScope(orderId);

            List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);

            Map<String, Object> response = new HashMap<>();
            response.put("order", toOrderDto(order));
            response.put("orderItems", orderItems.stream().map(OrderItemDto::from).collect(java.util.stream.Collectors.toList()));

            return new BaseResponse(HttpStatus.OK.value(), "Order details retrieved successfully", response);

        } catch (AccessDeniedException e) {
            throw e;
        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve order details: " + e.getMessage(), null);
        }
    }

    /**
     * Refuses to let a caller move an order into a "paid" status/flag with nothing
     * behind it - the exact gap that let a mobile order reach PAYMENT_CONFIRMED with
     * is_paid=false and zero rows in the payments table (no wallet debit, no card
     * charge, no installment progress). Every legitimate payment flow already creates
     * one of these three kinds of evidence before/while setting status, so this is a
     * no-op for them and only blocks a bare status/flag flip with no payment behind it.
     */
    private void assertPaymentBacksConfirmation(Order order) {
        if (Boolean.TRUE.equals(order.getIsPaid())) {
            return;
        }
        boolean hasCompletedPayment = paymentRepository.findByOrderId(order.getId()).stream()
                .anyMatch(p -> p.getStatus() == com.appGate.account.enums.PaymentStatus.COMPLETED);
        if (hasCompletedPayment) {
            return;
        }
        if (order.getInstallmentPlanId() != null) {
            boolean hasInstallmentProgress = installmentPlanRepository.findById(order.getInstallmentPlanId())
                    .map(plan -> plan.getCompletedInstallments() != null && plan.getCompletedInstallments() > 0)
                    .orElse(false);
            if (hasInstallmentProgress) {
                return;
            }
        }
        throw new RuntimeException("Cannot confirm payment: no payment record found for this order");
    }

    /**
     * TEMPORARY WORKAROUND (see updateOrderStatus/updatePaymentStatus below) - true when this
     * is an installment order whose plan still has installments outstanding. A caller asserting
     * "payment confirmed" / "is paid" for such an order is reporting one collected installment,
     * never a settled plan: the mobile app fires exactly that the moment a plan's down payment
     * clears. Note assertPaymentBacksConfirmation does NOT catch this - a down payment is real
     * payment evidence, so it passes that check while leaving 4 of 5 installments unpaid.
     * An installment order with no plan linked can never be settled, so it counts as unsettled.
     */
    private boolean isUnsettledInstallmentOrder(Order order) {
        boolean installmentOrder = order.getPaymentType() == PaymentType.INSTALLMENT
                || order.getInstallmentPlanId() != null;
        if (!installmentOrder) {
            return false;
        }
        if (order.getInstallmentPlanId() == null) {
            return true;
        }
        return installmentPlanRepository.findById(order.getInstallmentPlanId())
                .map(plan -> plan.getStatus() != InstallmentStatus.COMPLETED)
                .orElse(true);
    }

    @Transactional
    public BaseResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        try {
            Order order = loadOrderInScope(orderId);

            if (newStatus == OrderStatus.PAYMENT_CONFIRMED) {
                assertPaymentBacksConfirmation(order);
            }

            order.setOrderStatus(newStatus);

            // Update timestamps based on status
            if (newStatus == OrderStatus.SHIPPED) {
                order.setShippedAt(LocalDateTime.now());
                order.setDeliveryStatus(DeliveryStatus.IN_TRANSIT);
            } else if (newStatus == OrderStatus.DELIVERED) {
                order.setDeliveredAt(LocalDateTime.now());
                order.setDeliveryStatus(DeliveryStatus.DELIVERED);
            } else if (newStatus == OrderStatus.CANCELLED) {
                order.setCancelledAt(LocalDateTime.now());
            }

            Order updatedOrder = orderRepository.save(order);

            // Mirror the status onto the admin-facing SalesOrder so it doesn't go stale
            // there - this endpoint used to skip that, which is the same class of bug as
            // the incident where a mobile order showed paid while every admin screen
            // still showed 0%/PENDING (see MobileSalesOrderSyncService's class javadoc).
            if (newStatus == OrderStatus.PAYMENT_CONFIRMED) {
                // TEMPORARY WORKAROUND - remove once the mobile app can be updated. The app
                // calls this endpoint with PAYMENT_CONFIRMED as soon as an installment plan's
                // down payment clears, meaning "that payment went through" - not "the plan is
                // settled". Marking the mirror fully paid on that showed 100% while 4 of 5
                // installments were still outstanding (production, 2026-09-10: sales_order 4).
                // Move the progress instead, and leave the fully-paid transition to the
                // installments themselves - syncInstallmentPaid closes the order out on the
                // last one. syncFullPaymentCollected refuses this case on its own too; the
                // branch here keeps the intent visible at the call site.
                if (isUnsettledInstallmentOrder(updatedOrder)) {
                    log.warn("Order {} is an installment order whose plan {} is still unsettled - treating "
                            + "this PAYMENT_CONFIRMED status update as a single installment payment and "
                            + "refreshing the mirror's payment progress instead of marking it fully paid.",
                            updatedOrder.getId(), updatedOrder.getInstallmentPlanId());
                    mobileSalesOrderSyncService.syncInstallmentProgress(updatedOrder.getId());
                } else {
                    mobileSalesOrderSyncService.syncFullPaymentCollected(updatedOrder.getId());
                }
            } else {
                mobileSalesOrderSyncService.syncOrderStatus(updatedOrder.getId(), newStatus);
            }

            return new BaseResponse(HttpStatus.OK.value(), "Order status updated successfully", toOrderDto(updatedOrder));

        } catch (AccessDeniedException e) {
            // Must precede the RuntimeException catch below, which would otherwise
            // report a branch violation as "order not found".
            throw e;
        } catch (RuntimeException e) {
            // The sync call above may already have marked this transaction rollback-only
            // before throwing - see the identical guard in payOrderByWallet/checkout.
            if (TransactionAspectSupport.currentTransactionStatus().isRollbackOnly()) {
                throw e;
            }
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to update order status: " + e.getMessage(), null);
        }
    }

    // Statuses a customer can no longer request cancellation from - either the order is
    // already too far along (shipped/delivered), already terminal (cancelled/refunded/failed),
    // or a cancellation request is already in flight for it.
    private static final java.util.Set<OrderStatus> NOT_CANCELLABLE = java.util.EnumSet.of(
            OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED,
            OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.FAILED,
            OrderStatus.CANCELLATION_REQUESTED, OrderStatus.PENDING_CANCELLATION_APPROVAL);

    /**
     * Customer-initiated cancellation request (mobile app). Does not cancel the order
     * outright - it flags it for sales review (see MobileSalesOrderSyncService.
     * syncCancellationRequested), who can forward it to admin for approval or reject it.
     * Only the admin's final approval (SalesService.approveCancellation) actually cancels
     * the order and refunds the wallet.
     *
     * <p>Only allowed while less than 50% of the order's total has been paid - once 50% or
     * more is paid the customer must go through the return/refund flow instead.
     */
    @Transactional
    public BaseResponse requestCancellation(Long orderId, String reason) {
        try {
            Order order = loadOrderInScope(orderId);

            if (NOT_CANCELLABLE.contains(order.getOrderStatus())) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Cannot cancel order that has been shipped, delivered, already cancelled, "
                                + "or already has a cancellation request pending", null);
            }
            // A fully paid order has to go through the refund flow instead of cancellation.
            if (Boolean.TRUE.equals(order.getIsPaid())) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Cannot cancel an order that has already been fully paid", null);
            }

            double amountPaid = paymentRepository.findByOrderId(orderId).stream()
                    .filter(p -> p.getStatus() == com.appGate.account.enums.PaymentStatus.COMPLETED)
                    .mapToDouble(com.appGate.account.models.Payment::getAmount)
                    .sum();
            double grandTotal = order.getGrandTotal() != null ? order.getGrandTotal() : 0;
            double progressPercent = grandTotal > 0 ? (amountPaid / grandTotal) * 100 : 0;

            if (progressPercent >= 50) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "This order cannot be cancelled because 50% or more of the total amount has "
                                + "already been paid. Please contact support for a return or refund instead.", null);
            }

            order.setPreCancellationStatus(order.getOrderStatus());
            order.setOrderStatus(OrderStatus.CANCELLATION_REQUESTED);
            order.setCancellationReason(reason);
            Order updatedOrder = orderRepository.save(order);

            mobileSalesOrderSyncService.syncCancellationRequested(orderId, reason);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Cancellation request submitted. Our sales team will review it shortly.",
                    toOrderDto(updatedOrder));

        } catch (AccessDeniedException e) {
            throw e;
        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to submit cancellation request: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse updatePaymentStatus(Long orderId, String paymentReference, boolean isPaid) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            if (isPaid) {
                assertPaymentBacksConfirmation(order);
            }

            // TEMPORARY WORKAROUND - same root cause as updateOrderStatus above: isPaid=true on
            // an installment order whose plan is still running can only mean "an installment was
            // collected". Honouring it would flip order.isPaid, which then blocks every remaining
            // payment on the order (payOrderByWallet and initializeCardPayment both refuse an
            // order already flagged paid) and marks the mirror 100%. Record the reference, move
            // the mirror's progress, and stay OK so the unchangeable app doesn't see an error.
            if (isPaid && isUnsettledInstallmentOrder(order)) {
                log.warn("Ignoring isPaid=true for order {} - its installment plan {} is still unsettled. "
                        + "Recorded payment reference {} and refreshed the mirror's payment progress instead.",
                        order.getId(), order.getInstallmentPlanId(), paymentReference);
                order.setPaymentReference(paymentReference);
                Order recorded = orderRepository.save(order);
                mobileSalesOrderSyncService.syncInstallmentProgress(recorded.getId());
                return new BaseResponse(HttpStatus.OK.value(),
                        "Payment recorded against the installment plan - the order stays partially paid "
                                + "until every installment is settled", toOrderDto(recorded));
            }

            order.setPaymentReference(paymentReference);
            order.setIsPaid(isPaid);

            if (isPaid) {
                order.setPaidAt(LocalDateTime.now());
                order.setOrderStatus(OrderStatus.PAYMENT_CONFIRMED);
            }

            Order updatedOrder = orderRepository.save(order);

            // Mirror onto the admin-facing SalesOrder - see the identical comment in
            // updateOrderStatus above. This endpoint's own contract treats isPaid=true as
            // "fully confirmed" (it always sets orderStatus to PAYMENT_CONFIRMED above), so
            // syncFullPaymentCollected is the right counterpart, same as payOrderByWallet's
            // non-installment branch and PaymentGatewayService.markOrderPaid's.
            if (isPaid) {
                mobileSalesOrderSyncService.syncFullPaymentCollected(updatedOrder.getId());
            }

            return new BaseResponse(HttpStatus.OK.value(), "Payment status updated successfully", toOrderDto(updatedOrder));

        } catch (RuntimeException e) {
            // The sync call above may already have marked this transaction rollback-only
            // before throwing - see the identical guard in payOrderByWallet/checkout.
            if (TransactionAspectSupport.currentTransactionStatus().isRollbackOnly()) {
                throw e;
            }
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to update payment status: " + e.getMessage(), null);
        }
    }

    public BaseResponse getOrderStatistics(Long userId) {
        try {
            Long totalOrders = orderRepository.countByUserId(userId);
            Long pendingOrders = orderRepository.countByUserIdAndOrderStatus(userId, OrderStatus.PENDING);
            Long completedOrders = orderRepository.countByUserIdAndOrderStatus(userId, OrderStatus.DELIVERED);
            Long cancelledOrders = orderRepository.countByUserIdAndOrderStatus(userId, OrderStatus.CANCELLED);

            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalOrders", totalOrders);
            statistics.put("pendingOrders", pendingOrders);
            statistics.put("completedOrders", completedOrders);
            statistics.put("cancelledOrders", cancelledOrders);

            return new BaseResponse(HttpStatus.OK.value(), "Order statistics retrieved successfully", statistics);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve order statistics: " + e.getMessage(), null);
        }
    }

    // Rider endpoints
    public BaseResponse getRiderOrders(Long riderId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            // RiderBoxService.assignProduct is what actually dispatches an order to a rider,
            // and it sets orderStatus to ASSIGNED_TO_RIDER (never SHIPPED - that only happens
            // via the separate admin-driven OrderService.updateOrderStatus flow).
            Page<Order> orders = orderRepository.findByRiderIdAndOrderStatus(riderId, OrderStatus.ASSIGNED_TO_RIDER, pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Rider orders retrieved successfully", orders.map(this::toOrderDto));

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve rider orders: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse assignRider(Long orderId, Long riderId) {
        try {
            Order order = loadOrderInScope(orderId);

            // Also creates/reuses the RiderBox row the rider's mobile app reads its pending
            // deliveries from - without this, an order assigned here never surfaced there
            // (see MobileSalesOrderSyncService.assignOrderToRider).
            mobileSalesOrderSyncService.assignOrderToRider(orderId, riderId);

            order.setRiderId(riderId);
            order.setOrderStatus(OrderStatus.ASSIGNED_TO_RIDER);
            order.setDeliveryStatus(DeliveryStatus.AWAITING_PICKUP);

            Order updatedOrder = orderRepository.save(order);

            return new BaseResponse(HttpStatus.OK.value(), "Rider assigned successfully", toOrderDto(updatedOrder));

        } catch (AccessDeniedException e) {
            throw e;
        } catch (ResponseStatusException e) {
            return new BaseResponse(e.getStatusCode().value(), e.getReason(), null);
        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to assign rider: " + e.getMessage(), null);
        }
    }

    private String generateOrderNumber() {
        // Truncating to 8 hex chars (~4.3B possibilities) made collisions against the
        // unique order_number column plausible at real order volume, which surfaced
        // as a confusing UnexpectedRollbackException rather than a clear duplicate error.
        // The full UUID is effectively collision-free.
        return "ORD-" + UUID.randomUUID().toString().toUpperCase();
    }
}
