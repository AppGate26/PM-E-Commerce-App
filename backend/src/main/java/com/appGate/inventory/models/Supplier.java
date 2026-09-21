package com.appGate.inventory.models;

import com.appGate.rbac.context.BranchOwned;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.security.SecureRandom;
import java.time.Year;

/**
 * A supplier. A null branch id means the supplier is shared company-wide; a
 * non-null branch id marks one a single branch registered for itself.
 */
@Entity
@Data
@Table(name = "suppliers", uniqueConstraints = {
    @UniqueConstraint(name = "uk_supplier_id", columnNames = "supplierId")
})
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Supplier extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_phone_no")
    private String contactPhoneNo;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "tax_id")
    private String taxId;

    @Column(name = "payment_terms")
    private String paymentTerms;

    @Column(name = "delivery_terms")
    private String deliveryTerms;

    @Column(name = "address")
    private String address;

    @Column(name = "passport_image")
    private String passportImage;
    
    private String supplierId;

    @PostPersist
    public void generateSupplierId() {
        if (supplierId == null) {
            String year = String.valueOf(Year.now().getValue()).substring(2);
            String formattedId = String.format("%06d", id);
            supplierId = "SUP/" + year + "/" + formattedId;
        }
    }
}


// 1. when admin creates a user, the admin should give the user the roles and permission to operate with


// e.g
// Inventory 
// * creates/edit/view a supplier (needs an admin approval)


