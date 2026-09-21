// Builds a professional supplier-payment document and exports it as PDF (via the
// browser print dialog → "Save as PDF") or as a Word-compatible .doc file
// (HTML blob with an MS-Word MIME type — no extra dependencies required).

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || value === "" || value == null) return String(value ?? "—");
  return `₦${numeric.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (value) => {
  if (!value) return new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
};

const row = (label, value) => `
  <tr>
    <td class="label">${escapeHtml(label)}</td>
    <td class="value">${escapeHtml(value) || "—"}</td>
  </tr>`;

// `data` is the Payment form data; `supplier` is the resolved supplier record.
export const buildSupplierPaymentHtml = (data = {}, supplier = {}) => {
  const supplierName =
    supplier.customerName || supplier.companyName || supplier.name || `Supplier ${data.supplierId || ""}`;
  const reference = data.invoiceNumber || `INV-${Date.now()}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Supplier Payment Agreement - ${escapeHtml(reference)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
  .doc { max-width: 820px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0867db; padding-bottom: 16px; }
  .brand h1 { margin: 0; font-size: 22px; color: #0867db; letter-spacing: 0.5px; }
  .brand p { margin: 2px 0 0; font-size: 12px; color: #6b7280; }
  .meta { text-align: right; font-size: 12px; color: #374151; }
  .meta strong { display: block; font-size: 14px; color: #111827; }
  h2.title { text-align: center; margin: 26px 0 6px; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
  .subtitle { text-align: center; color: #6b7280; font-size: 12px; margin: 0 0 22px; }
  .section { margin: 18px 0; }
  .section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.6px; color: #0867db; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 10px; font-size: 13px; vertical-align: top; border-bottom: 1px solid #f1f5f9; }
  td.label { width: 42%; color: #6b7280; font-weight: 600; }
  td.value { color: #111827; }
  .amount-box { margin-top: 8px; background: #f0f7ff; border: 1px solid #cfe2ff; border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
  .amount-box span { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.6px; }
  .amount-box strong { font-size: 22px; color: #0867db; }
  .signs { display: flex; justify-content: space-between; margin-top: 60px; gap: 40px; }
  .sign { flex: 1; text-align: center; }
  .sign .line { border-top: 1px solid #9ca3af; margin-bottom: 6px; }
  .sign small { color: #6b7280; font-size: 12px; }
  .foot { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style>
</head>
<body>
  <div class="doc">
    <div class="head">
      <div class="brand">
        <h1>PEACE OF MIND STORES</h1>
        <p>Procurement &amp; Supplier Payments</p>
      </div>
      <div class="meta">
        <strong>${escapeHtml(reference)}</strong>
        Date: ${escapeHtml(formatDate(data.paymentDate))}
      </div>
    </div>

    <h2 class="title">Supplier Payment Agreement</h2>
    <p class="subtitle">Invoice-linked payment terms and delivery conditions</p>

    <div class="section">
      <h3>Supplier Details</h3>
      <table>
        ${row("Supplier", supplierName)}
        ${row("Supplier ID", supplier.supplierId || data.supplierId)}
        ${row("Contact Person", supplier.contactPersonName || supplier.contactName)}
        ${row("Phone", supplier.contactPhoneNumber || supplier.contactPhoneNo)}
        ${row("Email", supplier.contactEmail || supplier.email)}
        ${row("Address", supplier.address)}
      </table>
    </div>

    <div class="section">
      <h3>Invoice &amp; Payment</h3>
      <table>
        ${row("Invoice Number", data.invoiceNumber)}
        ${row("Period of Payment", data.periodOfPayment)}
        ${row("Rules for Payment", data.rulesForPayment)}
        ${row("Accepted Payment Methods", data.acceptedPaymentMethods)}
        ${row("Percentage Made", data.percentageMade ? `${data.percentageMade}%` : "")}
        ${row("Discount on Order", data.discountOnOrder ? `${data.discountOnOrder}%` : "")}
        ${row("Payment Date", formatDate(data.paymentDate))}
      </table>
      <div class="amount-box">
        <span>Invoice Amount</span>
        <strong>${formatMoney(data.invoiceAmount)}</strong>
      </div>
    </div>

    <div class="section">
      <h3>Delivery Terms</h3>
      <table>
        ${row("Advance Payment Plan", data.advancePaymentPlansDetails)}
        ${row("Tenure of Delivery", data.tenureOfDeliveryGoods)}
        ${row("Timeline of Delivery", data.timelineOfDeliveryGoods)}
        ${row("Process if Non-Delivery", data.processIncaseOfNonDelivery)}
      </table>
    </div>

    <div class="signs">
      <div class="sign"><div class="line"></div><small>Authorised By (Procurement)</small></div>
      <div class="sign"><div class="line"></div><small>Supplier Representative</small></div>
    </div>

    <div class="foot">
      This document was generated by the Peace of Mind Stores inventory system on
      ${escapeHtml(formatDate(new Date().toISOString()))}.
    </div>
  </div>
</body>
</html>`;
};

// Opens the document in a print window so the user can save it as a PDF.
export const exportSupplierPaymentPdf = (data, supplier) => {
  const html = buildSupplierPaymentHtml(data, supplier);
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    throw new Error("Pop-up blocked. Allow pop-ups to export the payment document as PDF.");
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  // Give the browser a tick to lay out before invoking print.
  setTimeout(() => printWindow.print(), 400);
};

// Downloads the document as a Word-compatible .doc file (HTML + MS-Word MIME type).
export const exportSupplierPaymentWord = (data, supplier) => {
  const html = buildSupplierPaymentHtml(data, supplier);
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  const reference = data?.invoiceNumber || "supplier-payment";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `supplier_payment_${reference}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
