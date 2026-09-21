package com.appGate.rbac.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "wards")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "lga"})
public class Ward {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lga_id", referencedColumnName = "id")
    private LGA lga;
}
