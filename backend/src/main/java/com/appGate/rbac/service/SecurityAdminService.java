package com.appGate.rbac.service;

import com.appGate.email.dto.EmailDto;
import com.appGate.email.services.EmailService;
import com.appGate.rbac.dto.*;
import com.appGate.rbac.enums.PermissionEnum;
import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.enums.UserStatusEnum;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.models.DatabaseBackup;
import com.appGate.rbac.models.User;
import com.appGate.rbac.models.UserLogTrail;
import com.appGate.rbac.models.UserSecurityQuestion;
import com.appGate.rbac.repository.BranchRepository;
import com.appGate.rbac.repository.DatabaseBackupRepository;
import com.appGate.rbac.repository.UserLogTrailRepository;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.repository.UserSecurityQuestionRepository;
import com.appGate.rbac.response.BaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SecurityAdminService {

    private final UserRepository userRepository;
    private final UserLogTrailRepository userLogTrailRepository;
    private final UserSecurityQuestionRepository userSecurityQuestionRepository;
    private final DatabaseBackupRepository databaseBackupRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final BranchRepository branchRepository;

    public SecurityAdminService(UserRepository userRepository,
                                UserLogTrailRepository userLogTrailRepository,
                                UserSecurityQuestionRepository userSecurityQuestionRepository,
                                DatabaseBackupRepository databaseBackupRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService,
                                BranchRepository branchRepository) {
        this.userRepository = userRepository;
        this.userLogTrailRepository = userLogTrailRepository;
        this.userSecurityQuestionRepository = userSecurityQuestionRepository;
        this.databaseBackupRepository = databaseBackupRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.branchRepository = branchRepository;
    }

    // ==================== VIEW USERS ====================

    public BaseResponse getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findAllByOrderByCreatedAtDesc(pageable);
        return new BaseResponse(HttpStatus.OK.value(), "successful", users);
    }

    public BaseResponse getUsersByRole(RoleEnum role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findByRole(role, pageable);
        return new BaseResponse(HttpStatus.OK.value(), "successful", users);
    }

    public BaseResponse getUsersByStatus(UserStatusEnum status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findByStatus(status, pageable);
        return new BaseResponse(HttpStatus.OK.value(), "successful", users);
    }

    public BaseResponse getUserByEmail(String email) {
        Optional<User> user = userRepository.findByEmail(email.toLowerCase());
        if (user.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }
        return new BaseResponse(HttpStatus.OK.value(), "successful", user.get());
    }

    // ==================== CREATE/MODIFY USER ====================

    public BaseResponse createUser(CreateUserDto dto) {
        // Creating a privileged manager role (BRANCH_MANAGER / WAREHOUSE_MANAGER)
        // requires an ADMIN or SUPER_ADMIN to be signed in.
        if (dto.getRole() == RoleEnum.BRANCH_MANAGER || dto.getRole() == RoleEnum.WAREHOUSE_MANAGER) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN")
                            || a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                return new BaseResponse(HttpStatus.FORBIDDEN.value(), "failure",
                        "Only an ADMIN or SUPER_ADMIN can create a manager user");
            }
        }

        // Check if user already exists
        Optional<User> existingUser = userRepository.findByEmail(dto.getEmail().toLowerCase());
        if (existingUser.isPresent()) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "User with this email already exists");
        }

        // Validate password match
        if (dto.getVerifyPassword() != null && !dto.getPassword().equals(dto.getVerifyPassword())) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "Passwords do not match");
        }

        User user = new User();
        user.setEmail(dto.getEmail().toLowerCase());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(dto.getRole());
        user.setDepartment(dto.getDepartment());
        user.setUserCode(dto.getUserCode());
        user.setStatus(UserStatusEnum.ACTIVE);

        // Assign branch: required for all roles except SUPER_ADMIN
        if (dto.getBranchId() != null) {
            Branch branch = branchRepository.findById(dto.getBranchId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
            user.setBranch(branch);
        } else if (dto.getRole() != RoleEnum.SUPER_ADMIN) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure",
                    "Branch is required for non-SUPER_ADMIN users");
        }

        User savedUser = userRepository.save(user);

        // Save security question if provided
        if (dto.getSecurityQuestion() != null && dto.getSecurityAnswer() != null) {
            UserSecurityQuestion securityQuestion = new UserSecurityQuestion();
            securityQuestion.setUserId(savedUser.getId());
            securityQuestion.setQuestion(dto.getSecurityQuestion());
            securityQuestion.setAnswer(dto.getSecurityAnswer());
            userSecurityQuestionRepository.save(securityQuestion);
        }

        return new BaseResponse(HttpStatus.CREATED.value(), "successful", savedUser);
    }

    public BaseResponse modifyUser(Long userId, CreateUserDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (dto.getRole() != null) {
            user.setRole(dto.getRole());
        }
        // Update the password when the admin supplies a new one. Previously the
        // modify flow silently ignored the password field, so an admin who tried
        // to reset a (branch) user's password changed nothing and the user was
        // locked out with a password they believed had been updated.
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            if (dto.getVerifyPassword() != null
                    && !dto.getVerifyPassword().isBlank()
                    && !dto.getPassword().equals(dto.getVerifyPassword())) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "Passwords do not match");
            }
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getDepartment() != null) {
            user.setDepartment(dto.getDepartment());
        }
        if (dto.getUserCode() != null) {
            user.setUserCode(dto.getUserCode());
        }
        if (dto.getBranchId() != null) {
            Branch branch = branchRepository.findById(dto.getBranchId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
            user.setBranch(branch);
        }

        userRepository.save(user);

        // Update security question if provided
        if (dto.getSecurityQuestion() != null && dto.getSecurityAnswer() != null) {
            UserSecurityQuestion securityQuestion = userSecurityQuestionRepository.findByUserId(userId)
                    .orElse(new UserSecurityQuestion());
            securityQuestion.setUserId(userId);
            securityQuestion.setQuestion(dto.getSecurityQuestion());
            securityQuestion.setAnswer(dto.getSecurityAnswer());
            userSecurityQuestionRepository.save(securityQuestion);
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", user);
    }

    // ==================== ACTIVATE/DEACTIVATE USER ====================

    public BaseResponse activateDeactivateUser(ActivateDeactivateUserDto dto) {
        Optional<User> userOptional = userRepository.findByEmail(dto.getEmail().toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();
        user.setStatus(dto.getStatus());
        userRepository.save(user);

        // Send warning email if provided
        if (dto.getWarningMessage() != null && !dto.getWarningMessage().isEmpty()) {
            EmailDto emailDto = new EmailDto();
            emailDto.setRecipient(user.getEmail());
            emailDto.setSubject("Account Status Update - PomStores");
            emailDto.setContent(buildStatusUpdateEmailContent(user.getFirstName(), dto.getStatus(), dto.getWarningMessage()));

            try {
                emailService.sendEmail(emailDto);
            } catch (Exception e) {
                System.err.println("Failed to send status update email: " + e.getMessage());
            }
        }

        String message = dto.getStatus() == UserStatusEnum.ACTIVE ? "User activated successfully" : "User deactivated successfully";
        return new BaseResponse(HttpStatus.OK.value(), "successful", message);
    }

    public BaseResponse sendWarning(String email, String warningMessage) {
        Optional<User> userOptional = userRepository.findByEmail(email.toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();

        EmailDto emailDto = new EmailDto();
        emailDto.setRecipient(user.getEmail());
        emailDto.setSubject("Warning Notice - PomStores");
        emailDto.setContent(buildWarningEmailContent(user.getFirstName(), warningMessage));

        try {
            emailService.sendEmail(emailDto);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "failure", "Failed to send warning email");
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Warning sent successfully");
    }

    // ==================== CHANGE USER PASSWORD ====================

    public BaseResponse adminChangePassword(AdminChangePasswordDto dto) {
        Optional<User> userOptional = userRepository.findByEmail(dto.getEmail().toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();

        // Verify current password
        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "Current password is incorrect");
        }

        // Validate new passwords match
        if (!dto.getNewPassword().equals(dto.getVerifyNewPassword())) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "New passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));

        if (dto.getUserCode() != null) {
            user.setUserCode(dto.getUserCode());
        }
        if (dto.getUserRole() != null) {
            user.setRole(dto.getUserRole());
        }

        userRepository.save(user);

        // Update security question if provided
        if (dto.getSecurityQuestion() != null && dto.getSecurityAnswer() != null) {
            UserSecurityQuestion securityQuestion = userSecurityQuestionRepository.findByUserId(user.getId())
                    .orElse(new UserSecurityQuestion());
            securityQuestion.setUserId(user.getId());
            securityQuestion.setQuestion(dto.getSecurityQuestion());
            securityQuestion.setAnswer(dto.getSecurityAnswer());
            userSecurityQuestionRepository.save(securityQuestion);
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Password changed successfully");
    }

    // ==================== MERGE USER ROLE ====================

    public BaseResponse mergeUserRole(MergeUserRoleDto dto) {
        Optional<User> userOptional = userRepository.findByEmail(dto.getEmail().toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();

        // Since User model has single role, we update it with the new role
        // For multiple roles, you would need a separate user_roles table
        if (dto.getAttachRoles() != null && !dto.getAttachRoles().isEmpty()) {
            // Set the primary (first) role
            user.setRole(dto.getAttachRoles().get(0));
        }

        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("user", user);
        result.put("currentRole", user.getRole());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    public BaseResponse getUserRoleInfo(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email.toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();

        Map<String, Object> result = new HashMap<>();
        result.put("email", user.getEmail());
        result.put("currentRole", user.getRole());
        result.put("availableRoles", RoleEnum.values());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    // ==================== USER LOG TRAILS ====================

    public BaseResponse getUserLogTrails(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserLogTrail> logTrails = userLogTrailRepository.findAllByOrderByDateDescTimeInDesc(pageable);
        return new BaseResponse(HttpStatus.OK.value(), "successful", logTrails);
    }

    public BaseResponse getUserLogTrailsByUserId(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserLogTrail> logTrails = userLogTrailRepository.findByUserId(userId, pageable);
        return new BaseResponse(HttpStatus.OK.value(), "successful", logTrails);
    }

    public BaseResponse getActiveSessions() {
        List<UserLogTrail> activeSessions = userLogTrailRepository.findBySessionActiveTrueOrderByDateDescTimeInDesc();
        return new BaseResponse(HttpStatus.OK.value(), "successful", activeSessions);
    }

    @Transactional
    public BaseResponse forceLogout(ForceLogoutDto dto) {
        if (dto.getLogoutAll() && dto.getUserId() != null) {
            userLogTrailRepository.forceLogoutAllSessions(dto.getUserId());
            return new BaseResponse(HttpStatus.OK.value(), "successful", "All sessions logged out successfully");
        }

        if (dto.getLogTrailIds() != null && !dto.getLogTrailIds().isEmpty()) {
            for (Long logId : dto.getLogTrailIds()) {
                userLogTrailRepository.forceLogout(logId);
            }
            return new BaseResponse(HttpStatus.OK.value(), "successful", "Selected sessions logged out successfully");
        }

        return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure", "No sessions specified for logout");
    }

    // ==================== DATABASE BACKUP ====================

    public BaseResponse performBackup(DatabaseBackupDto dto, Long performedBy) {
        User user = userRepository.findById(performedBy)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        DatabaseBackup backup = new DatabaseBackup();
        backup.setDatabaseVersion(dto.getDatabaseVersion());
        backup.setBackupLocation(dto.getBackupLocation());
        backup.setBackupFileName(dto.getBackupFileName());
        backup.setFileNamingType(dto.getFileNamingType());
        backup.setStatus("IN_PROGRESS");
        backup.setStartedAt(LocalDateTime.now());
        backup.setPerformedBy(user);

        databaseBackupRepository.save(backup);

        // Simulate backup process (in real scenario, this would trigger actual backup)
        try {
            // Here you would implement actual backup logic
            // For now, we'll just mark it as completed
            backup.setStatus("COMPLETED");
            backup.setCompletedAt(LocalDateTime.now());
            databaseBackupRepository.save(backup);

            return new BaseResponse(HttpStatus.OK.value(), "successful", "Database backup completed successfully");
        } catch (Exception e) {
            backup.setStatus("FAILED");
            backup.setErrorMessage(e.getMessage());
            backup.setCompletedAt(LocalDateTime.now());
            databaseBackupRepository.save(backup);

            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "failure", "Backup failed: " + e.getMessage());
        }
    }

    public BaseResponse getBackupHistory() {
        List<DatabaseBackup> backups = databaseBackupRepository.findAllByOrderByCreatedAtDesc();
        return new BaseResponse(HttpStatus.OK.value(), "successful", backups);
    }

    // ==================== SECURITY QUESTIONS ====================

    public BaseResponse getSecurityQuestions() {
        List<String> questions = List.of(
                "What is your mother's maiden name?",
                "What was the name of your first pet?",
                "What city were you born in?",
                "What is your favorite movie?",
                "What was your childhood nickname?",
                "What is the name of your favorite childhood friend?",
                "What school did you attend for sixth grade?",
                "What was the make of your first car?"
        );
        return new BaseResponse(HttpStatus.OK.value(), "successful", questions);
    }

    public BaseResponse getUserCodes() {
        // Returns available user codes (can be customized based on business needs)
        List<String> userCodes = List.of(
                "UC001", "UC002", "UC003", "UC004", "UC005",
                "UC006", "UC007", "UC008", "UC009", "UC010"
        );
        return new BaseResponse(HttpStatus.OK.value(), "successful", userCodes);
    }

    public BaseResponse getRoles() {
        return new BaseResponse(HttpStatus.OK.value(), "successful", RoleEnum.values());
    }

    // ==================== USER PERMISSIONS ====================

    public BaseResponse assignPermissions(AssignPermissionsDto dto) {
        Optional<User> userOptional = userRepository.findByEmail(dto.getEmail().toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();
        user.setPermissions(dto.getPermissions());
        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("email", user.getEmail());
        result.put("role", user.getRole());
        result.put("permissions", user.getPermissions());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    public BaseResponse getUserPermissions(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email.toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();

        Map<String, Object> result = new HashMap<>();
        result.put("email", user.getEmail());
        result.put("role", user.getRole());
        result.put("permissions", user.getPermissions());
        result.put("deniedFeatures", user.getDeniedFeatures());
        result.put("availablePermissions", PermissionEnum.values());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    public BaseResponse getAvailablePermissions() {
        return new BaseResponse(HttpStatus.OK.value(), "successful", PermissionEnum.values());
    }

    // ==================== USER DENIED FEATURES (SUB-MODULE ACCESS) ====================

    public BaseResponse assignDeniedFeatures(AssignDeniedFeaturesDto dto) {
        Optional<User> userOptional = userRepository.findByEmail(dto.getEmail().toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();
        user.setDeniedFeatures(dto.getDeniedFeatures() == null ? new java.util.HashSet<>() : dto.getDeniedFeatures());
        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("email", user.getEmail());
        result.put("deniedFeatures", user.getDeniedFeatures());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    public BaseResponse getDeniedFeatures(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email.toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }

        User user = userOptional.get();
        Map<String, Object> result = new HashMap<>();
        result.put("email", user.getEmail());
        result.put("deniedFeatures", user.getDeniedFeatures());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    // ==================== EMAIL TEMPLATES ====================

    private String buildStatusUpdateEmailContent(String firstName, UserStatusEnum status, String message) {
        String statusText = status == UserStatusEnum.ACTIVE ? "activated" : "deactivated";
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2>Account Status Update</h2>
                        <p>Hello %s,</p>
                        <p>Your account has been <strong>%s</strong>.</p>
                        %s
                        <p>If you have any questions, please contact our support team.</p>
                        <p>Best regards,<br>The PomStores Team</p>
                    </div>
                </body>
                </html>
                """, firstName != null ? firstName : "User", statusText,
                message != null ? "<p><strong>Message:</strong> " + message + "</p>" : "");
    }

    private String buildWarningEmailContent(String firstName, String warningMessage) {
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #f44336;">Warning Notice</h2>
                        <p>Hello %s,</p>
                        <p>This is an official warning regarding your account:</p>
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0;">%s</p>
                        </div>
                        <p>Please take necessary action to avoid further consequences.</p>
                        <p>Best regards,<br>The PomStores Admin Team</p>
                    </div>
                </body>
                </html>
                """, firstName != null ? firstName : "User", warningMessage);
    }
}
