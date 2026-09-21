package com.appGate.email.controller;

import java.io.IOException;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.appGate.email.dto.EmailDto;
import com.appGate.email.services.EmailService;

@RestController
@RequestMapping(path = "/api/users")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/send-email")
    public void sendEmail(@RequestBody EmailDto emailDto) throws IOException {
        emailService.sendEmail(emailDto);
    }

}
