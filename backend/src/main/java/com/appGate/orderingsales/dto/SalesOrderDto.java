package com.appGate.orderingsales.dto;

import com.appGate.orderingsales.enums.FulfillmentType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderDto {
    private ProductInfoDto productInfo;
    private CustomerInfoDto customerInfo;
    private LoanInfoDto loanInfo;

    // The branch processing this sale — required so stock is decremented at the right branch
    private Long branchId;

    // Pickup vs delivery, as chosen in the walk-in sale form; null falls back to
    // FulfillmentType.DELIVERY in SalesService.createBaseSalesOrder.
    private FulfillmentType fulfillmentType;
}
