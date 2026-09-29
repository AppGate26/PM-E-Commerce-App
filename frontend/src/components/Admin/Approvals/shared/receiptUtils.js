import { pickValue, resolveApprovalData } from "./approvalUtils";

// Company details printed on every sales receipt (same letterhead as the
// APPGATE_Invoice template).
export const RECEIPT_COMPANY = {
  name: "APPGATE NIG LIMITED",
  tagline: "Financial Technology & Core Banking Solutions",
  bankName: "Moniepoint",
  accountName: "APP-GATE NIG LIMITED",
  accountNumber: "6727149379",
};

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

const hundredsToWords = (n) => {
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
    if (n) parts.push("and");
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  } else if (n) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
};

const integerToWords = (n) => {
  if (n === 0) return "Zero";
  const groups = [];
  let scale = 0;
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk) groups.unshift(`${hundredsToWords(chunk)}${SCALES[scale] ? ` ${SCALES[scale]}` : ""}`);
    n = Math.floor(n / 1000);
    scale += 1;
  }
  return groups.join(", ");
};

// 1300000 -> "One Million, Three Hundred Thousand Naira Only"
export const amountToWords = (value) => {
  const numeric = Math.abs(Number(value) || 0);
  const naira = Math.floor(numeric);
  const kobo = Math.round((numeric - naira) * 100);
  let words = `${integerToWords(naira)} Naira`;
  if (kobo) words += `, ${integerToWords(kobo)} Kobo`;
  return `${words} Only`;
};

