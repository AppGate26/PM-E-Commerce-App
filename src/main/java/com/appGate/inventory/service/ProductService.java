package com.appGate.inventory.service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import org.modelmapper.ModelMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;

import com.appGate.inventory.dto.ProductDto;
// import com.appGate.inventory.kafka.PopularProductCache;
// import com.appGate.inventory.kafka.ProductViewEventPublisher;
import com.appGate.inventory.models.Category;
import com.appGate.inventory.models.Product;
import com.appGate.inventory.models.SubCategory;
import com.appGate.inventory.models.Supplier;
import com.appGate.inventory.repository.CategoryRepository;
import com.appGate.inventory.repository.ProductRepository;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.util.FileUploadUtil;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.appGate.inventory.repository.SubCategoryRepository;
import com.appGate.inventory.repository.SupplierRepository;
import com.appGate.inventory.models.Stock;
import com.appGate.inventory.repository.StockRepository;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    // private final PopularProductCache popularProductCache;
    // private final ProductViewEventPublisher productViewEventPublisher;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final SupplierRepository supplierRepository;
    private final StockRepository stockRepository;

    public ProductService(ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SubCategoryRepository subCategoryRepository,
            SupplierRepository supplierRepository,
            StockRepository stockRepository
            // PopularProductCache popularProductCache,
            // ProductViewEventPublisher productViewEventPublisher
            ) {
        // this.popularProductCache = popularProductCache;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.subCategoryRepository = subCategoryRepository;
        this.supplierRepository = supplierRepository;
        this.stockRepository = stockRepository;
        // this.productViewEventPublisher = productViewEventPublisher;
    }

    public BaseResponse quickPick() {

        List<Product> products = productRepository.findOneProductPerSubCategory();

        return new BaseResponse(HttpStatus.OK.value(), "successful", products);
    }

    public BaseResponse getPopularProductsToday() {
        // uncomment when going live
        // List<Long> productIds = popularProductCache.getTopProducts(10);
        List<Long> productIds = productRepository.findTopProductIds();

        List<Product> products;
        if (!productIds.isEmpty()) {
            products = productRepository.findByIdIn(productIds);
        } else {
            // Fallback to new arrivals
            products = productRepository.findTop10ByOrderByIdDesc();
        }

        // TODO
        // implement a fallback to most purchased product

        if (products.isEmpty()) {
            // Fallback to random products
            products = productRepository.findRandomProducts();
        }

        return new BaseResponse(HttpStatus.OK.value(), "Popular products today", productIds);
        // return new BaseResponse(HttpStatus.OK.value(), "Popular products today",
        // products);
    }

    public BaseResponse getAProduct(Long productId) {

        Product product = getOneProduct(productId);

        // productViewEventPublisher.publishOrderEvent(productId);

        return new BaseResponse(HttpStatus.OK.value(), "successful", product);
    }

    private Product getOneProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid product id"));
    }

    public BaseResponse createProduct(ProductDto productDto, HttpServletRequest request) {

        Category category = categoryRepository.findById(productDto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category id"));

        SubCategory subCategory = subCategoryRepository.findById(productDto.getSubCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sub category id"));

        Supplier supplier = null;
        if (productDto.getSupplierId() != null) {
            supplier = supplierRepository.findById(productDto.getSupplierId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid supplier id"));
        }

        Product product = new Product();
        product.setProductName(productDto.getProductName());
        product.setProductDescription(productDto.getProductDescription());
        product.setCategory(category);
        product.setSubCategory(subCategory);
        product.setSupplier(supplier);
        product.setSellingPrice(productDto.getSellingPrice());
        product.setCostPrice(productDto.getCostPrice());
        product.setManufacturerName(productDto.getManufacturerName());
        product.setQuantity(productDto.getQuantity());

        if (productDto.getProductImage() != null && !productDto.getProductImage().isEmpty()) {
            product.setProductImage(saveImage(productDto.getProductImage(), "product", getBaseUrl(request)));
        }

        Product newProduct = productRepository.save(product);

        // Create stock entry
        Stock stock = new Stock();
        stock.setProduct(newProduct);
        stock.setQuantity(productDto.getQuantity());
        // Note: Stock model doesn't have reorderLevel field - consider adding it if needed
        stockRepository.save(stock);

        return new BaseResponse(HttpStatus.CREATED.value(), "Product created successfully", newProduct);
    }

    public BaseResponse getAllProducts() {
        return new BaseResponse(HttpStatus.OK.value(), "successful", productRepository.findAll());
    }

    public BaseResponse editProduct(Long productId, ProductDto productDto) {

        Product product = getOneProduct(productId);

        // Manually map fields to avoid ModelMapper conflicts with *Id fields
        if (productDto.getProductName() != null) {
            product.setProductName(productDto.getProductName());
        }
        if (productDto.getProductDescription() != null) {
            product.setProductDescription(productDto.getProductDescription());
        }
        if (productDto.getCategoryId() != null) {
            Category category = categoryRepository.findById(productDto.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category id"));
            product.setCategory(category);
        }
        if (productDto.getSubCategoryId() != null) {
            SubCategory subCategory = subCategoryRepository.findById(productDto.getSubCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sub category id"));
            product.setSubCategory(subCategory);
        }
        if (productDto.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(productDto.getSupplierId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid supplier id"));
            product.setSupplier(supplier);
        }
        if (productDto.getSellingPrice() != null) {
            product.setSellingPrice(productDto.getSellingPrice());
        }
        if (productDto.getCostPrice() != null) {
            product.setCostPrice(productDto.getCostPrice());
        }
        if (productDto.getManufacturerName() != null) {
            product.setManufacturerName(productDto.getManufacturerName());
        }
        if (productDto.getQuantity() != null) {
            product.setQuantity(productDto.getQuantity());
        }

        productRepository.save(product);

        return new BaseResponse(HttpStatus.OK.value(), "successful", getOneProduct(productId));
    }

    private String saveImage(MultipartFile file, String uploadDir, String baseUrl) {

        String fileSavedPath = "";
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        try {
            fileSavedPath = FileUploadUtil.saveImage(uploadDir, FileUploadUtil.generateUniqueName(fileName), file);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error", e);
        }

        fileSavedPath = baseUrl + "/api/users/customer/image/" + fileSavedPath;

        System.out.println("fileSavedPath " + fileSavedPath);
        System.out.println("baseUrl " + baseUrl);

        return fileSavedPath;
    }

    private String getBaseUrl(HttpServletRequest request) {
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        String forwardedPrefix = request.getHeader("X-Forwarded-Prefix");

        // Build the original URL
        StringBuilder originalUrl = new StringBuilder();

        // Protocol (http or https)
        if (forwardedProto != null) {
            originalUrl.append(forwardedProto).append("://");
        } else {
            originalUrl.append(request.getScheme()).append("://");
        }

        // Host and port
        if (forwardedHost != null) {
            originalUrl.append(forwardedHost);
        } else {
            originalUrl.append(request.getServerName());
            if (request.getServerPort() != 80 && request.getServerPort() != 443) {
                originalUrl.append(":").append(request.getServerPort());
            }
        }

        // Path prefix if any
        if (forwardedPrefix != null) {
            originalUrl.append(forwardedPrefix);
        }

        return originalUrl.toString();
    }

    public void deleteProduct(Long productId) throws IOException {
        Product product = getOneProduct(productId);

        // Delete the image file if it exists
        if (product.getProductImage() != null && !product.getProductImage().isEmpty()) {
            String filePath = product.getProductImage().replace(getBaseUrl(null) + "/api/users/customer/image/", "");
            FileUploadUtil.deleteImage(filePath);
        }

        productRepository.deleteById(productId);
    }

    // New methods for pagination, search, and filtering
    public BaseResponse getAllProductsPaginated(int page, int size, String sortBy, String sortDirection) {
        try {
            Sort sort = sortDirection.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Product> productsPage = productRepository.findAll(pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Products retrieved successfully", productsPage);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to retrieve products: " + e.getMessage(), null);
        }
    }

    public BaseResponse getProductsByCategory(Long categoryId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> products = productRepository.findByCategoryId(categoryId, pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Products retrieved successfully", products);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to retrieve products: " + e.getMessage(), null);
        }
    }

    public BaseResponse searchProducts(String query, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> products = productRepository.findByProductNameContainingIgnoreCase(query, pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Search results retrieved successfully", products);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Search failed: " + e.getMessage(), null);
        }
    }

    public BaseResponse filterProductsByPriceRange(Double minPrice, Double maxPrice, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> products = productRepository.findBySellingPriceBetween(minPrice, maxPrice, pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Products retrieved successfully", products);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to filter products: " + e.getMessage(), null);
        }
    }

    public Resource loadImageAsResource(String fileName) {
        try {
            Path filePath = Paths.get("products/images").resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found: " + fileName);
            }
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found: " + fileName, e);
        }
    }

}
