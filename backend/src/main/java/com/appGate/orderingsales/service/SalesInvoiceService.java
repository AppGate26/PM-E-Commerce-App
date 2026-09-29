package com.appGate.orderingsales.service;

import com.appGate.orderingsales.dto.PaymentDetailDto;
import com.appGate.orderingsales.dto.RepaymentEntryDetailDto;
import com.appGate.orderingsales.dto.SalesInvoiceDto;
import com.appGate.orderingsales.enums.CustomerType;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.enums.SalesChannel;
import com.appGate.orderingsales.enums.SalesOrderType;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.orderingsales.repository.OrderItemRepository;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.repository.SalesOrderRepository;
import com.appGate.rbac.service.BranchScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Builds the invoice/receipt for a sale once it has been approved: admin approval moves an
// order to PROCESSING (SalesService.approveOrder, ApprovalService CASH_SALES/CREDIT_SALES),
// and a Paystack-verified walk-in cash sale lands there directly
// (SalesService.verifyWalkInCashPayment). Anything before that - pending, awaiting approval,
// cancelled, refunded - has no invoice.
//
// A multi-item walk-in cart is stored as one SalesOrder per product, sharing a
// "<reference>-<n>" salesReference, so those rows are gathered back into one document.
// Amounts paid/outstanding come from SalesService.getPaymentDetails, which already resolves
// the right source of truth for every order kind (one-off, walk-in credit, mobile installment).
@Service
@RequiredArgsConstructor
public class SalesInvoiceService {

    static final Set<OrderStatus> INVOICE_READY_STATUSES = EnumSet.of(
            OrderStatus.PROCESSING, OrderStatus.ASSIGNED_TO_RIDER, OrderStatus.SHIPPED,
            OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED);

    private static final Pattern LINE_SUFFIX = Pattern.compile("^(.+)-(\\d+)$");
    private static final BigDecimal CENT = new BigDecimal("0.01");
    private static final DateTimeFormatter DUE_DATE = DateTimeFormatter.ofPattern("d MMMM yyyy");

    private final SalesOrderRepository salesOrderRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SalesService salesService;
    private final BranchScopeService branchScopeService;

    @Value("${appgate.invoice.company-name:APPGATE NIG LIMITED}")
    private String companyName;
    @Value("${appgate.invoice.company-tagline:Financial Technology & Core Banking Solutions}")
    private String companyTagline;
    @Value("${appgate.invoice.bank-name:Moniepoint}")
    private String bankName;
    @Value("${appgate.invoice.account-name:APP-GATE NIG LIMITED}")
    private String accountName;
    @Value("${appgate.invoice.account-number:6727149379}")
    private String accountNumber;

    // Approved orders that have an invoice/receipt, newest first. Branch users only see
    // their own branch, same as the sales reports.
    @Transactional(readOnly = true)
    public Page<SalesOrder> getInvoiceableOrders(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String pattern = search != null && !search.isBlank()
                ? "%" + search.trim().toLowerCase(Locale.ROOT) + "%" : null;
        return salesOrderRepository.findInvoiceableOrders(INVOICE_READY_STATUSES,
                branchScopeService.getScopedBranchId(), pattern, pageable);
    }

    // Admin/sales side: any approved SalesOrder, walk-in, online or mobile mirror.
    @Transactional(readOnly = true)
    public SalesInvoiceDto buildForSalesOrder(Long salesOrderId) {
        SalesOrder order = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        requireApproved(order);

        if (order.getMobileOrderId() != null) {
            Order mobileOrder = orderRepository.findById(order.getMobileOrderId()).orElse(null);
            if (mobileOrder != null) {
                return buildMobile(order, mobileOrder);
            }
        }
        return buildSalesOrders(saleGroup(order));
    }

