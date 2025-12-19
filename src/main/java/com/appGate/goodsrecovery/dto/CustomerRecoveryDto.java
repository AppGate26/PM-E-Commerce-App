package com.appGate.goodsrecovery.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class CustomerRecoveryDto {
    private Long customerId;
    private Map<String, Object> customerInfo;
    private Map<String, Object> guarantorInfo;
    private List<RecoveryItemDto> itemsToRecover;
}
