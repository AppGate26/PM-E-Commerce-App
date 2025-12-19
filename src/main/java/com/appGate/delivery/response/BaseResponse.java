package com.appGate.delivery.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BaseResponse {
    private Integer status;
    private String message;
    private Object data;
}
