package com.appGate.rbac.dto;

import com.appGate.rbac.util.validation.StrongPassword;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserDto {
    @NotNull(message = "Email is required")
    private String email;
    @NotNull(message = "Phone Number is required")
    private String phoneNumber;
    @NotNull(message = "Last Name is required")
    private String lastName;
    @NotNull(message = "First Name is required")
    private String firstName;
    @NotNull(message = "Password cannot be empty")
    @StrongPassword
    private String password;


    public String getEmail() {
        return email != null ? email.toLowerCase() : null;
    }
    
    public void setEmail(String email) {
        this.email = email.toLowerCase();
    }
}