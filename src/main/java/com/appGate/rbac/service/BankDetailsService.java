package com.appGate.rbac.service;


import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.appGate.rbac.repository.BankDetailsRepository;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.models.BankDetails;
import com.appGate.rbac.models.EmploymentInformation;
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
        BankDetails existingBankDetails = bankDetailsRepository.findByUserId(bankDetailsDto.getUserId());
        String message;
        if (existingBankDetails != null) {
            modelMapper.map(bankDetailsDto, existingBankDetails);
            message = "Bank details updated successfully";
        } else {
            existingBankDetails = modelMapper.map(bankDetailsDto, BankDetails.class);
            message = "Bank details saved successfully";
        }
        
        existingBankDetails = bankDetailsRepository.save(existingBankDetails);

        return new BaseResponse(HttpStatus.OK.value(), message, existingBankDetails);
    }
    
}
