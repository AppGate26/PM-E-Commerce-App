package com.appGate.orderingsales.service;

import com.appGate.account.enums.PaymentStatus;
import com.appGate.account.repository.InstallmentPlanRepository;
import com.appGate.account.repository.PaymentRepository;
import com.appGate.inventory.models.Stock;
import com.appGate.inventory.repository.StockRepository;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.repository.OrderItemRepository;
import com.appGate.orderingsales.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Gives back the stock held by checkouts that were never paid for.
 *
 * <p>{@code OrderService.checkout} decrements stock before any money moves, because the
 * order has to exist before it can be paid for. Nothing ever put that stock back: a
 * customer who opened the payment screen and walked away removed those units from sale
 * permanently, and enough abandoned checkouts would make a product unbuyable while the
 * warehouse was still full of it.
 *
 * <p>An order is only reaped when it is still PENDING, still unpaid, and has no payment
 * that settled or is in flight - so a charge that is mid-flight at Paystack is never
 * cancelled underneath the customer. The stock is returned to the same pool the checkout
 * took it from (the order's branch, falling back to central stock).
 */
@Service
@RequiredArgsConstructor
public class AbandonedOrderReaper {

    private static final Logger log = LoggerFactory.getLogger(AbandonedOrderReaper.class);

    // Self-reference through the container: calling cancelAndRestock directly from the
    // scheduled method below would bypass the proxy, so its @Transactional would do
    // nothing and a half-restocked order could be left behind. Going through the proxy
    // gives each order its own transaction - one bad order cannot spoil the sweep.
    private final ObjectProvider<AbandonedOrderReaper> self;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final StockRepository stockRepository;
    private final PaymentRepository paymentRepository;
    private final InstallmentPlanRepository installmentPlanRepository;

    /** How long an unpaid order may hold stock. Long enough for a slow bank transfer. */
    @Value("${orders.abandoned.timeout-minutes:120}")
    private long timeoutMinutes;

    @Value("${orders.abandoned.reaper-enabled:true}")
    private boolean enabled;

    @Scheduled(fixedDelayString = "${orders.abandoned.reaper-interval-ms:900000}")
    public void reapAbandonedOrders() {
        if (!enabled) {
            return;
        }
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(timeoutMinutes);
        List<Order> stale = orderRepository.findByOrderStatusAndCreatedAtBefore(OrderStatus.PENDING, cutoff);
        for (Order order : stale) {
            try {
                self.getObject().cancelAndRestock(order, cutoff);
            } catch (Exception e) {
                log.error("Could not reap abandoned order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void cancelAndRestock(Order order, LocalDateTime cutoff) {
        if (Boolean.TRUE.equals(order.getIsPaid()) || hasLivePayment(order.getId(), cutoff)) {
            return;
        }

        for (OrderItem item : orderItemRepository.findByOrderId(order.getId())) {
            restock(item, order.getBranchId());
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Unlink the plan so the customer can start a fresh one for the same cart:
        // createInstallmentPlan only reuses plans that have no order yet.
        if (order.getInstallmentPlanId() != null) {
            installmentPlanRepository.findById(order.getInstallmentPlanId()).ifPresent(plan -> {
                if (!Boolean.TRUE.equals(plan.getDownPaymentPaid())) {
                    plan.setOrderId(null);
                    installmentPlanRepository.save(plan);
                }
            });
        }

        log.info("Reaped abandoned order {} (created {}) and returned its stock", order.getId(), order.getCreatedAt());
    }

    /**
     * A payment that completed, or that may still complete, means hands off this order.
     * A PENDING row only counts while it is recent: an abandoned attempt leaves one behind
     * for good, and treating that as live would make this reaper never fire for exactly
     * the case it exists for.
     */
    private boolean hasLivePayment(Long orderId, LocalDateTime cutoff) {
        return paymentRepository.findByOrderId(orderId).stream()
                .anyMatch(payment -> payment.getStatus() == PaymentStatus.COMPLETED
                        || payment.getStatus() == PaymentStatus.PROCESSING
                        || (payment.getStatus() == PaymentStatus.PENDING
                                && payment.getCreatedAt() != null
                                && payment.getCreatedAt().isAfter(cutoff)));
    }

    private void restock(OrderItem item, Long branchId) {
        if (item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
            return;
        }
        Stock stock = (branchId != null
                ? stockRepository.findByProductIdAndBranchId(item.getProductId(), branchId)
                : java.util.Optional.<Stock>empty())
                .or(() -> stockRepository.findByProductIdAndBranchIdIsNull(item.getProductId()))
                .orElse(null);
        if (stock == null) {
            log.warn("No stock row to return {} unit(s) of product {} to", item.getQuantity(), item.getProductId());
            return;
        }
        stock.setQuantity(stock.getQuantity() + item.getQuantity());
        stockRepository.save(stock);
    }
}
