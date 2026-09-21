package com.appGate.delivery.dto;

import com.appGate.delivery.enums.GenderEnum;
import com.appGate.delivery.enums.TransportModeEnum;
import jakarta.annotation.Nullable;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class RiderDto {
    private String surName;
    private String otherName;
    private String email;
    private String phoneNumber;
    private GenderEnum gender;
    private TransportModeEnum modeOfTransport;
    private String contactAddress;
    private String officeAddress;
    private String dob;
    private String nationality;
    private String nin;
    private String bvn;
    private String nextOfKin;
    private String nextOfKinAddress;
    @Nullable
    private MultipartFile passport;
    @Nullable
    private MultipartFile licences;
    @Nullable
    private MultipartFile signature;
}
