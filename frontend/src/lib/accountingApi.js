import { apiRequest } from "./config";

const FUND_TRANSFER_ENDPOINT =
  import.meta.env.VITE_FUND_TRANSFER_ENDPOINT || "/admin/fund-transfers";
const FUND_TRANSFER_LIST_ENDPOINT =
  import.meta.env.VITE_FUND_TRANSFER_LIST_ENDPOINT || "";
const JOURNAL_ENDPOINT =
  import.meta.env.VITE_JOURNAL_ENDPOINT || "/admin/journal-entries";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.accounts)) return payload.accounts;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.response?.data)) return payload.response.data;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.response?.items)) return payload.response.items;
  if (Array.isArray(payload?.response?.records)) return payload.response.records;
  if (Array.isArray(payload?.response?.accounts)) return payload.response.accounts;
  if (Array.isArray(payload?.response?.result)) return payload.response.result;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;
  if (Array.isArray(payload?.data?.accounts)) return payload.data.accounts;
  if (Array.isArray(payload?.data?.result)) return payload.data.result;
  if (Array.isArray(payload?.response?.data?.content)) return payload.response.data.content;
  if (Array.isArray(payload?.response?.data?.items)) return payload.response.data.items;
  if (Array.isArray(payload?.response?.data?.records)) return payload.response.data.records;
  if (Array.isArray(payload?.response?.data?.accounts)) return payload.response.data.accounts;
  if (Array.isArray(payload?.response?.data?.result)) return payload.response.data.result;
  return [];
};

