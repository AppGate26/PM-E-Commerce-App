-- Mobile-app checkouts/part-payments (Order, InstallmentPlan, Installment, Payment) and the
-- admin "Orderlist"/"Mark as Paid" screens (SalesOrder, LoanDetails, LoanRepaymentEntry) were
-- two entirely disconnected data models: a mobile customer's installment/part-payment updated
-- the former but the admin screens only ever read the latter, so a mobile part-payment never
-- showed up as paid on those screens. MobileSalesOrderSyncService now mirrors mobile checkouts
-- and payments onto a shadow SalesOrder, linked back to the mobile order via this column.
--
-- NOTE: Flyway is inert in this project (see V2/V3/V4/V9/V10). Hibernate's ddl-auto=update
-- will add this column automatically on the next backend startup; this file is kept only as a
-- record of the schema change (run it by hand if ddl-auto is ever turned off).

ALTER TABLE sales_orders ADD COLUMN mobile_order_id BIGINT NULL;
