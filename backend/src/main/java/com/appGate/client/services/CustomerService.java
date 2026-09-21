package com.appGate.client.services;

import com.appGate.client.dto.CustomerDto;
import com.appGate.client.dto.SuspendCustomerDto;
import com.appGate.client.dto.UnblockCustomerDto;
import com.appGate.client.enums.CustomerTypeEnum;
import com.appGate.client.models.Customer;
import com.appGate.client.repository.CustomerRepository;
import com.appGate.client.response.BaseResponse;
import com.appGate.client.util.FileUploadUtil;
import com.appGate.account.service.WalletService;
import com.appGate.rbac.enums.ApprovalStatus;
import com.appGate.rbac.enums.ApprovalType;
import com.appGate.rbac.models.ApprovalRequest;
import com.appGate.rbac.models.State;
import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.Ward;
import com.appGate.rbac.repository.ApprovalRequestRepository;
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
    private final WalletService walletService;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;
    private final com.appGate.orderingsales.repository.SalesOrderRepository salesOrderRepository;
    private final com.appGate.orderingsales.service.SalesService salesService;

    public CustomerService(CustomerRepository customerRepository, StateRepository stateRepository,
                          LGARepository lgaRepository, WardRepository wardRepository,
                          WalletService walletService, ApprovalRequestRepository approvalRequestRepository,
                          com.appGate.rbac.service.BranchScopeService branchScopeService,
                          com.appGate.orderingsales.repository.SalesOrderRepository salesOrderRepository,
                          com.appGate.orderingsales.service.SalesService salesService) {
        this.customerRepository = customerRepository;
        this.stateRepository = stateRepository;
        this.lgaRepository = lgaRepository;
        this.wardRepository = wardRepository;
        this.walletService = walletService;
        this.branchScopeService = branchScopeService;
        this.approvalRequestRepository = approvalRequestRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.salesService = salesService;
    }

    public BaseResponse createWalkinCustomer(CustomerDto customerDto, HttpServletRequest request) {

        String baseUrl = getBaseUrl(request);

        Customer saved = saveCustomer(customerDto, baseUrl);

        // The customer stays pending (approved = false) until an admin approves this
        // registration from the Customer Registration approval queue.
        createRegistrationApproval(saved);

        return new BaseResponse(HttpStatus.CREATED.value(),
                "Customer registered and submitted for admin approval", saved);
    }

    private void createRegistrationApproval(Customer customer) {
        ApprovalRequest approval = new ApprovalRequest();
        approval.setApprovalType(ApprovalType.CUSTOMER_REGISTRATION);
        approval.setEntityId(customer.getId());
        approval.setRequestedBy(0L);
        approval.setStatus(ApprovalStatus.PENDING);

        String name = ((customer.getFirstName() == null ? "" : customer.getFirstName()) + " "
                + (customer.getSurname() == null ? "" : customer.getSurname())).trim();
        String account = customer.getAccountNumber() == null ? "" : customer.getAccountNumber();
        // Minimal display payload (values are escaped for JSON safety).
        approval.setRequestData(String.format(
                "{\"customerId\":%d,\"accountNumber\":\"%s\",\"name\":\"%s\"}",
                customer.getId(), jsonEscape(account), jsonEscape(name)));
        approval.setComments("Walk-in customer registration awaiting approval");

        approvalRequestRepository.save(approval);
    }

    private String jsonEscape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
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

        fileSavedPath = baseUrl + "/api/users/customer/image/" + fileSavedPath;

        System.out.println("fileSavedPath " + fileSavedPath);
        System.out.println("baseUrl " + baseUrl);

        return fileSavedPath;
    }

    private Customer saveCustomer(CustomerDto customerDto, String baseUrl) {

        Customer customer = new Customer();
        // Auto-set accountNumber to phoneNumber if not provided
        if (customerDto.getAccountNumber() != null && !customerDto.getAccountNumber().isBlank()) {
            customer.setAccountNumber(customerDto.getAccountNumber());
        } else {
            customer.setAccountNumber(customerDto.getPhoneNumber());
        }
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

        if (customerDto.getPassport() != null && !customerDto.getPassport().isEmpty()) {
            customer.setPassport(saveImage(customerDto.getPassport(), "customer", baseUrl));
        }
        if (customerDto.getSignature() != null && !customerDto.getSignature().isEmpty()) {
            customer.setSignature(saveImage(customerDto.getSignature(), "customer", baseUrl));
        }
        customer.setGender(customerDto.getGender());
        customer.setCustomerType(CustomerTypeEnum.WALKIN);

        Customer savedCustomer = customerRepository.save(customer);

        // Create wallet for the customer. A real Paystack Dedicated Virtual Account is provisioned
        // when Paystack is configured; otherwise it falls back to the phone-number placeholder.
        walletService.createCustomerWallet(
                savedCustomer.getId(),
                savedCustomer.getPhoneNumber(),
                savedCustomer.getEmail(),
                savedCustomer.getFirstName(),
                savedCustomer.getSurname());

        return savedCustomer;
    }

    // Every plain field below is null-guarded so a caller that only sends a subset of
    // fields (e.g. an edit form that only exposes address, or an older client unaware
    // of a newer field like gender/officeAddress/nextOfKin) doesn't wipe out the rest
    // of the customer's record to null - only the (relationship) State/LGA/Ward lookups
    // were guarded this way before, which silently erased gender/office
    // address/next-of-kin on every save from a form that didn't happen to collect them.
    private void updateCustomer(Customer customer, CustomerDto customerDto) {
        if (customerDto.getAccountNumber() != null) customer.setAccountNumber(customerDto.getAccountNumber());
        if (customerDto.getEmail() != null) customer.setEmail(customerDto.getEmail());
        if (customerDto.getSurname() != null) customer.setSurname(customerDto.getSurname());
        if (customerDto.getFirstName() != null) customer.setFirstName(customerDto.getFirstName());
        if (customerDto.getDob() != null) customer.setDob(customerDto.getDob());
        if (customerDto.getPhoneNumber() != null) customer.setPhoneNumber(customerDto.getPhoneNumber());
        if (customerDto.getOccupation() != null) customer.setOccupation(customerDto.getOccupation());
        if (customerDto.getNationality() != null) customer.setNationality(customerDto.getNationality());
        if (customerDto.getNin() != null) customer.setNin(customerDto.getNin());
        if (customerDto.getBvn() != null) customer.setBvn(customerDto.getBvn());

        // Contact address
        if (customerDto.getContactAddress() != null) customer.setContactAddress(customerDto.getContactAddress());
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
        if (customerDto.getOfficeAddress() != null) customer.setOfficeAddress(customerDto.getOfficeAddress());
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
        if (customerDto.getNextOfKin() != null) customer.setNextOfKin(customerDto.getNextOfKin());
        if (customerDto.getNextOfKinAddress() != null) customer.setNextOfKinAddress(customerDto.getNextOfKinAddress());
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

        if (customerDto.getGender() != null) customer.setGender(customerDto.getGender());
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

    public BaseResponse updateOnlineCustomer(Long customerId, CustomerDto customerDto, HttpServletRequest request) {

        Customer customer = getCustomer(customerId);

        String baseUrl = getBaseUrl(request);

        if (customerDto.getPassport() != null && !customerDto.getPassport().isEmpty()) {
            updateImage(customer, customerDto, "passport", baseUrl);
        }
        if (customerDto.getSignature() != null && !customerDto.getSignature().isEmpty()) {
            updateImage(customer, customerDto, "signature", baseUrl);
        }

        updateCustomer(customer, customerDto);

        return new BaseResponse(HttpStatus.OK.value(), "Online customer updated successfully", customerRepository.save(customer));
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
        // A branch manager only sees the customers their branch registered.
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                customerRepository.findAll(com.appGate.rbac.context.BranchSpecs.<Customer>ownedBy(
                        branchScopeService.getScopedBranchId())));
    }

    public BaseResponse suspendCustomer(Long customerId, SuspendCustomerDto suspendCustomerDto) {
        Customer customer = getCustomer(customerId);

        customer.setSuspended(true);
        customer.setReasonForSuspension(suspendCustomerDto.getReasonForSuspension());

        customerRepository.save(customer);

        return new BaseResponse(HttpStatus.OK.value(), "successful", customerRepository.findById(customerId).get());
    }

    /**
     * The single lookup behind details / update / suspend / unblock, so guarding it
     * here stops a branch user reaching another branch's customer by id.
     */
    private Customer getCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid customer id"));
        branchScopeService.assertCanAccess(customer.getBranchId());
        return customer;
    }

    public BaseResponse unBlockCustomer(Long customerId, UnblockCustomerDto unblockCustomerDto) {
        Customer customer = getCustomer(customerId);

        customer.setSuspended(false);
        customer.setReasonForUnblocking(unblockCustomerDto.getReasonForUnblocking());

        customerRepository.save(customer);

        return new BaseResponse(HttpStatus.OK.value(), "successful", customerRepository.findById(customerId).get());
    }
    
    public BaseResponse getAllSuspendedCustomers(boolean suspended) {
        Specification<Customer> spec = Specification.where(isSuspended(suspended))
                .and(branchScope());
        return new BaseResponse(HttpStatus.OK.value(), "successful", customerRepository.findAll(spec));
    }

    /** Restricts a customer query to the caller's branch (a no-op for head office). */
    private Specification<Customer> branchScope() {
        return com.appGate.rbac.context.BranchSpecs.ownedBy(branchScopeService.getScopedBranchId());
    }

    public BaseResponse getCustomerReportByType(String customerType, String startDate, String endDate,
                                                 String sortBy, int page, int size) {
        try {
            CustomerTypeEnum type = CustomerTypeEnum.valueOf(customerType);
            Specification<Customer> spec = Specification.where(hasCustomerType(type))
                    .and(branchScope());

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
                    .and(isSuspended(true))
                    .and(branchScope());

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
        Specification<Customer> spec = Specification.where(branchScope());

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
            jakarta.persistence.criteria.Predicate namePredicate = criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("accountNumber")), likeQuery),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), likeQuery),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), likeQuery),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("surname")), likeQuery),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNumber")), likeQuery)
            );

            try {
                Long idValue = Long.parseLong(query.trim());
                jakarta.persistence.criteria.Predicate idPredicate = criteriaBuilder.equal(root.get("id"), idValue);
                return criteriaBuilder.or(namePredicate, idPredicate);
            } catch (NumberFormatException e) {
                return namePredicate;
            }
        };
    }

    private Sort getSort(String sortBy) {
        return switch (sortBy.toLowerCase()) {
            case "accountnumber" -> Sort.by("accountNumber").ascending();
            case "name" -> Sort.by("firstName").ascending().and(Sort.by("surname").ascending());
            default -> Sort.by("createdAt").descending();
        };
    }

    public BaseResponse requestCustomerEdit(Long customerId, CustomerDto customerDto) {
        try {
            Customer customer = getCustomer(customerId);

            ApprovalRequest approval = new ApprovalRequest();
            approval.setApprovalType(ApprovalType.CUSTOMER_EDIT);
            approval.setEntityId(customerId);
            approval.setRequestedBy(0L);
            approval.setStatus(ApprovalStatus.PENDING);

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> editData = new java.util.HashMap<>();

            if (customerDto.getFirstName() != null) {
                editData.put("firstName", customerDto.getFirstName());
            }
            if (customerDto.getOtherNames() != null) {
                editData.put("otherNames", customerDto.getOtherNames());
            }
            if (customerDto.getSurname() != null) {
                editData.put("surname", customerDto.getSurname());
            }
            if (customerDto.getGender() != null) {
                editData.put("gender", customerDto.getGender());
            }
            if (customerDto.getDob() != null) {
                editData.put("dob", customerDto.getDob());
            }
            if (customerDto.getNationality() != null) {
                editData.put("nationality", customerDto.getNationality());
            }
            if (customerDto.getOccupation() != null) {
                editData.put("occupation", customerDto.getOccupation());
            }
            if (customerDto.getPhoneNumber() != null) {
                editData.put("phoneNumber", customerDto.getPhoneNumber());
            }
            if (customerDto.getEmail() != null) {
                editData.put("email", customerDto.getEmail());
            }
            if (customerDto.getContactAddress() != null) {
                editData.put("contactAddress", customerDto.getContactAddress());
            }
            if (customerDto.getOfficeAddress() != null) {
                editData.put("officeAddress", customerDto.getOfficeAddress());
            }
            if (customerDto.getNin() != null) {
                editData.put("nin", customerDto.getNin());
            }
            if (customerDto.getBvn() != null) {
                editData.put("bvn", customerDto.getBvn());
            }
            if (customerDto.getNextOfKin() != null) {
                editData.put("nextOfKin", customerDto.getNextOfKin());
            }
            if (customerDto.getNextOfKinAddress() != null) {
                editData.put("nextOfKinAddress", customerDto.getNextOfKinAddress());
            }

            approval.setRequestData(mapper.writeValueAsString(editData));
            approval.setComments("Customer edit submitted for admin approval");

            ApprovalRequest savedApproval = approvalRequestRepository.save(approval);

            return new BaseResponse(HttpStatus.CREATED.value(),
                    "Customer edit submitted for approval", savedApproval);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error submitting customer edit for approval: " + e.getMessage(), null);
        }
    }

    // Report Methods
    public BaseResponse getCustomerCreditReport(String startDate, String endDate) {
        try {
            var customers = customerRepository.findAll();
            var reportData = customers.stream().map(customer -> java.util.Map.of(
                    "customerName", (customer.getFirstName() != null ? customer.getFirstName() : "") + " " + (customer.getSurname() != null ? customer.getSurname() : ""),
                    "accountNumber", customer.getAccountNumber() != null ? customer.getAccountNumber() : "-",
                    "creditLimit", customer.getCreditLimit() != null ? customer.getCreditLimit() : 0,
                    "usedCredit", calculateUsedCredit(customer.getId()),
                    "availableCredit", (customer.getCreditLimit() != null ? customer.getCreditLimit() : 0) - calculateUsedCredit(customer.getId()),
                    "status", customer.getApproved() != null && customer.getApproved() ? "Active" : "Inactive",
                    "date", LocalDate.now().toString()
            )).toList();

            return new BaseResponse(HttpStatus.OK.value(), "Customer credit report retrieved successfully", reportData);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving customer credit report: " + e.getMessage(), null);
        }
    }

    // Was a stub that always returned an empty list regardless of the date range passed
    // in, so the One-Off Report never showed anything. One-off sales orders (single,
    // non-installment payment) already carry everything the report table needs.
    public BaseResponse getOneOffReport(String startDate, String endDate) {
        try {
            LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
            LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);

            var orders = salesOrderRepository.findByOrderTypeAndCreatedAtBetween(
                    com.appGate.orderingsales.enums.SalesOrderType.ONE_OFF, start, end, PageRequest.of(0, 1000))
                    .getContent();

            var reportData = orders.stream().map(order -> java.util.Map.of(
                    "referenceNo", order.getSalesReference() != null ? order.getSalesReference() : "-",
                    "customerName", order.getCustomerName() != null ? order.getCustomerName() : "-",
                    "accountNumber", order.getAccountNumber() != null ? order.getAccountNumber() : "-",
                    "transactionType", "One-Off Sale",
                    "amount", order.getTotalAmount() != null ? order.getTotalAmount() : java.math.BigDecimal.ZERO,
                    "description", "Order " + (order.getSalesReference() != null ? order.getSalesReference() : ""),
                    "date", order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate().toString() : "-",
                    "status", Boolean.TRUE.equals(order.getIsPaid()) ? "Completed" : "Pending"
            )).toList();

            return new BaseResponse(HttpStatus.OK.value(), "One-off report retrieved successfully", reportData);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving one-off report: " + e.getMessage(), null);
        }
    }

    // Was filtering on Customer.loanBalance, a column nothing in the app ever writes to
    // (credit sales are tracked on SalesOrder/LoanDetails instead) - so this report was
    // always empty. Drive it off the same real credit-sale data as the credit report.
    public BaseResponse getLoanRecoveryReport(String startDate, String endDate) {
        try {
            var customers = customerRepository.findAll();
            var reportData = customers.stream()
                    .map(customer -> java.util.Map.entry(customer, totalCreditExtended(customer.getId())))
                    .filter(entry -> entry.getValue() > 0)
                    .map(entry -> {
                        Customer customer = entry.getKey();
                        double loanAmount = entry.getValue();
                        double recovered = calculateRecoveredAmount(customer.getId());
                        return java.util.Map.of(
                                "customerName", (customer.getFirstName() != null ? customer.getFirstName() : "") + " " + (customer.getSurname() != null ? customer.getSurname() : ""),
                                "accountNumber", customer.getAccountNumber() != null ? customer.getAccountNumber() : "-",
                                "loanAmount", loanAmount,
                                "recoveredAmount", recovered,
                                "outstandingAmount", Math.max(loanAmount - recovered, 0.0),
                                "loanDate", customer.getCreatedAt() != null ? customer.getCreatedAt().toLocalDate().toString() : "-",
                                "dueDate", customer.getLoanDueDate() != null ? customer.getLoanDueDate().toString() : "-",
                                "recoveryStatus", determineRecoveryStatus(loanAmount, recovered)
                        );
                    }).toList();

            return new BaseResponse(HttpStatus.OK.value(), "Loan recovery report retrieved successfully", reportData);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving loan recovery report: " + e.getMessage(), null);
        }
    }

    /** Sum of a customer's CREDIT/INSTALLMENT sales order totals, excluding cancelled/refunded ones. */
    private double totalCreditExtended(Long customerId) {
        return salesOrderRepository.findByCustomerId(customerId, PageRequest.of(0, 1000)).getContent().stream()
                .filter(o -> o.getOrderType() == com.appGate.orderingsales.enums.SalesOrderType.CREDIT
                        || o.getOrderType() == com.appGate.orderingsales.enums.SalesOrderType.INSTALLMENT)
                .filter(o -> !Boolean.TRUE.equals(o.getIsRefunded()))
                .filter(o -> o.getStatus() != com.appGate.orderingsales.enums.OrderStatus.CANCELLED
                        && o.getStatus() != com.appGate.orderingsales.enums.OrderStatus.FAILED)
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0.0)
                .sum();
    }

    // Credit currently in use: what was extended on credit sales minus what has actually
    // been paid back. Was a stub always returning 0, which made "available credit" equal
    // the raw credit limit no matter how much of it a customer had already drawn down.
    private double calculateUsedCredit(Long customerId) {
        double extended = totalCreditExtended(customerId);
        double recovered = calculateRecoveredAmount(customerId);
        return Math.max(extended - recovered, 0.0);
    }

    // Total collected against a customer's CREDIT/INSTALLMENT orders specifically -
    // resolved order-by-order via SalesService.getRecoveredAmountForCreditOrders, which
    // reads the same per-order payment-progress logic the payment-tracking screens use
    // (correct for both walk-in and mobile-mirrored orders). Was a stub always
    // returning 0, then later summed *every* completed Payment row for the customer's
    // userId regardless of order type - which pulled in one-off/cash/orderless payments
    // and made this (and the credit/loan-recovery reports built on it) not tally.
    private double calculateRecoveredAmount(Long customerId) {
        return salesService.getRecoveredAmountForCreditOrders(customerId).doubleValue();
    }

    private String determineRecoveryStatus(double loanAmount, double recovered) {
        if (loanAmount <= 0) return "N/A";
        if (recovered >= loanAmount) return "Fully Recovered";
        if (recovered > 0) return "Partially Recovered";
        return "Outstanding";
    }
}
