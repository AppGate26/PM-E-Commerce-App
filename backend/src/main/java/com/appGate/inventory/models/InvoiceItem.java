package com.appGate.inventory.models;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
@Table(name = "invoice_items")
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Excluded from toString/equals/hashCode: Lombok @Data doesn't know about
    // @JsonBackReference, so without this, Invoice.toString() -> this list's
    // toString() -> this.toString() -> invoice.toString() -> ... recurses
    // infinitely (StackOverflowError) any time either side's toString() runs -
    // same bug as SubCategory.category, see that field's comment.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Invoice invoice;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "rate", precision = 15, scale = 2, nullable = false)
    private BigDecimal rate;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "product_id")
    private Long productId;
}
