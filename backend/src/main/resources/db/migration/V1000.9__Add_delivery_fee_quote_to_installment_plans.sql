-- The delivery fee quoted for an installment plan's cart at the moment the plan is
-- built (InstallmentService.buildPlan). Kept out of total_amount/grand_total/
-- installment_amount on purpose: delivery is never financed across the installments -
-- it is charged in full as part of the first payment (the down payment), so
-- firstPaymentAmount = down_payment + delivery_fee.
--
-- Distinct from down_payment_delivery_fee (V1000.8), which records how much delivery fee
-- was actually COLLECTED by the down-payment charge. This column is the quote the charge
-- should collect; that one is the receipt.
ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS delivery_fee DOUBLE PRECISION NULL;