export const formatNaira = (value) =>
  (Number(value) || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatReceiptDate = (value) => {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return safe.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const buildLine = ({ description, quantity, unitPrice, discount, amount }) => {
  const qty = toNumber(quantity) || 1;
  const price = toNumber(unitPrice);
  const lineDiscount = toNumber(discount);
  const total = amount !== undefined && amount !== null && amount !== ""
    ? toNumber(amount)
    : qty * price - lineDiscount;
  return {
    description: description || "Item",
    quantity: qty,
    unitPrice: price || (qty ? total / qty : 0),
    discount: lineDiscount,
    amount: total,
  };
};

const customerFrom = (info = {}) => ({
  name:
    info.customerName ||
    `${info.firstName || ""} ${info.surname || ""}`.trim() ||
    "Walk-in Customer",
  accountNumber: info.accountNumber || info.customerBankAccount || "",
  phone: info.phoneNumber || "",
  email: info.email || "",
  address: info.address || "",
});

// Cash sale approval: requestData is { customerInfo, items: [{ productInfo, customerInfo }] }
// (see ApprovalService.createWalkInCashSalesFromApproval), or a single SalesOrderDto.
export const buildCashSaleReceipt = (approval, approvedBy) => {
  const sale = resolveApprovalData(approval, ["saleData", "cashSale", "sale", "data"]);
  const rawItems = Array.isArray(sale.items) && sale.items.length ? sale.items : [sale];
  const firstCustomer = sale.customerInfo || rawItems[0]?.customerInfo || sale.customer || {};

  const items = rawItems.map((item) => {
    const product = item.productInfo || item.product || item;
    return buildLine({
      description: pickValue(product, ["productName", "description", "name"], "Item"),
      quantity: pickValue(product, ["quantity"], 1),
      unitPrice: pickValue(product, ["unitPrice", "price"], 0),
      discount: pickValue(product, ["discount"], 0),
      amount: pickValue(item, ["totalAmount", "amount"], undefined),
    });
  });
  const total = items.reduce((sum, line) => sum + line.amount, 0);

  return {
    title: "SALES RECEIPT",
    saleType: "Cash Sale",
    receiptNo: pickValue(sale, ["saleRef", "sale_ref", "reference", "referenceNo"], `RCT-CS-${approval?.id ?? ""}`),
    date: new Date(),
    customer: customerFrom({ ...(sale.customer || {}), ...firstCustomer, customerName: firstCustomer.customerName || sale.customerName }),
    items,
    total,
    amountPaid: total,
    balance: 0,
    paymentMethod: pickValue(sale, ["paymentMethod", "saleChannel", "channel"], "Cash"),
    paymentStatus: "PAID",
    approvedBy,
  };
};

// Credit sale approval: requestData is a SalesOrderDto { customerInfo, productInfo, loanInfo }.
export const buildCreditSaleReceipt = (approval, approvedBy) => {
  const rd = approval?.requestDataParsed || approval?.data || {};
  const customer = rd.customerInfo || rd.customer || {};
  const product = rd.productInfo || rd.product || {};
  const loan = rd.loanInfo || rd.loan || {};

  const line = buildLine({
    description: product.productName || rd.productName,
    quantity: product.quantity,
    unitPrice: product.unitPrice || product.price,
    discount: product.discount,
    amount: loan.productAmount ?? undefined,
  });
  const upfront = toNumber(loan.upfrontCharges);

  return {
    title: "SALES RECEIPT",
    saleType: "Credit Sale",
    receiptNo: product.referenceNo || rd.referenceNo || `RCT-CR-${approval?.id ?? ""}`,
    date: new Date(),
    customer: customerFrom(customer),
    items: [line],
    total: line.amount,
    amountPaid: upfront,
    balance: Math.max(line.amount - upfront, 0),
    paymentMethod: loan.repaymentMethod ? `Credit (${loan.repaymentMethod})` : "Credit",
    paymentStatus: "ON CREDIT",
    credit: {
      loanType: loan.loanType,
      duration: loan.duration,
      rate: loan.rate,
      startDate: loan.startDate,
      expirationDate: loan.expirationDate,
      officer: loan.officerInCharge,
    },
    approvedBy,
  };
};

// Online sale: the approved SalesOrder row from /sales/reports/all/online.
export const buildOnlineSaleReceipt = (order, approvedBy) => {
  const line = buildLine({
    description: order.productName,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    discount: order.discount,
    amount: order.totalAmount,
  });
  const isPaid = Boolean(order.isPaid);
  const progress = toNumber(order.paymentProgress);
  const amountPaid = isPaid ? line.amount : Math.min((line.amount * progress) / 100, line.amount);

  return {
    title: "SALES RECEIPT",
    saleType: order.orderType === "CREDIT" ? "Online Credit Sale" : "Online Sale",
    receiptNo: order.referenceNo || order.salesReference || `RCT-ON-${order.id}`,
    date: new Date(),
    customer: customerFrom(order),
    items: [line],
    total: line.amount,
    amountPaid,
    balance: Math.max(line.amount - amountPaid, 0),
    paymentMethod: order.orderType === "CREDIT" ? "Credit (Installments)" : "Online Payment",
    paymentStatus: isPaid ? "PAID" : amountPaid > 0 ? "PART PAYMENT" : "AWAITING PAYMENT",
    approvedBy,
  };
};

// Display name of the signed-in approver for the receipt's "approved by" line.
export const approverName = (user) =>
  user?.fullName ||
  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
  user?.name ||
  user?.username ||
  user?.email ||
  "";

// Invoice/receipt served by GET /sales/orders/{id}/invoice (SalesInvoiceService) for an
// approved order - mapped onto the shape SalesReceipt renders.
export const receiptFromInvoice = (invoice) => {
  const isReceipt = invoice.documentType === "RECEIPT";
  const label = isReceipt ? "Receipt" : "Invoice";
  return {
    title: isReceipt ? "RECEIPT" : "INVOICE",
    toolbarLabel: `${label} ${invoice.documentNo}`,
    numberLabel: `${label} No.`,
    dateLabel: `${label} Date`,
    billToLabel: isReceipt ? "Received From:" : "Bill To:",
    totalLabel: isReceipt ? "TOTAL AMOUNT" : "TOTAL INVOICE AMOUNT",
    saleType: invoice.saleType || "Sale",
    receiptNo: invoice.documentNo,
    date: invoice.issuedAt,
    saleDate: invoice.saleDate,
    dueOn: isReceipt ? "" : invoice.nextDueDate ? formatReceiptDate(invoice.nextDueDate) : "Per payment schedule",
    summary: `${invoice.saleType || "Sale"} · Order ref ${(invoice.orderReferences || []).join(", ")}`,
    company: invoice.company || RECEIPT_COMPANY,
    customer: {
      name: invoice.customer?.name || "Walk-in Customer",
      accountNumber: invoice.customer?.accountNumber || "",
      phone: invoice.customer?.phone || "",
      email: invoice.customer?.email || "",
      address: invoice.customer?.address || "",
    },
    items: (invoice.items || []).map((line) => ({
      description: line.description,
      quantity: toNumber(line.quantity) || 1,
      unitPrice: toNumber(line.unitPrice),
      discount: toNumber(line.discount),
      amount: toNumber(line.amount),
    })),
    charges: (invoice.charges || []).map((charge) => ({ label: charge.label, amount: toNumber(charge.amount) })),
    subtotal: toNumber(invoice.subtotal),
    total: toNumber(invoice.total),
    amountInWords: invoice.amountInWords,
    amountPaid: toNumber(invoice.amountPaid),
    balance: toNumber(invoice.balance),
    paymentMethod: invoice.paymentMethod || "—",
    paymentStatus: invoice.paymentStatus,
    payments: (invoice.payments || []).map((entry, index) => ({
      number: entry.entryNumber ?? index + 1,
      date: entry.paidDate || entry.date || entry.dueDate,
      reference: entry.reference,
      method: entry.method,
      status: entry.status,
      amount: toNumber(entry.amount ?? entry.amountPaid ?? entry.amountDue),
    })),
    notes: invoice.notes,
  };
};
