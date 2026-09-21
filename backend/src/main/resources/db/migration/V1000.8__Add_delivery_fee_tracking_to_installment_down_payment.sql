-- Lets the pre-checkout installment down-payment charge (PaymentGatewayService.
-- initializeDownPaymentBankTransfer/Card) fold a delivery-fee quote into its own
-- amount, and tracks how much of it was collected there so the later order-level
-- charge (resolveOrderChargeAmount / OrderService.payOrderByWallet) only collects
-- what's still outstanding instead of charging the delivery fee twice.
ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS down_payment_delivery_fee DOUBLE PRECISION NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS delivery_fee_amount DOUBLE PRECISION NULL;
