package com.appGate.rbac.response;

import lombok.Data;

@Data
public class SignInResponse {
    private boolean status;
    private String message;
    private int code;

    private String accessToken;
    // private String refreshToken;
    private String expiresIn;
    private Object userDetails;
}
