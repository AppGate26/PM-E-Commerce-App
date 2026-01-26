package com.appGate.inventory.service;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.appGate.inventory.dto.SupplierDto;
import com.appGate.inventory.models.Supplier;
import com.appGate.inventory.repository.SupplierRepository;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.util.FileUploadUtil;

@Service
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public BaseResponse createSupplier(SupplierDto supplierDto, HttpServletRequest request) {
        try {
            Supplier supplier = new Supplier();
            supplier.setCustomerName(supplierDto.getCustomerName());
            supplier.setContactName(supplierDto.getContactName());
            supplier.setContactPhoneNo(supplierDto.getContactPhoneNo());
            supplier.setContactEmail(supplierDto.getContactEmail());
            supplier.setTaxId(supplierDto.getTaxId());
            supplier.setPaymentTerms(supplierDto.getPaymentTerms());
            supplier.setDeliveryTerms(supplierDto.getDeliveryTerms());
            supplier.setAddress(supplierDto.getAddress());

            // Handle passport image upload
            if (supplierDto.getPassportImage() != null && !supplierDto.getPassportImage().isEmpty()) {
                String imageUrl = saveImage(supplierDto.getPassportImage(),
                        "supplier-images",
                        getBaseUrl(request));
                supplier.setPassportImage(imageUrl);
            }

            Supplier newSupplier = supplierRepository.save(supplier);
            return new BaseResponse(HttpStatus.CREATED.value(), "Supplier created successfully", newSupplier);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating supplier: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllSuppliers() {
        List<Supplier> suppliers = supplierRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Suppliers retrieved successfully", suppliers);
    }

    public BaseResponse getSupplier(Long id) {
        Supplier supplier = getOneSupplier(id);
        return new BaseResponse(HttpStatus.OK.value(), "Supplier retrieved successfully", supplier);
    }

    public BaseResponse updateSupplier(Long id, SupplierDto supplierDto, HttpServletRequest request) {
        try {
            Supplier supplier = getOneSupplier(id);

            if (supplierDto.getCustomerName() != null) {
                supplier.setCustomerName(supplierDto.getCustomerName());
            }
            if (supplierDto.getContactName() != null) {
                supplier.setContactName(supplierDto.getContactName());
            }
            if (supplierDto.getContactPhoneNo() != null) {
                supplier.setContactPhoneNo(supplierDto.getContactPhoneNo());
            }
            if (supplierDto.getContactEmail() != null) {
                supplier.setContactEmail(supplierDto.getContactEmail());
            }
            if (supplierDto.getTaxId() != null) {
                supplier.setTaxId(supplierDto.getTaxId());
            }
            if (supplierDto.getPaymentTerms() != null) {
                supplier.setPaymentTerms(supplierDto.getPaymentTerms());
            }
            if (supplierDto.getDeliveryTerms() != null) {
                supplier.setDeliveryTerms(supplierDto.getDeliveryTerms());
            }
            if (supplierDto.getAddress() != null) {
                supplier.setAddress(supplierDto.getAddress());
            }

            // Handle passport image upload
            if (supplierDto.getPassportImage() != null && !supplierDto.getPassportImage().isEmpty()) {
                String imageUrl = saveImage(supplierDto.getPassportImage(),
                        "supplier-images",
                        getBaseUrl(request));
                supplier.setPassportImage(imageUrl);
            }

            Supplier updatedSupplier = supplierRepository.save(supplier);
            return new BaseResponse(HttpStatus.OK.value(), "Supplier updated successfully", updatedSupplier);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating supplier: " + e.getMessage(), null);
        }
    }

    private Supplier getOneSupplier(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier not found"));
    }

    private String saveImage(MultipartFile file, String uploadDir, String baseUrl) {
        String fileSavedPath = "";
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        try {
            fileSavedPath = FileUploadUtil.saveImage(uploadDir,
                    FileUploadUtil.generateUniqueName(fileName), file);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED,
                    "Error uploading image", e);
        }
        return baseUrl + "/api/users/supplier/image/" + fileSavedPath;
    }

    private String getBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String contextPath = request.getContextPath();

        StringBuilder url = new StringBuilder();
        url.append(scheme).append("://").append(serverName);

        if ((scheme.equals("http") && serverPort != 80) ||
            (scheme.equals("https") && serverPort != 443)) {
            url.append(":").append(serverPort);
        }

        url.append(contextPath);
        return url.toString();
    }
}
