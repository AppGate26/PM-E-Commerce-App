package com.appGate.inventory.service;

import com.appGate.inventory.dto.CreateInvoiceDto;
import com.appGate.inventory.dto.InvoiceItemDto;
import com.appGate.inventory.dto.ProformaInvoiceDto;
import com.appGate.inventory.enums.InvoiceStatus;
import com.appGate.inventory.enums.InvoiceType;
import com.appGate.inventory.models.Invoice;
import com.appGate.inventory.models.InvoiceItem;
import com.appGate.inventory.models.Stock;
import com.appGate.inventory.repository.InvoiceRepository;
import com.appGate.inventory.repository.StockRepository;
import com.appGate.inventory.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final StockRepository stockRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    /** Load an invoice, refusing one raised at another branch. */
    private Invoice loadInvoiceInScope(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        branchScopeService.assertCanAccess(invoice.getBranchId());
        return invoice;
    }

    @Transactional
    public BaseResponse createInvoice(CreateInvoiceDto dto) {
        try {
            Invoice invoice = new Invoice();
            invoice.setInvoiceNumber(generateInvoiceNumber(dto.getInvoiceType()));
            invoice.setInvoiceType(dto.getInvoiceType());
            invoice.setStatus(InvoiceStatus.PENDING);
            invoice.setSupplierId(dto.getSupplierId());
            invoice.setSupplierName(dto.getSupplierName());
            invoice.setCustomerName(dto.getCustomerName());
            invoice.setCustomerAddress(dto.getCustomerAddress());
            invoice.setInvoiceDate(dto.getInvoiceDate());
            invoice.setDueDate(dto.getDueDate());
            invoice.setDeliveryDate(dto.getDeliveryDate());
            invoice.setNotes(dto.getNotes());
            invoice.setCompanyName(dto.getCompanyName() != null ? dto.getCompanyName() : "PEACE OF MIND PLC");
            invoice.setCompanyAddress(dto.getCompanyAddress() != null ? dto.getCompanyAddress() : "214 AVENUE IKOYI, LAGOS, NIGERIA");
            invoice.setCompanyPhone(dto.getCompanyPhone() != null ? dto.getCompanyPhone() : "+234-903-567-9689");
            invoice.setCompanyEmail(dto.getCompanyEmail());
            invoice.setCustomerPhone(dto.getCustomerPhone());
            invoice.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : BigDecimal.ZERO);
            invoice.setBankName(dto.getBankName());
            invoice.setAccountName(dto.getAccountName() != null ? dto.getAccountName() : "PM MARKET HUB LTD");
            invoice.setAccountNumber(dto.getAccountNumber());
            // A branch user always raises the invoice at their own branch.
            invoice.setBranchId(branchScopeService.resolveWriteBranchId(dto.getBranchId()));

            // Calculate totals
            BigDecimal subtotal = BigDecimal.ZERO;
            for (InvoiceItemDto itemDto : dto.getItems()) {
                InvoiceItem item = new InvoiceItem();
                item.setInvoice(invoice);
                item.setDescription(itemDto.getDescription());
                item.setQuantity(itemDto.getQuantity());
                item.setRate(itemDto.getRate());
                item.setAmount(itemDto.getRate().multiply(new BigDecimal(itemDto.getQuantity())));
                item.setProductId(itemDto.getProductId());
                invoice.getItems().add(item);

                subtotal = subtotal.add(item.getAmount());
            }

            invoice.setSubtotal(subtotal);
            BigDecimal tax = dto.getTax() != null ? dto.getTax() : BigDecimal.ZERO;
            invoice.setTax(tax);
            BigDecimal discount = invoice.getDiscount() != null ? invoice.getDiscount() : BigDecimal.ZERO;
            BigDecimal total = subtotal.subtract(discount).add(tax);
            invoice.setTotalAmount(total);
            invoice.setAmountDue(total);

            Invoice savedInvoice = invoiceRepository.save(invoice);

            if (savedInvoice.getInvoiceNumber() == null || savedInvoice.getInvoiceNumber().isEmpty()) {
                String year = String.valueOf(Year.now().getValue()).substring(2);
                String formattedId = String.format("%06d", savedInvoice.getId());
                savedInvoice.setInvoiceNumber("INV/" + year + "/" + formattedId);
            }

            savedInvoice = invoiceRepository.save(savedInvoice);

            // When a real purchase invoice arrives from a supplier, add the goods to central stock.
            // PROFORMA invoices are quotes only — they do not affect stock.
            if (dto.getInvoiceType() == InvoiceType.INVOICE) {
                for (InvoiceItemDto itemDto : dto.getItems()) {
                    if (itemDto.getProductId() != null) {
                        java.util.Optional<Stock> centralStockOpt =
                                stockRepository.findByProductIdAndBranchIdIsNull(itemDto.getProductId());
                        if (centralStockOpt.isPresent()) {
                            Stock centralStock = centralStockOpt.get();
                            centralStock.setQuantity(centralStock.getQuantity() + itemDto.getQuantity());
                            stockRepository.save(centralStock);
                        }
                        // If no central stock entry exists yet for this product,
                        // staff should create one first via POST /api/admin/stocks (branchId = null).
                    }
                }
            }

            return new BaseResponse(HttpStatus.CREATED.value(), "Invoice created successfully", savedInvoice);
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating invoice: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllInvoices() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<Invoice> invoices = branchId == null
                ? invoiceRepository.findAll()
                : invoiceRepository.findByBranchId(branchId);
        return new BaseResponse(HttpStatus.OK.value(), "Invoices retrieved successfully", invoices);
    }

    public BaseResponse getInvoiceById(Long id) {
        Invoice invoice = loadInvoiceInScope(id);
        return new BaseResponse(HttpStatus.OK.value(), "Invoice retrieved successfully", invoice);
    }

    public BaseResponse getInvoiceByNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        branchScopeService.assertCanAccess(invoice.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "Invoice retrieved successfully", invoice);
    }

    public BaseResponse getInvoicesByType(InvoiceType invoiceType) {
        Long branchId = branchScopeService.getScopedBranchId();
        List<Invoice> invoices = branchId == null
                ? invoiceRepository.findByInvoiceType(invoiceType)
                : invoiceRepository.findByInvoiceTypeAndBranchId(invoiceType, branchId);
        return new BaseResponse(HttpStatus.OK.value(), "Invoices retrieved successfully", invoices);
    }

    public BaseResponse getInvoicesByStatus(InvoiceStatus status) {
        Long branchId = branchScopeService.getScopedBranchId();
        List<Invoice> invoices = branchId == null
                ? invoiceRepository.findByStatus(status)
                : invoiceRepository.findByStatusAndBranchId(status, branchId);
        return new BaseResponse(HttpStatus.OK.value(), "Invoices retrieved successfully", invoices);
    }

    public BaseResponse getInvoicesBySupplier(Long supplierId) {
        Long branchId = branchScopeService.getScopedBranchId();
        List<Invoice> invoices = branchId == null
                ? invoiceRepository.findBySupplierId(supplierId)
                : invoiceRepository.findBySupplierIdAndBranchId(supplierId, branchId);
        return new BaseResponse(HttpStatus.OK.value(), "Supplier invoices retrieved successfully", invoices);
    }

    public BaseResponse getOverdueInvoices() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<Invoice> invoices = branchId == null
                ? invoiceRepository.findByDueDateBeforeAndStatus(LocalDate.now(), InvoiceStatus.PENDING)
                : invoiceRepository.findByDueDateBeforeAndStatusAndBranchId(
                        LocalDate.now(), InvoiceStatus.PENDING, branchId);
        return new BaseResponse(HttpStatus.OK.value(), "Overdue invoices retrieved successfully", invoices);
    }

    @Transactional
    public BaseResponse updateInvoiceStatus(Long id, InvoiceStatus status) {
        try {
            Invoice invoice = loadInvoiceInScope(id);
            invoice.setStatus(status);
            Invoice updatedInvoice = invoiceRepository.save(invoice);
            return new BaseResponse(HttpStatus.OK.value(), "Invoice status updated successfully", updatedInvoice);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating invoice status: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteInvoice(Long id) {
        try {
            Invoice invoice = loadInvoiceInScope(id);
            invoiceRepository.delete(invoice);
            return new BaseResponse(HttpStatus.OK.value(), "Invoice deleted successfully", null);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting invoice: " + e.getMessage(), null);
        }
    }

    public BaseResponse generateProforma(String invoiceNumber) {
        try {
            Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                    .orElseThrow(() -> new RuntimeException("Invoice not found with number: " + invoiceNumber));
            branchScopeService.assertCanAccess(invoice.getBranchId());

            // Build proforma item list
            AtomicInteger counter = new AtomicInteger(1);
            List<ProformaInvoiceDto.ProformaItemDto> proformaItems = invoice.getItems().stream()
                    .map(item -> ProformaInvoiceDto.ProformaItemDto.builder()
                            .serialNumber(counter.getAndIncrement())
                            .description(item.getDescription())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getRate())
                            .total(item.getAmount())
                            .build())
                    .toList();

            // Generate proforma number from invoice number (e.g., PM-INVOICE-NO-2026-0001 -> PF-2026-0001)
            String proformaNo = invoice.getInvoiceNumber().replace("PM-INVOICE-NO-", "PF-");

            BigDecimal discount = invoice.getDiscount() != null ? invoice.getDiscount() : BigDecimal.ZERO;

            List<String> terms = List.of(
                    "This is a Proforma Invoice and not a final tax invoice.",
                    "Payment must be completed before goods are delivered.",
                    "Prices may change after confirmation.");

            ProformaInvoiceDto proforma = ProformaInvoiceDto.builder()
                    .companyName(invoice.getCompanyName() != null ? invoice.getCompanyName() : "PM MARKET HUB LTD")
                    .companyAddress(invoice.getCompanyAddress())
                    .companyPhone(invoice.getCompanyPhone())
                    .companyEmail(invoice.getCompanyEmail())
                    .proformaNumber(proformaNo)
                    .date(invoice.getInvoiceDate())
                    .customerName(invoice.getCustomerName())
                    .customerPhone(invoice.getCustomerPhone())
                    .customerAddress(invoice.getCustomerAddress())
                    .items(proformaItems)
                    .subtotal(invoice.getSubtotal())
                    .discount(discount)
                    .totalAmount(invoice.getTotalAmount())
                    .bankName(invoice.getBankName())
                    .accountName(invoice.getAccountName() != null ? invoice.getAccountName() : "PM MARKET HUB LTD")
                    .accountNumber(invoice.getAccountNumber())
                    .termsAndConditions(terms)
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .build();

            return new BaseResponse(HttpStatus.OK.value(), "Proforma invoice generated successfully", proforma);
        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error generating proforma: " + e.getMessage(), null);
        }
    }

    private String generateInvoiceNumber(InvoiceType type) {
        String prefix = type == InvoiceType.INVOICE ? "PM-INVOICE-NO-" : "PM-PROFORMA-NO-";
        int year = Year.now().getValue();
        long count = invoiceRepository.count() + 1;
        return prefix + year + "-" + String.format("%04d", count);
    }
}
