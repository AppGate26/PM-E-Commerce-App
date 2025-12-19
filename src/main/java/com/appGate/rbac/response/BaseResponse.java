package com.appGate.rbac.response;

import org.springframework.http.HttpStatus;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class BaseResponse {
    private Integer status;
    private String message;
    private Object response;
}
