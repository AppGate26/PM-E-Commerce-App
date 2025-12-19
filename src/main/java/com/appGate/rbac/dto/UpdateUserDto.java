package com.appGate.rbac.dto;

import lombok.Data;

@Data
public class UpdateUserDto {
    private String firstName;
    private String lastName;
    private String address;
    private Long stateId;
    private Long lgaId;
    private Long wardId;
    private String phoneNumber;
}
