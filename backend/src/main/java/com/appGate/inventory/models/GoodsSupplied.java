package com.appGate.inventory.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@Table(name = "goods_supplied")
public class GoodsSupplied extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "supplied_product", nullable = false)
    private String suppliedProduct;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "delivery_fee", precision = 15, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "date_supplied")
    private LocalDate dateSupplied;

    @Column(name = "vehicle_number")
    private String vehicleNumber;

    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "lpo_number")
    private String lpoNumber; // Local Purchase Order

    @Column(name = "waybill_number")
    private String waybillNumber;

    @Column(name = "warehouse_name")
    private String warehouseName;

    @Column(name = "gl_debit_code")
    private String glDebitCode;

    @Column(name = "gl_credit_code")
    private String glCreditCode;

    @Column(name = "terminal_code")
    private String terminalCode;
}
