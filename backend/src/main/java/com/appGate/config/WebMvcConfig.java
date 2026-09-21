package com.appGate.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration
 * Registers custom converters for all controllers
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final StringToEnumConverter stringToEnumConverter;
    private final AuditInterceptor auditInterceptor;

    public WebMvcConfig(StringToEnumConverter stringToEnumConverter, AuditInterceptor auditInterceptor) {
        this.stringToEnumConverter = stringToEnumConverter;
        this.auditInterceptor = auditInterceptor;
    }

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverterFactory(stringToEnumConverter);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auditInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/health",
                    "/actuator/**"
                );
    }
}
