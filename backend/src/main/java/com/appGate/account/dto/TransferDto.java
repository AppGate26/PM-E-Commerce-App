package com.appGate.account.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TransferDto {

    @NotNull(message = "From User ID is required")
    private Long fromUserId;

    @NotNull(message = "To User ID is required")
    private Long toUserId;

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be greater than 0")
    private Double amount;

    @NotBlank(message = "Sender name is required")
    private String senderName;

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    private String narration;
}
