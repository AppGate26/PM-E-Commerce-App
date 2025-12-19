package com.appGate.inventory.dto;

import lombok.Data;

@Data
public class SupplierDto {
    private String customerName;
    private String contactName;
    private String contactPhoneNo;
    private String contactEmail;
    private String taxId;
    private String paymentTerms;
    private String deliveryTerms;
    private String address;
    private String passportImage;
}
