package com.appGate.rbac.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "user_log_trail")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserLogTrail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "log_date")
    private LocalDate date;

    @Column(name = "time_in")
    private LocalTime timeIn;

    @Column(name = "activity")
    private String activity; // PURCHASE, ORDER, COMPLAIN, LOGIN, LOGOUT

    @Column(name = "time_out")
    private LocalTime timeOut;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "session_active")
    private Boolean sessionActive = false;
}
