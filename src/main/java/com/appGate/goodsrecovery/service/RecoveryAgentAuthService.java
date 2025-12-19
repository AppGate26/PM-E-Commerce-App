package com.appGate.goodsrecovery.service;

import com.appGate.goodsrecovery.dto.RecoveryAgentLoginDto;
import com.appGate.goodsrecovery.models.RecoveryAgent;
import com.appGate.goodsrecovery.repository.RecoveryAgentRepository;
import com.appGate.goodsrecovery.response.BaseResponse;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class RecoveryAgentAuthService {

    private final RecoveryAgentRepository recoveryAgentRepository;
    private final PasswordEncoder passwordEncoder;
    private final String jwtSecret;
    private final int jwtExpirationMs;

    public RecoveryAgentAuthService(
            RecoveryAgentRepository recoveryAgentRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.jwtSecret}") String jwtSecret,
            @Value("${app.jwtExpirationMs}") int jwtExpirationMs) {
        this.recoveryAgentRepository = recoveryAgentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtSecret = jwtSecret;
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public BaseResponse login(RecoveryAgentLoginDto loginDto) {
        RecoveryAgent agent = recoveryAgentRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (agent.getSuspended()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account has been suspended: " + agent.getReasonForSuspension());
        }

        if (!agent.getIsActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is not active");
        }

        if (agent.getPassword() == null || !passwordEncoder.matches(loginDto.getPassword(), agent.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = generateRecoveryAgentToken(agent);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("agentId", agent.getId());
        response.put("email", agent.getEmail());
        response.put("fullName", agent.getFirstName() + " " + agent.getLastName());

        return new BaseResponse(HttpStatus.OK.value(), "Login successful", response);
    }

    private String generateRecoveryAgentToken(RecoveryAgent agent) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_16));

        return Jwts.builder()
                .setSubject(agent.getEmail())
                .setIssuedAt(new Date())
                .claim("agentId", agent.getId())
                .claim("email", agent.getEmail())
                .claim("fullName", agent.getFirstName() + " " + agent.getLastName())
                .claim("type", "RECOVERY_AGENT")
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key)
                .compact();
    }
}
