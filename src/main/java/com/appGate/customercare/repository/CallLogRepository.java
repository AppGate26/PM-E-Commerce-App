package com.appGate.customercare.repository;

import com.appGate.customercare.enums.CallStatus;
import com.appGate.customercare.models.CallLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, Long> {

    Optional<CallLog> findByCallId(String callId);

    Page<CallLog> findByStatus(CallStatus status, Pageable pageable);

    List<CallLog> findByStatus(CallStatus status);

    List<CallLog> findByStatusIn(List<CallStatus> statuses);

    Long countByStatus(CallStatus status);
}
