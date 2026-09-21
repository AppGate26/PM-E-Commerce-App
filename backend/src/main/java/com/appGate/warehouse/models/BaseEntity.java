package com.appGate.warehouse.models;

import java.time.LocalDateTime;
import jakarta.persistence.*;

import com.appGate.rbac.context.BranchStampListener;
import lombok.Data;

@Data
@MappedSuperclass
@EntityListeners(BranchStampListener.class)
public abstract class BaseEntity {

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
