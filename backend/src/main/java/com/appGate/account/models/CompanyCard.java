package com.appGate.account.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * A store-owned ("company") card kept in a shared registry. Cashiers pick one of these when
 * funding a customer wallet by card so the funding transaction records which card was used.
 * This is record-only — the card is not charged through a gateway here.
 */
@Entity
@Table(name = "company_cards")
@Data
@EqualsAndHashCode(callSuper = true)
public class CompanyCard extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String cardName; // Human label, e.g. "POS GTB Card". Used as the funding reference.

    private String email; // Paystack authorization email; charge_authorization must reuse it.

    // Paystack reusable authorization code, captured the first time the card is used. Its
    // presence means the card can be charged instantly (server-to-server) without a redirect.
    private String authorizationCode;

    private String brand; // e.g. "visa", "mastercard" (from Paystack).

    private String last4; // Last 4 digits (from Paystack, or entered manually).

    private String expMonth;

    private String expYear;

    private String bankName; // Optional issuing bank.

    @Column(nullable = false)
    private Boolean isActive = true;
}
