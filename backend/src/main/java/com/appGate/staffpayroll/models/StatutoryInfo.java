package com.appGate.staffpayroll.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "staff_statutory_info")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StatutoryInfo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_id", nullable = false, unique = true)
    private Long staffId;

    @Column(name = "tax_id")
    private String taxId;

    @Column(name = "pension_number")
    private String pensionNumber;

    @Column(name = "nhf_number")
    private String nhfNumber;
}
