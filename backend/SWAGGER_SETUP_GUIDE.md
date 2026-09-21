# Swagger Configuration for PomStores Monolith

## What Changed

### Before (Microservices):
- ❌ Each service had its own `SwaggerConfig.java`
- ❌ Each service had separate Swagger UI at different ports
- ❌ Multiple API documentation pages

### After (Monolith):
- ✅ **Single unified SwaggerConfig** at `com.appGate.config.SwaggerConfig`
- ✅ **One Swagger UI** for all APIs at `http://localhost:8080/swagger-ui.html`
- ✅ **Organized by tags** for easy navigation

---

## New SwaggerConfig Location

**File:** `src/main/java/com/appGate/config/SwaggerConfig.java`

This single config file now handles:
- Account & Payment APIs
- Inventory & Product APIs
- Order & Sales APIs
- Delivery & Rider APIs
- RBAC & Authentication APIs
- Email Service APIs
- Customer Management APIs
- Recovery & Support APIs

---

## How to Use Tags in Controllers

To organize your APIs in Swagger UI, add the `@Tag` annotation to your controllers:

### Example 1: Account Controllers

```java
package com.appGate.account.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account/payments")
@Tag(name = "Account & Payments", description = "Payment processing and transaction management")
public class PaymentController {
    // Your endpoints here
}
```

### Example 2: Inventory Controllers

```java
package com.appGate.inventory.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory/products")
@Tag(name = "Inventory Management", description = "Product catalog and stock management")
public class ProductController {
    // Your endpoints here
}
```

### Example 3: RBAC Controllers

```java
package com.appGate.rbac.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication & RBAC", description = "User authentication and authorization")
public class AuthController {
    // Your endpoints here
}
```

---

## Available Tags

Use these exact tag names in your `@Tag` annotations:

| Tag Name | Use For |
|----------|---------|
| `Authentication & RBAC` | Login, signup, user roles, permissions |
| `Account & Payments` | Wallets, payments, installments, transactions |
| `Inventory Management` | Products, categories, subcategories, stock, suppliers |
| `Product Reviews` | Product reviews, ratings, comments |
| `Orders & Sales` | Order creation, processing, tracking |
| `Delivery & Riders` | Delivery management, rider operations |
| `Customer Management` | Customer profiles, suspend/unblock |
| `Email Services` | Email sending and notifications |
| `Recovery & Support` | Account recovery, password reset |
| `Dashboard & Analytics` | Business metrics, reports |

---

## Adding Swagger Annotations to Endpoints

Make your API documentation more detailed:

```java
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/inventory/products")
@Tag(name = "Inventory Management")
public class ProductController {

    @Operation(
        summary = "Get all products",
        description = "Retrieves a paginated list of all products in the inventory"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved products"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - JWT token required"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    public BaseResponse getAllProducts(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size
    ) {
        // Implementation
    }
}
```

---

## Accessing Swagger UI

After starting your application:

1. **Swagger UI (Interactive):**
   ```
   http://localhost:8080/swagger-ui.html
   ```

2. **OpenAPI JSON:**
   ```
   http://localhost:8080/v3/api-docs
   ```

3. **OpenAPI YAML:**
   ```
   http://localhost:8080/v3/api-docs.yaml
   ```

---

## Production Configuration

When deploying to AWS EC2, update the server URL in `application-prod.properties`:

```properties
# Swagger/OpenAPI Settings
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/v3/api-docs

# You can disable Swagger in production if needed
# springdoc.swagger-ui.enabled=false
# springdoc.api-docs.enabled=false
```

Or update the SwaggerConfig to use environment variables:

```java
@Value("${app.swagger.server.url:http://localhost:8080}")
private String serverUrl;

@Bean
public OpenAPI pomStoresAPI() {
    return new OpenAPI()
            // ... other configs
            .servers(List.of(
                    new Server()
                            .url(serverUrl)
                            .description("Application Server")))
            // ... rest of config
}
```

---

## Quick Controller Update Checklist

For each controller in your project:

- [ ] Add `@Tag(name = "...")` annotation at class level
- [ ] Use appropriate tag name from the table above
- [ ] (Optional) Add `@Operation` for detailed endpoint descriptions
- [ ] (Optional) Add `@ApiResponses` for response documentation
- [ ] (Optional) Add `@Parameter` for request parameter descriptions

---

## Example: Complete Controller with Swagger Annotations

```java
package com.appGate.inventory.controller;

import com.appGate.inventory.dto.ProductDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory/products")
@Tag(name = "Inventory Management", description = "Product catalog and inventory operations")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Operation(
        summary = "Create a new product",
        description = "Creates a new product in the inventory with image upload support"
    )
    @ApiResponse(responseCode = "201", description = "Product created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid product data")
    @PostMapping
    public BaseResponse createProduct(
            @Parameter(description = "Product details including image") @ModelAttribute ProductDto productDto,
            HttpServletRequest request
    ) {
        return productService.createProduct(productDto, request);
    }

    @Operation(summary = "Get product by ID")
    @GetMapping("/{id}")
    public BaseResponse getProduct(
            @Parameter(description = "Product ID") @PathVariable Long id
    ) {
        return productService.getAProduct(id);
    }

    @Operation(summary = "Get all products with pagination")
    @GetMapping
    public BaseResponse getAllProducts(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)") @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return productService.getAllProductsPaginated(page, size, sortBy, sortDirection);
    }
}
```

---

## Benefits of Unified Swagger

1. ✅ **Single Documentation Page** - All APIs in one place
2. ✅ **Organized by Tags** - Easy to find related endpoints
3. ✅ **No Port Confusion** - Everything on port 8080
4. ✅ **Shared Security** - JWT authentication configured once
5. ✅ **Better Developer Experience** - One URL to remember

---

## Testing the Setup

1. Start your application:
   ```bash
   mvn spring-boot:run
   ```

2. Open Swagger UI:
   ```
   http://localhost:8080/swagger-ui.html
   ```

3. You should see:
   - All your endpoints organized by tags
   - JWT authentication (lock icon on each endpoint)
   - Try it out functionality
   - Request/response schemas

---

## Common Issues & Solutions

### Issue 1: Multiple Bean Definition Errors
**Error:** `The bean 'openAPI' could not be registered`

**Solution:** Make sure you deleted all old `SwaggerConfig.java` files from:
- ❌ `com.appGate.account.config.SwaggerConfig`
- ❌ `com.appGate.inventory.config.SwaggerConfig`
- ❌ `com.appGate.orderingsales.config.SwaggerConfig`
- ❌ `com.appGate.recovery.config.SwaggerConfig`

Only keep: ✅ `com.appGate.config.SwaggerConfig`

### Issue 2: Tags Not Showing
**Problem:** Controllers appear under "default" tag

**Solution:** Add `@Tag` annotation to your controller class

### Issue 3: Endpoints Not Appearing
**Problem:** Some endpoints missing in Swagger UI

**Solution:** Verify `@ComponentScan` in main application class includes all packages

---

## Next Steps

1. Update all your controllers with `@Tag` annotations
2. (Optional) Add detailed `@Operation` and `@Parameter` annotations
3. Test Swagger UI locally
4. Configure for production deployment

---

Happy documenting! 🚀
