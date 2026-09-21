package com.appGate.rbac.dto;

import lombok.Data;

import java.util.List;

@Data
public class ForceLogoutDto {
    private List<Long> logTrailIds;
    private Long userId;
    private Boolean logoutAll = false;
}