const pickFirstValue = (item = {}, keys = []) => {
  for (const key of keys) {
    const value = String(key).split(".").reduce((nextValue, pathPart) => {
      if (nextValue === null || nextValue === undefined) return undefined;
      return nextValue[pathPart];
    }, item);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return "";
};

const asNumber = (value) => Number(value) || 0;

const unwrapItem = (payload) => payload?.response ?? payload?.data ?? payload?.content ?? payload;

const withAccountingPermissionMessage = async (request, endpointLabel) => {
  try {
    return await request();
  } catch (error) {
    if (error?.status === 403) {
      throw new Error(
        `You do not have permission to access ${endpointLabel}. Ask an admin to grant accounting setup access.`
      );
    }
    throw error;
  }
};

export const mapAccountTypeFromApi = (item = {}, fallbackIndex = 0) => ({
  id: pickFirstValue(item, ["id", "accountTypeId", "account_type_id"]) || `type-${fallbackIndex}`,
  name: String(pickFirstValue(item, ["name", "accountType", "account_type", "description"]) || "").toUpperCase(),
  raw: item,
});

export const mapControlAccountFromApi = (item = {}, fallbackIndex = 0) => {
  const accountTypeId = pickFirstValue(item, [
    "accountTypeId",
    "account_type_id",
    "accountType.id",
    "account_type.id",
  ]);
  const accountTypeName = String(
    pickFirstValue(item, [
      "accountTypeName",
      "account_type_name",
      "accountType.name",
      "accountType.accountType",
      "account_type.name",
    ]) || ""
  ).toUpperCase();
  return {
    id: pickFirstValue(item, ["id", "controlAccountId", "control_account_id"]) || `control-${fallbackIndex}`,
    name: String(pickFirstValue(item, ["name", "controlAccountName", "control_account_name"]) || ""),
    controlId: pickFirstValue(item, ["controlId", "control_id"]),
    accountTypeId,
    accountTypeName,
    raw: item,
  };
};

export const mapChartOfAccountFromApi = (item = {}, fallbackIndex = 0) => {
  const accountTypeId = pickFirstValue(item, [
    "accountTypeId",
    "account_type_id",
    "accountType.id",
    "account_type.id",
  ]);
  const controlAccountId = pickFirstValue(item, [
    "controlAccountId",
    "control_account_id",
    "controlAccount.id",
    "control_account.id",
  ]);
  return {
    id: pickFirstValue(item, ["id", "chartOfAccountId", "chart_of_account_id"]) || `chart-${fallbackIndex}`,
    code: String(pickFirstValue(item, ["chartOfAccountId", "chart_of_account_id"]) || ""),
    description: String(pickFirstValue(item, ["description", "name", "chartOfAccountName", "chart_of_account_name"]) || ""),
    accountTypeId,
    accountTypeName: String(
      pickFirstValue(item, ["accountTypeName", "accountType.name", "account_type.name"]) || ""
    ).toUpperCase(),
    controlAccountId,
    controlAccountName: String(
      pickFirstValue(item, ["controlAccountName", "controlAccount.name", "control_account.name"]) || ""
    ),
    raw: item,
  };
};

export const mapAccountDetailFromApi = (item = {}, fallbackIndex = 0) => {
  const accountTypeId = pickFirstValue(item, [
    "accountTypeId",
    "account_type_id",
    "accountType.id",
    "account_type.id",
  ]);
  const controlAccountId = pickFirstValue(item, [
    "controlAccountId",
    "control_account_id",
    "controlAccount.id",
    "control_account.id",
  ]);
  const chartOfAccountId = pickFirstValue(item, [
    "chartOfAccountId",
    "chart_of_account_id",
    "chartOfAccount.id",
    "chart_of_account.id",
  ]);
  const accountDetailsName = String(
    pickFirstValue(item, [
      "accountDetailsName",
      "account_details_name",
      "name",
      "accountName",
      "account_name",
    ]) || ""
  );

  return {
    id: pickFirstValue(item, ["id", "accountDetailsId", "account_details_id"]) || `detail-${fallbackIndex}`,
    accountDetailsCode: String(
      pickFirstValue(item, ["accountDetailsCode", "account_details_code"]) || ""
    ),
    accountTypeId,
    accountTypeName: String(
      pickFirstValue(item, ["accountTypeName", "accountType.name", "account_type.name"]) || ""
    ).toUpperCase(),
    controlAccountId,
    controlAccountName: String(
      pickFirstValue(item, ["controlAccountName", "controlAccount.name", "control_account.name"]) || ""
    ),
    chartOfAccountId,
    chartOfAccountName: String(
      pickFirstValue(item, ["chartOfAccountName", "chartOfAccount.description", "chart_of_account.description"]) || ""
    ),
    accountDetailsName,
    raw: item,
  };
};

export const getAccountTypes = async ({ page = 0, size = 1000 } = {}) => {
  const payload = await withAccountingPermissionMessage(
    () => apiRequest(`/account-types?page=${page}&size=${size}`, "GET", null, true),
    "/account-types"
  );
  return toArray(payload).map((item, index) => mapAccountTypeFromApi(item, index));
};

export const createAccountType = async ({ id, name }) => {
  const requestBody = id ? { id: Number(id), name } : { name };
  const payload = await withAccountingPermissionMessage(
    () => apiRequest("/account-types", "POST", requestBody, true),
    "/account-types"
  );
  return mapAccountTypeFromApi(unwrapItem(payload), 0);
};

export const updateAccountType = async (id, { backendId, name }) => {
  const requestBody = backendId ? { id: Number(backendId), name } : { name };
  const payload = await withAccountingPermissionMessage(
    () => apiRequest(`/account-types/${id}`, "PUT", requestBody, true),
    "/account-types"
  );
  return mapAccountTypeFromApi(unwrapItem(payload), 0);
};

export const deleteAccountType = async (id) => {
  await withAccountingPermissionMessage(
    () => apiRequest(`/account-types/${id}`, "DELETE", null, true),
    "/account-types"
  );
};

export const getControlAccounts = async ({ page = 0, size = 1000, accountTypeId = "" } = {}) => {
  const endpoint = accountTypeId
    ? `/control-accounts/by-type/${accountTypeId}`
    : `/control-accounts?page=${page}&size=${size}`;
  const payload = await apiRequest(endpoint, "GET", null, true);
  return toArray(payload).map((item, index) => mapControlAccountFromApi(item, index));
};

export const createControlAccount = async ({ id, accountTypeId, name }) => {
  const requestBody = {
    controlId: String(id),
    accountTypeId: Number(accountTypeId),
    name,
  };
  const payload = await apiRequest(
    "/control-accounts",
    "POST",
    requestBody,
    true
  );
  return mapControlAccountFromApi(unwrapItem(payload), 0);
};

export const updateControlAccount = async (id, { backendId, name }) => {
  const requestBody = backendId ? { id: Number(backendId), name } : { name };
  const payload = await apiRequest(`/control-accounts/${id}`, "PUT", requestBody, true);
  return mapControlAccountFromApi(unwrapItem(payload), 0);
};

export const deleteControlAccount = async (id) => {
  await apiRequest(`/control-accounts/${id}`, "DELETE", null, true);
};

export const getChartOfAccounts = async ({ page = 0, size = 1000, controlAccountId = "" } = {}) => {
  const endpoint = controlAccountId
    ? `/chart-of-accounts/by-control/${controlAccountId}`
    : `/chart-of-accounts?page=${page}&size=${size}`;
  const payload = await apiRequest(endpoint, "GET", null, true);
  return toArray(payload).map((item, index) => mapChartOfAccountFromApi(item, index));
};

export const createChartOfAccount = async ({ accountTypeId, controlAccountId, chartOfAccountId, description }) => {
  const payload = await apiRequest(
    "/chart-of-accounts",
    "POST",
    {
      accountTypeId: Number(accountTypeId),
      controlAccountId: Number(controlAccountId),
      chartOfAccountId: String(chartOfAccountId),
      description,
    },
    true
  );
  return mapChartOfAccountFromApi(unwrapItem(payload), 0);
};

export const updateChartOfAccount = async (id, { description }) => {
  const payload = await apiRequest(`/chart-of-accounts/${id}`, "PUT", { description }, true);
  return mapChartOfAccountFromApi(unwrapItem(payload), 0);
};

export const deleteChartOfAccount = async (id) => {
  await apiRequest(`/chart-of-accounts/${id}`, "DELETE", null, true);
};

export const getAccountDetails = async ({ page = 0, size = 1000, chartOfAccountId = "" } = {}) => {
  const endpoint = chartOfAccountId
    ? `/account-details/by-chart/${chartOfAccountId}`
    : `/account-details?page=${page}&size=${size}`;
  const payload = await apiRequest(endpoint, "GET", null, true);
  return toArray(payload).map((item, index) => mapAccountDetailFromApi(item, index));
};

export const createAccountDetail = async ({
  accountTypeId,
  controlAccountId,
  chartOfAccountId,
  accountDetailsCode,
  accountDetailsName,
}) => {
  const payload = await apiRequest(
    "/account-details",
    "POST",
    {
      accountTypeId: Number(accountTypeId),
      controlAccountId: Number(controlAccountId),
      chartOfAccountId: Number(chartOfAccountId),
      accountDetailsCode: String(accountDetailsCode),
      accountDetailsName,
    },
    true
  );
  return mapAccountDetailFromApi(unwrapItem(payload), 0);
};

export const updateAccountDetail = async (id, { accountDetailsName }) => {
  const payload = await apiRequest(
    `/account-details/${id}`,
    "PUT",
    { accountDetailsName },
    true
  );
  return mapAccountDetailFromApi(unwrapItem(payload), 0);
};

export const deleteAccountDetail = async (id) => {
  await apiRequest(`/account-details/${id}`, "DELETE", null, true);
};

export const mapAccountFromApi = (item = {}, fallbackIndex = 0) => {
  const backendId =
    item.id ??
    item.accountId ??
    item.account_id ??
    item.accountDetailsId ??
    item.account_details_id ??
    "";
  const code = String(
    pickFirstValue(item, [
      "glCode",
      "gl_code",
      "accountDetailsCode",
      "account_details_code",
      "accountCode",
      "account_code",
      "code",
    ]) || ""
  );
  const name = String(
    pickFirstValue(item, [
      "accountName",
      "account_name",
      "accountDetailsName",
      "account_details_name",
      "glName",
      "gl_name",
      "name",
    ]) || code
  );
  const accountType = String(
    pickFirstValue(item, ["accountType", "account_type", "type"]) || ""
  ).toUpperCase();

  return {
    id: backendId || code,
    code,
    accountId: backendId || "",
    name,
    type: accountType,
    accountType,
    description: String(pickFirstValue(item, ["description"]) || ""),
    classId: item.classId ?? item.class_id ?? "",
    isControlAccount: Boolean(item.isControlAccount ?? item.is_control_account),
    parentAccountId: item.parentAccountId ?? item.parent_account_id ?? "",
    controlAccount: String(
      pickFirstValue(item, ["controlAccount", "control_account"]) || code.slice(0, 3)
    ),
    chartOfAccount: String(
      pickFirstValue(item, ["chartOfAccount", "chart_of_account"]) || code.slice(0, 5)
    ),
    raw: item,
  };
};

const getAccountsByGlCode = async () => {
  try {
    const response = await apiRequest("/api/admin/accounts", "GET");
    const accounts = toArray(response);
    const map = new Map();
    accounts.forEach((account) => {
      if (account.glCode) {
        map.set(String(account.glCode), account.id);
      }
    });
    return map;
  } catch (error) {
    console.warn("Failed to fetch Account ledger rows for ID resolution", error);
    return new Map();
  }
};

export const getAccounts = async ({ activeOnly = true } = {}) => {
  const [accountTypes, controlAccounts, chartAccounts, accountDetails, glCodeToAccountIdMap] =
    await Promise.all([
      getAccountTypes(),
      getControlAccounts(),
      getChartOfAccounts(),
      getAccountDetails(),
      getAccountsByGlCode(),
    ]);

  const accountTypeMap = new Map(accountTypes.map((row) => [String(row.id), row]));
  const controlMap = new Map(controlAccounts.map((row) => [String(row.id), row]));
  const chartMap = new Map(chartAccounts.map((row) => [String(row.id), row]));

  return accountDetails.map((detail, index) => {
    const accountType = accountTypeMap.get(String(detail.accountTypeId));
    const control = controlMap.get(String(detail.controlAccountId));
    const chart = chartMap.get(String(detail.chartOfAccountId));
    const typeName = detail.accountTypeName || accountType?.name || chart?.accountTypeName || control?.accountTypeName || "";
    const controlName = detail.controlAccountName || control?.name || chart?.controlAccountName || "";
    const chartName = detail.chartOfAccountName || chart?.description || "";
    const glCode = String(detail.accountDetailsCode || detail.id || "");
    // Resolve to the paired Account.id (ledger entity) for posting. Do NOT fall
    // back to the AccountDetails row's own id when there's no match: both are
    // small auto-increment sequences, so a "detailId" fallback can (and does)
    // collide with a real, unrelated Account.id — silently posting/reporting
    // against the wrong GL account. Accounts with no matching ledger row simply
    // have no accountId; callers must treat that as "not postable".
    const realAccountId = glCodeToAccountIdMap.get(glCode) || null;

    return {
      id: realAccountId || `unmapped-${detail.id}`,
      // Surface the real GL account code (e.g. 1020201), not the raw DB id, so the
      // account picker/search shows and filters by the code accountants recognise.
      code: glCode,
      accountId: realAccountId,
      hasLedgerAccount: Boolean(realAccountId),
      name: detail.accountDetailsName,
      type: typeName,
      accountType: typeName,
      accountTypeId: detail.accountTypeId || chart?.accountTypeId || control?.accountTypeId || "",
      controlAccount: String(detail.controlAccountId || ""),
      controlAccountId: detail.controlAccountId,
      controlAccountName: controlName,
      chartOfAccount: String(detail.chartOfAccountId || ""),
      chartOfAccountId: detail.chartOfAccountId,
      chartOfAccountName: chartName,
      // The two GL codes used to build a full account code in the reports:
      // chart-of-account code + account-details code (e.g. "10202" + "01").
      chartOfAccountCode: String(chart?.code || detail.chartOfAccountId || ""),
      accountDetailsCode: String(detail.accountDetailsCode || ""),
      description: detail.accountDetailsName,
      sn: index + 1,
      raw: detail.raw || detail,
    };
  });
};

export const getAccountOptions = async () => {
  let accounts = await getAccounts({ activeOnly: true });
  if (accounts.length === 0) {
    accounts = await getAccounts({ activeOnly: false });
  }
  return accounts.map((account) => ({
    // Postable only when there's a real ledger Account row — never the synthetic
    // "unmapped-<detailId>" id, which exists solely to keep list/select keys
    // unique and must never be sent to the backend as an accountId.
    value: String(account.accountId || ""),
    // QA #1: journal line options read as account_details_name - account_details_code
    // (e.g. "STAFF ADVANCE - 1020201"), name first then GL code.
    label: [account.name, account.code].filter(Boolean).join(" - "),
    id: account.id,
    accountId: account.accountId || "",
    hasLedgerAccount: account.hasLedgerAccount,
    code: account.code,
    glCode: account.code,
    name: account.name,
    accountType: account.accountType,
    controlAccount: account.controlAccount,
    chartOfAccount: account.chartOfAccount,
  }));
};

export const mapLoanPercentageSetupFromApi = (item = {}, fallbackIndex = 0) => ({
  id: item.id ?? item.setupId ?? item.loanPercentageSetupId ?? `loan-${fallbackIndex}`,
  productName: String(
    pickFirstValue(item, ["productName", "product_name", "categoryName", "category_name"]) || ""
  ),
  setupRate: item.setupRate ?? item.setup_rate ?? "",
  newRate: item.newRate ?? item.new_rate ?? "",
  incomeGlCode: String(item.incomeGlCode ?? item.income_gl_code ?? ""),
  loanInterestType: String(item.loanInterestType ?? item.loan_interest_type ?? ""),
  isActive: item.isActive ?? item.active ?? true,
  raw: item,
});

export const getLoanPercentageSetups = async ({ activeOnly = true } = {}) => {
  const endpoint = activeOnly
    ? "/admin/loan-percentage-setups/active"
    : "/admin/loan-percentage-setups";
  let payload;

  try {
    payload = await apiRequest(endpoint, "GET", null, true);
  } catch (requestError) {
    if (!activeOnly) throw requestError;
    payload = await apiRequest("/admin/loan-percentage-setups", "GET", null, true);
  }

  return toArray(payload).map((item, index) =>
    mapLoanPercentageSetupFromApi(item, index)
  );
};

export const createLoanPercentageSetup = async (setupPayload) => {
  const payload = await apiRequest(
    "/admin/loan-percentage-setups",
    "POST",
    setupPayload,
    true
  );
  return mapLoanPercentageSetupFromApi(payload?.response ?? payload?.data ?? payload, 0);
};

export const updateLoanPercentageSetup = async (setupId, setupPayload) => {
  const payload = await apiRequest(
    `/admin/loan-percentage-setups/${setupId}`,
    "PUT",
    setupPayload,
    true
  );
  return mapLoanPercentageSetupFromApi(payload?.response ?? payload?.data ?? payload, 0);
};

export const deleteLoanPercentageSetup = async (setupId) => {
  await apiRequest(`/admin/loan-percentage-setups/${setupId}`, "DELETE", null, true);
};

export const mapDeliverySetupFromApi = (item = {}, fallbackIndex = 0) => ({
  id: item.id ?? item.deliverySetupId ?? `delivery-${fallbackIndex}`,
  categoryId: item.categoryId ?? item.category_id ?? "",
  categoryName: String(
    pickFirstValue(item, ["categoryName", "category_name"]) || ""
  ),
  weightMinKg: item.weightMinKg ?? item.weight_min_kg ?? "",
  weightMaxKg: item.weightMaxKg ?? item.weight_max_kg ?? null,
  distanceMinKm: item.distanceMinKm ?? item.distance_min_km ?? "",
  distanceMaxKm: item.distanceMaxKm ?? item.distance_max_km ?? null,
  deliveryFee: item.deliveryFee ?? item.delivery_fee ?? "",
  accountToCredit: String(item.accountToCredit ?? item.account_to_credit ?? ""),
  isActive: item.isActive ?? item.active ?? true,
  raw: item,
});

export const getDeliverySetups = async ({ activeOnly = true } = {}) => {
  const endpoint = activeOnly
    ? "/admin/delivery-setups/active"
    : "/admin/delivery-setups";
  let payload;

  try {
    payload = await apiRequest(endpoint, "GET", null, true);
  } catch (requestError) {
    if (!activeOnly) throw requestError;
    payload = await apiRequest("/admin/delivery-setups", "GET", null, true);
  }

  return toArray(payload).map((item, index) =>
    mapDeliverySetupFromApi(item, index)
  );
};

export const createDeliverySetup = async (setupPayload) => {
  const payload = await apiRequest(
    "/admin/delivery-setups",
    "POST",
    setupPayload,
    true
  );
  return mapDeliverySetupFromApi(payload?.response ?? payload?.data ?? payload, 0);
};

export const updateDeliverySetup = async (setupId, setupPayload) => {
  const payload = await apiRequest(
    `/admin/delivery-setups/${setupId}`,
    "PUT",
    setupPayload,
    true
  );
  return mapDeliverySetupFromApi(payload?.response ?? payload?.data ?? payload, 0);
};

export const deleteDeliverySetup = async (setupId) => {
  await apiRequest(`/admin/delivery-setups/${setupId}`, "DELETE", null, true);
};

export const mapFundTransferFromApi = (item = {}, fallbackIndex = 0) => {
  const accountId =
    item.fromAccountId ??
    item.from_account_id ??
    item.accountId ??
    item.account_id ??
    item.glAccount ??
    item.gl_account ??
    item.accountNo ??
    item.account_no ??
    "";
  const accountName = item.accountName ?? item.account_name ?? item.name ?? "";
  const description = item.description ?? item.narration ?? "";
  const customerName = pickFirstValue(item, [
    "customerName",
    "customer_name",
    "beneficiaryName",
    "beneficiary_name",
    "accountHolderName",
    "account_holder_name",
    "memberName",
    "member_name",
  ]);
  const debitValue =
    item.debit ??
    item.debitAmount ??
    item.debit_amount ??
    (String(item.entryType || item.entry_type || "").toUpperCase() === "DEBIT"
      ? item.amount
      : 0) ??
    0;
  const creditValue =
    item.credit ??
    item.creditAmount ??
    item.credit_amount ??
    (String(item.entryType || item.entry_type || "").toUpperCase() === "CREDIT"
      ? item.amount
      : 0) ??
    0;

  return {
    id: item.id ?? item.transferId ?? item.referenceNo ?? `row-${fallbackIndex}`,
    accountId: String(accountId),
    accountName: String(accountName),
    customerName: String(customerName || accountName || ""),
    description: String(description),
    debit: Number(debitValue) || 0,
    credit: Number(creditValue) || 0,
    referenceNo: item.referenceNo ?? item.reference_no ?? "",
    transactionDate: item.transactionDate ?? item.transaction_date ?? "",
    user:
      item.user ??
      item.createdBy ??
      item.created_by ??
      item.postedBy ??
      item.posted_by ??
      "",
    approvedBy:
      item.approvedBy ??
      item.approved_by ??
      item.authorizedBy ??
      item.authorized_by ??
      "",
    sourceType: "FUND_TRANSFER",
    raw: item,
  };
};

export const getFundTransfers = async (branchId = undefined) => {
  if (!FUND_TRANSFER_LIST_ENDPOINT) return [];

  const payload = await apiRequest(FUND_TRANSFER_LIST_ENDPOINT, "GET", null, true, branchId);
  return toArray(payload).map((item, index) => mapFundTransferFromApi(item, index));
};

export const createFundTransfer = async ({ userId, transferPayload }) => {
  if (!userId) {
    throw new Error("User ID is required for fund transfer");
  }

  const payload = await apiRequest(
    `${FUND_TRANSFER_ENDPOINT}?userId=${userId}`,
    "POST",
    transferPayload,
    true
  );

  const createdItem =
    payload?.response ??
    payload?.data ??
    payload?.content ??
    {
      ...transferPayload,
      accountId: transferPayload.fromAccountId,
      accountName: transferPayload.toAccountId
        ? `TO ACCOUNT ${transferPayload.toAccountId}`
        : "",
      debit: transferPayload.amount,
      credit: 0,
    };

  return mapFundTransferFromApi(createdItem, 0);
};

const getJournalLinesFromPayload = (item = {}) => {
  if (Array.isArray(item.journalLines)) return item.journalLines;
  if (Array.isArray(item.journal_lines)) return item.journal_lines;
  if (Array.isArray(item.lines)) return item.lines;
  if (Array.isArray(item.entries)) return item.entries;
  return [];
};

export const mapJournalRowsFromApi = (entry = {}, fallbackIndex = 0) => {
  const entryDescription =
    entry.description ?? entry.narration ?? entry.memo ?? "";
  const entryReference =
    entry.referenceNo ?? entry.reference_no ?? entry.refNo ?? "";
  const transactionDate =
    entry.transactionDate ?? entry.transaction_date ?? entry.createdAt ?? "";
  const user =
    entry.user ??
    entry.createdBy ??
    entry.created_by ??
    entry.postedBy ??
    entry.posted_by ??
    "";
  const approvedBy =
    entry.approvedBy ??
    entry.approved_by ??
    entry.authorizedBy ??
    entry.authorized_by ??
    "";
  const lines = getJournalLinesFromPayload(entry);

  const entryId = entry.id ?? null;
  const isApproved = entry.isApproved ?? entry.is_approved ?? false;

  if (lines.length === 0) {
    return [
      {
        id: entry.id ?? `journal-${fallbackIndex}`,
        journalEntryId: entryId,
        isApproved,
        accountId: entry.accountId ?? entry.account_id ?? "",
        accountName: entry.accountName ?? entry.account_name ?? "",
        customerName:
          entry.customerName ??
          entry.customer_name ??
          entry.accountName ??
          entry.account_name ??
          "",
        description: entryDescription,
        debit: Number(entry.debit) || 0,
        credit: Number(entry.credit) || 0,
        referenceNo: entryReference,
        transactionDate,
        user,
        approvedBy,
        sourceType: "JOURNAL",
      },
    ];
  }

  return lines.map((line, index) => ({
    id:
      line.id ??
      `${entry.id ?? `journal-${fallbackIndex}`}-line-${index + 1}`,
    journalEntryId: entryId,
    isApproved,
    // The backend serializes each line's account as a nested object (JournalLine.account),
    // not flat accountId/accountName — read both shapes so rows aren't dropped by filters.
    accountId: line.accountId ?? line.account_id ?? line.account?.id ?? "",
    accountName:
      line.accountName ??
      line.account_name ??
      line.account?.name ??
      line.account?.accountName ??
      "",
    customerName:
      line.customerName ??
      line.customer_name ??
      entry.customerName ??
      entry.customer_name ??
      line.accountName ??
      line.account_name ??
      line.account?.name ??
      line.account?.accountName ??
      "",
    description: line.description ?? entryDescription,
    debit: Number(line.debit) || 0,
    credit: Number(line.credit) || 0,
    referenceNo: line.referenceNo ?? line.reference_no ?? entryReference,
    transactionDate,
    user,
    approvedBy,
    sourceType: "JOURNAL",
  }));
};

export const getJournalEntries = async (branchId = undefined) => {
  const payload = await apiRequest(JOURNAL_ENDPOINT, "GET", null, true, branchId);
  const entries = toArray(payload);
  return entries.flatMap((entry, index) => mapJournalRowsFromApi(entry, index));
};

export const createJournalEntry = async ({ userId, journalPayload }) => {
  if (!userId) {
    throw new Error("User ID is required for journal entry");
  }

  const payload = await apiRequest(
    `${JOURNAL_ENDPOINT}?userId=${userId}`,
    "POST",
    journalPayload,
    true
  );

  const createdEntry =
    payload?.response ?? payload?.data ?? payload?.content ?? journalPayload;
  return mapJournalRowsFromApi(createdEntry, 0);
};

export const updateJournalEntry = async ({ entryId, userId, journalPayload }) => {
  if (!entryId) throw new Error("Entry ID is required for journal update");
  if (!userId) throw new Error("User ID is required for journal update");

  const payload = await apiRequest(
    `${JOURNAL_ENDPOINT}/${entryId}?userId=${userId}`,
    "PUT",
    journalPayload,
    true
  );

  const updatedEntry =
    payload?.response ?? payload?.data ?? payload?.content ?? journalPayload;
  return mapJournalRowsFromApi(updatedEntry, 0);
};

export const patchJournalEntry = async (entryId, updates) => {
  if (!entryId) throw new Error("Entry ID is required");
  const payload = await apiRequest(`${JOURNAL_ENDPOINT}/${entryId}`, "PATCH", updates, true);
  return payload?.response ?? payload?.data ?? payload?.content ?? payload;
};

// Entry-level mapper: keeps lines grouped under a single journal entry and
// computes the totals + balanced flag the index/form pages rely on.
export const mapJournalEntryFromApi = (entry = {}) => {
  const rawLines = getJournalLinesFromPayload(entry);
  const lines = rawLines.map((line, index) => {
    const account = line.account ?? {};
    return {
      id: line.id ?? `line-${index + 1}`,
      accountId: String(
        line.accountId ?? line.account_id ?? account.id ?? ""
      ),
      accountName:
        line.accountName ??
        line.account_name ??
        account.name ??
        account.accountName ??
        "",
      description: line.description ?? "",
      debit: Number(line.debit) || 0,
      credit: Number(line.credit) || 0,
      referenceNo: line.referenceNo ?? line.reference_no ?? "",
    };
  });

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: entry.id ?? null,
    journalReference:
      entry.journalReference ??
      entry.journal_reference ??
      entry.referenceNo ??
      entry.reference_no ??
      "",
    journalType: entry.journalType ?? entry.journal_type ?? "GENERAL_JOURNAL",
    transactionDate:
      entry.transactionDate ?? entry.transaction_date ?? entry.createdAt ?? "",
    description: entry.description ?? entry.narration ?? entry.memo ?? "",
    isApproved: entry.isApproved ?? entry.is_approved ?? false,
    postedBy: entry.postedBy ?? entry.posted_by ?? null,
    lines,
    totalDebit,
    totalCredit,
    balanced: Number(totalDebit.toFixed(2)) === Number(totalCredit.toFixed(2)),
  };
};

