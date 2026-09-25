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
    // orderId is the mobile Order id an assignment was made against - one rider box per order.
    Optional<RiderBox> findByOrderId(Long orderId);
    // salesOrderId is set instead of orderId for a walk-in sale (no mobile Order counterpart) -
    // see RiderBoxService.assignProduct.
    Optional<RiderBox> findBySalesOrderId(Long salesOrderId);
    List<RiderBox> findByRiderId(Long riderId);
    List<RiderBox> findByRiderIdAndStatus(Long riderId, RiderBoxStatusEnum status);
    Page<RiderBox> findByRiderIdAndStatus(Long riderId, RiderBoxStatusEnum status, Pageable pageable);
    List<RiderBox> findByRiderIdAndStatusIn(Long riderId, List<RiderBoxStatusEnum> statuses);
    Page<RiderBox> findByRiderIdAndStatusIn(Long riderId, List<RiderBoxStatusEnum> statuses, Pageable pageable);

    List<RiderBox> findByBranchId(Long branchId);
    List<RiderBox> findByStatusAndBranchId(RiderBoxStatusEnum status, Long branchId);

}
