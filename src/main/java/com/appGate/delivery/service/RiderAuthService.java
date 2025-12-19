package com.appGate.delivery.service;

import com.appGate.delivery.dto.RiderChangePasswordDto;
import com.appGate.delivery.dto.RiderForgotPasswordDto;
import com.appGate.delivery.dto.RiderLoginDto;
import com.appGate.delivery.models.Rider;
import com.appGate.delivery.repository.RiderRepository;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.email.dto.EmailDto;
import com.appGate.email.services.EmailService;
import com.appGate.rbac.dto.ResetPasswordDto;
import com.appGate.rbac.models.User;

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
import java.util.Optional;
import java.util.Random;

@Service
public class RiderAuthService {

    private final RiderRepository riderRepository;
    private final PasswordEncoder passwordEncoder;
    private final String jwtSecret;
    private final int jwtExpirationMs;
    private final EmailService emailService;

    public RiderAuthService(
            RiderRepository riderRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${app.jwtSecret}") String jwtSecret,
            @Value("${app.jwtExpirationMs}") int jwtExpirationMs) {
        this.riderRepository = riderRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtSecret = jwtSecret;
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public BaseResponse login(RiderLoginDto loginDto) {
        Rider rider = riderRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (rider.getSuspended()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account has been suspended: " + rider.getReasonForSuspension());
        }

        if (rider.getPassword() == null || !passwordEncoder.matches(loginDto.getPassword(), rider.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = generateRiderToken(rider);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("riderId", rider.getRiderId());
        response.put("email", rider.getEmail());
        response.put("fullName", rider.getSurName() + " " + rider.getOtherName());

        return new BaseResponse(HttpStatus.OK.value(), "Login successful", response);
    }

    public BaseResponse changePassword(Long riderId, RiderChangePasswordDto dto) {
        Rider rider = riderRepository.findById(riderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider not found"));

        if (!passwordEncoder.matches(dto.getOldPassword(), rider.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Old password is incorrect");
        }

        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }

        rider.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        riderRepository.save(rider);

        return new BaseResponse(HttpStatus.OK.value(), "Password changed successfully", null);
    }

    public BaseResponse forgotPassword(RiderForgotPasswordDto dto) {
        Rider rider = riderRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No rider found with this email"));

            Random random = new Random();
            int otp = 100000 + random.nextInt(900000);

            rider.setResetOtp(String.valueOf(otp));
            riderRepository.save(rider);

                        // Send password reset email
            EmailDto emailDto = new EmailDto();
            emailDto.setRecipient(rider.getEmail().toLowerCase());
            emailDto.setSubject("Password Reset Request - PomStores");
            emailDto.setContent(buildPasswordResetEmailContent(rider.getOtherName(), otp));

            // Send email asynchronously to avoid blocking the response
            try {
                emailService.sendEmail(emailDto);
            } catch (Exception e) {
                // Log the error but don't fail the password reset process
                System.err.println("Failed to send password reset email to " + rider.getEmail() + ": " + e.getMessage());
            } 

        return new BaseResponse(HttpStatus.OK.value(),
                "Password reset instructions have been sent to your email", null);
    }

    public BaseResponse resetPassword(ResetPasswordDto resetPasswordDto) {
        Optional<Rider> rider = riderRepository.findByEmail(resetPasswordDto.getEmail().toLowerCase());

        System.out.println("Reset Password Request for email: " + resetPasswordDto.getEmail());

        if (rider.isPresent()) {
            if (rider.get().getResetOtp().equals(resetPasswordDto.getResetOtp())) {
                rider.get().setPassword(passwordEncoder.encode(resetPasswordDto.getPassword()));
                riderRepository.save(rider.get());
                return new BaseResponse(HttpStatus.OK.value(), "successful", "Password reset successful");
            } else {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "Invalid OTP");
            }
        }

        return new BaseResponse(HttpStatus.FORBIDDEN.value(), "failure", "User does not exist");
    }

    private String generateRiderToken(Rider rider) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_16));

        return Jwts.builder()
                .setSubject(rider.getEmail())
                .setIssuedAt(new Date())
                .claim("riderId", rider.getRiderId())
                .claim("email", rider.getEmail())
                .claim("fullName", rider.getSurName() + " " + rider.getOtherName())
                .claim("type", "RIDER")
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
