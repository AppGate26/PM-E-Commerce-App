import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { salesApi } from "../../../../../lib/salesApi";
import "../../../../../Styles/CashierStand/loanPayment/LoanPayment.css";

// Paystack return page for a walk-in credit sale's first installment. This page is opened
// inside a small popup window (see CreditSales.jsx's handlePayFirstInstallment), not the
// main tab, so the Credit Sales modal underneath stays exactly where the cashier left it,
// with the product/customer/loan data still filled in. Paystack appends ?reference= (and
// ?trxref=) on redirect; we verify it with the backend, which creates the credit sale order
// immediately (carried through Paystack's metadata, see SalesService.verifyCreditFirstInstallmentPayment)
// — no admin pre-approval gate — then this window closes itself so focus returns to the
// modal, which polls for the popup closing and re-verifies to unlock the "paid" receipt
// watermark.
const CreditFirstInstallmentCallback = () => {
  const [searchParams] = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref") || "";

  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!reference) {
        setStatus("failed");
        setMessage("No payment reference was provided.");
        return;
      }

      try {
        const response = await salesApi.verifyCreditFirstInstallmentPayment(reference);
        if (cancelled) return;

        const ok = response?.status === "success";

        if (ok) {
          setStatus("success");
          setMessage(
            response?.alreadyProcessed
              ? "This payment was already confirmed. The order has been created."
              : "First installment confirmed. The order has been created and is ready in Marking as Paid."
          );
        } else {
          setStatus("failed");
          setMessage(
            response?.message ||
              "We could not confirm this payment. If you were debited, please contact support."
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

  // This page only ever runs inside the popup opened for the Paystack checkout - once we
  // have a result, close the popup so the cashier lands back on the Credit Sales modal in
  // the main tab, which polls for the popup closing to refresh itself.
  useEffect(() => {
    if (status === "verifying") return;
    const timer = setTimeout(() => {
      window.close();
    }, 1500);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <div className='lp-shell'>
      <div className='lp-container'>
        <header className='lp-header'>
          <div className='lp-title-wrap'>
            <h1>Credit Sale First Installment</h1>
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

            {status !== "verifying" && (
              <p className='lp-label'>This window will close automatically. You can also close it now.</p>
            )}

            <div className='lp-actions'>
              <button type='button' className='lp-primary-btn' onClick={() => window.close()}>
                CLOSE WINDOW
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CreditFirstInstallmentCallback;
