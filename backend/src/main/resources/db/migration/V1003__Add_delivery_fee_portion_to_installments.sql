-- An installment plan's delivery fee is no longer collected in full with the first
-- payment: it is spread evenly across the installments that make up the first 50% of the
-- plan (see InstallmentDeliveryFeeSpread). This column records each row's share, which is
-- already included in that row's amount_due.
--
-- NULL on rows created before this change - their delivery fee was collected in full with
-- the down payment, and the charge logic still treats them that way.
ALTER TABLE installments ADD COLUMN IF NOT EXISTS delivery_fee_portion DOUBLE PRECISION NULL;
