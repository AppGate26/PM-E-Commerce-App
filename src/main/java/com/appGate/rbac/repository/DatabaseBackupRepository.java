package com.appGate.rbac.repository;

import com.appGate.rbac.models.DatabaseBackup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DatabaseBackupRepository extends JpaRepository<DatabaseBackup, Long> {
    List<DatabaseBackup> findAllByOrderByCreatedAtDesc();
}
