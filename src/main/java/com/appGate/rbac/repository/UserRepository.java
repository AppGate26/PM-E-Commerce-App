package com.appGate.rbac.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.enums.UserStatusEnum;
import com.appGate.rbac.models.User;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    // For security module
    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<User> findByRole(RoleEnum role);

    Page<User> findByRole(RoleEnum role, Pageable pageable);

    Page<User> findByStatus(UserStatusEnum status, Pageable pageable);

    Page<User> findByRoleAndStatus(RoleEnum role, UserStatusEnum status, Pageable pageable);

    List<User> findByDepartment(String department);
}
