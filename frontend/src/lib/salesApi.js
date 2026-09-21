import { apiRequest } from "./config";

const unwrapResponse = (payload) => payload?.response ?? payload?.data ?? payload ?? {};

// Thin wrapper around the /api/sales endpoints used for walk-in cash sales paid
// through Paystack (SalesController.java, /api/sales/walk-in/cash/*).
export const salesApi = {
  // Initializes a Paystack hosted checkout for the current cash-sale cart. Body:
  // { items, amount, email, customerName, callbackUrl }. Returns { authorizationUrl, reference }.
  initializeWalkInCashPayment: async (body) => {
    const payload = await apiRequest("/sales/walk-in/cash/initialize-payment", "POST", body);
    return unwrapResponse(payload);
  },

  // Verifies a Paystack payment on return and, on success, creates the paid
  // SalesOrder(s) for the cart carried through Paystack's metadata.
  verifyWalkInCashPayment: async (reference) => {
    const payload = await apiRequest(
      `/sales/walk-in/cash/verify-payment/${encodeURIComponent(reference)}`,
      "GET",
    );
    return unwrapResponse(payload);
  },

  // Initializes a Paystack hosted checkout for the first installment of a walk-in credit
  // sale draft. Body: { saleData, firstInstallmentAmount, email, callbackUrl, requestedBy,
  // comments }. Returns { authorizationUrl, reference }.
  initializeCreditFirstInstallmentPayment: async (body) => {
    const payload = await apiRequest("/sales/credit/first-installment/initialize-payment", "POST", body);
    return unwrapResponse(payload);
  },

  // Verifies a first-installment Paystack payment on return and, on success, files the
  // credit sale as a normal admin-approval request (the draft was carried through
  // Paystack's metadata).
  verifyCreditFirstInstallmentPayment: async (reference) => {
    const payload = await apiRequest(
      `/sales/credit/first-installment/verify-payment/${encodeURIComponent(reference)}`,
      "GET",
    );
    return unwrapResponse(payload);
  },

  // Initializes a Paystack hosted checkout to collect the next due installment on an
  // existing order. Body: { email, callbackUrl }. The amount is priced server-side from
  // the order's next PENDING/OVERDUE repayment entry. Returns { authorizationUrl, reference,
  // amount, entryNumber }.
  initializeOrderInstallmentPayment: async (orderId, body) => {
    const payload = await apiRequest(
      `/sales/orders/${encodeURIComponent(orderId)}/installment-payment/initialize`,
      "POST",
      body,
    );
    return unwrapResponse(payload);
  },

  // Verifies a next-installment Paystack payment on return and, on success, marks the
  // targeted repayment entry PAID.
  verifyOrderInstallmentPayment: async (reference) => {
    const payload = await apiRequest(
      `/sales/orders/installment-payment/verify/${encodeURIComponent(reference)}`,
      "GET",
    );
    return unwrapResponse(payload);
  },
};
