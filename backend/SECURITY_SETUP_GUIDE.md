# Security Configuration for PomStores Monolith

## What Changed

### Before (Microservices):
- ❌ **RbacSecurityConfig** - JWT authentication for RBAC service
- ❌ **EmailSecurityConfig** - Header-based authentication for email service (X-User-Id, X-User-Role headers)
- ❌ Multiple SecurityFilterChain beans causing conflicts
- ❌ Complex inter-service authentication

### After (Monolith):
- ✅ **Single unified SecurityConfig** at `com.appGate.config.SecurityConfig`
- ✅ JWT-based authentication for all endpoints
- ✅ No need for header-based auth (services call each other directly)
- ✅ Clean role hierarchy: SUPER_ADMIN > ADMIN > USER
- ✅ All public endpoints defined in one place

---

## New SecurityConfig Location

**File:** `src/main/java/com/appGate/config/SecurityConfig.java`

This unified config handles:
- JWT token validation
- User authentication
- Password encoding (BCrypt)
- Role hierarchy
- Public endpoint access
- Method-level security

---

## Authentication Flow

### 1. User Sign Up
```
POST /api/users/sign-up
Body: { "email", "password", "firstName", "lastName", "phoneNumber" }
→ User created in database
→ Password hashed with BCrypt
→ Returns user details
```

### 2. User Sign In
```
POST /api/users/sign-in
Body: { "email", "password" }
→ Validates credentials
→ Generates JWT token
→ Returns: { "accessToken", "expiresIn", "userDetails" }
```

### 3. Accessing Protected Endpoints
```
GET /api/inventory/products
Headers: { "Authorization": "Bearer <jwt-token>" }
→ AuthTokenFilter extracts and validates JWT
→ Loads user details
→ Sets SecurityContext
→ Allows/denies request based on roles
```

---

## Public Endpoints (No Authentication Required)

These endpoints are accessible without a JWT token:

### Documentation
- `/swagger-ui.html` - Swagger UI
- `/v3/api-docs/**` - OpenAPI documentation
- `/api-docs/**` - API docs
- `/webjars/**` - Static resources

### Authentication
- `/api/users/sign-up` - User registration
- `/api/users/sign-in` - User login
- `/api/users/forget-password` - Request password reset
- `/api/users/reset-password` - Reset password with OTP

### Other
- `/error` - Error handling
- `/api/email/send` - Email service (internal)

### Optional Public Product Browsing
If you want users to browse products without login:
```java
"/api/inventory/products/public/**"  // Add public product endpoints
```

---

## Protected Endpoints (Authentication Required)

All other endpoints require a valid JWT token:

- Account & Payments: `/api/account/**`
- Inventory Management: `/api/inventory/**`
- Orders: `/api/orders/**`
- Delivery: `/api/delivery/**`
- Customer Management: `/api/customers/**`
- RBAC: `/api/users/**` (except public auth endpoints)

---

## Role Hierarchy

The system supports 3 roles with inheritance:

```
ROLE_SUPER_ADMIN
    ↓ (includes all ADMIN permissions)
ROLE_ADMIN
    ↓ (includes all USER permissions)
ROLE_USER
```

### What This Means:
- **SUPER_ADMIN**: Can access ADMIN and USER endpoints
- **ADMIN**: Can access USER endpoints
- **USER**: Can only access USER endpoints

### Example Usage in Controllers:

```java
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/inventory/products")
public class ProductController {

    // Only ADMIN and SUPER_ADMIN can create products
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public BaseResponse createProduct(@ModelAttribute ProductDto productDto) {
        // ...
    }

    // Only SUPER_ADMIN can delete products
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        // ...
    }

    // All authenticated users can view products
    @GetMapping
    public BaseResponse getAllProducts() {
        // No @PreAuthorize means any authenticated user can access
    }
}
```

---

## Role Assignment

Roles are assigned in the RBAC service when creating users:

