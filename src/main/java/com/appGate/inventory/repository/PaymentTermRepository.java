package com.appGate.inventory.repository;

import com.appGate.inventory.models.PaymentTerm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTermRepository extends JpaRepository<PaymentTerm, Long> {

    Optional<PaymentTerm> findByInvoiceNumber(String invoiceNumber);

    List<PaymentTerm> findBySupplierId(Long supplierId);
}