    // Mobile app side: keyed by the customer's own Order id. Approval happens on the
    // SalesOrder mirror (see MobileSalesOrderSyncService.createMirror), so that is what
    // decides whether the invoice is available yet.
    @Transactional(readOnly = true)
    public SalesInvoiceDto buildForMobileOrder(Long mobileOrderId) {
        Order mobileOrder = orderRepository.findById(mobileOrderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        SalesOrder mirror = salesOrderRepository.findByMobileOrderId(mobileOrderId)
                .orElseThrow(() -> new RuntimeException(
                        "The invoice for this order will be available once it has been approved"));
        requireApproved(mirror);
        return buildMobile(mirror, mobileOrder);
    }

    private static void requireApproved(SalesOrder order) {
        if (order.getStatus() == null || !INVOICE_READY_STATUSES.contains(order.getStatus())) {
            throw new RuntimeException("The invoice for this order will be available once it has been approved"
                    + (order.getStatus() != null ? " (current status: " + order.getStatus() + ")" : ""));
        }
    }

    // ==================== BUILDERS ====================

    private SalesInvoiceDto buildSalesOrders(List<SalesOrder> orders) {
        SalesOrder first = orders.get(0);
        List<SalesInvoiceDto.Line> lines = new ArrayList<>();
        Totals totals = new Totals();
        for (SalesOrder order : orders) {
            lines.add(lineFor(order));
            totals.add(salesService.getPaymentDetails(order.getId()));
        }

        BigDecimal subtotal = sum(lines);
        List<SalesInvoiceDto.Charge> charges = new ArrayList<>();
        addCharge(charges, chargeLabel(first), totals.total.subtract(subtotal));

        return assemble(orders, first, groupReference(orders), lines, subtotal, charges, totals,
                paymentMethodLabel(first, null));
    }

    private SalesInvoiceDto buildMobile(SalesOrder mirror, Order mobileOrder) {
        List<SalesInvoiceDto.Line> lines = new ArrayList<>();
        for (OrderItem item : orderItemRepository.findByOrderId(mobileOrder.getId())) {
            BigDecimal unitPrice = money(item.getUnitPrice());
            int qty = item.getQuantity() != null ? item.getQuantity() : 1;
            BigDecimal discount = money(item.getDiscount());
            BigDecimal amount = item.getTotal() != null
                    ? money(item.getTotal())
                    : unitPrice.multiply(BigDecimal.valueOf(qty)).subtract(discount);
            lines.add(line(item.getProductName(), qty, unitPrice, discount, amount));
        }
        if (lines.isEmpty()) {
            lines.add(lineFor(mirror));
        }

        Totals totals = new Totals();
        totals.add(salesService.getPaymentDetails(mirror.getId()));

        BigDecimal subtotal = sum(lines);
        BigDecimal delivery = money(mobileOrder.getDeliveryFee());
        BigDecimal discount = money(mobileOrder.getDiscountAmount());
        List<SalesInvoiceDto.Charge> charges = new ArrayList<>();
        addCharge(charges, "Delivery fee", delivery);
        addCharge(charges, "Discount", discount.negate());
        addCharge(charges, mirror.getOrderType() == SalesOrderType.INSTALLMENT
                        ? "Insurance & installment charges" : "Other charges",
                totals.total.subtract(subtotal).subtract(delivery).add(discount));

        return assemble(List.of(mirror), mirror, mobileOrder.getOrderNumber(), lines, subtotal, charges, totals,
                paymentMethodLabel(mirror, mobileOrder));
    }

    private SalesInvoiceDto assemble(List<SalesOrder> orders, SalesOrder first, String reference,
                                     List<SalesInvoiceDto.Line> lines, BigDecimal subtotal,
                                     List<SalesInvoiceDto.Charge> charges, Totals totals, String paymentMethod) {
        BigDecimal balance = totals.outstanding.max(BigDecimal.ZERO);
        boolean settled = balance.compareTo(CENT) < 0;
        String documentType = settled ? "RECEIPT" : "INVOICE";
        String documentNo = (settled ? "RCT-" : "INV-") + reference;
        LocalDate nextDue = settled ? null : totals.payments.stream()
                .filter(p -> !"PAID".equalsIgnoreCase(p.getStatus()))
                .map(RepaymentEntryDetailDto::getDueDate)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);

        String paymentStatus = settled ? "PAID IN FULL"
                : totals.paid.compareTo(BigDecimal.ZERO) > 0 ? "PART PAYMENT" : "AWAITING PAYMENT";

        List<String> notes = new ArrayList<>();
        if (settled) {
            notes.add("This receipt confirms full payment for the goods listed above.");
        } else {
            notes.add("Outstanding balance of NGN " + formatMoney(balance) + " is payable per the agreed "
                    + "payment schedule" + (nextDue != null ? "; next payment due " + DUE_DATE.format(nextDue) : "") + ".");
            notes.add("Please quote the invoice number (" + documentNo + ") as the payment narration/reference.");
        }
        notes.add("Goods sold are subject to the company's returns and refund policy.");

        return SalesInvoiceDto.builder()
                .documentType(documentType)
                .documentNo(documentNo)
                .issuedAt(LocalDateTime.now())
                .saleDate(first.getCreatedAt())
                .nextDueDate(nextDue)
                .currency("NGN")
                .saleType(saleTypeLabel(first))
                .orderStatus(first.getStatus() != null ? first.getStatus().name() : null)
                .paymentStatus(paymentStatus)
                .paymentMethod(paymentMethod)
                .orderReferences(orders.stream().map(SalesOrder::getReferenceNo).toList())
                .company(SalesInvoiceDto.Company.builder()
                        .name(companyName)
                        .tagline(companyTagline)
                        .bankName(bankName)
                        .accountName(accountName)
                        .accountNumber(accountNumber)
                        .build())
                .customer(SalesInvoiceDto.Customer.builder()
                        .name(first.getCustomerName() != null && !first.getCustomerName().isBlank()
                                ? first.getCustomerName() : "Walk-in Customer")
                        .accountNumber(first.getAccountNumber())
                        .phone(first.getPhoneNumber())
                        .email(first.getEmail())
                        .address(first.getAddress())
                        .build())
                .items(lines)
                .charges(charges)
                .subtotal(subtotal)
                .total(totals.total)
                .amountPaid(totals.paid)
                .balance(balance)
                .amountInWords(amountInWords(totals.total))
                .payments(totals.payments)
                .notes(notes)
                .build();
    }

