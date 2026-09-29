import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  RECEIPT_COMPANY,
  amountToWords,
  formatNaira,
  formatReceiptDate,
} from "./receiptUtils";
import "./SalesReceipt.css";

// Printable sales receipt modeled on the APPGATE_Invoice template: letterhead, bill-to /
// receipt meta block, blue-header item table, total bar, amount in words, payment
// details, notes and signatory. "Print / Save PDF" uses the browser print dialog; the
// print stylesheet hides the rest of the app so only the receipt page is printed.
const SalesReceipt = ({ receipt, onClose }) => {
  useEffect(() => {
    if (!receipt) return undefined;
    document.body.classList.add("sales-receipt-open");
    // Browsers use the page title as the default "Save as PDF" file name.
    const previousTitle = document.title;
    document.title = `${receipt.title} ${receipt.receiptNo}`;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("sales-receipt-open");
      document.title = previousTitle;
      window.removeEventListener("keydown", onKey);
    };
  }, [receipt, onClose]);

  if (!receipt) return null;

  const { customer = {}, items = [], credit, charges = [], payments = [] } = receipt;
  const company = receipt.company || RECEIPT_COMPANY;
  const showDiscount = items.some((line) => line.discount > 0);
  const hasBalance = receipt.balance > 0;
  const tableCols = showDiscount ? 5 : 4;
  const numberLabel = receipt.numberLabel || "Receipt No.";
  const dateLabel = receipt.dateLabel || "Receipt Date";

  const notes = receipt.notes?.length
    ? receipt.notes
    : [
        `This receipt confirms the ${receipt.saleType.toLowerCase()} recorded under reference ${receipt.receiptNo}.`,
        "Please quote the receipt number for any enquiry, return or refund on this sale.",
        hasBalance
          ? `The outstanding balance of ₦${formatNaira(receipt.balance)} is payable according to the agreed repayment schedule.`
          : "Goods sold are subject to the company's returns and refund policy.",
      ];

  return createPortal(
    <div className="sr-overlay" role="dialog" aria-modal="true" aria-label="Sales receipt">
      <div className="sr-toolbar">
        <span>{receipt.toolbarLabel || "Sale approved — receipt ready"}</span>
        <div>
          <button type="button" className="sr-btn sr-btn-primary" onClick={() => window.print()}>
            Print / Save PDF
          </button>
          <button type="button" className="sr-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="sr-scroll">
        <article className="sr-page">
          <header className="sr-letterhead">
            <h1>{company.name}</h1>
            <p>{company.tagline}</p>
          </header>

          <section className="sr-meta">
            <div className="sr-billto">
              <h2>{receipt.title}</h2>
              <span className="sr-label">{receipt.billToLabel || "Received From:"}</span>
              <strong>{customer.name}</strong>
              {customer.accountNumber ? <span>Account No: {customer.accountNumber}</span> : null}
              {customer.phone ? <span>{customer.phone}</span> : null}
              {customer.email ? <span>{customer.email}</span> : null}
              {customer.address ? <span>{customer.address}</span> : null}
            </div>
            <dl className="sr-meta-list">
              <div><dt>{numberLabel}:</dt><dd>{receipt.receiptNo}</dd></div>
              <div><dt>{dateLabel}:</dt><dd>{formatReceiptDate(receipt.date)}</dd></div>
              {receipt.saleDate ? (
                <div><dt>Sale Date:</dt><dd>{formatReceiptDate(receipt.saleDate)}</dd></div>
              ) : null}
              {receipt.dueOn ? <div><dt>Due On:</dt><dd>{receipt.dueOn}</dd></div> : null}
              <div><dt>Sale Type:</dt><dd>{receipt.saleType}</dd></div>
              <div><dt>Currency:</dt><dd>NGN (₦)</dd></div>
            </dl>
          </section>

          <section className="sr-project">
            <span className="sr-project-tag">SALE</span>
            <div>
              <strong>{items.map((line) => line.description).join(", ")}</strong>
              <p>
                {receipt.summary || (
                  <>
                    {receipt.saleType} approved on {formatReceiptDate(receipt.date)}
                    {receipt.approvedBy ? ` by ${receipt.approvedBy}` : ""}.
                  </>
                )}
              </p>
            </div>
          </section>

          <h3 className="sr-section-title">Items Purchased</h3>
          <table className="sr-table">
            <thead>
              <tr>
                <th className="sr-c">S/N</th>
                <th>Description</th>
                <th className="sr-c">Qty</th>
                <th className="sr-r">Unit Price (NGN)</th>
                {showDiscount ? <th className="sr-r">Discount</th> : null}
                <th className="sr-r">Amount (NGN)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((line, index) => (
                <tr key={`${line.description}-${index}`}>
                  <td className="sr-c">{index + 1}</td>
                  <td>{line.description}</td>
                  <td className="sr-c">{line.quantity}</td>
                  <td className="sr-r">₦ {formatNaira(line.unitPrice)}</td>
                  {showDiscount ? <td className="sr-r">₦ {formatNaira(line.discount)}</td> : null}
                  <td className="sr-r">₦ {formatNaira(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {charges.length ? (
                <>
                  <tr>
                    <td colSpan={tableCols} className="sr-r">Subtotal</td>
                    <td className="sr-r">₦ {formatNaira(receipt.subtotal)}</td>
                  </tr>
                  {charges.map((charge) => (
                    <tr key={charge.label}>
                      <td colSpan={tableCols} className="sr-r">{charge.label}</td>
                      <td className="sr-r">
                        {charge.amount < 0 ? "- " : ""}₦ {formatNaira(Math.abs(charge.amount))}
                      </td>
                    </tr>
                  ))}
                </>
              ) : null}
              <tr className="sr-total">
                <td colSpan={tableCols}>{receipt.totalLabel || "TOTAL SALE AMOUNT"}</td>
                <td className="sr-r">₦ {formatNaira(receipt.total)}</td>
              </tr>
            </tfoot>
          </table>

          <p className="sr-words">
            <span className="sr-label">Amount in words: </span>
            <em>{receipt.amountInWords || amountToWords(receipt.total)}</em>
          </p>

          <h3 className="sr-section-title">Payment Details</h3>
          <dl className="sr-box">
            <div><dt>Payment Method:</dt><dd>{receipt.paymentMethod}</dd></div>
            <div><dt>Payment Status:</dt><dd>{receipt.paymentStatus}</dd></div>
            <div><dt>Amount Paid:</dt><dd>₦ {formatNaira(receipt.amountPaid)}</dd></div>
            <div><dt>Balance Due:</dt><dd>₦ {formatNaira(receipt.balance)}</dd></div>
            {credit?.loanType ? <div><dt>Credit Type:</dt><dd>{credit.loanType}</dd></div> : null}
            {credit?.duration ? <div><dt>Duration:</dt><dd>{credit.duration}</dd></div> : null}
            {credit?.rate ? <div><dt>Rate:</dt><dd>{credit.rate}%</dd></div> : null}
            {credit?.startDate ? (
              <div>
                <dt>Repayment Period:</dt>
                <dd>
                  {formatReceiptDate(credit.startDate)}
                  {credit.expirationDate ? ` – ${formatReceiptDate(credit.expirationDate)}` : ""}
                </dd>
              </div>
            ) : null}
            {hasBalance ? (
              <>
                <div><dt>Bank Name:</dt><dd>{company.bankName}</dd></div>
                <div><dt>Account Name:</dt><dd>{company.accountName}</dd></div>
                <div><dt>Account Number:</dt><dd>{company.accountNumber}</dd></div>
              </>
            ) : null}
          </dl>

          {payments.length ? (
            <>
              <h3 className="sr-section-title">Payment History</h3>
              <table className="sr-table">
                <thead>
                  <tr>
                    <th className="sr-c">#</th>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th className="sr-r">Amount (NGN)</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr key={`${payment.reference || "p"}-${index}`}>
                      <td className="sr-c">{payment.number ?? index + 1}</td>
                      <td>{payment.date ? formatReceiptDate(payment.date) : "—"}</td>
                      <td>{payment.reference || payment.method || "—"}</td>
                      <td>{payment.status}</td>
                      <td className="sr-r">₦ {formatNaira(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}

          <h3 className="sr-section-title">Notes</h3>
          <ul className="sr-notes">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>

          <p className="sr-thanks">Thank you for your patronage.</p>

          <footer className="sr-sign">
            <span>For {company.name}</span>
            <span className="sr-sign-line">____________________________</span>
            <span>Authorized Signatory</span>
          </footer>
        </article>
      </div>
    </div>,
    document.body
  );
};

export default SalesReceipt;
