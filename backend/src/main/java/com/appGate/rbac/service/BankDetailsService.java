package com.appGate.rbac.service;


import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.appGate.rbac.repository.BankDetailsRepository;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.models.BankDetails;
import com.appGate.rbac.models.EmploymentInformation;
import com.appGate.rbac.models.User;
import com.appGate.rbac.dto.BankDetailsDto;

@Service
public class BankDetailsService {

    private final BankDetailsRepository bankDetailsRepository;

    public BankDetailsService(BankDetailsRepository bankDetailsRepository) {
        this.bankDetailsRepository = bankDetailsRepository;
    }

    public BaseResponse getBankDetails(Long userId) {
        // Logic to fetch bank details for the user
        BankDetails bankDetails = bankDetailsRepository.findByUserId(userId);
        if (bankDetails != null) {
        return new BaseResponse(HttpStatus.OK.value(), "Bank Details fetched successfully", bankDetails);
        }
        return null;
    }

    public BaseResponse saveAndUpdateBankDetails(BankDetailsDto bankDetailsDto) {

        ModelMapper modelMapper = new ModelMapper();
        // userId tokenizes to ["user","id"], which ModelMapper's standard
        // matching can ambiguously map onto BankDetails#id instead of
        // BankDetails#user.id, corrupting the entity's primary key. Skip
        // both and set them explicitly instead.
        modelMapper.typeMap(BankDetailsDto.class, BankDetails.class).addMappings(mapper -> {
            mapper.skip(BankDetails::setId);
            mapper.skip(BankDetails::setUser);
        });

        BankDetails existingBankDetails = bankDetailsRepository.findByUserId(bankDetailsDto.getUserId());
        String message;
        if (existingBankDetails != null) {
            modelMapper.map(bankDetailsDto, existingBankDetails);
            message = "Bank details updated successfully";
        } else {
            existingBankDetails = modelMapper.map(bankDetailsDto, BankDetails.class);
            User user = new User();
            user.setId(bankDetailsDto.getUserId());
            existingBankDetails.setUser(user);
            message = "Bank details saved successfully";
        }

        existingBankDetails = bankDetailsRepository.save(existingBankDetails);

        return new BaseResponse(HttpStatus.OK.value(), message, existingBankDetails);
    }
    
}
