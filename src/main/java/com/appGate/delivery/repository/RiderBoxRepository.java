package com.appGate.delivery.repository;

import com.appGate.delivery.enums.RiderBoxStatusEnum;
import com.appGate.delivery.models.Rider;
import com.appGate.delivery.models.RiderBox;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RiderBoxRepository extends JpaRepository<RiderBox, Long> {
    List<RiderBox> findByStatus(RiderBoxStatusEnum status);
    // Find a RiderBox by saleRef::
    Optional<RiderBox> findBySaleRef(Long saleRef);
    List<RiderBox> findByRiderId(Long riderId);
    List<RiderBox> findByRiderIdAndStatus(Long riderId, RiderBoxStatusEnum status);
    Page<RiderBox> findByRiderIdAndStatus(Long riderId, RiderBoxStatusEnum status, Pageable pageable);

}
