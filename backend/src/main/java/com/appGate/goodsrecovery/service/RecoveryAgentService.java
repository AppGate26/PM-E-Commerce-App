package com.appGate.goodsrecovery.service;

import com.appGate.goodsrecovery.repository.RecoveryAgentRepository;
import com.appGate.rbac.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

import com.appGate.delivery.utils.FileUploadUtil;
import com.appGate.goodsrecovery.dto.RecoveryAgentDto;
import com.appGate.goodsrecovery.dto.SuspendRecoveryAgentDto;
import com.appGate.goodsrecovery.dto.UnsuspendRecoveryAgentDto;
import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.models.User;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.appGate.goodsrecovery.models.RecoveryAgent;

@Service
public class RecoveryAgentService {

    private final RecoveryAgentRepository recoveryAgentRepository;
    private final UserRepository userRepository;
    private final com.appGate.rbac.repository.BranchRepository branchRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    public RecoveryAgentService(RecoveryAgentRepository recoveryAgentRepository, UserRepository userRepository,
                                com.appGate.rbac.repository.BranchRepository branchRepository,
                                com.appGate.rbac.service.BranchScopeService branchScopeService) {
        this.recoveryAgentRepository = recoveryAgentRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.branchScopeService = branchScopeService;
    }

    public BaseResponse createRecoveryAgent(RecoveryAgentDto recoveryAgentDto, HttpServletRequest request) {

        String baseUrl  = getBaseurl(request);

        return new BaseResponse(HttpStatus.CREATED.value(), "Success", saveAgent(recoveryAgentDto, "recoveryAgent", baseUrl));
    }

    public BaseResponse getAllRecoveryAgents() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<RecoveryAgent> agents = branchId == null
                ? recoveryAgentRepository.findAll()
                : recoveryAgentRepository.findByBranchId(branchId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", agents);
    }

    public BaseResponse getRecoveryAgentById(Long id) {
        RecoveryAgent agent = getRecoveryAgent(id);
        return new BaseResponse(HttpStatus.OK.value(), "successful", agent);
    }

    public BaseResponse updateRecoveryAgent(Long id, RecoveryAgentDto recoveryAgentDto, HttpServletRequest request) {
        RecoveryAgent agent = getRecoveryAgent(id);
        String baseUrl = getBaseurl(request);

        if (recoveryAgentDto.getPassport() != null && !recoveryAgentDto.getPassport().isEmpty()) {
            updateImage(agent, recoveryAgentDto, "passport", baseUrl);
        }

        if (recoveryAgentDto.getSignature() != null && !recoveryAgentDto.getSignature().isEmpty()) {
            updateImage(agent, recoveryAgentDto, "signature", baseUrl);
        }

        if (recoveryAgentDto.getLicences() != null && !recoveryAgentDto.getLicences().isEmpty()) {
            updateImage(agent, recoveryAgentDto, "licences", baseUrl);
        }

        updateRecoveryAgentInfo(agent, recoveryAgentDto);

        return new BaseResponse(HttpStatus.OK.value(), "successful", recoveryAgentRepository.save(agent));
    }

    public BaseResponse deleteRecoveryAgent(Long id) {
        RecoveryAgent agent = getRecoveryAgent(id);

        // Note: You might want to add checks here for active recovery assignments
        recoveryAgentRepository.delete(agent);
        return new BaseResponse(HttpStatus.OK.value(), "Recovery agent deleted successfully", null);
    }

    public BaseResponse suspendRecoveryAgent(Long id, SuspendRecoveryAgentDto suspendDto) {
        RecoveryAgent agent = getRecoveryAgent(id);

        agent.setSuspended(true);
        agent.setReasonForSuspension(suspendDto.getReasonForSuspension());

        recoveryAgentRepository.save(agent);

        return new BaseResponse(HttpStatus.OK.value(), "successful", recoveryAgentRepository.findById(id).get());
    }

    public BaseResponse unsuspendRecoveryAgent(Long id, UnsuspendRecoveryAgentDto unsuspendDto) {
        RecoveryAgent agent = getRecoveryAgent(id);

        agent.setSuspended(false);
        agent.setReasonForUnblocking(unsuspendDto.getReasonForUnblocking());

        recoveryAgentRepository.save(agent);

        return new BaseResponse(HttpStatus.OK.value(), "successful", recoveryAgentRepository.findById(id).get());
    }

    public BaseResponse getSuspendedRecoveryAgents() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<RecoveryAgent> agents = branchId == null
                ? recoveryAgentRepository.findBySuspended(true)
                : recoveryAgentRepository.findBySuspendedAndBranchId(true, branchId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", agents);
    }