    // ==================== GROUPING ====================

    // Every approved sibling of a "<reference>-<n>" walk-in cart, in cart order. Orders
    // without that shape (credit sales, SLS-... references) stand alone.
    private List<SalesOrder> saleGroup(SalesOrder order) {
        String base = referenceBase(order.getSalesReference());
        if (base == null) {
            return List.of(order);
        }
        List<SalesOrder> group = salesOrderRepository.findBySalesReferenceStartingWith(base + "-").stream()
                .filter(o -> base.equals(referenceBase(o.getSalesReference())))
                .filter(o -> Objects.equals(o.getCustomerName(), order.getCustomerName()))
                .filter(o -> o.getStatus() != null && INVOICE_READY_STATUSES.contains(o.getStatus()))
                .sorted(Comparator.comparingInt(o -> lineNumber(o.getSalesReference())))
                .toList();
        return group.isEmpty() ? List.of(order) : group;
    }

    private static String groupReference(List<SalesOrder> orders) {
        SalesOrder first = orders.get(0);
        String base = referenceBase(first.getSalesReference());
        if (base != null && orders.size() > 1) {
            return base;
        }
        return first.getSalesReference() != null ? first.getSalesReference() : first.getReferenceNo();
    }

    private static String referenceBase(String salesReference) {
        if (salesReference == null) return null;
        Matcher m = LINE_SUFFIX.matcher(salesReference);
        return m.matches() ? m.group(1) : null;
    }

