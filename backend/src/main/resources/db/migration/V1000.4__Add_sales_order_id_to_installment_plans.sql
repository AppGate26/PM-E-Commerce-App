-- Phase 2 of the order/SalesOrder unification plan: lets an InstallmentPlan shadow a
-- walk-in/online credit sale's LoanDetails, mirroring the same dual-ID pattern already
-- used by payments.order_id/payments.sales_order_id and order_items.order_id/sales_order_id.
ALTER TABLE installment_plans ADD COLUMN sales_order_id BIGINT NULL;
