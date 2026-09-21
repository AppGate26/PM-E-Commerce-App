package com.appGate.rbac.dto;

import com.appGate.rbac.enums.UtilityBillEnum;

import jakarta.annotation.Nullable;
import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class UtilityBillDto {
    private UtilityBillEnum utilityBillType;
    @Nullable
    private MultipartFile utilityBillPicture;
}
