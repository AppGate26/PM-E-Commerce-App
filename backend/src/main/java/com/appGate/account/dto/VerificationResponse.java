package com.appGate.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationResponse {
    private boolean success;
    private String message;
    private String verificationType; // BVN or NIN
    private PersonData data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonData {
        private String bvn;
        private String nin;
        private String firstName;
        private String middleName;
        private String lastName;
        private String fullName;
        private String dateOfBirth;
        private String phoneNumber;
        private String phoneNumber2;
        private String email;
        private String gender;
        private String address;
        private String state;
        private String stateOfOrigin;
        private String lga;
        private String lgaOfOrigin;
        private String nationality;
        private String image;
        private String enrollmentBank;
        private String enrollmentBranch;
        private String registrationDate;
        private String maritalStatus;
        private String watchListed;
    }
}
