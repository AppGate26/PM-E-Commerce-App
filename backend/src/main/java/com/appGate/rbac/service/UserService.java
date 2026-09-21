package com.appGate.rbac.service;

import com.appGate.account.service.WalletService;
import com.appGate.email.dto.EmailDto;
import com.appGate.email.services.EmailService;
import com.appGate.rbac.dto.UserDto;
import com.appGate.rbac.dto.ForgetPasswordDto;
import com.appGate.rbac.dto.ResetPasswordDto;
import com.appGate.rbac.dto.UpdateUserDto;
import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.models.User;
import com.appGate.rbac.models.State;
import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.Ward;
import com.appGate.rbac.models.UserLogTrail;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.repository.StateRepository;
import com.appGate.rbac.repository.LGARepository;
import com.appGate.rbac.repository.WardRepository;
import com.appGate.rbac.repository.UserLogTrailRepository;
import com.appGate.rbac.request.LoginRequest;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.response.SignInResponse;
import com.appGate.rbac.util.JwtUtils;
import com.appGate.account.service.WalletService;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.Random;

@Service
public class UserService {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final WalletService walletService;
    private final StateRepository stateRepository;
    private final LGARepository lgaRepository;
    private final WardRepository wardRepository;
    private final UserLogTrailRepository userLogTrailRepository;


    public UserService(JwtUtils jwtUtils, UserRepository userRepository, PasswordEncoder passwordEncoder,
            EmailService emailService, WalletService walletService, StateRepository stateRepository,
            LGARepository lgaRepository, WardRepository wardRepository,
            UserLogTrailRepository userLogTrailRepository) {
        this.emailService = emailService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.walletService = walletService;
        this.stateRepository = stateRepository;
        this.lgaRepository = lgaRepository;
        this.wardRepository = wardRepository;
        this.userLogTrailRepository = userLogTrailRepository;
    }

    public String generateTokenFromEmail(String email) {
        return jwtUtils.generateTokenFromEmail(email.toLowerCase());
    }

    public String generateRefreshTokenFromEmail(String email) {
        return jwtUtils.generateJwtRefreshToken(email.toLowerCase());
    }

