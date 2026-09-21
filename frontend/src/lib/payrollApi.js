import { apiRequest } from "./config";

const unwrap = (payload) =>
  payload?.response?.data ??
  payload?.response ??
  payload?.data?.content ??
  payload?.data ??
  payload?.content ??
  payload;

const toArray = (payload) => {
  const value = unwrap(payload);
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.records)) return value.records;
  return [];
};

const pick = (source = {}, keys = []) => {
  for (const key of keys) {
    const value = key.split(".").reduce((next, part) => next?.[part], source);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const normalizeEnum = (value = "") =>
  String(value).trim().replace(/[\s-]+/g, "_").toUpperCase();

const mapComponents = (components = [], componentType) =>
  components
    .filter((item) => normalizeEnum(item.componentType) === componentType)
    .map((item, index) => ({
      id: item.id || `${componentType}-${index}`,
      name: item.name || "",
      amount: item.amount ?? "",
      payrollAccountId: item.payrollAccountId || item.payrollAccount?.id || "",
    }));

export const mapStaffFromApi = (item = {}, index = 0) => {
  const salary = item.salaryBreakdown || item.salary || {};
  const components = salary.components || item.salaryComponents || [];
  const basicSalary = salary.basicSalary ?? item.basicSalary ?? 0;
  const allowances = mapComponents(components, "ALLOWANCE");
  const deductions = [
    ...mapComponents(components, "DEDUCTION"),
    ...mapComponents(components, "TAX"),
  ];
  const allowanceTotal = allowances.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const deductionTotal = deductions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const gross = Number(salary.grossSalary ?? item.grossSalary ?? basicSalary + allowanceTotal);
  const staffId = pick(item, ["id", "staffId", "staff.id"]) || `staff-${index}`;

  return {
    ...item,
    id: staffId,
    staffId: String(pick(item, ["staffCode", "employeeCode", "staffId", "id"]) || staffId),
    fullName: String(pick(item, ["fullName", "name", "staff.fullName"]) || ""),
    department: String(pick(item, ["employmentDetails.department", "employment.department", "department"]) || ""),
    designation: String(pick(item, ["employmentDetails.designation", "employment.designation", "designation"]) || ""),
    staffGroup: String(pick(item, ["employmentDetails.staffGroup", "employment.staffGroup", "staffGroup"]) || ""),
    status: String(pick(item, ["employmentDetails.staffStatus", "employment.staffStatus", "staffStatus", "status"]) || "ACTIVE"),
    basicSalary,
    grossSalary: gross,
    allowances,
    deductions,
    salarySummary: {
      basic: Number(basicSalary || 0),
      allowanceTotal,
      deductionTotal,
      gross,
      net: Number(salary.netSalary ?? item.netSalary ?? Math.max(gross - deductionTotal, 0)),
    },
  };
};

export const getStaff = async () => {
  const payload = await apiRequest("/admin/staff", "GET", null, true);
  const rows = toArray(payload);
  const enriched = await Promise.all(rows.map(async (row) => {
    const staffId = pick(row, ["id", "staffId", "staff.id"]);
    if (!staffId) return row;

    const [profileResult, salaryResult] = await Promise.allSettled([
      apiRequest(`/admin/staff/${staffId}/profile`, "GET", null, true),
      apiRequest(`/admin/payroll/salary-breakdown/${staffId}`, "GET", null, true),
    ]);

    return {
      ...row,
      ...(profileResult.status === "fulfilled" ? unwrap(profileResult.value) : {}),
      salaryBreakdown: salaryResult.status === "fulfilled" ? unwrap(salaryResult.value) : row.salaryBreakdown,
    };
  }));
  return enriched.map(mapStaffFromApi);
};

export const registerStaff = async (form) => {
  const requestBody = {
    fullName: form.fullName,
    gender: normalizeEnum(form.gender),
    dateOfBirth: form.dateOfBirth || null,
    phoneNumber: form.phoneNumber,
    email: form.emailAddress,
    homeAddress: form.homeAddress,
    stateOfOrigin: form.stateOfOrigin,
  };
  if (form.title) requestBody.title = normalizeEnum(form.title);

  const payload = await apiRequest("/admin/staff", "POST", requestBody, true);
  return unwrap(payload);
};

export const saveStaffDetails = async (staffId, form) => {
  const requests = [
    apiRequest("/admin/staff/employment-details", "POST", {
      staffId: Number(staffId),
      department: form.department,
      designation: form.designation,
      staffGroup: form.staffGroup,
      employmentType: normalizeEnum(form.employmentType),
      employmentDate: form.employmentDate || null,
      salaryLevel: form.salaryGrade,
      staffStatus: normalizeEnum(form.status),
    }, true),
    apiRequest("/admin/staff/next-of-kin", "POST", {
      staffId: Number(staffId),
      fullName: form.nextOfKinName,
      phoneNumber: form.nextOfKinPhone,
      relationship: normalizeEnum(form.relationship) || "OTHER",
    }, true),
    apiRequest("/admin/staff/statutory-info", "POST", {
      staffId: Number(staffId),
      taxId: form.taxId,
      pensionNumber: form.pensionPin,
      nhfNumber: form.nhfNumber,
    }, true),
    apiRequest("/admin/staff/bank-details", "POST", {
      staffId: Number(staffId),
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      accountName: form.accountName,
    }, true),
    apiRequest("/admin/payroll/salary-breakdown", "POST", {
      staffId: Number(staffId),
      basicSalary: Number(form.basicSalary || 0),
      components: [
        ...(form.allowances || []).map((row) => ({
          componentType: "ALLOWANCE",
          name: row.name,
          amount: Number(row.amount || 0),
          isPercentage: false,
          percentageValue: 0,
          payrollAccountId: row.payrollAccountId ? Number(row.payrollAccountId) : null,
        })),
        ...(form.deductions || []).map((row) => ({
          componentType: row.name?.toUpperCase() === "PAYE" ? "TAX" : "DEDUCTION",
          name: row.name,
          amount: Number(row.amount || 0),
          isPercentage: false,
          percentageValue: 0,
          payrollAccountId: row.payrollAccountId ? Number(row.payrollAccountId) : null,
        })),
      ],
    }, true),
  ];

  return Promise.all(requests);
};

export const deleteStaff = async (staffId) =>
  unwrap(await apiRequest(`/admin/staff/${staffId}`, "DELETE", null, true));

export const getPayrollAccounts = async () =>
  toArray(await apiRequest("/admin/payroll/accounts", "GET", null, true));

export const savePayrollAccount = async ({ componentType, accountGlCode, accountName, description }) =>
  apiRequest("/admin/payroll/accounts", "POST", {
    componentType,
    accountGlCode: String(accountGlCode || ""),
    accountName,
    description,
  }, true);

export const initiatePayroll = async ({ period, paymentDate, initiatedBy }) =>
  unwrap(await apiRequest("/admin/payroll/initiate", "POST", {
    period,
    paymentDate,
    initiatedBy: Number(initiatedBy),
  }, true));

export const getPayrollRuns = async () =>
  toArray(await apiRequest("/admin/payroll/runs", "GET", null, true));

export const getStaffPayslips = async (staffId) =>
  toArray(await apiRequest(`/admin/payroll/staff/${staffId}/payslips`, "GET", null, true));

export const registerStaffAdvance = async (form) => {
  const body = {
    staffId: Number(form.staffId) || null,
    // Always stamp a request date so the record shows one; default to today.
    requestDate: form.requestDate || new Date().toISOString().slice(0, 10),
    amount: Number(form.amount) || 0,
    tenure: Number(form.repaymentMonths) || null,
    interestRate: Number(form.interestRate) || 0,
    receiverAccountName: form.receiverAccountName || "",
    receiverAccountNumber: form.receiverAccountNumber || "",
    receiverBankName: form.receiverBankName || "",
    reason: form.reason || "",
  };
  return unwrap(await apiRequest("/admin/staff/advance", "POST", body, true));
};

export const getStaffAdvances = async () =>
  toArray(await apiRequest("/admin/staff/advance", "GET", null, true));

export const approveStaffAdvance = async (id, approvedBy) =>
  unwrap(await apiRequest(`/admin/staff/advance/${id}/approve?approvedBy=${approvedBy}`, "PATCH", null, true));

export const disburseStaffAdvance = async (id, disbursedBy) =>
  unwrap(await apiRequest(`/admin/staff/advance/${id}/disburse?disbursedBy=${disbursedBy}`, "PATCH", null, true));

export const generateRepaymentSchedule = async (advanceId) =>
  toArray(await apiRequest(`/admin/staff/advance/${advanceId}/generate-schedule`, "POST", null, true));

export const getRepaymentSchedule = async (advanceId) =>
  toArray(await apiRequest(`/admin/staff/advance/${advanceId}/repayment-schedule`, "GET", null, true));

export const recordRepayment = async (form) => {
  const body = {
    advanceId: Number(form.advanceId),
    repaymentDate: form.repaymentDate || new Date().toISOString().slice(0, 10),
    amount: Number(form.amount) || 0,
    month: form.month || "",
    status: form.status || "COMPLETED",
    remarks: form.remarks || "",
  };
  return unwrap(await apiRequest("/admin/staff/advance-repayment", "POST", body, true));
};

export const updateRepaymentStatus = async (repaymentId, status, recordedBy) =>
  unwrap(await apiRequest(`/admin/staff/advance-repayment/${repaymentId}/status?status=${status}&recordedBy=${recordedBy}`, "PATCH", null, true));

export const deleteRepayment = async (repaymentId) =>
  unwrap(await apiRequest(`/admin/staff/advance-repayment/${repaymentId}`, "DELETE", null, true));
