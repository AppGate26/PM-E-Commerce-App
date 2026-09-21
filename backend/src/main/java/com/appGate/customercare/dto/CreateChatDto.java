package com.appGate.customercare.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateChatDto {
    private Long userId;         // the customer/user the chat is with (optional)
    private String userName;     // display name for the chat list
    private String message;      // optional first message to seed the conversation
    private String sender;       // CUSTOMER (default) or SUPPORT — who sent the first message
}
