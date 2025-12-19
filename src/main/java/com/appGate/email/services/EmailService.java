package com.appGate.email.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.appGate.email.dto.EmailDto;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.List;
import java.util.Properties;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final String username;
    private final String password;
    private final int port;
    private final String host;

    public EmailService(
            @Value("${spring.mail.username}") String username,
            @Value("${spring.mail.password}") String password,
            @Value("${spring.mail.host}") String host,
            @Value("${spring.mail.port}") int port) {
        this.username = username;
        this.password = password;
        this.host = host;
        this.port = port;
    }

    private JavaMailSenderImpl createMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", host);
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        return mailSender;
    }

    public void sendEmail(EmailDto emailDto) throws IOException {

        JavaMailSenderImpl mailSender = createMailSender();

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(emailDto.getRecipient());
            helper.setSubject(emailDto.getSubject());
            helper.setText(emailDto.getContent(), true);
            helper.setFrom(username, "PomStores");

            // Add CC addresses if provided
            if (emailDto.getCcAddresses() != null && !emailDto.getCcAddresses().isEmpty()) {
                helper.setCc(emailDto.getCcAddresses().toArray(new String[0]));
            }

            // Add BCC addresses if provided
            if (emailDto.getBccAddresses() != null && !emailDto.getBccAddresses().isEmpty()) {
                helper.setBcc(emailDto.getBccAddresses().toArray(new String[0]));
            }

            mailSender.send(message);
            System.out.println("Email sent successfully to: " + emailDto.getRecipient());

        } catch (MessagingException e) {
            System.err.println("MessagingException while sending email to " + emailDto.getRecipient() + ": " + e.getMessage());
            throw new IOException("Failed to send email: " + e.getMessage(), e);
        } catch (IOException e) {
            System.err.println("IOException while sending email to " + emailDto.getRecipient() + ": " + e.getMessage());
            throw e;
        }
    }
}
