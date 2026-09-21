package com.appGate.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Global exception handler for all modules
 * Catches validation errors and formats them in a consistent, frontend-friendly way
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle validation errors from @Valid annotation
     * Example: @NotBlank, @Email, @Min, @Max validations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        List<FieldError> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> FieldError.builder()
                        .field(error.getField())
                        .message(error.getDefaultMessage())
                        .code(getErrorCode(error.getCode()))
                        .rejectedValue(error.getRejectedValue())
                        .build())
                .collect(Collectors.toList());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Validation failed")
                .errors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * Handle binding errors (form data binding, enum conversion, type mismatch)
     * This is what catches the "Male" -> GenderEnum conversion errors
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(BindException ex) {
        List<FieldError> fieldErrors = new ArrayList<>();

        // Field errors (like enum conversion failures)
        ex.getFieldErrors().forEach(error -> {
            String message = error.getDefaultMessage();
            String field = error.getField();
            Object rejectedValue = error.getRejectedValue();

            // Check if it's an enum conversion error
            if (message != null && message.contains("Failed to convert")) {
                message = buildEnumErrorMessage(error);
            }

            fieldErrors.add(FieldError.builder()
                    .field(field)
                    .message(message)
                    .code("INVALID_VALUE")
                    .rejectedValue(rejectedValue)
                    .build());
        });

        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Validation failed")
                .errors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * Handle constraint violations (Bean Validation API)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        List<FieldError> fieldErrors = ex.getConstraintViolations()
                .stream()
                .map(violation -> {
                    String field = getFieldName(violation);
                    return FieldError.builder()
                            .field(field)
                            .message(violation.getMessage())
                            .code("CONSTRAINT_VIOLATION")
                            .rejectedValue(violation.getInvalidValue())
                            .build();
                })
                .collect(Collectors.toList());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Validation failed")
                .errors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * Handle JSON parsing errors (malformed JSON, wrong data types)
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        String message = "Invalid request format";

        // Try to extract more specific error info
        if (ex.getCause() != null) {
            String causeMessage = ex.getCause().getMessage();
            if (causeMessage != null) {
                if (causeMessage.contains("JSON parse error")) {
                    message = "Invalid JSON format";
                } else if (causeMessage.contains("Cannot deserialize")) {
                    message = "Invalid data type in request";
                }
            }
        }

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                message,
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * Handle ResponseStatusException (custom exceptions thrown in services)
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        ErrorResponse errorResponse = new ErrorResponse(
                ex.getStatusCode().value(),
                ex.getReason() != null ? ex.getReason() : "An error occurred",
                null
        );

        return ResponseEntity.status(ex.getStatusCode()).body(errorResponse);
    }

    /**
     * Handle all other unhandled exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex) {
        ex.printStackTrace(); // Log the error for debugging

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred",
                null
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    /**
     * Build user-friendly enum error message
     */
    private String buildEnumErrorMessage(org.springframework.validation.FieldError error) {
        String message = error.getDefaultMessage();
        String field = error.getField();

        // Try to extract enum class name
        try {
            // Look for enum class in the error message
            if (message.contains("GenderEnum")) {
                return "Invalid gender. Use: MALE or FEMALE";
            } else if (message.contains("MaritalStatusEnum")) {
                return "Invalid marital status. Use: SINGLE, MARRIED, DIVORCED, or WIDOWED";
            } else if (message.contains("UtilityBillEnum")) {
                return "Invalid utility bill type. Use: LAWMA, NEPA, WATER, or BANK_STATEMENT";
            } else if (message.contains("PaymentStatus")) {
                return "Invalid payment status";
            } else if (message.contains("TransactionStatus")) {
                return "Invalid transaction status";
            } else if (message.contains("Enum")) {
                // Generic enum error
                return "Invalid value for " + field + ". Please use a valid option";
            }
        } catch (Exception e) {
            // Fallback
        }

        return "Invalid value for " + field;
    }

    /**
     * Convert validation error code to friendly error code
     */
    private String getErrorCode(String validationCode) {
        if (validationCode == null) return "VALIDATION_ERROR";

        switch (validationCode) {
            case "NotNull":
            case "NotBlank":
            case "NotEmpty":
                return "REQUIRED_FIELD";
            case "Email":
                return "INVALID_EMAIL";
            case "Min":
                return "VALUE_TOO_SMALL";
            case "Max":
                return "VALUE_TOO_LARGE";
            case "Size":
                return "INVALID_LENGTH";
            case "Pattern":
                return "INVALID_FORMAT";
            default:
                return "VALIDATION_ERROR";
        }
    }

    /**
     * Extract field name from constraint violation path
     */
    private String getFieldName(ConstraintViolation<?> violation) {
        String path = violation.getPropertyPath().toString();
        String[] parts = path.split("\\.");
        return parts[parts.length - 1];
    }
}
