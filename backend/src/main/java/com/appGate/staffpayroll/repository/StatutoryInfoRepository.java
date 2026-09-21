package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.models.StatutoryInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StatutoryInfoRepository extends JpaRepository<StatutoryInfo, Long> {
    Optional<StatutoryInfo> findByStaffId(Long staffId);
}
