-- Orders had no way to represent a customer picking the order up at a branch
-- instead of having it delivered: checkout() unconditionally geocoded
-- deliveryAddress and priced a delivery fee for every order, so pickup orders
-- 409'd with "Unable to determine delivery distance" whenever the address
-- couldn't be resolved by Google Maps. fulfillment_type now lets checkout()
-- skip the address/distance/fee lookup entirely for PICKUP orders.
--
-- NOTE: Flyway is inert in this project (see V2/V3/V4/V9). Run this by hand
-- against the database.

ALTER TABLE orders ADD COLUMN fulfillment_type VARCHAR(20) NOT NULL DEFAULT 'DELIVERY';
