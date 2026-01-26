package com.appGate.inventory.dto;

import jakarta.annotation.Nullable;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

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

    @Nullable
    private MultipartFile passportImage;
}
