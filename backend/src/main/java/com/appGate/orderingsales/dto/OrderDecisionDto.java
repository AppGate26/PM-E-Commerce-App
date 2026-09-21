package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Reviewer decision (approve / reject) on an online order awaiting fulfilment.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDecisionDto {
    private String comment;
}