```java
// In UserService.java (sign-up)
User user = new User();
user.setEmail(userDto.getEmail());
user.setPassword(passwordEncoder.encode(userDto.getPassword()));
user.setRole(RoleEnum.USER);  // Default role for new users
userRepository.save(user);

// To create an admin (manually or via admin endpoint):
user.setRole(RoleEnum.ADMIN);

// To create a super admin:
user.setRole(RoleEnum.SUPER_ADMIN);
```

---

## JWT Token Configuration

JWT settings are in `application.properties`:

```properties
# JWT Configuration
jwt.secret=your-super-secret-key-change-this-in-production
jwt.expiration=86400000  # 24 hours in milliseconds
```

**IMPORTANT:** Change the JWT secret in production!

### Generate a Secure JWT Secret:
```bash
# Generate a 256-bit secret
openssl rand -base64 32
```

Then update `application.properties`:
```properties
jwt.secret=<generated-secret-here>
```

---

## Testing Authentication

### 1. Test Public Endpoint (No Auth)
```bash
curl -X POST http://localhost:8080/api/users/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "1234567890"
  }'
```

### 2. Get JWT Token
```bash
curl -X POST http://localhost:8080/api/users/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "status": 200,
  "message": "successful",
  "response": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "2024-01-15T10:30:00",
    "userDetails": { ... }
  }
}
```

### 3. Access Protected Endpoint
```bash
curl -X GET http://localhost:8080/api/inventory/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Using JWT in Swagger UI

1. Go to `http://localhost:8080/swagger-ui.html`
2. Click the **"Authorize"** button (lock icon) at the top
3. Enter your JWT token in the format: `Bearer <your-token>`
4. Click **"Authorize"**
5. Now you can test protected endpoints directly in Swagger

---

## Adding New Public Endpoints

If you need to make additional endpoints public, update `SecurityConfig.java`:

```java
private static final String[] PUBLIC_ENDPOINTS = {
    // ... existing endpoints

    // Add your new public endpoints
    "/api/inventory/categories",      // Public category listing
    "/api/inventory/products/search", // Public product search
    "/api/contact-us",                // Contact form
};
```

---

## Method-Level Security

You can use annotations for fine-grained access control:

### @PreAuthorize - Check Before Method Execution
```java
@PreAuthorize("hasRole('ADMIN')")
public BaseResponse deleteProduct(Long id) { ... }

@PreAuthorize("hasRole('USER')")
public BaseResponse viewProduct(Long id) { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public BaseResponse createProduct(ProductDto dto) { ... }

// Custom expressions
@PreAuthorize("#userId == authentication.principal.id")
public BaseResponse viewProfile(Long userId) { ... }
```

### @PostAuthorize - Check After Method Execution
```java
@PostAuthorize("returnObject.userId == authentication.principal.id")
public Order getOrder(Long orderId) { ... }
```

### @Secured - Simple Role Check
```java
@Secured("ROLE_ADMIN")
public void deleteUser(Long userId) { ... }

@Secured({"ROLE_ADMIN", "ROLE_SUPER_ADMIN"})
public void updateInventory(Long productId) { ... }
```

---

## CORS Configuration

To allow frontend applications to call your API, configure CORS:

### Option 1: Global CORS (Recommended)
Create `CorsConfig.java` in `com.appGate.config`:

```java
package com.appGate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allowed origins (your frontend URLs)
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",      // React dev
            "http://localhost:4200",      // Angular dev
            "https://pomstores.com"       // Production
        ));

        // Allowed methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        // Allowed headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
```

### Option 2: Controller-Level CORS
```java
@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/products")
public class ProductController { ... }
```

---

## Common Security Scenarios

### Scenario 1: Allow Public Product Browsing
Users can view products without login, but must login to add to cart:

```java
// ProductController.java
@GetMapping  // No @PreAuthorize = public for authenticated users
public BaseResponse getAllProducts() { ... }

@PreAuthorize("isAuthenticated()")
@PostMapping("/cart")
public BaseResponse addToCart(@RequestBody CartDto dto) { ... }
```

Update `PUBLIC_ENDPOINTS`:
```java
"/api/inventory/products",
"/api/inventory/products/{id}",
"/api/inventory/categories"
```

