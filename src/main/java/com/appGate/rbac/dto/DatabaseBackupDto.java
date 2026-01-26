package com.appGate.rbac.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DatabaseBackupDto {
    @NotNull(message = "Database version is required")
    private String databaseVersion; // MYSQL, POSTGRESQL, COCKROACHDB

    private String serverConnection; // e.g., "PM SERVER"

    @NotNull(message = "File naming type is required")
    private String fileNamingType; // REPLACEMENT, INCREMENTAL

    @NotNull(message = "Backup location is required")
    private String backupLocation;

    @NotNull(message = "Backup file name is required")
    private String backupFileName;
}
