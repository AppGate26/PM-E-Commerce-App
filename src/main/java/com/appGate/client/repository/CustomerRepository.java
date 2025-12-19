package com.appGate.client.repository;

import com.appGate.client.models.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer>{
    boolean existsByPassport(String passport);
    boolean existsBySignature(String signature);
    @Override
    Optional<Customer> findById(Long customerId);

    List<Customer> findBySuspended(boolean suspended);
}
