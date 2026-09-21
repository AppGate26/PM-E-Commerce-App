package com.appGate.config;

import com.appGate.rbac.filter.AuthTokenFilter;
import com.appGate.rbac.filter.BranchContextFilter;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.util.CustomUserDetailService;
import com.appGate.rbac.util.JwtUtils;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;

/**
 * Unified Security Configuration for PomStores Monolith
 * Handles JWT-based authentication and authorization for all services
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailService customUserDetailService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    // Public endpoints that don't require authentication
    private static final String[] PUBLIC_ENDPOINTS = {
            // Swagger/OpenAPI Documentation
            "/v3/api-docs/**",
            "/v3/api-docs.yaml",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api-docs/**",
            "/webjars/**",

            // Authentication endpoints
            "/api/users/sign-up",
            "/api/users/sign-in",
            "/api/users/forget-password",
            "/api/users/reset-password",
            "/api/products",

            // Delivery Agent Authentication
            "/api/delivery-agent/auth/login",
            "/api/delivery-agent/auth/forgot-password",
            "/api/delivery-agent/auth/reset-password",

            // Goods Recovery Agent Authentication
            "/api/goods-recovery/auth/login",
            "/api/goods-recovery/auth/forgot-password",
            "/api/goods-recovery/auth/reset-password",

            // Email service (internal use - now direct method calls)
            "/api/email/send",

            // Payment webhooks (must be public for payment gateway callbacks)
            "/api/payments/webhook",

            // Public product browsing (optional - remove if you want auth required)
            "/api/inventory/products/public/**",

            // Settings - public endpoints for language and currency options
            "/api/settings/languages",
            "/api/settings/currencies",

            // Security questions - public for registration
            "/api/admin/security/security-questions",

            // Error handling
            "/error"
    };

    public SecurityConfig(CustomUserDetailService customUserDetailService,
                          JwtUtils jwtUtils,
                          UserRepository userRepository) {
        this.customUserDetailService = customUserDetailService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS and disable CSRF (for REST API)
                .cors().and()
                .csrf().disable()

                // Configure authorization rules
                .authorizeHttpRequests(authorize -> authorize
                        // Allow public access to these endpoints
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()

                        // All other requests require authentication
                        .anyRequest().authenticated())

                // Without this, Spring Security has no formLogin()/httpBasic() configured, so it
                // falls back to Http403ForbiddenEntryPoint for genuinely unauthenticated requests
                // (missing/invalid/expired JWT) - the frontend then can't tell "your session
                // expired, log in again" apart from "you're logged in but not allowed to do this".
                // Returning 401 here for the former keeps 403 meaning the latter.
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"message\":\"Unauthorized: authentication token is missing, invalid, or expired\"}");
                        }))

                // Stateless session management (JWT)
                .sessionManagement(sess -> sess
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Configure authentication provider
                .authenticationProvider(authenticationProvider())

                // Log every request/response first, before auth runs, so failed/unauthenticated
                // calls are captured too. Then add the JWT authentication filter, and resolve
                // the caller's branch from the now-populated SecurityContext.
                .addFilterBefore(requestResponseLoggingFilter(), SecurityContextHolderFilter.class)
                .addFilterAfter(authTokenFilter(), SecurityContextHolderFilter.class)
                .addFilterAfter(branchContextFilter(), AuthTokenFilter.class);

        return http.build();
    }

    /**
     * Publishes the caller's branch on BranchContext for the life of the request.
     * Must run after {@link AuthTokenFilter}, which is what puts the user in the
     * SecurityContext.
     */
    @Bean
    public BranchContextFilter branchContextFilter() {
        return new BranchContextFilter(userRepository);
    }

    /**
     * Console-logs every request (method, URI, JSON payload) for debugging client
     * calls (e.g. the mobile app) - see RequestResponseLoggingFilter's own javadoc.
     */
    @Bean
    public RequestResponseLoggingFilter requestResponseLoggingFilter() {
        return new RequestResponseLoggingFilter();
    }

    /**
     * JWT Authentication Filter
     * Validates JWT tokens and sets authentication in SecurityContext
     */
    @Bean
    public AuthTokenFilter authTokenFilter() {
        return new AuthTokenFilter(jwtUtils, customUserDetailService);
    }

    /**
     * Authentication Manager
     * Used for processing authentication requests
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfiguration)
            throws Exception {
        return authConfiguration.getAuthenticationManager();
    }

    /**
     * Authentication Provider
     * Connects UserDetailsService with PasswordEncoder
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Password Encoder
     * Uses BCrypt for secure password hashing
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Role Hierarchy
     * Defines role inheritance: SUPER_ADMIN > ADMIN > USER
     * A SUPER_ADMIN automatically has ADMIN and USER permissions
     * RIDER and RECOVERY_AGENT are separate roles with specific permissions
     */
    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        hierarchy.setHierarchy("""
                ROLE_SUPER_ADMIN > ROLE_ADMIN
                ROLE_ADMIN > ROLE_BRANCH_MANAGER
                ROLE_BRANCH_MANAGER > ROLE_USER
                ROLE_ADMIN > ROLE_RIDER
                ROLE_ADMIN > ROLE_RECOVERY_AGENT
                """);
        return hierarchy;
    }

    /**
     * Method Security Expression Handler
     * Enables role hierarchy in @PreAuthorize and @Secured annotations
     */
    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler(RoleHierarchy roleHierarchy) {
        DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setRoleHierarchy(roleHierarchy);
        return expressionHandler;
    }

    /**
     * CORS Configuration
     * Allows cross-origin requests from frontend applications
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow specific origins (add your frontend URLs)
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",
                "http://localhost:5172",
                "http://localhost:3000",
                "http://localhost:4200",
                "https://pm-gamma-six.vercel.app",
                "https://pmstores.vercel.app"
        ));

        // Allow all HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allow all headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Expose these headers to the client
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
