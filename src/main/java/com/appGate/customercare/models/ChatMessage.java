package com.appGate.customercare.models;

import com.appGate.customercare.enums.MessageSender;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "chat_conversation_id", nullable = false)
    private ChatConversation chatConversation;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender", nullable = false)
    private MessageSender sender;

    @Column(name = "message", length = 2000)
    private String message;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