    public BaseResponse searchRecoveryAgents(String searchTerm) {
        List<RecoveryAgent> agents = recoveryAgentRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                searchTerm, searchTerm, searchTerm);
        Long branchId = branchScopeService.getScopedBranchId();
        if (branchId != null) {
            agents = agents.stream()
                    .filter(a -> branchId.equals(a.getBranchId()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return new BaseResponse(HttpStatus.OK.value(), "successful", agents);
    }

    private RecoveryAgent getRecoveryAgent(Long id) {
        RecoveryAgent agent = recoveryAgentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery agent not found!"));
        branchScopeService.assertCanAccess(agent.getBranchId());
        return agent;
    }

    private void updateRecoveryAgentInfo(RecoveryAgent agent, RecoveryAgentDto dto) {
        agent.setFirstName(dto.getFirstName());
        agent.setLastName(dto.getLastName());
        agent.setContactAddress(dto.getContactAddress());
        agent.setOfficeAddress(dto.getOfficeAddress());
        agent.setDob(dto.getDob());
        agent.setEmail(dto.getEmail());
        agent.setPhoneNumber(dto.getPhoneNumber());
        agent.setNationality(dto.getNationality());
        agent.setNin(dto.getNin());
        agent.setBvn(dto.getBvn());
        agent.setNextOfKin(dto.getNextOfKin());
        agent.setNextOfKinAddress(dto.getNextOfKinAddress());
        agent.setGender(dto.getGender());
    }

    private void updateImage(RecoveryAgent agent, RecoveryAgentDto dto, String imageType, String baseUrl) {
        if ("passport".equals(imageType) && dto.getPassport() != null) {
            try {
                if (agent.getPassport() != null) {
                    FileUploadUtil.deleteFile(agent.getPassport());
                }
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error", e);
            }
            agent.setPassport(saveImage(dto.getPassport(), "recoveryAgent", baseUrl));

        } else if ("signature".equals(imageType) && dto.getSignature() != null) {
            try {
                if (agent.getSignature() != null) {
                    FileUploadUtil.deleteFile(agent.getSignature());
                }
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error", e);
            }
            agent.setSignature(saveImage(dto.getSignature(), "recoveryAgent", baseUrl));

        } else if ("licences".equals(imageType) && dto.getLicences() != null) {
            try {
                if (agent.getLicences() != null) {
                    FileUploadUtil.deleteFile(agent.getLicences());
                }
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error", e);
            }
            agent.setLicences(saveImage(dto.getLicences(), "recoveryAgent", baseUrl));
        }
    }


    private RecoveryAgent saveAgent(RecoveryAgentDto recoveryAgentDto, String folder, String baseUrl) {

        
        Long branchId = branchScopeService.resolveWriteBranchId(null);

        User user = new User();
        user.setEmail(recoveryAgentDto.getEmail());
        user.setFirstName(recoveryAgentDto.getFirstName());
        user.setLastName(recoveryAgentDto.getLastName());
        user.setPassword(recoveryAgentDto.getEmail());
        user.setRole(RoleEnum.USER);
        user.setPhoneNumber(recoveryAgentDto.getPhoneNumber());
        // Post the agent's login to the branch that hired them, so their reads are
        // scoped to that branch rather than treated as a self-registered shopper.
        if (branchId != null) {
            branchRepository.findById(branchId).ifPresent(user::setBranch);
        }

        User newUser = userRepository.save(user);


        RecoveryAgent recoveryAgent = new RecoveryAgent();
        recoveryAgent.setUserId(newUser.getId());
        recoveryAgent.setLastName(recoveryAgentDto.getLastName());
        recoveryAgent.setFirstName(recoveryAgentDto.getFirstName());
        recoveryAgent.setPhoneNumber(recoveryAgentDto.getPhoneNumber());
        recoveryAgent.setEmail(recoveryAgentDto.getEmail());
        recoveryAgent.setContactAddress(recoveryAgentDto.getContactAddress());
        recoveryAgent.setOfficeAddress(recoveryAgentDto.getOfficeAddress());
        recoveryAgent.setDob(recoveryAgentDto.getDob());
        recoveryAgent.setNationality(recoveryAgentDto.getNationality());
        recoveryAgent.setNin(recoveryAgentDto.getNin());
        recoveryAgent.setBvn(recoveryAgentDto.getBvn());
        recoveryAgent.setGender(recoveryAgentDto.getGender());
        recoveryAgent.setNextOfKin(recoveryAgentDto.getNextOfKin());
        recoveryAgent.setNextOfKinAddress(recoveryAgentDto.getNextOfKinAddress());
        recoveryAgent.setPassport(saveImage(recoveryAgentDto.getPassport(), folder, baseUrl));
        recoveryAgent.setLicences(saveImage(recoveryAgentDto.getLicences(), folder, baseUrl));
        recoveryAgent.setSignature(saveImage(recoveryAgentDto.getSignature(), folder, baseUrl));

        return recoveryAgentRepository.save(recoveryAgent);
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

    private String getBaseurl(HttpServletRequest request){
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        String forwardedPrefix = request.getHeader("X-Forwarded-Prefix");

        //Build the original URL
        StringBuilder originalUrl = new StringBuilder();

        // Protocol (http or https)
        if (forwardedProto != null){
            originalUrl.append(forwardedProto).append("://");
        } else{
            originalUrl.append(request.getScheme()).append("://");
        }

        // host and port
        if(forwardedHost != null){
            originalUrl.append(forwardedHost);
        } else {
            originalUrl.append(request.getServerName());
            if (request.getServerPort() != 80 && request.getServerPort() != 443) {
                originalUrl.append(":").append(request.getServerPort());
            }
        }

        // Path prefix if any
        if (forwardedPrefix != null){
            originalUrl.append(forwardedPrefix);
        }

        return originalUrl.toString();
    }
}
