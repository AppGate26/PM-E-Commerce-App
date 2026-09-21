package com.appGate.rbac.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.LocationService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/states")
    public BaseResponse getAllStates() {
        return locationService.getAllStates();
    }

    @GetMapping("/states/{id}")
    public BaseResponse getStateById(@PathVariable Long id) {
        return locationService.getStateById(id);
    }

    @GetMapping("/states/{stateId}/lgas")
    public BaseResponse getLGAsByStateId(@PathVariable Long stateId) {
        return locationService.getLGAsByStateId(stateId);
    }

    @GetMapping("/lgas")
    public BaseResponse getAllLGAs() {
        return locationService.getAllLGAs();
    }

    @GetMapping("/lgas/{id}")
    public BaseResponse getLGAById(@PathVariable Long id) {
        return locationService.getLGAById(id);
    }

    @GetMapping("/lgas/{lgaId}/wards")
    public BaseResponse getWardsByLGAId(@PathVariable Long lgaId) {
        return locationService.getWardsByLGAId(lgaId);
    }

    @GetMapping("/wards")
    public BaseResponse getAllWards() {
        return locationService.getAllWards();
    }

    @GetMapping("/wards/{id}")
    public BaseResponse getWardById(@PathVariable Long id) {
        return locationService.getWardById(id);
    }
}
