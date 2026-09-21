package com.appGate.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import lombok.Data;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "dojah.api")
@Data
public class DojahConfig {
    private String baseUrl;
    private String appId;
    private String secretKey;
    private Long timeout = 30000L;

    @Bean
    public RestTemplate dojahRestTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofMillis(timeout))
                .setReadTimeout(Duration.ofMillis(timeout))
                .build();
    }
}
