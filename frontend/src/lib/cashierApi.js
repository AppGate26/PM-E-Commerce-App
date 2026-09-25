import { apiRequest } from "./config";

const unwrapResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.response ?? payload?.data ?? payload ?? null;
};

const toArray = (payload) => {
  const unwrapped = unwrapResponse(payload);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (Array.isArray(unwrapped?.content)) return unwrapped.content;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const extractCollection = (payload) => {
  const unwrapped = unwrapResponse(payload);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (Array.isArray(unwrapped?.content)) return unwrapped.content;
  if (Array.isArray(unwrapped?.transactions)) return unwrapped.transactions;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.response?.transactions)) return payload.response.transactions;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  return [];
};

// tryApiRequest (walk a list of candidate URLs until one answers) and its
// shouldTryNextEndpoint predicate went with the guessed endpoint lists they existed to
// serve. Every call here now names the one real endpoint.

const firstValue = (item = {}, keys = []) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const firstNestedValue = (item = {}, paths = []) => {
  for (const path of paths) {
    const value = String(path).split(".").reduce((nextValue, key) => {
      if (nextValue === null || nextValue === undefined) return undefined;
      return nextValue[key];
    }, item);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const getFirstProduct = (item = {}) => {
  const candidates = [
    item.product,
    item.productInfo,
    item.product_info,
    item.products?.[0],
    item.items?.[0],
    item.orderItems?.[0],
    item.order_items?.[0],
  ];
  return candidates.find((candidate) => candidate && typeof candidate === "object") || {};
};

const normalizeCustomerDirectoryRow = (item = {}, sourceType = "", index = 0) => ({
  id:
    item?.id ||
    item?.customerId ||
    item?.userId ||
    item?.customer_id ||
    item?.user_id ||
    `${sourceType || "customer"}-${index}`,
  customerName:
    item?.customerName ||
    `${item?.firstName || ""} ${item?.surname || item?.lastName || ""}`.trim() ||
    item?.accountName ||
    item?.name ||
    "",
  accountNumber:
    item?.accountNumber ||
    item?.accountNo ||
    item?.acctNo ||
    item?.customerAccountNo ||
    "",
  bankName:
    item?.bankName ||
    item?.bank ||
    item?.virtualBankName ||
    "",
  walletBalance: Number(
    firstValue(item, [
      "walletBalance",
      "wallet_balance",
      "wallet",
      "balance",
      "availableBalance",
      "available_balance",
      "mainBalance",
      "currentBalance",
      "customerBalance",
      "depositBalance",
      "totalWalletBalance",
    ]) || 0
  ),
  principalLoanBalance:
    item?.principalLoanBalance ??
    item?.loanBalance ??
    item?.principalBalance ??
    item?.outstandingBalance ??
    0,
  loanAccruedInterest:
    item?.loanAccruedInterest ??
    item?.interestBalance ??
    item?.accruedInterest ??
    0,
  dueDate:
    item?.dueDate ||
    item?.nextDueDate ||
    item?.repaymentDueDate ||
    item?.nextRepaymentDate ||
    null,
  customerType: item?.customerType || item?.type || item?.customerCategory || sourceType || "",
  isWalkIn:
    item?.isWalkIn ??
    item?.walkIn ??
    item?.walk_in ??
    String(sourceType).toLowerCase().includes("walk"),
  raw: item,
});

const normalizeCompanyCard = (item = {}, index = 0) => ({
  id: item?.id ?? item?.cardId ?? `company-card-${index}`,
  cardName: item?.cardName || item?.label || item?.name || "Company Card",
  last4: item?.last4 || item?.lastFour || item?.last_four || "",
  bankName: item?.bankName || item?.bank || "",
  isActive: item?.isActive ?? item?.active ?? true,
  // True once the card has been tokenized on Paystack and can be charged instantly.
  hasAuthorization: Boolean(
    item?.authorizationCode || item?.authorization_code || item?.hasAuthorization,
  ),
  raw: item,
});

// Removed as dead and misleading (no component called any of them):
//   submitLoanPayment      -> POST /cashier/loan-payment, an endpoint that has been closed
//                             off because it recorded repayments against a hard-coded
//                             balance and reduced no actual loan.
//   fundWalkInCustomerWallet, fundWalletByCompanyCard, initializeCashierBankTransfer
//                          -> cash and company-card funding, advertised here but never
//                             wired to a screen. The live funding path is
//                             initializePaystackCheckout + verifyCashierWalletFunding.
export const cashierApi = {

  // Shared company-card registry used to record card funding (record-only).
  getCompanyCards: async () => {
    const payload = await apiRequest("/cashier/company-cards", "GET");
    return toArray(payload).map((item, index) => normalizeCompanyCard(item, index));
  },

  addCompanyCard: async (body) => {
    const payload = await apiRequest("/cashier/company-cards", "POST", body);
    return unwrapResponse(payload) || payload || {};
  },

  // Initialize Paystack hosted checkout for wallet funding. Supports both card and bank
  // transfer; the user picks on Paystack's hosted page. Only one real endpoint backs this -
  // the three fallbacks that used to follow it do not exist on the backend and only served
  // to turn a plain 404 into three more.
  initializePaystackCheckout: async (body) => {
    const payload = await apiRequest(
      "/cashier/wallet/initialize-paystack-checkout",
      "POST",
      body,
    );
    return unwrapResponse(payload) || payload || {};
  },

  // Verifies a Paystack funding on return from the payment page and credits the wallet.
  verifyCashierWalletFunding: async (reference) => {
    const payload = await apiRequest(
      `/cashier/wallet/verify-funding/${encodeURIComponent(reference)}`,
      "GET",
    );
    return unwrapResponse(payload) || payload || {};
  },

  submitCashPayment: (body) => apiRequest("/cashier/cash-payment", "POST", body),

  // Running cash total per till box for a cashier (server-maintained).
  getTillBalances: async (cashier) => {
    if (!cashier) return {};
    const params = new URLSearchParams({ cashier });
    const payload = await apiRequest(
      `/cashier/till-balances?${params.toString()}`,
      "GET",
    );
    const balances = unwrapResponse(payload);
    return balances && typeof balances === "object" ? balances : {};
  },

  generateCashPaymentInvoice: (paymentId) =>
    apiRequest(`/cashier/cash-payment/${paymentId}/generate-invoice`, "POST"),

  getCashDepositsReport: async ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    const payload = await apiRequest(
      `/cashier/reports/cash-deposits?${params.toString()}`,
      "GET",
    );
    return toArray(payload);
  },

  getBankDepositsReport: async ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    const payload = await apiRequest(
      `/cashier/reports/bank-deposits?${params.toString()}`,
      "GET",
    );
    return toArray(payload);
  },

  getAllDepositsReport: async ({ startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    const payload = await apiRequest(
      `/cashier/reports/all-deposits?${params.toString()}`,
      "GET",
    );
    return toArray(payload);
  },

  searchCustomerByAccount: async (accountNumber) => {
    const value = accountNumber?.trim?.() || "";
    const params = new URLSearchParams({
      accountNumber: value,
      accountName: value,
      customerName: value,
      name: value,
    });
    const payload = await apiRequest(
      `/cashier/customer/search?${params.toString()}`,
      "GET",
    );
    return unwrapResponse(payload);
  },

  getCustomerLedger: async ({ customerId, startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    const payload = await apiRequest(
      `/cashier/customer/${customerId}/ledger?${params.toString()}`,
      "GET",
    );
    return extractCollection(payload);
  },

  getAdminCustomerLedger: async ({ userId, startDate, endDate }) => {
    const params = new URLSearchParams({ startDate, endDate });
    const payload = await apiRequest(
      `/admin/ledger/customer/${userId}?${params.toString()}`,
      "GET",
    );
    return extractCollection(payload);
  },

  getCallOver: async ({ startDate, endDate, cashier }) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (cashier) {
      params.append("cashier", cashier);
    }
    const payload = await apiRequest(
      `/cashier/call-over?${params.toString()}`,
      "GET",
    );
    return toArray(payload);
  },

  getBalanceEnquiry: async (searchValue) => {
    const value = searchValue?.trim?.() || "";
    const params = new URLSearchParams({
      accountName: value,
      accountNumber: value,
      customerName: value,
    });
    const payload = await apiRequest(
      `/cashier/balance-enquiry?${params.toString()}`,
      "GET",
    );
    return unwrapResponse(payload) || {};
  },

  getCustomerDirectory: async () => {
    try {
      // Try the new dedicated cashier endpoint first
      const payload = await apiRequest("/cashier/customers/directory", "GET");
      const customers = toArray(payload);
      if (customers.length > 0) {
        return customers.map((item, index) =>
          normalizeCustomerDirectoryRow(item, item?.customerType || "", index)
        );
      }
    } catch (err) {
      console.warn("Failed to load customer directory from cashier endpoint, falling back...", err);
    }

    // Fallback to admin endpoints
    const [allCustomers, onlineCustomers, walkInCustomers] = await Promise.allSettled([
      apiRequest("/admin/customers", "GET"),
      apiRequest("/admin/customers/online/report", "GET"),
      apiRequest("/admin/customers/walk-in/report", "GET"),
    ]);

    const rows = [
      ...(allCustomers.status === "fulfilled" ? toArray(allCustomers.value) : []),
      ...(onlineCustomers.status === "fulfilled" ? toArray(onlineCustomers.value) : []),
      ...(walkInCustomers.status === "fulfilled" ? toArray(walkInCustomers.value) : []),
    ];

    const seen = new Set();
    return rows
      .map((item, index) =>
        normalizeCustomerDirectoryRow(
          item,
          item?.customerType || item?.type || (item?.isWalkIn || item?.walkIn ? "walk-in" : ""),
          index
        )
      )
      .filter((customer) => {
        const key = String(customer.id || customer.accountNumber || customer.customerName || "").toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  },

  getSalesOrderReferences: async () => {
    const payload = await apiRequest("/sales/orders?size=500", "GET");
    const orders = extractCollection(payload);
    const seen = new Set();

    return orders.reduce((acc, order) => {
      const referenceNumber =
        order?.referenceNo || order?.referenceNumber || order?.reference || "";
      const product = getFirstProduct(order);

      if (!referenceNumber || seen.has(referenceNumber)) {
        return acc;
      }

      seen.add(referenceNumber);
      acc.push({
        referenceNumber,
        orderId: order?.orderId || order?.id || "",
        productId:
          firstNestedValue(order, [
            "productId",
            "product_id",
            "product.id",
            "productInfo.productId",
            "productInfo.id",
            "products.0.productId",
            "items.0.productId",
          ]) ||
          firstNestedValue(product, ["productId", "id"]) ||
          order?.orderId ||
          order?.id ||
          "",
        productName:
          firstNestedValue(order, [
            "productName",
            "product_name",
            "product.productName",
            "product.name",
            "productInfo.productName",
            "productInfo.name",
          ]) || firstNestedValue(product, ["productName", "name", "description"]),
        productCategory:
          firstNestedValue(order, [
            "productCategory",
            "product_category",
            "category",
            "categoryName",
            "product.categoryName",
            "product.category.name",
            "productInfo.category",
            "productInfo.categoryName",
          ]) || firstNestedValue(product, ["categoryName", "category.name", "category"]),
        productImageUrl:
          firstNestedValue(order, [
            "productImageUrl",
            "productImage",
            "product_image",
            "product.productImage",
            "product.image",
            "productInfo.productImage",
            "productInfo.image",
          ]) || firstNestedValue(product, ["productImage", "image", "imageUrl"]),
        customerName: order?.customerName || "",
        phoneNumber: order?.phoneNumber || "",
        address:
          firstNestedValue(order, [
            "deliveryAddress",
            "delivery_address",
            "shippingAddress",
            "shipping_address",
            "customerAddress",
            "customer_address",
            "address",
            "customerInfo.address",
            "customerInfo.deliveryAddress",
            "customerInfo.contactAddress",
          ]) || "",
      });
      return acc;
    }, []);
  },

  getCashierPaymentReferences: async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const endDate = `${yyyy}-${mm}-${dd}`;

    const payload = await apiRequest(
      `/cashier/reports/all-deposits?startDate=2000-01-01&endDate=${endDate}`,
      "GET",
    );

    const rows = toArray(payload);
    const seen = new Set();

    return rows.reduce((acc, row) => {
      const referenceNumber =
        row?.referenceNumber ||
        row?.referenceNo ||
        row?.reference ||
        row?.transactionId ||
        row?.id ||
        "";

      if (!referenceNumber) return acc;
      if (seen.has(referenceNumber)) return acc;

      seen.add(referenceNumber);
      const product = getFirstProduct(row);
      acc.push({
        referenceNumber: String(referenceNumber),
        customerName: row?.customerName || row?.accountName || "",
        productId:
          firstNestedValue(row, [
            "productId",
            "product_id",
            "product.id",
            "productInfo.productId",
            "productInfo.id",
            "products.0.productId",
            "items.0.productId",
          ]) || firstNestedValue(product, ["productId", "id"]),
        productName:
          firstNestedValue(row, [
            "productName",
            "product_name",
            "product.productName",
            "product.name",
            "productInfo.productName",
            "productInfo.name",
          ]) || firstNestedValue(product, ["productName", "name", "description"]),
        productCategory:
          firstNestedValue(row, [
            "productCategory",
            "product_category",
            "category",
            "categoryName",
            "product.categoryName",
            "product.category.name",
            "productInfo.category",
            "productInfo.categoryName",
          ]) || firstNestedValue(product, ["categoryName", "category.name", "category"]),
        deliveryAddress:
          firstNestedValue(row, [
            "deliveryAddress",
            "delivery_address",
            "shippingAddress",
            "shipping_address",
            "customerAddress",
            "customer_address",
            "address",
          ]) || "",
      });
      return acc;
    }, []);
  },
};
