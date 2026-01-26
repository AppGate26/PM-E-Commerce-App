package com.appGate.inventory.service;

import com.appGate.inventory.dto.CreateInvoiceDto;
import com.appGate.inventory.dto.InvoiceItemDto;
import com.appGate.inventory.enums.InvoiceStatus;
import com.appGate.inventory.enums.InvoiceType;
import com.appGate.inventory.models.Invoice;
import com.appGate.inventory.models.InvoiceItem;
import com.appGate.inventory.repository.InvoiceRepository;
import com.appGate.inventory.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

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
            BigDecimal total = subtotal.add(tax);
            invoice.setTotalAmount(total);
            invoice.setAmountDue(total);

            Invoice savedInvoice = invoiceRepository.save(invoice);
            return new BaseResponse(HttpStatus.CREATED.value(), "Invoice created successfully", savedInvoice);
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating invoice: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllInvoices() {
        List<Invoice> invoices = invoiceRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Invoices retrieved successfully", invoices);
    }

    public BaseResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Invoice retrieved successfully", invoice);
    }

    public BaseResponse getInvoiceByNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Invoice retrieved successfully", invoice);
    }

    public BaseResponse getInvoicesByType(InvoiceType invoiceType) {
        List<Invoice> invoices = invoiceRepository.findByInvoiceType(invoiceType);
        return new BaseResponse(HttpStatus.OK.value(), "Invoices retrieved successfully", invoices);
    }

    public BaseResponse getInvoicesByStatus(InvoiceStatus status) {
        List<Invoice> invoices = invoiceRepository.findByStatus(status);
        return new BaseResponse(HttpStatus.OK.value(), "Invoices retrieved successfully", invoices);
    }

    public BaseResponse getInvoicesBySupplier(Long supplierId) {
        List<Invoice> invoices = invoiceRepository.findBySupplierId(supplierId);
        return new BaseResponse(HttpStatus.OK.value(), "Supplier invoices retrieved successfully", invoices);
    }

    public BaseResponse getOverdueInvoices() {
        List<Invoice> invoices = invoiceRepository.findByDueDateBeforeAndStatus(
                LocalDate.now(), InvoiceStatus.PENDING);
        return new BaseResponse(HttpStatus.OK.value(), "Overdue invoices retrieved successfully", invoices);
    }

    @Transactional
    public BaseResponse updateInvoiceStatus(Long id, InvoiceStatus status) {
        try {
            Invoice invoice = invoiceRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Invoice not found"));
            invoice.setStatus(status);
            Invoice updatedInvoice = invoiceRepository.save(invoice);
            return new BaseResponse(HttpStatus.OK.value(), "Invoice status updated successfully", updatedInvoice);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating invoice status: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteInvoice(Long id) {
        try {
            Invoice invoice = invoiceRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Invoice not found"));
            invoiceRepository.delete(invoice);
            return new BaseResponse(HttpStatus.OK.value(), "Invoice deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting invoice: " + e.getMessage(), null);
        }
    }

    private String generateInvoiceNumber(InvoiceType type) {
        String prefix = type == InvoiceType.INVOICE ? "PM-INVOICE-NO-" : "PM-PROFORMA-NO-";
        int year = Year.now().getValue();
        long count = invoiceRepository.count() + 1;
        return prefix + year + "-" + String.format("%04d", count);
    }
}