export const getJournalEntryList = async () => {
  const payload = await apiRequest(JOURNAL_ENDPOINT, "GET", null, true);
  return toArray(payload).map((entry) => mapJournalEntryFromApi(entry));
};

export const getJournalEntryById = async (entryId) => {
  if (!entryId) throw new Error("Entry ID is required");
  const payload = await apiRequest(`${JOURNAL_ENDPOINT}/${entryId}`, "GET", null, true);
  return mapJournalEntryFromApi(unwrapItem(payload));
};

export const getNextJournalReference = async () => {
  const payload = await apiRequest(`${JOURNAL_ENDPOINT}/next-reference`, "GET", null, true);
  const value = unwrapItem(payload);
  if (typeof value === "string") return value;
  return value?.journalReference ?? value?.reference ?? value?.nextReference ?? "";
};

export const deleteJournalEntry = async (entryId) => {
  if (!entryId) throw new Error("Entry ID is required");
  return apiRequest(`${JOURNAL_ENDPOINT}/${entryId}`, "DELETE", null, true);
};

export const mapUnifiedTransactionRow = (row = {}, fallbackIndex = 0) => {
  const raw = row.raw ?? row;
  const accountId = String(
    pickFirstValue(row, ["accountId", "account_id", "glAccount", "gl_account"]) || ""
  );
  const accountName = String(
    pickFirstValue(row, ["accountName", "account_name", "glName", "gl_name", "name"]) || ""
  );
  const customerName = String(
    pickFirstValue(row, [
      "customerName",
      "customer_name",
      "beneficiaryName",
      "beneficiary_name",
      "accountHolderName",
      "account_holder_name",
    ]) || accountName
  );
  return {
    id: row.id ?? raw.id ?? `txn-${fallbackIndex}`,
    referenceNo: String(pickFirstValue(row, ["referenceNo", "reference_no", "refNo"]) || ""),
    transactionDate: String(
      pickFirstValue(row, ["transactionDate", "transaction_date", "createdAt", "created_at"]) || ""
    ),
    accountId,
    accountName,
    customerName,
    affectedAccount: [accountId, accountName].filter(Boolean).join(" - "),
    description: String(pickFirstValue(row, ["description", "narration", "memo"]) || ""),
    debit: asNumber(pickFirstValue(row, ["debit", "debitAmount", "debit_amount"])),
    credit: asNumber(pickFirstValue(row, ["credit", "creditAmount", "credit_amount"])),
    user: String(pickFirstValue(row, ["user", "createdBy", "created_by", "postedBy", "posted_by"]) || ""),
    approvedBy: String(
      pickFirstValue(row, ["approvedBy", "approved_by", "authorizedBy", "authorized_by"]) || ""
    ),
    sourceType: String(pickFirstValue(row, ["sourceType"]) || "TRANSACTION"),
    raw,
  };
};

