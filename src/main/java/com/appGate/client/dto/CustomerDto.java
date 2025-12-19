package com.appGate.client.dto;

import jakarta.annotation.Nullable;
import org.springframework.web.multipart.MultipartFile;

import com.appGate.client.enums.GenderEnum;
import lombok.Data;

@Data
public class CustomerDto {

    private String accountNumber;
    private String email;
    private String surname ;
    private String firstName;
    private String dob;
    private String phoneNumber;
    private String occupation;
    private String nationality;
    private String nin;
    private String bvn;
    private String contactAddress;
    private Long contactStateId;
    private Long contactLgaId;
    private Long contactWardId;
    private String officeAddress;
    private Long officeStateId;
    private Long officeLgaId;
    private Long officeWardId;
    private String nextOfKin;
    private String nextOfKinAddress;
    private Long nextOfKinStateId;
    private Long nextOfKinLgaId;
    private Long nextOfKinWardId;
    @Nullable
    private MultipartFile passport;
    @Nullable
    private MultipartFile signature;
    private GenderEnum gender;
}
