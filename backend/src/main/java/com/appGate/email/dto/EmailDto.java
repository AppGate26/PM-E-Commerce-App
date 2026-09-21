package com.appGate.email.dto;

import java.util.List;

import lombok.Data;


@Data
public class EmailDto {

    private String recipient;
    private String subject;
    private String content;
  
    private List<String> bccAddresses;
    private List<String> ccAddresses;
}
