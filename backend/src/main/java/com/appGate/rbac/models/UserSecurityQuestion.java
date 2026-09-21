package com.appGate.rbac.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "user_security_questions")
public class UserSecurityQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true)
    private Long userId;

    @Column(name = "question")
    private String question;

    @Column(name = "answer")
    private String answer;
}
