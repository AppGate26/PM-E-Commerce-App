import { salesApi } from "./salesApi";

// Opens Paystack's hosted checkout for an order's next due installment in a popup window
// instead of navigating the current tab away. The order modal underneath stays open and
// untouched; when the customer closes the popup (payment done or abandoned), the returned
// promise resolves so the caller can refresh the order's payment details in place - that is
// the "return to the order modal" behaviour.
export const payNextInstallmentViaPaystackPopup = async ({ orderId, email }) => {
  const callbackUrl = `${window.location.origin}/orders/installment-payment/callback`;

  const response = await salesApi.initializeOrderInstallmentPayment(orderId, {
    email: email || "",
    callbackUrl,
  });

  const authorizationUrl =
    response?.authorizationUrl ||
    response?.authorization_url ||
    response?.checkoutUrl ||
    response?.checkout_url;

  if (!authorizationUrl) {
    throw new Error(response?.message || "Could not start Paystack payment. Please try again.");
  }

  const popup = window.open(
    authorizationUrl,
    "paystack_installment",
    "width=520,height=720,menubar=no,toolbar=no,location=yes,status=no"
  );

  if (!popup) {
    throw new Error("Please allow popups for this site to pay via Paystack.");
  }

  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        resolve();
      }
    }, 1200);
  });

  // The popup closing tells us nothing about whether the customer actually paid, so ask
  // the server. Callers used to report "payment received" purely because the window shut,
  // which read as success even when the customer abandoned checkout.
  let settled = false;
  let settlementMessage = "Payment window closed before the payment was confirmed.";
  try {
    const verification = await salesApi.verifyOrderInstallmentPayment(
      response?.reference || response?.paymentReference
    );
    settled = verification?.status === "success";
    settlementMessage = verification?.message || settlementMessage;
  } catch (error) {
    settlementMessage = error?.message || settlementMessage;
  }

  return { ...response, settled, settlementMessage };
};
