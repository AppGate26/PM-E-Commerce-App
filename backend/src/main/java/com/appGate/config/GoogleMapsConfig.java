package com.appGate.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import lombok.Data;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "googlemaps.api")
@Data
public class GoogleMapsConfig {
    private String baseUrl;
    private String key;
    private Long timeout = 15000L;

    @Bean
    public RestTemplate googleMapsRestTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofMillis(timeout))
                .setReadTimeout(Duration.ofMillis(timeout))
                .build();
    }
}
