package com.appGate.goodsrecovery.service;

import com.appGate.goodsrecovery.dto.RecoveryAgentLoginDto;
import com.appGate.goodsrecovery.models.RecoveryAgent;
import com.appGate.goodsrecovery.repository.RecoveryAgentRepository;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.goodsrecovery.response.BaseResponse;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.appGate.email.services.EmailService;


import com.appGate.email.dto.EmailDto;
import com.appGate.goodsrecovery.dto.DeliveryChangePasswordDto;
import com.appGate.goodsrecovery.dto.ForgotPasswordDto;
import com.appGate.goodsrecovery.dto.ResetPasswordDto;


import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class RecoveryAgentAuthService {

    private final RecoveryAgentRepository recoveryAgentRepository;
    private final PasswordEncoder passwordEncoder;
    private final String jwtSecret;
    private final int jwtExpirationMs;
    private final EmailService emailService;
    private final UserRepository userRepository;

    public RecoveryAgentAuthService(
            RecoveryAgentRepository recoveryAgentRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${app.jwtSecret}") String jwtSecret,
            @Value("${app.jwtExpirationMs}") int jwtExpirationMs) {
        this.recoveryAgentRepository = recoveryAgentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtSecret = jwtSecret;
        this.jwtExpirationMs = jwtExpirationMs;
        this.emailService = emailService;
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
        User user = userRepository.findByEmail(agent.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email"));

        if (user.getPassword() == null || !passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
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

    public BaseResponse changePassword(Long agentId, DeliveryChangePasswordDto dto) {
        RecoveryAgent agent = recoveryAgentRepository.findById(agentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery agent not found"));

        User user = userRepository.findByEmail(agent.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email"));


        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Old password is incorrect");
        }

        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        return new BaseResponse(HttpStatus.OK.value(), "Password changed successfully", null);
    }

    public BaseResponse forgotPassword(ForgotPasswordDto dto) {
        RecoveryAgent agent = recoveryAgentRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery agent not found"));

        User user = userRepository.findByEmail(agent.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email"));

        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);

        user.setResetOtp(String.valueOf(otp));
        userRepository.save(user);

        EmailDto emailDto = new EmailDto();
        emailDto.setRecipient(agent.getEmail().toLowerCase());
        emailDto.setSubject("Password Reset Request - PomStores");
        emailDto.setContent(buildPasswordResetEmailContent(agent.getFirstName(), otp));

        // Send email asynchronously to avoid blocking the response
        try {
            emailService.sendEmail(emailDto);
        } catch (Exception e) {
            // Log the error but don't fail the password reset process
            System.err.println("Failed to send password reset email to " + agent.getEmail() + ": " + e.getMessage());
        } 

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Forgot password successful");
    }

    public BaseResponse resetPassword(ResetPasswordDto resetPasswordDto) {

        RecoveryAgent agent = recoveryAgentRepository.findByEmail(resetPasswordDto.getEmail().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery agent not found"));


        User user = userRepository.findByEmail(agent.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email"));

        if (user.getResetOtp() == null || !user.getResetOtp().equals(resetPasswordDto.getResetOtp())) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "Invalid OTP");
        }

        user.setPassword(passwordEncoder.encode(resetPasswordDto.getPassword()));
        userRepository.save(user);

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Password reset successful");
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

    
    private String buildPasswordResetEmailContent(String firstName, int otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #f093fb 0%%, #f5576c 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px dashed #f5576c; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 5px; }
                        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <h2>Hello %s,</h2>
                            <p>We received a request to reset your password for your PomStores account.</p>
                            <p>Use the following One-Time Password (OTP) to reset your password:</p>

                            <div class="otp-box">
                                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Your OTP Code</div>
                                <div class="otp-code">%d</div>
                                <div style="font-size: 12px; color: #666; margin-top: 10px;">Valid for 15 minutes</div>
                            </div>

                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong>
                                <ul style="margin: 10px 0; padding-left: 20px;">
                                    <li>Never share this OTP with anyone</li>
                                    <li>PomStores will never ask for your OTP</li>
                                    <li>If you didn't request this, please ignore this email</li>
                                </ul>
                            </div>

                            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

                            <div style="margin-top: 30px;">
                                <strong>The PomStores Team</strong>
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 PomStores. All rights reserved.</p>
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(firstName, otp);
    }
}