    public BaseResponse signUp(UserDto userDto) {

        Optional<User> existingUser = userRepository.findByEmail(userDto.getEmail().toLowerCase());

        if (existingUser.isPresent()) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "email already taken");
        }

        Optional<User> existingPhoneNumber = userRepository.findByPhoneNumber(userDto.getPhoneNumber());

        if (existingPhoneNumber.isPresent()) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "phone number already taken");
        }

        User user = new User();
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        user.setEmail(userDto.getEmail().toLowerCase());
        user.setPhoneNumber(userDto.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(userDto.getPassword())); // Encrypt the password
        user.setRole(RoleEnum.USER);

        // Save the user to the database
        User newUser = userRepository.save(user);

        walletService.createWallet(newUser.getId());

        // Send welcome email to new user
        EmailDto welcomeEmail = new EmailDto();
        welcomeEmail.setRecipient(user.getEmail());
        welcomeEmail.setSubject("Welcome to PomStores - Account Created Successfully");
        welcomeEmail.setContent(buildWelcomeEmailContent(user.getFirstName()));

        try {
            emailService.sendEmail(welcomeEmail);
        } catch (Exception e) {
            // Log the error but don't fail the sign-up process
            System.err.println("Failed to send welcome email to " + user.getEmail() + ": " + e.getMessage());
        }

        return new BaseResponse(HttpStatus.CREATED.value(), "successful", user);
    }

    public BaseResponse signIn(LoginRequest loginRequest) throws BadCredentialsException {
        return signIn(loginRequest, null, null);
    }

    public BaseResponse signIn(LoginRequest loginRequest, String ipAddress, String userAgent)
            throws BadCredentialsException {
        SignInResponse signInResponse = new SignInResponse();

        User user = userRepository.findByEmail(loginRequest.getEmail().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        // Verify the password
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "Invalid username or password");
        }

        // Record a LOGIN entry for the Users Log Trail audit (non-fatal).
        recordLoginTrail(user, ipAddress, userAgent);

        signInResponse.setStatus(true);
        signInResponse.setMessage("Login successful");
        signInResponse.setCode(200);
        signInResponse.setAccessToken(generateTokenFromEmail(loginRequest.getEmail().toLowerCase()));
        signInResponse.setExpiresIn(jwtUtils.getExpiringDateFromToken(generateTokenFromEmail(loginRequest.getEmail().toLowerCase())));
        signInResponse.setUserDetails(user);

        // Send welcome email
        EmailDto email = new EmailDto();
        email.setRecipient(loginRequest.getEmail().toLowerCase());
        email.setSubject("Sign in Successful - Welcome to PomStores");
        email.setContent(buildSignInEmailContent(user.getFirstName()));

        // Send email asynchronously to avoid blocking the response
        try {
            emailService.sendEmail(email);
        } catch (Exception e) {
            // Log the error but don't fail the sign-in process
            System.err.println("Failed to send sign-in email to " + loginRequest.getEmail() + ": " + e.getMessage());
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", signInResponse);
    }

    public BaseResponse forgetPassword(ForgetPasswordDto forgetPasswordDto) {
        Optional<User> user = userRepository.findByEmail(forgetPasswordDto.getEmail().toLowerCase());

        if (user.isPresent()) {

            Random random = new Random();
            int otp = 100000 + random.nextInt(900000);

            user.get().setResetOtp(String.valueOf(otp));
            userRepository.save(user.get());

            // Send password reset email
            EmailDto emailDto = new EmailDto();
            emailDto.setRecipient(forgetPasswordDto.getEmail().toLowerCase());
            emailDto.setSubject("Password Reset Request - PomStores");
            emailDto.setContent(buildPasswordResetEmailContent(user.get().getFirstName(), otp));

            // Send email asynchronously to avoid blocking the response
            try {
                emailService.sendEmail(emailDto);
            } catch (Exception e) {
                // Log the error but don't fail the password reset process
                System.err.println("Failed to send password reset email to " + forgetPasswordDto.getEmail() + ": " + e.getMessage());
            }
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", "If Email is correct, you will receive an email");
    }

    public BaseResponse resetPassword(ResetPasswordDto resetPasswordDto) {
        Optional<User> user = userRepository.findByEmail(resetPasswordDto.getEmail().toLowerCase());

        System.out.println("Reset Password Request for email: " + resetPasswordDto.getEmail());

        if (user.isPresent()) {
            if (user.get().getResetOtp().equals(resetPasswordDto.getResetOtp())) {
                user.get().setPassword(passwordEncoder.encode(resetPasswordDto.getPassword()));
                userRepository.save(user.get());
                return new BaseResponse(HttpStatus.OK.value(), "successful", "Password reset successful");
            } else {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "Invalid OTP");
            }
        }

        return new BaseResponse(HttpStatus.FORBIDDEN.value(), "failure", "User does not exist");
    }

    public BaseResponse signOut(String token) {
        try {
            // Extract "Bearer " prefix if present
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            // Close any open log-trail sessions for this user so the audit
            // shows the logout time. JWTs remain stateless otherwise.
            try {
                String email = jwtUtils.extractEmail(token);
                userRepository.findByEmail(email == null ? null : email.toLowerCase())
                        .ifPresent(user -> userLogTrailRepository.forceLogoutAllSessions(user.getId()));
            } catch (Exception e) {
                System.err.println("Failed to record logout trail: " + e.getMessage());
            }

            return new BaseResponse(HttpStatus.OK.value(), "successful", "Sign out successful");

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "failure", "Sign out failed: " + e.getMessage());
        }
    }

    /**
     * Records a LOGIN entry in the user log trail. Best-effort: a failure here
     * must never block sign-in.
     */
    private void recordLoginTrail(User user, String ipAddress, String userAgent) {
        try {
            UserLogTrail trail = new UserLogTrail();
            trail.setUserId(user.getId());
            trail.setDate(LocalDate.now());
            trail.setTimeIn(LocalTime.now());
            trail.setActivity("LOGIN");
            trail.setIpAddress(ipAddress);
            trail.setUserAgent(userAgent);
            trail.setSessionActive(true);
            userLogTrailRepository.save(trail);
        } catch (Exception e) {
            System.err.println("Failed to record login trail for " + user.getEmail() + ": " + e.getMessage());
        }
    }

    public BaseResponse updateProfile(Long userId, UpdateUserDto userDto) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        existingUser.setFirstName(userDto.getFirstName());
        existingUser.setLastName(userDto.getLastName());
        existingUser.setPhoneNumber(userDto.getPhoneNumber());

        // Update address if provided
        if (userDto.getAddress() != null) {
            existingUser.setAddress(userDto.getAddress());
        }

        // Update state if provided
        if (userDto.getStateId() != null) {
            State state = stateRepository.findById(userDto.getStateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "State not found"));
            existingUser.setState(state);
        }

        // Update LGA if provided
        if (userDto.getLgaId() != null) {
            LGA lga = lgaRepository.findById(userDto.getLgaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "LGA not found"));
            existingUser.setLga(lga);
        }

        // Update Ward if provided
        if (userDto.getWardId() != null) {
            Ward ward = wardRepository.findById(userDto.getWardId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ward not found"));
            existingUser.setWard(ward);
        }

        User savedUser = userRepository.save(existingUser);

        return new BaseResponse(HttpStatus.OK.value(), "successful", savedUser);
    }

    public BaseResponse getUserProfile(String email) {
        Optional<User> user = userRepository.findByEmail(email.toLowerCase());

        if (user.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", user.get());
    }

    public BaseResponse changePassword(String email, String currentPassword, String newPassword, String confirmPassword) {
        // Validate that new password and confirm password match
        if (!newPassword.equals(confirmPassword)) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "New password and confirm password do not match");
        }

        // Validate that new password is different from current password
        if (currentPassword.equals(newPassword)) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "New password must be different from current password");
        }

        // Find user by email
        Optional<User> userOptional = userRepository.findByEmail(email.toLowerCase());

        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Send password change notification email
        EmailDto emailDto = new EmailDto();
        emailDto.setRecipient(user.getEmail());
        emailDto.setSubject("Password Changed Successfully - PomStores");
        emailDto.setContent(buildPasswordChangedEmailContent(user.getFirstName()));

        try {
            emailService.sendEmail(emailDto);
        } catch (Exception e) {
            // Log the error but don't fail the password change process
            System.err.println("Failed to send password change notification to " + user.getEmail() + ": " + e.getMessage());
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Password changed successfully");
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    /**
     * Build HTML email content for new user welcome
     */
    private String buildWelcomeEmailContent(String firstName) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .feature-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
                        .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Welcome to PomStores!</h1>
                            <p style="font-size: 18px; margin-top: 10px;">Your account has been created successfully</p>
                        </div>
                        <div class="content">
                            <h2>Hello %s,</h2>
                            <p>Thank you for joining PomStores! We're excited to have you as part of our community.</p>

                            <p>Your account is now active and you can start exploring our wide range of products and services.</p>

                            <div class="feature-box">
                                <strong>✨ What you can do now:</strong>
                                <ul style="margin: 10px 0; padding-left: 20px;">
                                    <li>Browse our extensive product catalog</li>
                                    <li>Add items to your cart and wishlist</li>
                                    <li>Track your orders in real-time</li>
                                    <li>Manage your wallet and payments</li>
                                    <li>Leave reviews and ratings</li>
                                </ul>
                            </div>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="#" class="button">Start Shopping Now</a>
                            </div>

                            <p>If you have any questions or need assistance, our support team is always here to help.</p>

                            <div style="margin-top: 30px;">
                                <strong>Happy Shopping!</strong><br>
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
                """.formatted(firstName);
    }

    /**
     * Build HTML email content for sign-in notification
     */
    private String buildSignInEmailContent(String firstName) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome Back to PomStores!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello %s,</h2>
                            <p>You have successfully signed in to your PomStores account.</p>
                            <p>If this wasn't you, please reset your password immediately to secure your account.</p>
                            <p>Thank you for shopping with us!</p>
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
                """.formatted(firstName);
    }

    /**
     * Build HTML email content for password reset
     */
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

    /**
     * Build HTML email content for password change notification
     */
    private String buildPasswordChangedEmailContent(String firstName) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #56ab2f 0%%, #a8e063 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
                        .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Changed Successfully</h1>
                        </div>
                        <div class="content">
                            <div class="success-icon">✅</div>
                            <h2>Hello %s,</h2>
                            <p>Your password has been successfully changed for your PomStores account.</p>

                            <div class="info-box">
                                <strong>ℹ️ What happened?</strong>
                                <p style="margin: 10px 0;">Your account password was changed on your request. You can now use your new password to sign in to your account.</p>
                            </div>

                            <p><strong>If you did not make this change:</strong></p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Someone may have unauthorized access to your account</li>
                                <li>Please reset your password immediately</li>
                                <li>Contact our support team for assistance</li>
                            </ul>

                            <p>For your security, we recommend:</p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Use a strong, unique password</li>
                                <li>Don't share your password with anyone</li>
                                <li>Enable two-factor authentication if available</li>
                            </ul>

                            <div style="margin-top: 30px;">
                                <strong>Stay Safe!</strong><br>
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
                """.formatted(firstName);
    }
}
