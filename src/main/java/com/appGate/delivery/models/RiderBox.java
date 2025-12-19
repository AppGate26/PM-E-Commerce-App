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
public class RiderBox extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  Long riderBoxId;
    @Column(name = "order_id")
    private Long  orderId;
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
