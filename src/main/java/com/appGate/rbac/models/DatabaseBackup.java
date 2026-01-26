package com.appGate.rbac.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "database_backups")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DatabaseBackup extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "database_version")
    private String databaseVersion;

    @Column(name = "backup_location")
    private String backupLocation;

    @Column(name = "backup_file_name")
    private String backupFileName;

    @Column(name = "file_naming_type")
    private String fileNamingType; // REPLACEMENT or INCREMENTAL

    @Column(name = "status")
    private String status; // IN_PROGRESS, COMPLETED, FAILED

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "error_message")
    private String errorMessage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "performed_by", referencedColumnName = "id")
    @JsonIgnoreProperties({"password", "resetOtp", "hibernateLazyInitializer", "handler"})
    private User performedBy;
}
