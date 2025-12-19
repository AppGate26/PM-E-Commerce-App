package com.appGate.orderingsales.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class BaseResponse {
    private Integer status;
    private String message;
    private Object response;
}
