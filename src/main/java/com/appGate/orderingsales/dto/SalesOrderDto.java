package com.appGate.orderingsales.dto;

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
}
