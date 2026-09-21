-- SalesOrder had no way to represent whether a walk-in/online sale is a pickup
-- or a delivery: findOrdersReadyForRiderAssignment could not filter out PICKUP
-- orders, and walk-in orders (which never had any fulfillment concept at all)
-- were unconditionally excluded from the rider-ready list. fulfillment_type
-- lets that query correctly scope to DELIVERY orders across both walk-in and
-- online sales.
--
-- NOTE: Flyway is inert in this project (see V2/V3/V4/V9/V10/V12). Run this by
-- hand against the database.

ALTER TABLE sales_orders ADD COLUMN fulfillment_type VARCHAR(20) NOT NULL DEFAULT 'DELIVERY';