export const mapAccountLedgerLineFromApi = (line = {}, fallbackIndex = 0) => ({
  id: line.id ?? `ledger-${fallbackIndex}`,
  referenceNo: String(pickFirstValue(line, ["referenceNo", "reference_no"]) || ""),
  transactionDate: String(pickFirstValue(line, ["transactionDate", "transaction_date"]) || ""),
  accountId: String(pickFirstValue(line, ["accountId", "account_id"]) || ""),
  accountName: String(pickFirstValue(line, ["accountName", "account_name"]) || ""),
  customerName: String(
    pickFirstValue(line, ["customerName", "customer_name", "accountName", "account_name"]) || ""
  ),
  description: String(pickFirstValue(line, ["description"]) || ""),
  debit: asNumber(line.debit),
  credit: asNumber(line.credit),
  user: String(pickFirstValue(line, ["postedBy", "posted_by"]) || ""),
  approvedBy: String(pickFirstValue(line, ["approvedBy", "approved_by"]) || ""),
  sourceType: String(pickFirstValue(line, ["sourceType"]) || "JOURNAL"),
  isApproved: Boolean(line.isApproved ?? line.is_approved),
});

// The real, backend-computed ledger for one GL account — the source LedgerService
// builds from journal_lines joined to their parent entry (date/reference/approver),
// rather than the frontend re-aggregating separate journal/fund-transfer lists.
export const getAccountLedger = async (accountId, { startDate = "", endDate = "" } = {}) => {
  if (!accountId) return { transactions: [], totalDebit: 0, totalCredit: 0 };

  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();

  const payload = await apiRequest(
    `/admin/ledger/account/${accountId}${query ? `?${query}` : ""}`,
    "GET",
    null,
    true
  );
  const data = unwrapItem(payload) || {};
  const transactions = toArray(data.transactions ?? data).map((line, index) =>
    mapAccountLedgerLineFromApi(line, index)
  );

  return {
    transactions,
    totalDebit: asNumber(data.totalDebit),
    totalCredit: asNumber(data.totalCredit),
  };
};

export const getAccountingTransactions = async (branchId = undefined) => {
  const [journalRows, fundTransferRows] = await Promise.allSettled([
    getJournalEntries(branchId),
    getFundTransfers(branchId),
  ]);

  const rows = [
    ...(journalRows.status === "fulfilled" ? journalRows.value : []),
    ...(fundTransferRows.status === "fulfilled" ? fundTransferRows.value : []),
  ].map((row, index) => mapUnifiedTransactionRow(row, index));

  return rows.sort((left, right) => {
    const leftTime = Date.parse(left.transactionDate || "") || 0;
    const rightTime = Date.parse(right.transactionDate || "") || 0;
    return rightTime - leftTime;
  });
};
