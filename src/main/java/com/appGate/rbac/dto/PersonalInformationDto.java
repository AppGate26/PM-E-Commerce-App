package com.appGate.rbac.dto;

import org.springframework.web.multipart.MultipartFile;

import com.appGate.rbac.enums.GenderEnum;
import com.appGate.rbac.enums.MaritalStatusEnum;
import com.appGate.rbac.enums.UtilityBillEnum;

import jakarta.annotation.Nullable;
import lombok.Data;

@Data
public class PersonalInformationDto {

    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String homeAddress;
    private Long stateId;
    private Long lgaId;
    private Long wardId;
    private String phoneNumber;
    private String stateOfOrigin;
    private String dateOfBirth; 
    private GenderEnum gender;
    private MaritalStatusEnum maritalStatus;
    private UtilityBillEnum utilityBillType;
    @Nullable
    private MultipartFile utilityBillPicture;

}
