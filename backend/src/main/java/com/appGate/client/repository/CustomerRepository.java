package com.appGate.client.repository;

import com.appGate.client.models.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer>{
    boolean existsByPassport(String passport);
    boolean existsBySignature(String signature);
    @Override
    Optional<Customer> findById(Long customerId);

    List<Customer> findBySuspended(boolean suspended);

    Optional<Customer> findByAccountNumber(String accountNumber);

    // Some walk-in customers were registered with the same phone number reused as
    // account number, so account_number is not actually unique in the data. A plain
    // findByAccountNumber() (single-result query) throws IncorrectResultSizeDataAccessException
    // and surfaces as a 500 the moment two rows share a value. Callers that only need "a"
    // matching customer (search/balance-enquiry) should use this instead and take the first.
    List<Customer> findAllByAccountNumberOrderByIdDesc(String accountNumber);

    List<Customer> findByFirstNameContainingIgnoreCaseOrSurnameContainingIgnoreCase(String firstName, String surname);

    List<Customer> findByBranchId(Long branchId);

    // Customers created before branch-scoping was added still carry a NULL
    // branch_id (the V3 backfill migration that assigns them to Head Office is
    // a manual, easy-to-miss step -- see db/migration/V3). Until it has been
    // run, a strict findByBranchId hides every legacy customer from branch-scoped
    // staff. Matching NULL alongside the caller's branch keeps those customers
    // visible either way and is a no-op once the backfill has actually run.
    @Query("SELECT c FROM Customer c WHERE c.branchId = :branchId OR c.branchId IS NULL")
    List<Customer> findByBranchIdIncludingUnassigned(@Param("branchId") Long branchId);
}
