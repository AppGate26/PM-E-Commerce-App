package com.appGate.account.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DojahApiResponse {
    private Entity entity;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Entity {
        private String bvn;
        private String nin;

        @JsonProperty("first_name")
        private String firstName;

        @JsonProperty("middle_name")
        private String middleName;

        @JsonProperty("last_name")
        private String lastName;

        @JsonProperty("date_of_birth")
        private String dateOfBirth;

        @JsonProperty("phone_number")
        private String phoneNumber;

        @JsonProperty("phone_number2")
        private String phoneNumber2;

        private String email;
        private String gender;
        private String image;

        @JsonProperty("residential_address")
        private String residentialAddress;

        private String state;

        @JsonProperty("state_of_origin")
        private String stateOfOrigin;

        private String lga;

        @JsonProperty("lga_of_origin")
        private String lgaOfOrigin;

        private String nationality;

        @JsonProperty("enrollment_bank")
        private String enrollmentBank;

        @JsonProperty("enrollment_branch")
        private String enrollmentBranch;

        @JsonProperty("watch_listed")
        private String watchListed;

        @JsonProperty("registration_date")
        private String registrationDate;

        @JsonProperty("level_of_account")
        private String levelOfAccount;

        @JsonProperty("marital_status")
        private String maritalStatus;
    }
}
