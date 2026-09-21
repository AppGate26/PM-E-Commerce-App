-- Phase 2 of the order/SalesOrder unification plan: lets OrderItem attach to a
-- walk-in/online SalesOrder (which has no mobile Order to hang the existing NOT NULL
-- order_id FK off), mirroring the same dual-ID pattern already used by
-- payments.order_id/payments.sales_order_id.
ALTER TABLE order_items MODIFY order_id BIGINT NULL;
ALTER TABLE order_items ADD COLUMN sales_order_id BIGINT NULL;
