package com.appGate.delivery.service;

import com.appGate.delivery.dto.RiderBoxDto;
import com.appGate.delivery.dto.RiderBoxViewDto;
import com.appGate.delivery.enums.RiderBoxStatusEnum;
import com.appGate.delivery.models.Rider;
import com.appGate.delivery.models.RiderBox;
import com.appGate.delivery.repository.RiderBoxRepository;
import com.appGate.delivery.repository.RiderRepository;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.repository.SalesOrderRepository;
import com.appGate.orderingsales.service.MobileSalesOrderSyncService;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RiderBoxService {
    private final RiderBoxRepository riderBoxRepository;
    private final RiderRepository riderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final OrderRepository orderRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;
    private final MobileSalesOrderSyncService mobileSalesOrderSyncService;

    public RiderBoxService(RiderBoxRepository riderBoxRepository, RiderRepository riderRepository,
                           SalesOrderRepository salesOrderRepository,
                           OrderRepository orderRepository,
                           com.appGate.rbac.service.BranchScopeService branchScopeService,
                           MobileSalesOrderSyncService mobileSalesOrderSyncService){
     this.riderBoxRepository = riderBoxRepository;
     this.riderRepository = riderRepository;
     this.salesOrderRepository = salesOrderRepository;
     this.orderRepository = orderRepository;
     this.branchScopeService = branchScopeService;
     this.mobileSalesOrderSyncService = mobileSalesOrderSyncService;
    }

    /** Load a box and refuse it if it belongs to another branch. */
    private Optional<RiderBox> loadBoxInScope(Long boxId){
        Optional<RiderBox> box = riderBoxRepository.findById(boxId);
        box.ifPresent(b -> branchScopeService.assertCanAccess(b.getBranchId()));
        return box;
    }

    // Assign an order (not a bare product) to a rider (Defaults to PENDING), then moves the
    // order itself to ASSIGNED_TO_RIDER so it drops out of the "ready for rider" list and
    // can't be double-assigned.
    @Transactional
    public  BaseResponse assignProduct(RiderBoxDto riderBoxDto){

        Long riderId = riderBoxDto.getRiderId();
        Long salesOrderId = riderBoxDto.getSalesOrderId();

        // check if  the Rider ID exists
        Optional<Rider> existingRider = riderRepository.findById(riderId);
        if(existingRider.isEmpty()){
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Rider not found", null);
        }
        // A branch may only dispatch through its own riders.
        branchScopeService.assertCanAccess(existingRider.get().getBranchId());

        if (salesOrderId == null) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Order reference is required", null);
        }
        SalesOrder salesOrder = salesOrderRepository.findById(salesOrderId).orElse(null);
        if (salesOrder == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Order not found", null);
        }
        Long mobileOrderId = salesOrder.getMobileOrderId();
        boolean isWalkIn = mobileOrderId == null;

        // check if the order is already assigned. saleRef is unique per order, so a
        // previously REJECTED box is reused (reassigned to the new rider) instead of blocking
        // forever - otherwise a rejected delivery could never be handed to another rider.
        Optional<RiderBox> existingAssignment = isWalkIn
                ? riderBoxRepository.findBySalesOrderId(salesOrderId)
                : riderBoxRepository.findByOrderId(mobileOrderId);
        if (existingAssignment.isPresent() && existingAssignment.get().getStatus() != RiderBoxStatusEnum.REJECTED){
            return  new BaseResponse(HttpStatus.BAD_REQUEST.value(),  "Order already assigned",null);
        }

        RiderBox riderBox = existingAssignment.orElseGet(RiderBox::new);
        if (isWalkIn) {
            // Walk-in sale: no mobile Order counterpart to key off, so reference the
            // SalesOrder directly (see ORDERING #4). saleRef still needs a value distinct
            // from any mobile order id sharing this column's unique constraint - offset it
            // into a range mobile Order ids (also positive, autoincrement) will never reach.
            riderBox.setOrderId(null);
            riderBox.setSalesOrderId(salesOrderId);
            riderBox.setSaleRef(-salesOrderId);
        } else {
            riderBox.setOrderId(mobileOrderId);
            riderBox.setSalesOrderId(null);
            riderBox.setSaleRef(mobileOrderId);
        }
        riderBox.setRider(existingRider.get());
        riderBox.setStatus(RiderBoxStatusEnum.PENDING);

        RiderBox savedRiderBox;
        try {
            savedRiderBox = riderBoxRepository.save(riderBox);
        } catch (DataIntegrityViolationException e) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Order already assigned", null);
        }

        salesOrder.setStatus(OrderStatus.ASSIGNED_TO_RIDER);
        salesOrderRepository.save(salesOrder);

        // Mirror the assignment onto the mobile Order too, so rider-facing order listings
        // (OrderService.getRiderOrders) and downstream delivery status updates key off a
        // consistent riderId/orderStatus/deliveryStatus instead of only the SalesOrder mirror.
        // No mobile Order exists for a walk-in sale, so there's nothing to mirror onto.
        if (!isWalkIn) {
            orderRepository.findById(mobileOrderId).ifPresent(order -> {
                order.setRiderId(riderId);
                order.setOrderStatus(OrderStatus.ASSIGNED_TO_RIDER);
                order.setDeliveryStatus(DeliveryStatus.AWAITING_PICKUP);
                orderRepository.save(order);
            });
        }

        return new BaseResponse(HttpStatus.CREATED.value(), "Order assigned to rider successfully", savedRiderBox);

    }


    @Transactional
    public BaseResponse acceptProduct(Long productId){
        Optional<RiderBox> riderBoxOpt = loadBoxInScope(productId);
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
        Optional<RiderBox> riderBoxOpt = loadBoxInScope(productId);
        if (riderBoxOpt.isEmpty()){
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Product not found", null);
        }

        RiderBox riderBox = riderBoxOpt.get();
        riderBox.setStatus(RiderBoxStatusEnum.REJECTED);
        riderBoxRepository.save(riderBox);

        // Reopen the order so it can be handed to a different rider - see the REJECTED-reuse
        // branch in assignProduct.
        if (riderBox.getOrderId() != null) {
            orderRepository.findById(riderBox.getOrderId()).ifPresent(order -> {
                order.setRiderId(null);
                order.setOrderStatus(OrderStatus.PROCESSING);
                order.setDeliveryStatus(DeliveryStatus.NOT_SHIPPED);
                orderRepository.save(order);
            });
            mobileSalesOrderSyncService.syncOrderStatus(riderBox.getOrderId(), OrderStatus.PROCESSING);
        } else if (riderBox.getSalesOrderId() != null) {
            // Walk-in sale: no mobile Order/sync service to go through - reopen the
            // SalesOrder itself directly.
            salesOrderRepository.findById(riderBox.getSalesOrderId()).ifPresent(salesOrder -> {
                salesOrder.setStatus(OrderStatus.PROCESSING);
                salesOrderRepository.save(salesOrder);
            });
        }

        return new BaseResponse(HttpStatus.OK.value(), "Product rejected", riderBox);
    }

    @Transactional
    public  BaseResponse deliverProduct(Long productId){
        Optional<RiderBox> riderBoxOpt = loadBoxInScope(productId);
        if (riderBoxOpt.isEmpty()){
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Product not found", null);
        }

        RiderBox riderBox = riderBoxOpt.get();
        riderBox.setStatus(RiderBoxStatusEnum.DELIVERED);
        riderBoxRepository.save(riderBox);

        // Update the order's status and mirror it onto the admin-facing SalesOrder -
        // see MobileSalesOrderSyncService.markOrderDelivered.
        if (riderBox.getOrderId() != null) {
            mobileSalesOrderSyncService.markOrderDelivered(riderBox.getOrderId());
        } else if (riderBox.getSalesOrderId() != null) {
            // Walk-in sale: no mobile Order/sync service to go through - mark the
            // SalesOrder itself delivered directly.
            salesOrderRepository.findById(riderBox.getSalesOrderId()).ifPresent(salesOrder -> {
                salesOrder.setStatus(OrderStatus.DELIVERED);
                salesOrderRepository.save(salesOrder);
            });
        }

        return new BaseResponse(HttpStatus.OK.value(), "Product delivered", riderBox);
    }

     public BaseResponse getProductsByStatus(RiderBoxStatusEnum status){
         Long branchId = branchScopeService.getScopedBranchId();
         List<RiderBox> products = branchId == null
                 ? riderBoxRepository.findByStatus(status)
                 : riderBoxRepository.findByStatusAndBranchId(status, branchId);

         if(products.isEmpty()){
             return new BaseResponse(HttpStatus.OK.value(), "No products found with status " + status, null);
         }

         List<RiderBoxViewDto> views = products.stream().map(this::toViewDto).toList();

         return new BaseResponse(HttpStatus.OK.value(), "Products fetched successfully", views);
     }

    // Looks the assigned order back up (by the mobile Order id, or directly by SalesOrder id
    // for a walk-in sale - see ORDERING #4) so the admin screen can show the real order
    // reference/customer/address instead of a bare id.
    private RiderBoxViewDto toViewDto(RiderBox riderBox) {
        SalesOrder salesOrder;
        if (riderBox.getOrderId() != null) {
            salesOrder = salesOrderRepository.findByMobileOrderId(riderBox.getOrderId()).orElse(null);
        } else if (riderBox.getSalesOrderId() != null) {
            salesOrder = salesOrderRepository.findById(riderBox.getSalesOrderId()).orElse(null);
        } else {
            salesOrder = null;
        }

        return new RiderBoxViewDto(
                riderBox.getRiderBoxId(),
                riderBox.getOrderId() != null ? riderBox.getOrderId() : riderBox.getSalesOrderId(),
                salesOrder != null ? salesOrder.getReferenceNo() : null,
                salesOrder != null ? salesOrder.getCustomerName() : null,
                salesOrder != null ? salesOrder.getAddress() : null,
                salesOrder != null ? salesOrder.getProductName() : null,
                riderBox.getStatus(),
                riderBox.getRiderId(),
                riderBox.getRider(),
                riderBox.getCreatedAt()
        );
    }

}
