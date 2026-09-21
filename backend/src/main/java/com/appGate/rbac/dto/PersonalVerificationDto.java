package com.appGate.rbac.dto;

import lombok.Data;

@Data
public class PersonalVerificationDto {
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String dateOfBirth;
    private String homeAddress;
    private String city;
    private String stateOfOrigin;
}
