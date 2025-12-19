package com.appGate.delivery.repository;
import com.appGate.delivery.models.Rider;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

import java.util.List;

public interface RiderRepository extends JpaRepository<Rider,Long> {
    boolean existsByPassport(String passport);
    boolean existsByLicences(String licences);
    boolean existsBySignature(String signature);

    List<Rider> findBySuspended(boolean suspended);
    Optional<Rider> findByEmail(String email);


}
