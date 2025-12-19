package com.appGate.rbac.repository;

import com.appGate.rbac.models.UserLogTrail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserLogTrailRepository extends JpaRepository<UserLogTrail, Long> {

    Page<UserLogTrail> findByUserId(Long userId, Pageable pageable);

    Page<UserLogTrail> findByUserIdAndActivity(Long userId, String activity, Pageable pageable);
}
