package com.appGate.client.services;

import com.appGate.client.dto.CustomerDto;
import com.appGate.client.dto.SuspendCustomerDto;
import com.appGate.client.dto.UnblockCustomerDto;
import com.appGate.client.enums.CustomerTypeEnum;
import com.appGate.client.models.Customer;
import com.appGate.client.repository.CustomerRepository;
import com.appGate.client.response.BaseResponse;
import com.appGate.client.util.FileUploadUtil;
import com.appGate.rbac.models.State;
import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.Ward;
import com.appGate.rbac.repository.StateRepository;
import com.appGate.rbac.repository.LGARepository;
import com.appGate.rbac.repository.WardRepository;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

import jakarta.servlet.http.HttpServletRequest;
import org.modelmapper.ModelMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final StateRepository stateRepository;
    private final LGARepository lgaRepository;
    private final WardRepository wardRepository;

    public CustomerService(CustomerRepository customerRepository, StateRepository stateRepository,
                          LGARepository lgaRepository, WardRepository wardRepository) {
        this.customerRepository = customerRepository;
        this.stateRepository = stateRepository;
        this.lgaRepository = lgaRepository;
        this.wardRepository = wardRepository;
    }

    public BaseResponse createWalkinCustomer(CustomerDto customerDto, HttpServletRequest request) {

        String baseUrl = getBaseUrl(request);

        return new BaseResponse(HttpStatus.CREATED.value(), "successful", saveCustomer(customerDto, baseUrl));
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

    private String saveImage(MultipartFile file, String uploadDir, String baseUrl) {

        String fileSavedPath = "";
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        try {
            fileSavedPath = FileUploadUtil.saveImage(uploadDir, FileUploadUtil.generateUniqueName(fileName), file);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error", e);
        }

        fileSavedPath = baseUrl + "/api/users/customer-image/" + fileSavedPath;

        System.out.println("fileSavedPath " + fileSavedPath);
        System.out.println("baseUrl " + baseUrl);

        return fileSavedPath;
    }

    private Customer saveCustomer(CustomerDto customerDto, String baseUrl) {

        Customer customer = new Customer();
        customer.setAccountNumber(customerDto.getAccountNumber());
        customer.setEmail(customerDto.getEmail());
        customer.setSurname(customerDto.getSurname());
        customer.setFirstName(customerDto.getFirstName());
        customer.setDob(customerDto.getDob());
        customer.setPhoneNumber(customerDto.getPhoneNumber());
        customer.setOccupation(customerDto.getOccupation());
        customer.setNationality(customerDto.getNationality());
        customer.setNin(customerDto.getNin());
        customer.setBvn(customerDto.getBvn());

        // Contact address
        customer.setContactAddress(customerDto.getContactAddress());
        if (customerDto.getContactStateId() != null) {
            State state = stateRepository.findById(customerDto.getContactStateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact State not found"));
            customer.setContactState(state);
        }
        if (customerDto.getContactLgaId() != null) {
            LGA lga = lgaRepository.findById(customerDto.getContactLgaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact LGA not found"));
            customer.setContactLga(lga);
        }
        if (customerDto.getContactWardId() != null) {
            Ward ward = wardRepository.findById(customerDto.getContactWardId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact Ward not found"));
            customer.setContactWard(ward);
        }

        // Office address
        customer.setOfficeAddress(customerDto.getOfficeAddress());
        if (customerDto.getOfficeStateId() != null) {
            State state = stateRepository.findById(customerDto.getOfficeStateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Office State not found"));
            customer.setOfficeState(state);
        }
        if (customerDto.getOfficeLgaId() != null) {
            LGA lga = lgaRepository.findById(customerDto.getOfficeLgaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Office LGA not found"));
            customer.setOfficeLga(lga);
        }
        if (customerDto.getOfficeWardId() != null) {
            Ward ward = wardRepository.findById(customerDto.getOfficeWardId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Office Ward not found"));
            customer.setOfficeWard(ward);
        }

        // Next of kin address
        customer.setNextOfKin(customerDto.getNextOfKin());
        customer.setNextOfKinAddress(customerDto.getNextOfKinAddress());
        if (customerDto.getNextOfKinStateId() != null) {
            State state = stateRepository.findById(customerDto.getNextOfKinStateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Next of Kin State not found"));
            customer.setNextOfKinState(state);
        }
        if (customerDto.getNextOfKinLgaId() != null) {
            LGA lga = lgaRepository.findById(customerDto.getNextOfKinLgaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Next of Kin LGA not found"));
            customer.setNextOfKinLga(lga);
        }
        if (customerDto.getNextOfKinWardId() != null) {
            Ward ward = wardRepository.findById(customerDto.getNextOfKinWardId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Next of Kin Ward not found"));
            customer.setNextOfKinWard(ward);
        }

        customer.setPassport(saveImage(customerDto.getPassport(), "customer", baseUrl));
        customer.setSignature(saveImage(customerDto.getSignature(), "customer", baseUrl));
        customer.setGender(customerDto.getGender());
        customer.setCustomerType(CustomerTypeEnum.WALKIN);

        return customerRepository.save(customer);
    }

    private void updateCustomer(Customer customer, CustomerDto customerDto) {
        customer.setAccountNumber(customerDto.getAccountNumber());
        customer.setEmail(customerDto.getEmail());
        customer.setSurname(customerDto.getSurname());
        customer.setFirstName(customerDto.getFirstName());
        customer.setDob(customerDto.getDob());
        customer.setPhoneNumber(customerDto.getPhoneNumber());
        customer.setOccupation(customerDto.getOccupation());
        customer.setNationality(customerDto.getNationality());
        customer.setNin(customerDto.getNin());
        customer.setBvn(customerDto.getBvn());

        // Contact address
        customer.setContactAddress(customerDto.getContactAddress());
        if (customerDto.getContactStateId() != null) {
            State state = stateRepository.findById(customerDto.getContactStateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact State not found"));
            customer.setContactState(state);
        }
        if (customerDto.getContactLgaId() != null) {
            LGA lga = lgaRepository.findById(customerDto.getContactLgaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact LGA not found"));
            customer.setContactLga(lga);
        }
        if (customerDto.getContactWardId() != null) {
            Ward ward = wardRepository.findById(customerDto.getContactWardId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact Ward not found"));
            customer.setContactWard(ward);
        }

        // Office address
        customer.setOfficeAddress(customerDto.getOfficeAddress());
        if (customerDto.getOfficeStateId() != null) {
            State state = stateRepository.findById(customerDto.getOfficeStateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Office State not found"));
            customer.setOfficeState(state);
        }
        if (customerDto.getOfficeLgaId() != null) {
            LGA lga = lgaRepository.findById(customerDto.getOfficeLgaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Office LGA not found"));
            customer.setOfficeLga(lga);
        }
        if (customerDto.getOfficeWardId() != null) {
            Ward ward = wardRepository.findById(customerDto.getOfficeWardId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Office Ward not found"));
            customer.setOfficeWard(ward);
        }

        // Next of kin address
        customer.setNextOfKin(customerDto.getNextOfKin());
        customer.setNextOfKinAddress(customerDto.getNextOfKinAddress());
        if (customerDto.getNextOfKinStateId() != null) {
            State state = stateRepository.findById(customerDto.getNextOfKinStateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Next of Kin State not found"));
            customer.setNextOfKinState(state);
        }
        if (customerDto.getNextOfKinLgaId() != null) {
            LGA lga = lgaRepository.findById(customerDto.getNextOfKinLgaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Next of Kin LGA not found"));
            customer.setNextOfKinLga(lga);
        }
        if (customerDto.getNextOfKinWardId() != null) {
            Ward ward = wardRepository.findById(customerDto.getNextOfKinWardId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Next of Kin Ward not found"));
            customer.setNextOfKinWard(ward);
        }

        customer.setGender(customerDto.getGender());
    }

    public BaseResponse getCustomersDetails(Long customerId) {
        return new BaseResponse(HttpStatus.OK.value(), "successful", getCustomer(customerId));
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            // Split by forward slash
            String[] splitedFileName = fileName.split("/");

            // The last element will be the actual filename
            String imageFile = splitedFileName[splitedFileName.length - 1];
            // Everything before the last slash is the directory
            String uploadDir = String.join("/", Arrays.copyOfRange(splitedFileName, 0, splitedFileName.length - 1));

            Path uploadPath = Paths.get(uploadDir);
            Path file = uploadPath.resolve(imageFile);
            Resource resource = new UrlResource(file.toUri());

            System.out.println("file url " + file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the file!");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }

    public BaseResponse updateWalkinCustomer(Long customerId, CustomerDto customerDto, HttpServletRequest request) {

        Customer customer = getCustomer(customerId);

        String baseUrl = getBaseUrl(request);


        if (customerDto.getPassport() != null && !customerDto.getPassport().isEmpty()) {
            updateImage(customer, customerDto, "passport", baseUrl);
        }
        if (customerDto.getSignature() != null && !customerDto.getSignature().isEmpty()) {
            updateImage(customer, customerDto, "signature", baseUrl);
        }

        updateCustomer(customer, customerDto);

        return new BaseResponse(HttpStatus.OK.value(), "successful", customerRepository.save(customer));
    }

    private void updateImage(Customer customer, CustomerDto customerDto, String imageType, String baseUrl) {

        if ("passport".equals(imageType) && customerDto.getPassport() != null) {
            try {
                FileUploadUtil.deleteImage(customer.getPassport());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error", e);
            }
            customer.setPassport(saveImage(customerDto.getPassport(), "customer", baseUrl));
        } else if ("signature".equals(imageType) && customerDto.getSignature() != null) {
            try {
                FileUploadUtil.deleteImage(customer.getSignature());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error", e);
            }
            customer.setSignature(saveImage(customerDto.getSignature(), "customer", baseUrl));
        }
    }

    public BaseResponse getAllCustomers() {
        return new BaseResponse(HttpStatus.OK.value(), "successful", customerRepository.findAll());
    }

    public BaseResponse suspendCustomer(Long customerId, SuspendCustomerDto suspendCustomerDto) {
        Customer customer = getCustomer(customerId);

        customer.setSuspended(true);
        customer.setReasonForSuspension(suspendCustomerDto.getReasonForSuspension());

        customerRepository.save(customer);

        return new BaseResponse(HttpStatus.OK.value(), "successful", customerRepository.findById(customerId).get());
    }

    private Customer getCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid customer id"));
    }

    public BaseResponse unBlockCustomer(Long customerId, UnblockCustomerDto unblockCustomerDto) {
        Customer customer = getCustomer(customerId);

        customer.setSuspended(false);
        customer.setReasonForUnblocking(unblockCustomerDto.getReasonForUnblocking());

        customerRepository.save(customer);

        return new BaseResponse(HttpStatus.OK.value(), "successful", customerRepository.findById(customerId).get());
    }
    
    public BaseResponse getAllSuspendedCustomers(boolean suspended) {
        return new BaseResponse(HttpStatus.OK.value(), "successful", customerRepository.findBySuspended(suspended));
    }

    public BaseResponse getCustomerReportByType(String customerType, String startDate, String endDate,
                                                 String sortBy, int page, int size) {
        try {
            CustomerTypeEnum type = CustomerTypeEnum.valueOf(customerType);
            Specification<Customer> spec = Specification.where(hasCustomerType(type));

            // Add date range filter if provided
            if (startDate != null && endDate != null) {
                LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
                LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
                spec = spec.and(createdBetween(start, end));
            }

            // Determine sort field
            Sort sort = getSort(sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);

            Page<Customer> customers = customerRepository.findAll(spec, pageable);
            return new BaseResponse(HttpStatus.OK.value(), "successful", customers);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid customer type: " + customerType);
        }
    }

    public BaseResponse getSuspendedCustomerReportByType(String customerType, String startDate, String endDate,
                                                          String sortBy, int page, int size) {
        try {
            CustomerTypeEnum type = CustomerTypeEnum.valueOf(customerType);
            Specification<Customer> spec = Specification.where(hasCustomerType(type))
                    .and(isSuspended(true));

            // Add date range filter if provided
            if (startDate != null && endDate != null) {
                LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
                LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
                spec = spec.and(createdBetween(start, end));
            }

            // Determine sort field
            Sort sort = getSort(sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);

            Page<Customer> customers = customerRepository.findAll(spec, pageable);
            return new BaseResponse(HttpStatus.OK.value(), "successful", customers);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid customer type: " + customerType);
        }
    }

    public BaseResponse searchCustomers(String query, String customerType, String status, int page, int size) {
        Specification<Customer> spec = Specification.where(null);

        // Add search query filter
        if (query != null && !query.trim().isEmpty()) {
            spec = spec.and(searchByQuery(query.trim()));
        }

        // Add customer type filter
        if (customerType != null && !customerType.trim().isEmpty()) {
            try {
                CustomerTypeEnum type = CustomerTypeEnum.valueOf(customerType);
                spec = spec.and(hasCustomerType(type));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid customer type: " + customerType);
            }
        }

        // Add status filter
        if (status != null && !status.trim().isEmpty()) {
            boolean isSuspended = "suspended".equalsIgnoreCase(status);
            spec = spec.and(isSuspended(isSuspended));
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Customer> customers = customerRepository.findAll(spec, pageable);

        return new BaseResponse(HttpStatus.OK.value(), "successful", customers);
    }

    // Specification helper methods
    private Specification<Customer> hasCustomerType(CustomerTypeEnum type) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("customerType"), type);
    }

    private Specification<Customer> isSuspended(boolean suspended) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("suspended"), suspended);
    }

    private Specification<Customer> createdBetween(LocalDateTime start, LocalDateTime end) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.between(root.get("createdAt"), start, end);
    }

    private Specification<Customer> searchByQuery(String query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            String likeQuery = "%" + query.toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("accountNumber")), likeQuery),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), likeQuery),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), likeQuery),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("surname")), likeQuery),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNumber")), likeQuery)
            );
        };
    }

    private Sort getSort(String sortBy) {
        return switch (sortBy.toLowerCase()) {
            case "accountnumber" -> Sort.by("accountNumber").ascending();
            case "name" -> Sort.by("firstName").ascending().and(Sort.by("surname").ascending());
            default -> Sort.by("createdAt").descending();
        };
    }
}
