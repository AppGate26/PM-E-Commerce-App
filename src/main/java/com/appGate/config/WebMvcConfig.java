package com.appGate.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration
 * Registers custom converters for all controllers
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final StringToEnumConverter stringToEnumConverter;

    public WebMvcConfig(StringToEnumConverter stringToEnumConverter) {
        this.stringToEnumConverter = stringToEnumConverter;
    }

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverterFactory(stringToEnumConverter);
    }
}
