package com.appGate.messenger.models;

import com.appGate.rbac.models.BaseEntity;
import com.appGate.rbac.models.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "messenger_conversations")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MessengerConversation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_one_id", referencedColumnName = "id")
    @JsonIgnoreProperties({"password", "resetOtp", "hibernateLazyInitializer", "handler"})
    private User userOne;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_two_id", referencedColumnName = "id")
    @JsonIgnoreProperties({"password", "resetOtp", "hibernateLazyInitializer", "handler"})
    private User userTwo;

    @Column(name = "last_message")
    private String lastMessage;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "user_one_unread_count")
    private Integer userOneUnreadCount = 0;

    @Column(name = "user_two_unread_count")
    private Integer userTwoUnreadCount = 0;
}
