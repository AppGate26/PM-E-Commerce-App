package com.appGate.delivery.service;

import com.appGate.delivery.dto.RiderBoxDto;
import com.appGate.delivery.enums.RiderBoxStatusEnum;
import com.appGate.delivery.models.Rider;
import com.appGate.delivery.models.RiderBox;
import com.appGate.delivery.repository.RiderBoxRepository;
import com.appGate.delivery.repository.RiderRepository;
import com.appGate.delivery.response.BaseResponse;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RiderBoxService {
    private final RiderBoxRepository riderBoxRepository;
    private final RiderRepository riderRepository;

    public RiderBoxService(RiderBoxRepository riderBoxRepository, RiderRepository riderRepository){
     this.riderBoxRepository = riderBoxRepository;
     this.riderRepository = riderRepository;
    }

    // Assign an order to a rider (Defaults to PENDING)
    @Transactional
    public  BaseResponse assignProduct(RiderBoxDto riderBoxDto){

        Long saleRef = riderBoxDto.getSaleRef();
        Long riderId = riderBoxDto.getRiderId();
        Long orderId = riderBoxDto.getOrderId();
        // check if  the Rider ID exists
        Optional<Rider> existingRider = riderRepository.findById(riderId);
        if(existingRider.isEmpty()){
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Rider not found", null);
        }

        // check if the order is already assigned
        Optional<RiderBox> existingOrder = riderBoxRepository.findBySaleRef(saleRef);
        if (existingOrder.isPresent()){
            return  new BaseResponse(HttpStatus.BAD_REQUEST.value(),  "Order already assigned",null);
        }

        //Create a new RiderBox entry
        RiderBox riderBox = new RiderBox();
        riderBox.setSaleRef(saleRef);
        riderBox.setRider(existingRider.get());
        riderBox.setStatus(RiderBoxStatusEnum.PENDING);
        riderBox.setOrderId(orderId);

        RiderBox savedRiderBox =  riderBoxRepository.save(riderBox);

        return new BaseResponse(HttpStatus.CREATED.value(), "Order assigned successfully",savedRiderBox);

    }


    @Transactional
    public BaseResponse acceptProduct(Long productId){
        Optional<RiderBox> riderBoxOpt = riderBoxRepository.findById(productId);
        if (riderBoxOpt.isEmpty()){
            return  new BaseResponse(HttpStatus.NOT_FOUND.value(), "Product not found", null);
        }

        RiderBox riderBox  = riderBoxOpt.get();
        riderBox.setStatus(RiderBoxStatusEnum.ACCEPTED);
        riderBoxRepository.save(riderBox);

        return new BaseResponse(HttpStatus.OK.value(), "Product accepted", riderBox);
    }

    @Transactional
    public BaseResponse rejectProduct(Long productId){
        Optional<RiderBox> riderBoxOpt = riderBoxRepository.findById(productId);
        if (riderBoxOpt.isEmpty()){
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Product not found", null);
        }

        RiderBox riderBox = riderBoxOpt.get();
        riderBox.setStatus(RiderBoxStatusEnum.REJECTED);
        riderBoxRepository.save(riderBox);

        return new BaseResponse(HttpStatus.OK.value(), "Product rejected", riderBox);
    }

    @Transactional
    public  BaseResponse deliverProduct(Long productId){
        Optional<RiderBox> riderBoxOpt = riderBoxRepository.findById(productId);
        if (riderBoxOpt.isEmpty()){
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Product not found", null);
        }

        RiderBox riderBox = riderBoxOpt.get();
        riderBox.setStatus(RiderBoxStatusEnum.DELIVERED);
        riderBoxRepository.save(riderBox);

        return new BaseResponse(HttpStatus.OK.value(), "Product delivered", riderBox);
    }

     public BaseResponse getProductsByStatus(RiderBoxStatusEnum status){
         List<RiderBox> products =  riderBoxRepository.findByStatus(status);

         if(products.isEmpty()){
             return new BaseResponse(HttpStatus.OK.value(), "No products found with status " + status, null);
         }

         return new BaseResponse(HttpStatus.OK.value(), "Products fetched successfully",products);
     }

}
