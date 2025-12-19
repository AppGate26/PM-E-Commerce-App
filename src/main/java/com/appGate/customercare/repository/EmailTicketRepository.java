package com.appGate.customercare.repository;

import com.appGate.customercare.enums.TicketStatus;
import com.appGate.customercare.models.EmailTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailTicketRepository extends JpaRepository<EmailTicket, Long> {

    Page<EmailTicket> findByStatus(TicketStatus status, Pageable pageable);

    Long countByStatus(TicketStatus status);
}
