package com.appGate.inventory.service;

import java.util.List;

import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import org.springframework.web.server.ResponseStatusException;

import com.appGate.inventory.dto.SupplierDto;
import com.appGate.inventory.models.Supplier;
import com.appGate.inventory.repository.SupplierRepository;
import com.appGate.inventory.response.BaseResponse;

@Service
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }
    public BaseResponse createSupplier(SupplierDto SupplierDto){

        ModelMapper modelMapper = new ModelMapper();
        Supplier supplier = modelMapper.map(SupplierDto, Supplier.class);

        Supplier newSupplier = supplierRepository.save(supplier);

        return new BaseResponse(HttpStatus.CREATED.value(), "successful", newSupplier);
    }

    public BaseResponse getAllSuppliers() {
        List<Supplier> suppliers = supplierRepository.findAll();

        return new BaseResponse(HttpStatus.OK.value(), "successful", suppliers);
    }

    public BaseResponse getSupplier(Long id) {

        Supplier Supplier = getOneSupplier(id);

        return new BaseResponse(HttpStatus.OK.value(), "successful", Supplier);
    }

    public BaseResponse updateSupplier(Long id, SupplierDto supplierDto) {

        Supplier supplier = getOneSupplier(id);

        supplier.setContactEmail(supplierDto.getContactEmail());
        supplier.setContactName(supplierDto.getContactName());
        supplier.setContactPhoneNo(supplierDto.getContactPhoneNo());
        supplier.setCustomerName(supplierDto.getCustomerName());
        supplier.setPassportImage(supplierDto.getPassportImage());
        supplier.setDeliveryTerms(supplierDto.getDeliveryTerms());
        supplier.setPaymentTerms(supplierDto.getPaymentTerms());
        supplier.setAddress(supplierDto.getAddress());

        supplierRepository.save(supplier);

        return new BaseResponse(HttpStatus.OK.value(), "successful", getOneSupplier(id));
    }

    private Supplier getOneSupplier(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid id"));
    }
}
