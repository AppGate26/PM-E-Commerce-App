-- POST /api/installments (create) now persists an InstallmentPlan before the
-- order it will belong to exists (see InstallmentService.createInstallmentPlan /
-- OrderService.checkout). order_id is only set once the order is placed, and
-- product_id is no longer set at all - a plan now prices the caller's whole
-- cart, not one product. Both columns were previously NOT NULL.
--
-- NOTE: Flyway is inert in this project (see V2/V3/V4). Run this by hand
-- against the database.

ALTER TABLE installment_plans MODIFY order_id BIGINT NULL;
ALTER TABLE installment_plans MODIFY product_id BIGINT NULL;
