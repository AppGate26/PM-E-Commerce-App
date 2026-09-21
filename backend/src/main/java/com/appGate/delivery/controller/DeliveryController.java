package com.appGate.delivery.controller;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

import com.appGate.delivery.dto.RiderDto;
import com.appGate.delivery.dto.SuspendRiderDto;
import com.appGate.delivery.dto.UnblockRiderDto;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.RiderService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "/api")
public class DeliveryController {

    private final RiderService riderService;


    public DeliveryController(RiderService riderInfoService){
        this.riderService = riderInfoService;
    }

    @PostMapping(value = "/admin/createRiderInfo", consumes =  "multipart/form-data")
    public BaseResponse createRiderInfo(@ModelAttribute RiderDto riderInfoDto, HttpServletRequest request){
     return  riderService.createRider(riderInfoDto,request);
    }

    @GetMapping(path = "/users/rider/{riderId}")
    public BaseResponse getRiderInfoDetails(@PathVariable Long riderId){
        return  riderService.getRiderDetails(riderId);
    }

    @PutMapping(value = "/admin/updateRiderInfo/{riderId}")
    public BaseResponse updateRiderInfo(@PathVariable Long riderId, @ModelAttribute RiderDto riderInfoDto, HttpServletRequest request){
        return riderService.updateRider(riderId,riderInfoDto,request);
    }

    @GetMapping(path = "/admin/riders")
    public BaseResponse getAllRiders(){
        return riderService.getAllRidersInfo();
    }

    @GetMapping(path = "/users/rider/image/**", produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE})
    public ResponseEntity<Resource> downloadImage(HttpServletRequest request){
        String fullPath = request.getRequestURI().split("/users/rider/image")[1];
        Resource resource = riderService.loadFileAsResource(fullPath);

        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(resource);
    }

    @PutMapping(value = "/admin/suspendRider/{riderId}")
    public BaseResponse suspendRider(@PathVariable Long riderId, @Valid @RequestBody SuspendRiderDto suspendRiderDto){
        return riderService.suspendRider(riderId,suspendRiderDto);
    }

    @PutMapping(value = "/admin/unblockRider/{riderId}")
    public BaseResponse unBlockRider(@PathVariable Long riderId , @Valid @RequestBody UnblockRiderDto unblockRiderDto){
        return riderService.unBlockRider(riderId, unblockRiderDto);
    }

    @GetMapping(value = "/admin/getAllSuspendRider")
    public BaseResponse getAllSuspendRider(){
     return riderService.getAllSuspendedRider(true);
    }

    @DeleteMapping(value = "/admin/riders/{riderId}")
    public BaseResponse deleteRider(@PathVariable Long riderId) {
        return riderService.deleteRider(riderId);
    }

    @GetMapping(value = "/admin/riders/{riderId}/deliveries")
    public BaseResponse getRiderDeliveries(@PathVariable Long riderId) {
        return riderService.getRiderDeliveries(riderId);
    }
}

