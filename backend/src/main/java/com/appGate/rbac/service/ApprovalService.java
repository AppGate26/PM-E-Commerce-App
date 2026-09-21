package com.appGate.rbac.service;

import com.appGate.client.models.Customer;
import com.appGate.client.repository.CustomerRepository;
import com.appGate.inventory.dto.StockDto;
import com.appGate.inventory.models.Supplier;
import com.appGate.inventory.repository.SupplierRepository;
import com.appGate.inventory.service.StockService;
import com.appGate.orderingsales.dto.CustomerInfoDto;
import com.appGate.orderingsales.dto.RefundDto;
import com.appGate.orderingsales.dto.SalesOrderDto;
import com.appGate.orderingsales.service.SalesService;
import com.appGate.rbac.dto.ApprovalActionDto;
import com.appGate.rbac.dto.CreateApprovalRequestDto;
import com.appGate.rbac.enums.ApprovalStatus;
import com.appGate.rbac.enums.ApprovalType;
import com.appGate.rbac.models.ApprovalRequest;
import com.appGate.rbac.repository.ApprovalRequestRepository;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.warehouse.dto.ProductReceiptDto;
import com.appGate.warehouse.dto.WarehouseTransferDto;
import com.appGate.warehouse.models.WarehouseMovement;
import com.appGate.warehouse.service.WarehouseMovementService;
import com.appGate.warehouse.service.WarehouseService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final SalesService salesService;
    private final StockService stockService;
    private final WarehouseMovementService warehouseMovementService;
    private final WarehouseService warehouseService;
    private final ObjectMapper objectMapper;

    @Transactional
    public BaseResponse createApprovalRequest(CreateApprovalRequestDto dto) {
        try {
            ApprovalRequest request = new ApprovalRequest();
            request.setApprovalType(dto.getApprovalType());
            request.setEntityId(dto.getEntityId());
            request.setRequestedBy(dto.getRequestedBy());
            request.setRequestData(dto.getRequestData());
            request.setComments(dto.getComments());
            request.setStatus(ApprovalStatus.PENDING);

            ApprovalRequest savedRequest = approvalRequestRepository.save(request);
            return new BaseResponse(HttpStatus.CREATED.value(), "Approval request created successfully", savedRequest);
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating approval request: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllPendingApprovals() {
        List<ApprovalRequest> requests = approvalRequestRepository.findByStatus(ApprovalStatus.PENDING);
        return new BaseResponse(HttpStatus.OK.value(), "Pending approvals retrieved successfully", requests);
    }

    public BaseResponse getPendingApprovalsByType(ApprovalType approvalType) {
        List<ApprovalRequest> requests = approvalRequestRepository.findByApprovalTypeAndStatus(
                approvalType, ApprovalStatus.PENDING);
        return new BaseResponse(HttpStatus.OK.value(), "Pending approvals retrieved successfully", requests);
    }

    public BaseResponse getApprovalRequestById(Long id) {
        ApprovalRequest request = approvalRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Approval request not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Approval request retrieved successfully", request);
    }

    public BaseResponse getAllApprovalsByType(ApprovalType approvalType) {
        List<ApprovalRequest> requests = approvalRequestRepository.findByApprovalType(approvalType);
        return new BaseResponse(HttpStatus.OK.value(), "Approvals retrieved successfully", requests);
    }

    @Transactional
    public BaseResponse approveRequest(Long requestId, ApprovalActionDto dto) {
        try {
            ApprovalRequest request = approvalRequestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Approval request not found"));

            if (request.getStatus() != ApprovalStatus.PENDING) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Only pending requests can be approved", null);
            }

            request.setStatus(ApprovalStatus.APPROVED);
            request.setApprovedBy(dto.getApprovedBy());
            request.setComments(dto.getComments());
            request.setApprovedAt(LocalDateTime.now());

            ApprovalRequest updatedRequest = approvalRequestRepository.save(request);

            // Here you would trigger the actual action based on approval type
            // e.g., create the stock, customer, supplier, etc.
            processApprovedRequest(updatedRequest);

            return new BaseResponse(HttpStatus.OK.value(), "Request approved successfully", updatedRequest);
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error approving request: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse declineRequest(Long requestId, ApprovalActionDto dto) {
        try {
            ApprovalRequest request = approvalRequestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Approval request not found"));

            if (request.getStatus() != ApprovalStatus.PENDING) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Only pending requests can be declined", null);
            }

            if (dto.getDeclineReason() == null || dto.getDeclineReason().isEmpty()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Decline reason is required", null);
            }

            request.setStatus(ApprovalStatus.DECLINED);
            request.setApprovedBy(dto.getApprovedBy());
            request.setDeclineReason(dto.getDeclineReason());
            request.setComments(dto.getComments());
            request.setApprovedAt(LocalDateTime.now());

            ApprovalRequest updatedRequest = approvalRequestRepository.save(request);

            return new BaseResponse(HttpStatus.OK.value(), "Request declined successfully", updatedRequest);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error declining request: " + e.getMessage(), null);
        }
    }

    private void processApprovedRequest(ApprovalRequest request) {
        // Execute the real action represented by an approved request. The requestData
        // field carries the JSON payload submitted when the request was created.
        if (request.getApprovalType() == null || request.getRequestData() == null
                || request.getRequestData().isBlank()) {
            return;
        }

        try {
            JsonNode data = objectMapper.readTree(request.getRequestData());
            switch (request.getApprovalType()) {
                case SUPPLIER_REGISTRATION -> createSupplierFromApproval(data);
                case CUSTOMER_REGISTRATION -> activateCustomer(request.getEntityId());
                case CUSTOMER_EDIT -> applyCustomerEdits(request.getEntityId(), data);
                case CREDIT_SALES -> createWalkInCreditSaleFromApproval(data);
                case CASH_SALES -> createWalkInCashSalesFromApproval(data);
                case STOCK_ADD -> createStockFromApproval(data);
                case PRODUCT_TO_WAREHOUSE -> processProductToWarehouseMovement(data, request);
                case REFUND -> processRefundFromApproval(data, request);
                // Other approval types can be wired here as their persistence flows are finalised.
                default -> { /* no automated action yet for this type */ }
            }
        } catch (Exception e) {
            // Surface the failure so the approval transaction rolls back rather than
            // silently marking the request approved without performing the action.
            throw new RuntimeException(
                    "Approved request could not be processed: " + e.getMessage(), e);
        }
    }

    // Persist a walk-in credit sale (SalesOrder + LoanDetails) once approved. The request
    // payload was built by the credit-sale form, so it maps onto SalesOrderDto directly
    // (unknown extra fields are ignored by the configured ObjectMapper). When the request
    // was filed via the first-installment Paystack checkout (see
    // SalesService.verifyCreditFirstInstallmentPayment), the payload also carries proof that
    // money was already collected - firstInstallmentPaid/Amount/Reference/PaidAt - which must
    // be threaded through here, otherwise that payment is never written to a Payment row or
    // reflected in the order's repayment schedule and the order sits at 0% paid despite the
    // customer having paid.
    //
    // No longer reachable from the first-installment-payment path (order_rules.txt #2b): that
    // path now calls salesService.createWalkInCreditSalesWithFirstInstallment directly instead
    // of filing a CREDIT_SALES ApprovalRequest, so this only runs if a CREDIT_SALES request is
    // ever filed some other way through the generic /api/admin/approvals endpoints.
    private void createWalkInCreditSaleFromApproval(JsonNode data) throws Exception {
        SalesOrderDto dto = objectMapper.treeToValue(data, SalesOrderDto.class);

        boolean firstInstallmentPaid = data.has("firstInstallmentPaid")
                && data.get("firstInstallmentPaid").asBoolean(false);
        if (!firstInstallmentPaid) {
            salesService.createWalkInCreditSales(dto);
            return;
        }

        JsonNode amountNode = data.get("firstInstallmentAmount");
        BigDecimal firstInstallmentAmount = (amountNode != null && !amountNode.isNull())
                ? new BigDecimal(amountNode.asText())
                : null;
        String firstInstallmentReference = text(data, "firstInstallmentReference");

        LocalDateTime firstInstallmentPaidAt = null;
        String paidAtText = text(data, "firstInstallmentPaidAt");
        if (paidAtText != null) {
            try {
                firstInstallmentPaidAt = LocalDateTime.parse(paidAtText);
            } catch (Exception ignored) {
                // Falls back to "now" inside SalesService.
            }
        }

        salesService.createWalkInCreditSalesWithFirstInstallment(
                dto, firstInstallmentAmount, firstInstallmentReference, firstInstallmentPaidAt);
    }

    // Persist a walk-in cash sale once approved. The cash-sale form submits an "items" array
    // (one entry per product); create one order per item. Falls back to the whole payload
    // when no items array is present.
    private void createWalkInCashSalesFromApproval(JsonNode data) throws Exception {
        JsonNode items = data.get("items");
        if (items != null && items.isArray() && items.size() > 0) {
            JsonNode topLevelCustomer = data.get("customerInfo");
            for (JsonNode item : items) {
                SalesOrderDto dto = objectMapper.treeToValue(item, SalesOrderDto.class);
                if (dto.getCustomerInfo() == null && topLevelCustomer != null) {
                    dto.setCustomerInfo(objectMapper.treeToValue(topLevelCustomer, CustomerInfoDto.class));
                }
                salesService.createWalkInCashSales(dto);
            }
        } else {
            SalesOrderDto dto = objectMapper.treeToValue(data, SalesOrderDto.class);
            salesService.createWalkInCashSales(dto);
        }
    }

    // Persist a stock addition once approved. Deserialize the stored StockDto and call StockService.
    // Uses addToStock rather than createStock so that approving a request for a product that
    // already has stock at the target scope tops up the existing quantity instead of failing.
    private void createStockFromApproval(JsonNode data) throws Exception {
        StockDto dto = objectMapper.treeToValue(data, StockDto.class);
        com.appGate.inventory.response.BaseResponse creationResult = stockService.addToStock(dto);
        if (creationResult.getStatus() == null || creationResult.getStatus() >= 300) {
            throw new RuntimeException("Could not create stock: " + creationResult.getMessage());
        }
    }

    private void activateCustomer(Long customerId) {
        if (customerId == null) {
            return;
        }
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer != null) {
            customer.setApproved(true);
            customerRepository.save(customer);
        }
    }

    private void createSupplierFromApproval(JsonNode data) {
        Supplier supplier = new Supplier();
        supplier.setCustomerName(text(data, "customerName", "companyName"));
        supplier.setContactName(text(data, "contactName", "contactPersonName"));
        supplier.setContactPhoneNo(text(data, "contactPhoneNo", "contactPhoneNumber"));
        supplier.setContactEmail(text(data, "contactEmail"));
        supplier.setTaxId(text(data, "taxId", "taxIdNumber"));
        supplier.setPaymentTerms(text(data, "paymentTerms"));
        supplier.setDeliveryTerms(text(data, "deliveryTerms"));
        supplier.setAddress(text(data, "address"));

        Supplier saved = supplierRepository.save(supplier);

        if (saved.getSupplierId() == null || saved.getSupplierId().isEmpty()) {
            String year = String.valueOf(Year.now().getValue()).substring(2);
            saved.setSupplierId("SUP/" + year + "/" + String.format("%06d", saved.getId()));
            supplierRepository.save(saved);
        }
    }

    // Apply approved customer edits to the customer record. The editData payload contains
    // only the fields that were modified during the edit submission.
    private void applyCustomerEdits(Long customerId, JsonNode data) {
        if (customerId == null) {
            return;
        }
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer == null) {
            return;
        }

        if (data.has("firstName")) {
            customer.setFirstName(data.get("firstName").asText(null));
        }
        if (data.has("otherNames")) {
            customer.setOtherNames(data.get("otherNames").asText(null));
        }
        if (data.has("surname")) {
            customer.setSurname(data.get("surname").asText(null));
        }
        if (data.has("gender")) {
            String genderStr = data.get("gender").asText(null);
            if (genderStr != null) {
                customer.setGender(com.appGate.client.enums.GenderEnum.valueOf(genderStr));
            }
        }
        if (data.has("dob") || data.has("dateOfBirth") || data.has("date_of_birth")) {
            String dobValue = data.has("dob") ? data.get("dob").asText(null) :
                            data.has("dateOfBirth") ? data.get("dateOfBirth").asText(null) :
                            data.get("date_of_birth").asText(null);
            customer.setDob(dobValue);
        }
        if (data.has("nationality")) {
            customer.setNationality(data.get("nationality").asText(null));
        }
        if (data.has("occupation")) {
            customer.setOccupation(data.get("occupation").asText(null));
        }
        if (data.has("phoneNumber") || data.has("telephoneNumber") || data.has("telephone_number")) {
            String phoneValue = data.has("phoneNumber") ? data.get("phoneNumber").asText(null) :
                              data.has("telephoneNumber") ? data.get("telephoneNumber").asText(null) :
                              data.get("telephone_number").asText(null);
            customer.setPhoneNumber(phoneValue);
        }
        if (data.has("email")) {
            customer.setEmail(data.get("email").asText(null));
        }
        if (data.has("contactAddress") || data.has("contact_address")) {
            String addressValue = data.has("contactAddress") ? data.get("contactAddress").asText(null) :
                                data.get("contact_address").asText(null);
            customer.setContactAddress(addressValue);
        }
        if (data.has("officeAddress") || data.has("office_address")) {
            String officeValue = data.has("officeAddress") ? data.get("officeAddress").asText(null) :
                               data.get("office_address").asText(null);
            customer.setOfficeAddress(officeValue);
        }
        if (data.has("nin")) {
            customer.setNin(data.get("nin").asText(null));
        }
        if (data.has("bvn")) {
            customer.setBvn(data.get("bvn").asText(null));
        }
        if (data.has("nextOfKin") || data.has("next_of_kin")) {
            String nokValue = data.has("nextOfKin") ? data.get("nextOfKin").asText(null) :
                            data.get("next_of_kin").asText(null);
            customer.setNextOfKin(nokValue);
        }
        if (data.has("nextOfKinAddress") || data.has("next_of_kin_address")) {
            String nokAddressValue = data.has("nextOfKinAddress") ? data.get("nextOfKinAddress").asText(null) :
                                   data.get("next_of_kin_address").asText(null);
            customer.setNextOfKinAddress(nokAddressValue);
        }

        customerRepository.save(customer);
    }

    // Process an approved product-to-warehouse movement request. Delegates to the same
    // WarehouseMovementService used by the warehouse manager's own submission endpoints, then
    // immediately approves the resulting movement (the RBAC-level approval already happened
    // here) so its quantity actually lands in WarehouseProduct — see
    // WarehouseService.approveMovement, which is what applies it and re-checks stock.
    private void processProductToWarehouseMovement(JsonNode data, ApprovalRequest request) {
        Long productId = longValue(data, "productId");
        Long destinationWarehouseId = longValue(data, "destinationWarehouseId");
        Long sourceWarehouseId = longValue(data, "sourceWarehouseId");
        Integer quantity = intValue(data, "quantity");
        String operationType = text(data, "operationType", "type");

        if (productId == null || destinationWarehouseId == null || quantity == null || quantity <= 0) {
            throw new RuntimeException("Product-to-warehouse request is missing productId, destinationWarehouseId, or a positive quantity");
        }

        boolean isTransfer = sourceWarehouseId != null
                && (operationType == null || operationType.toUpperCase().contains("TRANSFER"));

        com.appGate.warehouse.response.BaseResponse creationResult;
        if (isTransfer) {
            WarehouseTransferDto dto = new WarehouseTransferDto();
            dto.setSenderWarehouseId(sourceWarehouseId);
            dto.setReceiverWarehouseId(destinationWarehouseId);
            dto.setProductId(productId);
            dto.setQuantity(quantity);
            creationResult = warehouseMovementService.transferBetweenWarehouses(dto);
        } else {
            ProductReceiptDto dto = new ProductReceiptDto();
            dto.setWarehouseId(destinationWarehouseId);
            dto.setProductId(productId);
            dto.setQuantityReceived(quantity);
            creationResult = warehouseMovementService.addProductToWarehouse(dto);
        }

        if (creationResult.getStatus() == null || creationResult.getStatus() >= 300) {
            throw new RuntimeException("Could not record product-to-warehouse movement: " + creationResult.getMessage());
        }

        WarehouseMovement movement = (WarehouseMovement) creationResult.getResponse();
        com.appGate.warehouse.response.BaseResponse approveResult =
                warehouseService.approveMovement(movement.getId(), request.getApprovedBy());
        if (approveResult.getStatus() == null || approveResult.getStatus() >= 300) {
            throw new RuntimeException("Could not apply product-to-warehouse movement: " + approveResult.getMessage());
        }
    }

    // Process an approved refund request. Refund.jsx submits the order snapshot it showed
    // the approver under a "refundData" wrapper (totalAmount, customerName, accountNumber,
    // referenceNo, productName, createdAt) - SalesService.processRefund recalculates the
    // actual refund amount itself (10% charge on what was paid), it only reads reason and
    // productReference off the dto, so that's what matters here.
    private void processRefundFromApproval(JsonNode data, ApprovalRequest request) {
        if (request.getEntityId() == null) {
            throw new RuntimeException("Refund request is missing the order ID to refund");
        }

        JsonNode refundData = data.has("refundData") ? data.get("refundData") : data;

        RefundDto dto = new RefundDto();
        dto.setCustomerName(text(refundData, "customerName"));
        dto.setCustomerAccountNo(text(refundData, "accountNumber", "customerAccountNo"));
        dto.setProductReference(text(refundData, "referenceNo", "productName", "productReference"));
        dto.setReason(text(refundData, "reason", "comments"));
        if (dto.getReason() == null) {
            dto.setReason(request.getComments());
        }

        salesService.processRefund(request.getEntityId(), dto);
    }

    private Long longValue(JsonNode node, String key) {
        JsonNode value = node.get(key);
        return value != null && !value.isNull() ? value.asLong() : null;
    }

    private Integer intValue(JsonNode node, String key) {
        JsonNode value = node.get(key);
        return value != null && !value.isNull() ? value.asInt() : null;
    }

    // Returns the first non-blank value among the candidate JSON keys.
    private String text(JsonNode node, String... keys) {
        for (String key : keys) {
            JsonNode value = node.get(key);
            if (value != null && !value.isNull()) {
                String text = value.asText("").trim();
                if (!text.isEmpty()) {
                    return text;
                }
            }
        }
        return null;
    }
}