### Scenario 2: User Can Only Access Their Own Data
```java
@GetMapping("/wallet/{userId}")
@PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
public BaseResponse getWallet(@PathVariable Long userId) {
    // User can only see their own wallet, unless they're an admin
}
```

### Scenario 3: Admin Can Manage All Orders
```java
@GetMapping("/orders")
@PreAuthorize("hasRole('USER')")
public BaseResponse getMyOrders() {
    Long userId = SecurityUtils.getCurrentUserId();
    return orderService.getOrdersByUser(userId);
}

@GetMapping("/orders/all")
@PreAuthorize("hasRole('ADMIN')")
public BaseResponse getAllOrders() {
    return orderService.getAllOrders();
}
```

---

## Security Utilities

Create a utility class for common security operations:

**File:** `src/main/java/com/appGate/rbac/util/SecurityUtils.java`

```java
package com.appGate.rbac.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

public class SecurityUtils {

    /**
     * Get currently authenticated user ID
     */
    public static Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) auth.getPrincipal();
            // Assuming your UserDetails implementation has getId() method
            return ((CustomUserDetails) userDetails).getId();
        }
        return null;
    }

    /**
     * Get currently authenticated user email
     */
    public static String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails) {
            return ((UserDetails) auth.getPrincipal()).getUsername();
        }
        return null;
    }

    /**
     * Check if user has a specific role
     */
    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    /**
     * Check if user is authenticated
     */
    public static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated();
    }
}
```

---

## Production Security Checklist

Before deploying to AWS EC2:

- [ ] Change `jwt.secret` to a strong random value
- [ ] Set `jwt.expiration` appropriately (24 hours = 86400000ms)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for your frontend domain
- [ ] Review and minimize public endpoints
- [ ] Set up password strength validation
- [ ] Enable rate limiting (optional)
- [ ] Configure session timeout
- [ ] Set up audit logging
- [ ] Use environment variables for secrets (not hardcoded)

### Example Production Config:
```properties
# Use environment variables
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION:86400000}

# Database credentials
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# Disable Swagger in production (optional)
springdoc.swagger-ui.enabled=false
springdoc.api-docs.enabled=false
```

---

## Troubleshooting

### Issue 1: Multiple SecurityFilterChain Beans
**Error:** `The bean 'securityFilterChain' could not be registered`

**Solution:** Make sure you deleted old SecurityConfig files:
- ❌ `com.appGate.rbac.security.RbacSecurityConfig`
- ❌ `com.appGate.email.security.EmailSecurityConfig`

Only keep: ✅ `com.appGate.config.SecurityConfig`

### Issue 2: 401 Unauthorized on Public Endpoints
**Problem:** Getting 401 on `/api/users/sign-in`

**Solution:** Check that the endpoint is in `PUBLIC_ENDPOINTS` array in SecurityConfig

### Issue 3: JWT Token Not Working
**Problem:** Getting 401 even with valid token

**Solution:**
1. Check token format: `Bearer <token>` (note the space)
2. Verify JWT secret matches between sign-in and validation
3. Check token expiration
4. Ensure `AuthTokenFilter` is properly configured

### Issue 4: CORS Errors
**Problem:** Frontend can't call API due to CORS

**Solution:** Configure CORS (see CORS Configuration section above)

---

## Next Steps

1. Test authentication flow (sign-up → sign-in → get JWT)
2. Add `@PreAuthorize` annotations to sensitive endpoints
3. Configure CORS for your frontend
4. Update JWT secret for production
5. Test role hierarchy
6. Set up password strength validation
7. Consider adding refresh token support

---

## Benefits of Unified Security

1. ✅ **Single Source of Truth** - All security rules in one place
2. ✅ **No Configuration Conflicts** - One SecurityFilterChain bean
3. ✅ **Simplified Authentication** - JWT for everything
4. ✅ **Better Performance** - No inter-service auth overhead
5. ✅ **Easier Testing** - One authentication flow to test
6. ✅ **Role Hierarchy** - Automatic permission inheritance

---

Good luck securing your application! 🔒
