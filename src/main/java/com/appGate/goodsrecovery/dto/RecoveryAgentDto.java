package com.appGate.goodsrecovery.dto;



import org.springframework.web.multipart.MultipartFile;

import com.appGate.delivery.enums.GenderEnum;

import jakarta.annotation.Nullable;
import lombok.Data;

@Data
public class RecoveryAgentDto {
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String contactAddress;
    private String officeAddress;
    private String dob;
    private String nationality;
    private String nin;
    private String bvn;
    private String nextOfKin;
    private String nextOfKinAddress;
    private String password;
    private GenderEnum gender;
    @Nullable
    private MultipartFile passport;
    @Nullable
    private MultipartFile licences;
    @Nullable
    private MultipartFile signature;
}
