-- Before V1002, rider_box.status was ENUM('PENDING','ACCEPTED','REJECTED','DELIVERED'). In
-- non-strict sql_mode, DeliveryOperationsService.startDelivery's IN_TRANSIT write was stored
-- as '' instead of failing, so those deliveries never matched the Transit Deliveries query
-- (and '' can't be read back into RiderBoxStatusEnum). Restore them: DELIVERED when the order
-- behind the box has already been delivered, otherwise IN_TRANSIT (the only value that
-- could have been truncated).
UPDATE rider_box rb
LEFT JOIN orders o ON o.id = rb.order_id
LEFT JOIN sales_orders so ON so.id = rb.sales_order_id
SET rb.status = CASE
        WHEN o.delivery_status = 'DELIVERED' OR so.status = 'DELIVERED' THEN 'DELIVERED'
        ELSE 'IN_TRANSIT'
    END
WHERE rb.status = '';
