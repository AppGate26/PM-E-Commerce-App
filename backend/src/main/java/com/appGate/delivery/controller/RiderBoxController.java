package com.appGate.delivery.controller;

import com.appGate.delivery.dto.RiderBoxDto;
import com.appGate.delivery.enums.RiderBoxStatusEnum;
import com.appGate.delivery.models.RiderBox;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.RiderBoxService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class RiderBoxController {

    private final RiderBoxService riderBoxService;

    public RiderBoxController( RiderBoxService riderBoxService){
        this.riderBoxService = riderBoxService;
    }

    @PostMapping("/admin/assign-product")
    public ResponseEntity<BaseResponse> assignProduct(@RequestBody RiderBoxDto riderBoxDto){
        BaseResponse response = riderBoxService.assignProduct(riderBoxDto);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PutMapping("/admin/accept/{productId}")
    public ResponseEntity<BaseResponse> acceptProduct(@PathVariable Long productId){
        return ResponseEntity.ok(riderBoxService.acceptProduct(productId));
    }

    @PutMapping("/admin/deliver/{productId}")
    public ResponseEntity<BaseResponse> deliverProduct(@PathVariable Long productId){
        return ResponseEntity.ok(riderBoxService.deliverProduct(productId));
    }

    @PutMapping("/admin/reject/{productId}")
    public ResponseEntity<BaseResponse> rejectProduct(@PathVariable Long productId){
        return ResponseEntity.ok(riderBoxService.rejectProduct(productId));
    }

    @GetMapping("/admin/rider-boxes")
    public ResponseEntity<BaseResponse> getProductsByStatus(@RequestParam RiderBoxStatusEnum status){
      return ResponseEntity.ok(riderBoxService.getProductsByStatus(status));
    }

}
