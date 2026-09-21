package com.appGate.rbac.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.enums.UserStatusEnum;
import com.appGate.rbac.models.User;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    /**
     * Loads the user together with their branch in one query. Used by
     * {@code BranchContextFilter}, which resolves the branch after the
     * persistence session has closed — a plain {@link #findByEmail} would return
     * a detached user whose lazy {@code branch} proxy throws
     * {@code LazyInitializationException} on access.
     */
    @Query("select u from User u left join fetch u.branch where u.email = :email")
    Optional<User> findByEmailWithBranch(@Param("email") String email);

    // For security module
    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<User> findByRole(RoleEnum role);

    Page<User> findByRole(RoleEnum role, Pageable pageable);

    Page<User> findByStatus(UserStatusEnum status, Pageable pageable);

    Page<User> findByRoleAndStatus(RoleEnum role, UserStatusEnum status, Pageable pageable);

    List<User> findByDepartment(String department);

    List<User> findByBranchId(Long branchId);
}
