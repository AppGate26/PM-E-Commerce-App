import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cashierApi } from "../../../lib/cashierApi";
import "../../../Styles/CashierStand/loanPayment/LoanPayment.css";

// Paystack return page for cashier wallet funding. Paystack appends ?reference= (and
// ?trxref=) on redirect; we verify it with the backend, which credits the target
// customer wallet on success.
const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref") || "";

  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [message, setMessage] = useState("Verifying your payment...");
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!reference) {
        setStatus("failed");
        setMessage("No payment reference was provided.");
        return;
      }

      try {
        const response = await cashierApi.verifyCashierWalletFunding(reference);
        if (cancelled) return;

        const ok =
          response?.status === "success" ||
          response?.status === "COMPLETED" ||
          response?.paymentStatus === "COMPLETED" ||
          response?.success === true ||
          Number(response?.status) === 200;

        if (ok) {
          setStatus("success");
          setMessage(
            response?.message || "Wallet funded successfully. The customer wallet has been credited.",
          );
          setDetails(response?.data || response);
        } else {
          setStatus("failed");
          setMessage(
            response?.message ||
              "We could not confirm this payment. If you were debited, please contact support.",
          );
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("failed");
        setMessage(err.message || "Payment verification failed. Please try again.");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className='lp-shell'>
      <div className='lp-container'>
        <header className='lp-header'>
          <div className='lp-title-wrap'>
            <h1>Wallet Funding</h1>
            <p>Paystack payment result</p>
          </div>
        </header>

        <div className='lp-grid'>
          <section className='lp-card'>
            {status === "verifying" && (
              <div className='alert alert-info' role='alert'>
                {message}
              </div>
            )}
            {status === "success" && (
              <div className='alert alert-success' role='alert'>
                {message}
              </div>
            )}
            {status === "failed" && (
              <div className='alert alert-danger' role='alert'>
                {message}
              </div>
            )}

            {reference && (
              <p className='lp-label'>
                Reference: <strong>{reference}</strong>
              </p>
            )}

            {details && details.amount != null && (
              <p className='lp-label'>
                Amount: <strong>NGN {Number(details.amount).toLocaleString()}</strong>
              </p>
            )}

            <div className='lp-actions'>
              <Link to='/cashier' className='lp-primary-btn'>
                BACK TO CASHIER
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
