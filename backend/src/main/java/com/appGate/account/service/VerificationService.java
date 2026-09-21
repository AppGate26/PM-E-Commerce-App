package com.appGate.account.service;

import com.appGate.account.dto.VerificationResponse;

public interface VerificationService {
    VerificationResponse verifyBvn(String bvn);
    VerificationResponse verifyNin(String nin);
}
