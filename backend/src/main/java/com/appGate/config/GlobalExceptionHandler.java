package com.appGate.config;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import com.appGate.account.exception.VerificationException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("message", "Validation failed");
        response.put("response", errors);

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Object> handleResponseStatusException(ResponseStatusException ex) {
        Map<String, Object> response = new HashMap<>();
        // response.put("timestamp", LocalDateTime.now());
        response.put("status", ex.getStatusCode().value());
//        response.put("response", ex.getStatusCode().getReasonPhrase());
        response.put("response", ex.getStatusCode());
        response.put("message", ex.getReason());

        return new ResponseEntity<>(response, ex.getStatusCode());
    }

    @ExceptionHandler(VerificationException.class)
    public ResponseEntity<Object> handleVerificationException(VerificationException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("message", ex.getMessage());
        response.put("response", "Verification Failed");

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }


    /**
     * Branch scoping violations (see {@code BranchScopeService}) must reach the
     * client as a 403. Without this they would fall through to the catch-all
     * below and be reported as a 500, which reads like a server bug rather than
     * "you are not allowed to see this branch".
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.FORBIDDEN.value());
        response.put("message", ex.getMessage());
        response.put("response", "Forbidden");

        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    /**
     * A unique-key violation (e.g. duplicate phone number, email, or user code)
     * should read as a client error, not a server crash. Individual services
     * should already pre-check for duplicates, but this is the safety net for
     * races and any constraint not yet covered by an explicit check.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("message", describeDuplicateKey(ex));
        response.put("response", "Validation Failed");

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    private String describeDuplicateKey(DataIntegrityViolationException ex) {
        String rootMessage = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();

        if (rootMessage != null && rootMessage.toLowerCase().contains("duplicate entry")) {
            String field = "value";
            String lowerMessage = rootMessage.toLowerCase();
            if (lowerMessage.contains("phone_number")) {
                field = "phone number";
            } else if (lowerMessage.contains("email")) {
                field = "email";
            } else if (lowerMessage.contains("user_code")) {
                field = "user code";
            }
            return "This " + field + " is already registered";
        }

        return "A record with this value already exists";
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGenericException(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        // response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put("message", ex.getMessage());
        response.put("response", "Internal Server Error");

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
