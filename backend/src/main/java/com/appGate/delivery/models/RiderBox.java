package com.appGate.delivery.models;

import com.appGate.delivery.enums.RiderBoxStatusEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;


@Entity
@Table(name = "RiderBox")
@Data
public class RiderBox extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    /** The branch that dispatched this box. */
    @jakarta.persistence.Column(name = "branch_id")
    private Long branchId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  Long riderBoxId;
    // Set for a mobile-channel order - the mobile Order id this box was assigned against.
    @Column(name = "order_id")
    private Long  orderId;
    // Set instead of orderId for a walk-in sale, which has no mobile Order counterpart to
    // reference (see RiderBoxService.assignProduct / ORDERING #4 - walk-in sales previously
    // could never be assigned to a rider at all because this case fell through to
    // "no linked delivery record").
    @Column(name = "sales_order_id")
    private Long salesOrderId;
    @Column(name = "sale_ref", unique = true , nullable = false)
    private Long saleRef;
    @Enumerated(EnumType.STRING)
    private RiderBoxStatusEnum status = RiderBoxStatusEnum.PENDING;
    @ManyToOne
    @JoinColumn(name = "rider_id", referencedColumnName = "riderId", nullable = false)
    private Rider rider;
    @Column(name = "rider_Id", insertable = false, updatable = false)
    private Long riderId;
}
