package com.appGate.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Unified Swagger/OpenAPI configuration for PomStores Monolith
 * This replaces all individual service Swagger configs
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI pomStoresAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PomStores API - Complete Documentation")
                        .description("Unified REST API for all PomStores services including Account, Inventory, Orders, Delivery, RBAC, and more")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("PomStores Team")
                                .email("support@pomstores.com")
                                .url("https://pomstores.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://www.apache.org/licenses/LICENSE-2.0.html")))

                // Server configurations
                .servers(List.of(
                        new Server()
                                .url("http://18.188.177.144:8080")
                                .description("Local Development Server"),
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local Development Server")
                        // new Server()
                        //         .url("https://api.pomstores.com")
                        //         .description("Production Server (AWS EC2)")
                                ))

                // Security scheme for JWT authentication
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .in(SecurityScheme.In.HEADER)
                                .name("Authorization")
                                .description("JWT token for authentication. Format: Bearer {token}")))

                // Apply security globally
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"))

                // API Tags for organizing endpoints
                .tags(List.of(
                        // new Tag().name("Authentication & RBAC").description("User authentication, authorization, and role management"),
                        // new Tag().name("Account & Payments").description("Wallet, payments, installments, and transactions"),
                        // new Tag().name("Inventory Management").description("Products, categories, stock, and suppliers"),
                        // new Tag().name("Product Reviews").description("Product reviews and ratings"),
                        // new Tag().name("Orders & Sales").description("Order processing and sales management"),
                        // new Tag().name("Delivery & Riders").description("Delivery management and rider operations"),
                        // new Tag().name("Delivery Agent Operations").description("Delivery agent authentication and delivery operations"),
                        // new Tag().name("Goods Recovery").description("Goods recovery from defaulting customers"),
                        // new Tag().name("Customer Management").description("Customer profiles and operations"),
                        // new Tag().name("Email Services").description("Email notifications and messaging"),
                        // new Tag().name("Recovery & Support").description("Account recovery and customer support"),
                        new Tag().name("Dashboard & Analytics").description("Business metrics and analytics")
                ));
    }
}
