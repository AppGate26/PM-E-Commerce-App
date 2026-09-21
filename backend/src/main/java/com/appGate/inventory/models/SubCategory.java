package com.appGate.inventory.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Data
@Table(name = "sub_categories")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class SubCategory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", unique = true)
    private String name;

    @Column(name = "description")
    private String description;

    
    @Column(name = "image")
    private String image;

    // Excluded from toString/equals/hashCode: Lombok @Data doesn't know about
    // @JsonBackReference, so without this, Category.toString() -> this list's
    // toString() -> this.toString() -> category.toString() -> ... recurses
    // infinitely (StackOverflowError) any time either side's toString() runs,
    // e.g. Spring's DEBUG "Writing [...]" response logging.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonBackReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Category category;

    // The parent category object is hidden by @JsonBackReference (avoids recursion with
    // Category.subCategories). Expose the flat id so clients can filter sub-categories by
    // their category without pulling the whole graph.
    @JsonProperty("categoryId")
    public Long getCategoryId() {
        return category != null ? category.getId() : null;
    }
}
