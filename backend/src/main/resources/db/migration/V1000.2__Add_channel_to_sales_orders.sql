-- Phase 2 of the order/SalesOrder unification plan: explicit channel discriminator,
-- replacing the implicit "mobile_order_id IS NOT NULL" check used elsewhere. Backfills
-- historical rows from the existing customer_type/mobile_order_id signal.
ALTER TABLE sales_orders ADD COLUMN channel VARCHAR(20) NULL;

UPDATE sales_orders
SET channel = CASE
    WHEN mobile_order_id IS NOT NULL THEN 'MOBILE'
    WHEN customer_type = 'ONLINE' THEN 'ONLINE'
    ELSE 'WALKIN'
END
WHERE channel IS NULL;