    private static int lineNumber(String salesReference) {
        Matcher m = LINE_SUFFIX.matcher(salesReference);
        try {
            return m.matches() ? Integer.parseInt(m.group(2)) : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    // ==================== LINES & LABELS ====================

    private static SalesInvoiceDto.Line lineFor(SalesOrder order) {
        int qty = order.getQuantity() != null && order.getQuantity() > 0 ? order.getQuantity() : 1;
        BigDecimal discount = order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO;
        BigDecimal unitPrice = order.getUnitPrice();
        BigDecimal amount;
        if (unitPrice != null) {
            amount = unitPrice.multiply(BigDecimal.valueOf(qty)).subtract(discount);
        } else {
            amount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            unitPrice = amount.add(discount).divide(BigDecimal.valueOf(qty), 2, RoundingMode.HALF_UP);
        }
        return line(order.getProductName(), qty, unitPrice, discount, amount);
    }

    private static SalesInvoiceDto.Line line(String description, int qty, BigDecimal unitPrice,
                                             BigDecimal discount, BigDecimal amount) {
        return SalesInvoiceDto.Line.builder()
                .description(description != null && !description.isBlank() ? description : "Item")
                .quantity(qty)
                .unitPrice(unitPrice.setScale(2, RoundingMode.HALF_UP))
                .discount(discount.setScale(2, RoundingMode.HALF_UP))
                .amount(amount.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    private static void addCharge(List<SalesInvoiceDto.Charge> charges, String label, BigDecimal amount) {
        if (amount != null && amount.abs().compareTo(CENT) >= 0) {
            charges.add(new SalesInvoiceDto.Charge(label, amount.setScale(2, RoundingMode.HALF_UP)));
        }
    }

    // What the gap between totalAmount/schedule total and the bare item lines is made of
    // for a staff-entered order: settleOneOffOrder folds insurance/delivery/VAT into
    // totalAmount, and a credit schedule adds interest on top of the product amount.
    private static String chargeLabel(SalesOrder order) {
        if (order.getOrderType() == SalesOrderType.CREDIT || order.getOrderType() == SalesOrderType.INSTALLMENT) {
            return "Interest & credit charges";
        }
        if (order.getOrderType() == SalesOrderType.ONE_OFF) {
            return "Delivery, insurance & VAT";
        }
        return "Other charges";
    }

    private static String saleTypeLabel(SalesOrder order) {
        String origin = order.getChannel() == SalesChannel.MOBILE ? "Mobile App"
                : order.getCustomerType() == CustomerType.WALKIN ? "Walk-in" : "Online";
        String kind = order.getOrderType() == null ? "Sale" : switch (order.getOrderType()) {
            case CASH -> "Cash Sale";
            case CREDIT -> "Credit Sale";
            case INSTALLMENT -> "Installment Sale";
            case ONE_OFF -> "One-off Sale";
        };
        return origin + " " + kind;
    }

    private static String paymentMethodLabel(SalesOrder order, Order mobileOrder) {
        if (mobileOrder != null && mobileOrder.getPaymentType() != null) {
            return switch (mobileOrder.getPaymentType()) {
                case FULL_PAYMENT -> "Full payment";
                case INSTALLMENT -> "Installments";
                case WALLET -> "Wallet";
            };
        }
        if (order.getOrderType() == null) return "N/A";
        return switch (order.getOrderType()) {
            case CASH -> "Cash";
            case CREDIT -> order.getLoanDetails() != null && order.getLoanDetails().getRepaymentMethod() != null
                    ? "Credit (" + order.getLoanDetails().getRepaymentMethod() + ")" : "Credit";
            case INSTALLMENT -> "Installments";
            case ONE_OFF -> "Full payment";
        };
    }

    // ==================== MONEY ====================

    private static final class Totals {
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal paid = BigDecimal.ZERO;
        BigDecimal outstanding = BigDecimal.ZERO;
        List<RepaymentEntryDetailDto> payments = new ArrayList<>();

        void add(PaymentDetailDto details) {
            BigDecimal orderPaid = details.getTotalPaid() != null ? details.getTotalPaid() : BigDecimal.ZERO;
            BigDecimal orderOutstanding = details.getOutstandingBalance() != null
                    ? details.getOutstandingBalance() : BigDecimal.ZERO;
            paid = paid.add(orderPaid);
            outstanding = outstanding.add(orderOutstanding);
            total = total.add(orderPaid).add(orderOutstanding);
            if (details.getPayments() != null) {
                payments.addAll(details.getPayments());
            }
        }
    }

    private static BigDecimal sum(List<SalesInvoiceDto.Line> lines) {
        return lines.stream().map(SalesInvoiceDto.Line::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal money(Double value) {
        return value != null ? BigDecimal.valueOf(value) : BigDecimal.ZERO;
    }

    private static String formatMoney(BigDecimal value) {
        NumberFormat format = NumberFormat.getNumberInstance(Locale.US);
        format.setMinimumFractionDigits(2);
        format.setMaximumFractionDigits(2);
        return format.format(value);
    }

    private static final String[] ONES = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
            "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
            "Eighteen", "Nineteen"};
    private static final String[] TENS = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
            "Eighty", "Ninety"};
    private static final String[] SCALES = {"", "Thousand", "Million", "Billion", "Trillion"};

    // 1300000 -> "One Million, Three Hundred Thousand Naira Only" (same wording as the
    // template and frontend receiptUtils.amountToWords).
    static String amountInWords(BigDecimal value) {
        BigDecimal amount = value.abs().setScale(2, RoundingMode.HALF_UP);
        long naira = amount.longValue();
        int kobo = amount.subtract(BigDecimal.valueOf(naira)).movePointRight(2).intValue();
        String words = integerToWords(naira) + " Naira";
        if (kobo > 0) {
            words += ", " + integerToWords(kobo) + " Kobo";
        }
        return words + " Only";
    }

    private static String integerToWords(long n) {
        if (n == 0) return "Zero";
        Deque<String> groups = new ArrayDeque<>();
        int scale = 0;
        while (n > 0) {
            int chunk = (int) (n % 1000);
            if (chunk > 0) {
                groups.addFirst(hundredsToWords(chunk) + (SCALES[scale].isEmpty() ? "" : " " + SCALES[scale]));
            }
            n /= 1000;
            scale++;
        }
        return String.join(", ", groups);
    }

    private static String hundredsToWords(int n) {
        List<String> parts = new ArrayList<>();
        if (n >= 100) {
            parts.add(ONES[n / 100] + " Hundred");
            n %= 100;
            if (n > 0) parts.add("and");
        }
        if (n >= 20) {
            parts.add(TENS[n / 10] + (n % 10 > 0 ? "-" + ONES[n % 10] : ""));
        } else if (n > 0) {
            parts.add(ONES[n]);
        }
        return String.join(" ", parts);
    }
}
