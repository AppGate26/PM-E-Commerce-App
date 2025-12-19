package com.appGate.delivery.service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.appGate.delivery.dto.RiderDto;
import com.appGate.delivery.dto.SuspendRiderDto;
import com.appGate.delivery.dto.UnblockRiderDto;
import com.appGate.delivery.models.Rider;
import com.appGate.delivery.repository.RiderBoxRepository;
import com.appGate.delivery.repository.RiderRepository;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.utils.FileUploadUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;


@Service
public class RiderService {

    private final RiderRepository riderInfoRepository;
    private final RiderBoxRepository riderBoxRepository;

    public RiderService(RiderRepository riderInfoRepository, RiderBoxRepository riderBoxRepository) {
        this.riderInfoRepository = riderInfoRepository;
        this.riderBoxRepository = riderBoxRepository;
    }

    public BaseResponse createRider(RiderDto riderInfoDto, HttpServletRequest request){
       String baseUrl  = getBaseurl(request);

       return  new BaseResponse(HttpStatus.CREATED.value(),"Success", saveRider(riderInfoDto, baseUrl));
    }

    private   String getBaseurl(HttpServletRequest request){
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

    private String saveImage(MultipartFile file,  String heroGallery, String baseUrl){
        String fileSavePath = "";
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        try{
            fileSavePath = FileUploadUtil.saveImage(heroGallery, FileUploadUtil.generateUniqName(fileName), file);
        } catch (IOException e){
            throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error occurred while uploading image", e);
        }

        fileSavePath = baseUrl + "/api/users/rider/image/" + fileSavePath;

        System.out.println("file save path: " + fileSavePath);
        System.out.println("baseUrl " + baseUrl);

        return fileSavePath;
    }

    // save the rider info::
    private Rider saveRider(RiderDto riderInfoDto, String baseUrl){
        // create the rider instance::
        Rider riderInfo = new Rider();
        riderInfo.setSurName(riderInfoDto.getSurName());
        riderInfo.setOtherName(riderInfoDto.getOtherName());
        riderInfo.setContactAddress(riderInfoDto.getContactAddress());
        riderInfo.setOfficeAddress(riderInfoDto.getOfficeAddress());
        riderInfo.setDob(riderInfoDto.getDob());
        riderInfo.setEmail(riderInfoDto.getEmail());
        riderInfo.setPhoneNumber(riderInfoDto.getPhoneNumber());
        riderInfo.setNationality(riderInfoDto.getNationality());
        riderInfo.setNin(riderInfoDto.getNin());
        riderInfo.setBvn(riderInfoDto.getBvn());
        riderInfo.setNextOfKin(riderInfoDto.getNextOfKin());
        riderInfo.setNextOfKinAddress(riderInfoDto.getNextOfKinAddress());
        riderInfo.setPassport(saveImage(riderInfoDto.getPassport() , "riderGallery", baseUrl));
        riderInfo.setLicences(saveImage(riderInfoDto.getLicences() , "riderGallery", baseUrl));
        riderInfo.setSignature(saveImage(riderInfoDto.getSignature() , "riderGallery", baseUrl));
        riderInfo.setGender(riderInfoDto.getGender());

    return riderInfoRepository.save(riderInfo);
    }

    private void updateRiderInfo(Rider riderInfo, RiderDto riderInfoDto){
        riderInfo.setSurName(riderInfoDto.getSurName());
        riderInfo.setOtherName(riderInfoDto.getOtherName());
        riderInfo.setContactAddress(riderInfoDto.getContactAddress());
        riderInfo.setOfficeAddress(riderInfoDto.getOfficeAddress());
        riderInfo.setDob(riderInfoDto.getDob());
        riderInfo.setEmail(riderInfoDto.getEmail());
        riderInfo.setPhoneNumber(riderInfoDto.getPhoneNumber());
        riderInfo.setNationality(riderInfoDto.getNationality());
        riderInfo.setNin(riderInfoDto.getNin());
        riderInfo.setBvn(riderInfoDto.getBvn());
        riderInfo.setNextOfKin(riderInfoDto.getNextOfKin());
        riderInfo.setNextOfKinAddress(riderInfoDto.getNextOfKinAddress());
        riderInfo.setGender(riderInfoDto.getGender());
    }

    public BaseResponse getRiderDetails(Long riderId){
        return new BaseResponse(HttpStatus.OK.value(), "Success", getRider(riderId));
    }

    public Resource loadFileAsResource(String fileName){
        try {
            // Remove leading slash if present
            if (fileName.startsWith("/")) {
                fileName = fileName.substring(1);
            }

            // Construct the file path (relative to the current working directory)
            Path filePath = Paths.get(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            System.out.println("Attempting to load file: " + filePath.toAbsolutePath());
            System.out.println("File exists: " + Files.exists(filePath));
            System.out.println("File readable: " + Files.isReadable(filePath));

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found or not readable: " + fileName);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error:" + e.getMessage());
        }
    }

    public  BaseResponse updateRider(Long riderId, RiderDto riderInfoDto, HttpServletRequest request){
        Rider riderInfo = getRider(riderId);
        String baseUrl = getBaseurl(request);

        if (riderInfoDto.getPassport() != null && !riderInfoDto.getPassport().isEmpty()) {
            updateImage(riderInfo, riderInfoDto,  "passport", baseUrl);
        }

        if (riderInfoDto.getSignature() != null && !riderInfoDto.getSignature().isEmpty()) {
            updateImage(riderInfo, riderInfoDto,  "signature", baseUrl);
        }

        if (riderInfoDto.getLicences() != null && !riderInfoDto.getLicences().isEmpty()) {
            updateImage(riderInfo, riderInfoDto,  "licences", baseUrl);
        }

        updateRiderInfo(riderInfo, riderInfoDto);

        return new BaseResponse(HttpStatus.OK.value(), "successful", riderInfoRepository.save(riderInfo));
    }

    private void updateImage(Rider riderInfo, RiderDto riderInfoDto, String imageType, String baseUrl){
        if ("passport".equals(imageType) && riderInfoDto.getPassport() !=null) {
            try{
                FileUploadUtil.deleteFile(riderInfo.getPassport());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error",e);
            }
            riderInfo.setPassport(saveImage(riderInfoDto.getPassport() , "passport", baseUrl));

        } else if ("signature".equals(imageType) && riderInfoDto.getSignature() !=null) {
            try{
                FileUploadUtil.deleteFile(riderInfo.getSignature());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error",e);
            }
            riderInfo.setSignature(saveImage(riderInfoDto.getSignature() , "signature", baseUrl));

        } else if ("licences".equals(imageType) && riderInfoDto.getLicences() !=null) {
            try{
                FileUploadUtil.deleteFile(riderInfo.getLicences());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error",e);
            }
            riderInfo.setLicences(saveImage(riderInfoDto.getLicences() , "licences", baseUrl));
        }
    }



    public  BaseResponse getAllRidersInfo(){
        return new BaseResponse(HttpStatus.OK.value(), "successful", riderInfoRepository.findAll());
    }


    public  BaseResponse suspendRider(Long riderId, SuspendRiderDto suspendRiderDto){
        Rider rider = getRider(riderId);

        rider.setSuspended(true);
        rider.setReasonForSuspension(suspendRiderDto.getReasonForSuspension());

        riderInfoRepository.save(rider);

        return new BaseResponse(HttpStatus.OK.value(),"successful",riderInfoRepository.findById(riderId).get());

    }

    private Rider getRider(Long riderId){
        return riderInfoRepository.findById(riderId).orElseThrow( ()  -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider not found!"));
    }

    public  BaseResponse unBlockRider(Long riderId, UnblockRiderDto unblockRiderDto){
        Rider rider = getRider(riderId);

        rider.setSuspended(false);
        rider.setReasonForUnblocking(unblockRiderDto.getReasonForUnblocking());

        riderInfoRepository.save(rider);

        return new BaseResponse(HttpStatus.OK.value(), "successful", riderInfoRepository.findById(riderId).get());

    }

    public BaseResponse getAllSuspendedRider(boolean suspended){
        return  new BaseResponse(HttpStatus.OK.value(), "successful",riderInfoRepository.findBySuspended(suspended));
    }

    public BaseResponse deleteRider(Long riderId) {
        Rider rider = getRider(riderId);

        // Check if rider has pending or active deliveries
        List<com.appGate.delivery.models.RiderBox> activeBoxes = riderBoxRepository.findByRiderIdAndStatus(
                riderId,
                com.appGate.delivery.enums.RiderBoxStatusEnum.PENDING
        );

        if (!activeBoxes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot delete rider with active deliveries. Please reassign or complete deliveries first.");
        }

        riderInfoRepository.delete(rider);
        return new BaseResponse(HttpStatus.OK.value(), "Rider deleted successfully", null);
    }

    public BaseResponse getRiderDeliveries(Long riderId) {
        Rider rider = getRider(riderId);

        List<com.appGate.delivery.models.RiderBox> deliveries = riderBoxRepository.findByRiderId(riderId);

        Map<String, Object> response = new HashMap<>();
        response.put("riderId", riderId);
        response.put("riderName", rider.getSurName() + " " + rider.getOtherName());
        response.put("totalDeliveries", deliveries.size());
        response.put("deliveries", deliveries);

        return new BaseResponse(HttpStatus.OK.value(), "Rider deliveries retrieved successfully", response);
    }












}
