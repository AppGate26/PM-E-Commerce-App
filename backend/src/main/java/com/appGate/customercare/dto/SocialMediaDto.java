package com.appGate.customercare.dto;

import lombok.Data;

@Data
public class SocialMediaDto {
    private String platform;
    private String url;
    private String icon;
    // Account handle / username / address used to log in to the social platform.
    private String handle;
}
