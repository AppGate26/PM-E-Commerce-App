package com.appGate.rbac.service;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.appGate.rbac.dto.EmploymentInformationDto;
import com.appGate.rbac.dto.PersonalInformationDto;
import com.appGate.rbac.models.Profile;
import com.appGate.rbac.models.User;
import com.appGate.rbac.models.UtilityBill;
import com.appGate.rbac.models.State;
import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.Ward;
import com.appGate.rbac.repository.EmploymentInformationRepository;
import com.appGate.rbac.repository.ProfileRepository;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.repository.UtilityBIllRepository;
import com.appGate.rbac.repository.StateRepository;
import com.appGate.rbac.repository.LGARepository;
import com.appGate.rbac.repository.WardRepository;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.util.FileUploadUtil;

import org.modelmapper.ModelMapper;

import com.appGate.rbac.models.EmploymentInformation;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class VerificationService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final UtilityBIllRepository utilityBillRepository;
    private final EmploymentInformationRepository employmentRepository;
    private final StateRepository stateRepository;
    private final LGARepository lgaRepository;
    private final WardRepository wardRepository;

    public VerificationService(ProfileRepository profileRepository, UserRepository userRepository,
            UtilityBIllRepository utilityBillRepository, EmploymentInformationRepository employmentRepository,
            StateRepository stateRepository, LGARepository lgaRepository, WardRepository wardRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.utilityBillRepository = utilityBillRepository;
        this.employmentRepository = employmentRepository;
        this.stateRepository = stateRepository;
        this.lgaRepository = lgaRepository;
        this.wardRepository = wardRepository;
    }

    public BaseResponse saveEmploymentInformation(EmploymentInformationDto employmentInfoDto) {
        User user = getUser(employmentInfoDto.getUserId());

        ModelMapper modelMapper = new ModelMapper();

        EmploymentInformation existingEmploymentInfo = employmentRepository.findByUserId(user.getId()); 
        
        EmploymentInformation employmentInformation;
        String message;
        
        if (existingEmploymentInfo == null) {
            employmentInformation = modelMapper.map(employmentInfoDto, EmploymentInformation.class);
            message = "Employment information saved successfully";
        } else {
               modelMapper.map(employmentInfoDto, existingEmploymentInfo);
            employmentInformation = existingEmploymentInfo;
            message = "Employment information updated successfully";
        }

        employmentInformation = employmentRepository.save(employmentInformation);

        return new BaseResponse(HttpStatus.OK.value(), message, employmentInformation);
    }

    public BaseResponse savePersonalInformation(PersonalInformationDto personalInformationDto,
            HttpServletRequest request) {
        User user = getUser(personalInformationDto.getUserId());

        String baseUrl = getBaseUrl(request);

        return new BaseResponse(HttpStatus.CREATED.value(), "Verification saved successfully",
                saveProfile(personalInformationDto, user, baseUrl));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user id"));
    }

    private Profile saveProfile(PersonalInformationDto personalInformationDto, User user, String baseUrl) {
        Profile profile = new Profile();

        UtilityBill utilityBill = new UtilityBill();
        utilityBill.setUser(user);
        utilityBill.setUtilityBillPicture(saveImage(personalInformationDto.getUtilityBillPicture(), "utilityBill", baseUrl));
        utilityBill.setUtilityBill(personalInformationDto.getUtilityBillType());
        UtilityBill utilityBillSaved = utilityBillRepository.save(utilityBill);

        profile.setUser(user);
        profile.setFirstName(personalInformationDto.getFirstName());
        profile.setLastName(personalInformationDto.getLastName());
        profile.setEmail(personalInformationDto.getEmail());
        profile.setHomeAddress(personalInformationDto.getHomeAddress());
        profile.setPhoneNumber(personalInformationDto.getPhoneNumber());

        // Set state, LGA, ward using IDs
        if (personalInformationDto.getStateId() != null) {
            State state = stateRepository.findById(personalInformationDto.getStateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "State not found"));
            profile.setState(state);
        }

        if (personalInformationDto.getLgaId() != null) {
            LGA lga = lgaRepository.findById(personalInformationDto.getLgaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "LGA not found"));
            profile.setLga(lga);
        }

        if (personalInformationDto.getWardId() != null) {
            Ward ward = wardRepository.findById(personalInformationDto.getWardId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ward not found"));
            profile.setWard(ward);
        }

        profile.setGender(personalInformationDto.getGender());
        profile.setMaritalStatus(personalInformationDto.getMaritalStatus());
        profile.setDateOfBirth(personalInformationDto.getDateOfBirth());
        profile.setVerificationStatus(false);
        profile.setUtilityBill(utilityBillSaved);

        return profileRepository.save(profile);
    }

    private String saveImage(MultipartFile file, String uploadDir, String baseUrl) {

        String fileSavedPath = "";
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        try {
            fileSavedPath = FileUploadUtil.saveImage(uploadDir, FileUploadUtil.generateUniqueName(fileName), file);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error", e);
        }

        return baseUrl + "/api/users/customer/image/" + fileSavedPath;
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

}
