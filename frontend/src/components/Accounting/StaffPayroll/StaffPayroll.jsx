import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BranchBadge from "../../shared/BranchBadge";
import { FiArrowLeft, FiFolder, FiPlus, FiPrinter, FiSave, FiSend, FiSettings, FiTrash2 } from "react-icons/fi";
import logo from "../../../assets/images/adminLogo.png";
import AccountPicker from "../../shared/AccountPicker";
import { getAccountOptions } from "../../../lib/accountingApi";
import {
  approveStaffAdvance,
  deleteStaff,
  disburseStaffAdvance,
  getPayrollAccounts,
  getStaff,
  getStaffAdvances,
  initiatePayroll,
  registerStaff,
  registerStaffAdvance,
  savePayrollAccount,
  saveStaffDetails,
} from "../../../lib/payrollApi";
import { useAuth } from "../../../context/AuthContext";
import "../Account.css";
import "./StaffPayroll.css";

const DEFAULT_SETUP = {
  frequency: "Monthly",
  nextPayrollDate: "",
  salaryExpenseGl: "",
  earningsBreakdown: [],
  deductionsBreakdown: [],
};

const createSalaryRows = (names) => names.map((name) => ({ id: `${name}-${Date.now()}-${Math.random()}`, name, amount: "" }));
const createSetupBreakdownRows = (names) => names.map((name) => ({ id: `${name}-${Date.now()}-${Math.random()}`, name, accountId: "" }));

const DEFAULT_EARNING_NAMES = [
  "Housing Allowance",
  "Transport Allowance",
  "Meal Allowance",
  "Medical Allowance",
  "Utility Allowance",
];

const DEFAULT_ALLOWANCE_NAMES = [
  "Housing Allowance",
  "Transport Allowance",
  "Meal Allowance",
  "Medical Allowance",
  "Utility Allowance",
];

const DEFAULT_DEDUCTION_NAMES = [
  "PAYE",
  "Pension",
  "NHF",
  "NHIS",
  "Union Dues",
  "Absence/Lateness Deductions",
];

const FALLBACK_NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Keystone Bank", code: "082" },
  { name: "Polaris Bank", code: "076" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

const createDefaultSetup = () => ({
  ...DEFAULT_SETUP,
  earningsBreakdown: createSetupBreakdownRows(DEFAULT_EARNING_NAMES),
  deductionsBreakdown: createSetupBreakdownRows(DEFAULT_DEDUCTION_NAMES),
});

const createDefaultStaff = () => ({
  staffId: "",
  title: "",
  fullName: "",
  gender: "",
  dateOfBirth: "",
  phoneNumber: "",
  emailAddress: "",
  homeAddress: "",
  stateOfOrigin: "",
  nextOfKinName: "",
  nextOfKinPhone: "",
  relationship: "",
  department: "",
  designation: "",
  staffGroup: "",
  employmentType: "Full-time",
  employmentDate: "",
  salaryGrade: "",
  basicSalary: "",
  allowances: createSalaryRows(DEFAULT_ALLOWANCE_NAMES),
  deductions: createSalaryRows(DEFAULT_DEDUCTION_NAMES),
  grossSalary: "",
  status: "Active",
  taxId: "",
  pensionPin: "",
  nhfNumber: "",
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountName: "",
});

const DEFAULT_ADVANCE = {
  staffId: "",
  requestDate: "",
  amount: "",
  repaymentMonths: "",
  interestRate: "",
  receiverAccountName: "",
  receiverAccountNumber: "",
  receiverBankName: "",
  reason: "",
};

const DEFAULT_DISBURSEMENT = {
  payrollPeriod: "",
  paymentDate: "",
  staffId: "",
};

const OBSOLETE_PAYROLL_STORAGE_KEYS = [
  "pmhub_staff_payroll_setup_v1",
  "pmhub_staff_payroll_staff_v1",
  "pmhub_staff_payroll_advance_v1",
];

const normalizeSetup = (setup) => ({
  ...createDefaultSetup(),
  ...setup,
  earningsBreakdown: setup?.earningsBreakdown?.length
    ? setup.earningsBreakdown
    : createSetupBreakdownRows(DEFAULT_EARNING_NAMES),
  deductionsBreakdown: setup?.deductionsBreakdown?.length
    ? setup.deductionsBreakdown
    : createSetupBreakdownRows(DEFAULT_DEDUCTION_NAMES),
});

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const sumSalaryRows = (rows = []) =>
  rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

const Field = ({ label, required, children, className = "" }) => (
  <label className={`payroll-field ${className}`}>
    <span>
      {label}
      {required ? <em> *</em> : null}
    </span>
    {children}
  </label>
);

const SalaryRows = ({ title, rows, type, onAdd, onChange, onRemove }) => (
  <div className="payroll-salary-group">
    <div className="payroll-salary-group-header">
      <h4>{title}</h4>
      <button type="button" className="payroll-mini-action" onClick={() => onAdd(type)}>
        <FiPlus /> Add
      </button>
    </div>
    <div className="payroll-salary-rows">
      {rows.map((row) => (
        <div className="payroll-salary-row" key={row.id}>
          <Field label="Description">
            <input value={row.name} onChange={(e) => onChange(type, row.id, "name", e.target.value)} />
          </Field>
          <Field label="Amount (NGN)">
            <input type="number" min="0" value={row.amount} onChange={(e) => onChange(type, row.id, "amount", e.target.value)} />
          </Field>
          <button type="button" className="payroll-icon-btn" aria-label={`Remove ${row.name}`} onClick={() => onRemove(type, row.id)}>
            <FiTrash2 />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const SetupBreakdownRows = ({ title, rows, type, accountLabel, accounts, onAdd, onChange, onRemove }) => (
  <div className="payroll-salary-group">
    <div className="payroll-salary-group-header">
      <h4>{title}</h4>
      <button type="button" className="payroll-mini-action" onClick={() => onAdd(type)}>
        <FiPlus /> Add
      </button>
    </div>
    <div className="payroll-salary-rows">
      {rows.map((row) => (
        <div className="payroll-setup-breakdown-row" key={row.id}>
          <Field label="Breakdown Name">
            <input value={row.name} onChange={(e) => onChange(type, row.id, "name", e.target.value)} />
          </Field>
          <Field label={accountLabel}>
            <AccountPicker
              accounts={accounts}
              value={row.accountId}
              onChange={(nextValue) => onChange(type, row.id, "accountId", nextValue)}
              placeholder="Search account by GL code or name"
            />
          </Field>
          <button type="button" className="payroll-icon-btn" aria-label={`Remove ${row.name}`} onClick={() => onRemove(type, row.id)}>
            <FiTrash2 />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const StaffPayroll = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("setup");
  const [accounts, setAccounts] = useState([]);
  const [payrollAccounts, setPayrollAccounts] = useState([]);
  const [setup, setSetup] = useState(() => normalizeSetup(createDefaultSetup()));
  const [staffForm, setStaffForm] = useState(() => createDefaultStaff());
  const [advanceForm, setAdvanceForm] = useState(DEFAULT_ADVANCE);
  const [disbursementForm, setDisbursementForm] = useState(DEFAULT_DISBURSEMENT);
  const [staffRows, setStaffRows] = useState([]);
  const [advanceRows, setAdvanceRows] = useState([]);
  const [bankOptions, setBankOptions] = useState(FALLBACK_NIGERIAN_BANKS);
  const [banksLoading, setBanksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    OBSOLETE_PAYROLL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }, []);

  useEffect(() => {
    Promise.allSettled([getAccountOptions(), getPayrollAccounts(), getStaff(), getStaffAdvances()])
      .then(([accountResult, payrollAccountResult, staffResult, advanceResult]) => {
        setAccounts(accountResult.status === "fulfilled" ? accountResult.value : []);
        setPayrollAccounts(payrollAccountResult.status === "fulfilled" ? payrollAccountResult.value : []);
        setStaffRows(staffResult.status === "fulfilled" ? staffResult.value : []);
        setAdvanceRows(advanceResult.status === "fulfilled" ? advanceResult.value : []);
        if (staffResult.status === "rejected") {
          showNotice(staffResult.reason?.message || "Unable to load staff payroll records.");
        }
      });
  }, []);

  useEffect(() => {
    if (!payrollAccounts.length || !accounts.length) return;

    const findGlAccountId = (payrollAccount) =>
      accounts.find((account) =>
        [account.glCode, account.code, account.name]
          .filter(Boolean)
          .some((value) =>
            [payrollAccount.accountGlCode, payrollAccount.accountName]
              .filter(Boolean)
              .some((backendValue) => String(value) === String(backendValue))
          )
      )?.value || "";

    const rowsFor = (types) => payrollAccounts
      .filter((item) => types.includes(String(item.componentType).toUpperCase()))
      .map((item) => ({
        id: item.id || `${item.componentType}-${item.description || item.accountName}`,
        name: item.description || item.accountName || item.componentType,
        accountId: findGlAccountId(item),
      }));

    const basicAccount = payrollAccounts.find(
      (item) => String(item.componentType).toUpperCase() === "BASIC_SALARY"
    );
    setSetup((prev) => ({
      ...prev,
      salaryExpenseGl: basicAccount ? findGlAccountId(basicAccount) : prev.salaryExpenseGl,
      earningsBreakdown: rowsFor(["ALLOWANCE"]).length
        ? rowsFor(["ALLOWANCE"])
        : prev.earningsBreakdown,
      deductionsBreakdown: rowsFor(["DEDUCTION", "TAX"]).length
        ? rowsFor(["DEDUCTION", "TAX"])
        : prev.deductionsBreakdown,
    }));
  }, [accounts, payrollAccounts]);

  useEffect(() => {
    let active = true;
    setBanksLoading(true);
    fetch("https://api.paystack.co/bank?country=nigeria&perPage=100")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load Paystack banks");
        return response.json();
      })
      .then((payload) => {
        const banks = Array.isArray(payload?.data)
          ? payload.data
              .filter((bank) => bank?.name && bank?.code)
              .map((bank) => ({ name: bank.name, code: bank.code }))
          : [];
        if (active && banks.length) setBankOptions(banks);
      })
      .catch(() => {
        if (active) setBankOptions(FALLBACK_NIGERIAN_BANKS);
      })
      .finally(() => {
        if (active) setBanksLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const grossSalary = Number(staffForm.basicSalary || 0) + sumSalaryRows(staffForm.allowances);
    setStaffForm((prev) => (
      String(prev.grossSalary) === String(grossSalary) ? prev : { ...prev, grossSalary: String(grossSalary || "") }
    ));
  }, [staffForm.basicSalary, staffForm.allowances]);

  const accountLabel = (value) =>
    accounts.find((account) => String(account.value) === String(value))?.label || "Not attached";

  const stats = useMemo(() => {
    const gross = staffRows.reduce((sum, row) => sum + Number(row.grossSalary || 0), 0);
    const advance = advanceRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return {
      gross,
      net: Math.max(gross - advance, 0),
      advance,
    };
  }, [advanceRows, staffRows]);

  const activeStaff = staffRows.filter((row) => String(row.status).toUpperCase() === "ACTIVE");
  // Payslip can be produced for any registered staff (not only ACTIVE) — fall back to the first
  // staff on record so the slip renders even when nobody is flagged ACTIVE.
  const selectedPayslipStaff = useMemo(
    () => staffRows.find((row) => row.staffId === disbursementForm.staffId) || staffRows[0] || null,
    [disbursementForm.staffId, staffRows]
  );
  const selectedPayslipSummary = selectedPayslipStaff?.salarySummary || {
    basic: Number(selectedPayslipStaff?.basicSalary || 0),
    allowanceTotal: sumSalaryRows(selectedPayslipStaff?.allowances),
    deductionTotal: sumSalaryRows(selectedPayslipStaff?.deductions),
    gross: Number(selectedPayslipStaff?.grossSalary || 0),
    net: Math.max(Number(selectedPayslipStaff?.grossSalary || 0) - sumSalaryRows(selectedPayslipStaff?.deductions), 0),
  };
  const salarySummary = useMemo(() => {
    const basic = Number(staffForm.basicSalary || 0);
    const allowanceTotal = sumSalaryRows(staffForm.allowances);
    const deductionTotal = sumSalaryRows(staffForm.deductions);
    const gross = basic + allowanceTotal;
    return {
      basic,
      allowanceTotal,
      deductionTotal,
      gross,
      net: Math.max(gross - deductionTotal, 0),
    };
  }, [staffForm.allowances, staffForm.basicSalary, staffForm.deductions]);

  const updateSetup = (field, value) => setSetup((prev) => ({ ...prev, [field]: value }));
  const updateStaff = (field, value) => setStaffForm((prev) => ({ ...prev, [field]: value }));
  const updateStaffBank = (code) => {
    const selectedBank = bankOptions.find((bank) => String(bank.code) === String(code));
    setStaffForm((prev) => ({
      ...prev,
      bankCode: code,
      bankName: selectedBank?.name || "",
    }));
  };
  const updateAdvance = (field, value) => setAdvanceForm((prev) => ({ ...prev, [field]: value }));
  const updateDisbursement = (field, value) => setDisbursementForm((prev) => ({ ...prev, [field]: value }));
  const updateSetupBreakdownRow = (type, id, field, value) => {
    setSetup((prev) => ({
      ...prev,
      [type]: prev[type].map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
  };
  const addSetupBreakdownRow = (type) => {
    setSetup((prev) => ({
      ...prev,
      [type]: [
        ...prev[type],
        {
          id: `${type}-${Date.now()}`,
          name: type === "earningsBreakdown" ? "New Allowance" : "New Deduction",
          accountId: "",
        },
      ],
    }));
  };
  const removeSetupBreakdownRow = (type, id) => {
    setSetup((prev) => ({
      ...prev,
      [type]: prev[type].filter((row) => row.id !== id),
    }));
  };
  const updateSalaryRow = (type, id, field, value) => {
    setStaffForm((prev) => ({
      ...prev,
      [type]: prev[type].map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
  };
  const addSalaryRow = (type) => {
    setStaffForm((prev) => ({
      ...prev,
      [type]: [
        ...prev[type],
        {
          id: `${type}-${Date.now()}`,
          name: type === "allowances" ? "New Allowance" : "New Deduction",
          amount: "",
        },
      ],
    }));
  };
  const removeSalaryRow = (type, id) => {
    setStaffForm((prev) => ({
      ...prev,
      [type]: prev[type].filter((row) => row.id !== id),
    }));
  };

  const showNotice = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const reloadStaff = async () => {
    const rows = await getStaff();
    setStaffRows(rows);
  };

  const saveStaff = async (event) => {
    event.preventDefault();
    if (!staffForm.fullName || !staffForm.department || !staffForm.staffGroup || !staffForm.grossSalary) {
      showNotice("Complete all required staff registration fields.");
      return;
    }
    setSaving(true);
    try {
      const registered = await registerStaff(staffForm);
      const backendStaffId =
        registered?.id ||
        registered?.staffId ||
        registered?.staff?.id ||
        registered?.data?.id;
      if (!backendStaffId || Number.isNaN(Number(backendStaffId))) {
        throw new Error("The backend registered the staff but did not return the numeric staff ID.");
      }

      const withPayrollAccountIds = {
        ...staffForm,
        allowances: staffForm.allowances.map((row) => ({
          ...row,
          payrollAccountId: payrollAccounts.find(
            (account) =>
              String(account.componentType).toUpperCase() === "ALLOWANCE" &&
              String(account.description || account.accountName).toLowerCase() === String(row.name).toLowerCase()
          )?.id,
        })),
        deductions: staffForm.deductions.map((row) => ({
          ...row,
          payrollAccountId: payrollAccounts.find(
            (account) =>
              ["DEDUCTION", "TAX"].includes(String(account.componentType).toUpperCase()) &&
              String(account.description || account.accountName).toLowerCase() === String(row.name).toLowerCase()
          )?.id,
        })),
      };

      await saveStaffDetails(backendStaffId, withPayrollAccountIds);
      await reloadStaff();
      setStaffForm(createDefaultStaff());
      showNotice("Staff registration saved to the backend.");
    } catch (error) {
      showNotice(error.message || "Unable to save staff registration.");
    } finally {
      setSaving(false);
    }
  };

  const saveAdvance = async (event) => {
    event.preventDefault();
    if (!advanceForm.staffId) { showNotice("Select a staff member."); return; }
    if (!advanceForm.amount) { showNotice("Enter the advance amount."); return; }
    if (!advanceForm.repaymentMonths) { showNotice("Enter repayment months (tenure)."); return; }
    setSaving(true);
    try {
      await registerStaffAdvance(advanceForm);
      const rows = await getStaffAdvances();
      setAdvanceRows(rows);
      setAdvanceForm(DEFAULT_ADVANCE);
      showNotice("Staff advance registered successfully.");
    } catch (err) {
      showNotice(err?.message || "Failed to register advance.");
    } finally {
      setSaving(false);
    }
  };

  const removeStaff = async (staffRow) => {
    const staffKey = staffRow?.id ?? staffRow?.staffId;
    if (!staffKey) {
      showNotice("Cannot delete: missing staff id.");
      return;
    }
    if (!window.confirm(
      `Delete ${staffRow.fullName || "this staff"}? This permanently removes their payroll records.`
    )) {
      return;
    }
    setSaving(true);
    try {
      await deleteStaff(staffKey);
      setStaffRows(await getStaff());
      showNotice("Staff deleted successfully.");
    } catch (err) {
      showNotice(err?.message || "Failed to delete staff.");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAdvance = async (row) => {
    const approver = user?.id || user?.userId;
    if (!approver) {
      showNotice("Your signed-in backend profile has no user ID.");
      return;
    }
    setSaving(true);
    try {
      await approveStaffAdvance(row.id, approver);
      setAdvanceRows(await getStaffAdvances());
      showNotice("Advance approved.");
    } catch (err) {
      showNotice(err?.message || "Failed to approve advance.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisburseAdvance = async (row) => {
    const disburser = user?.id || user?.userId;
    if (!disburser) {
      showNotice("Your signed-in backend profile has no user ID.");
      return;
    }
    setSaving(true);
    try {
      await disburseStaffAdvance(row.id, disburser);
      setAdvanceRows(await getStaffAdvances());
      showNotice("Advance disbursed.");
    } catch (err) {
      showNotice(err?.message || "Failed to disburse advance.");
    } finally {
      setSaving(false);
    }
  };

  const saveSetup = async () => {
    const mappings = [
      ...(setup.salaryExpenseGl ? [{
        componentType: "BASIC_SALARY",
        name: "Basic Salary",
        accountId: setup.salaryExpenseGl,
      }] : []),
      ...setup.earningsBreakdown.map((row) => ({ componentType: "ALLOWANCE", ...row })),
      ...setup.deductionsBreakdown.map((row) => ({
        componentType: String(row.name).toUpperCase() === "PAYE" ? "TAX" : "DEDUCTION",
        ...row,
      })),
    ].filter((row) => row.accountId);

    if (!mappings.length) {
      showNotice("Select at least one payroll account mapping.");
      return;
    }

    setSaving(true);
    try {
      await Promise.all(mappings.map((mapping) => {
        const account = accounts.find((item) => String(item.value) === String(mapping.accountId));
        return savePayrollAccount({
          componentType: mapping.componentType,
          accountGlCode: account?.glCode || account?.code || mapping.accountId,
          accountName: account?.name || account?.label || mapping.name,
          description: mapping.name,
        });
      }));
      setPayrollAccounts(await getPayrollAccounts());
      showNotice("Payroll account mappings saved to the backend.");
    } catch (error) {
      showNotice(error.message || "Unable to save payroll setup.");
    } finally {
      setSaving(false);
    }
  };

  const disburseSalary = async () => {
    if (!disbursementForm.payrollPeriod || !disbursementForm.paymentDate) {
      showNotice("Select payroll period and payment date before disbursement.");
      return;
    }
    const initiatedBy = user?.id || user?.userId;
    if (!initiatedBy) {
      showNotice("Your signed-in backend profile has no user ID.");
      return;
    }
    setSaving(true);
    try {
      await initiatePayroll({
        period: disbursementForm.payrollPeriod,
        paymentDate: disbursementForm.paymentDate,
        initiatedBy,
      });
      showNotice("Payroll initiated on the backend and sent for approval.");
    } catch (error) {
      showNotice(error.message || "Unable to initiate payroll.");
    } finally {
      setSaving(false);
    }
  };

  const printPayslip = () => {
    if (!selectedPayslipStaff) {
      showNotice("Select a staff member before printing payslip.");
      return;
    }
    window.print();
  };

  return (
    <div className="payroll-page">
      <nav className="payroll-nav">
        <Link to="/adminDashboard" className="payroll-brand">
          <img src={logo} alt="PM logo" />
          <span>Accounting Module</span>
        </Link>
        <div className="payroll-nav-actions">
          <Link to="/Accounting" className="payroll-back-button">
            <FiArrowLeft />
            <span>Back</span>
          </Link>
          <Link to="/Accounting" className="payroll-nav-link">Accounting</Link>
          <Link to="/" className="payroll-logout">Log Out</Link>
        </div>
      </nav>

      <main className="payroll-shell">
        <section className="payroll-hero">
          <div>
            <span>Payroll Workspace</span>
            <h1>Staff Payroll</h1>
            <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
              <BranchBadge />
            </div>
            <p>Manage payroll setup, register staff for payroll processing, and track staff salary advance requests in one professional workspace.</p>
          </div>
          <div className="payroll-stat-grid">
            <div>
              <span>Gross Payroll</span>
              <strong>{formatCurrency(stats.gross)}</strong>
            </div>
            <div>
              <span>Net Payroll</span>
              <strong>{formatCurrency(stats.net)}</strong>
            </div>
            <div>
              <span>Salary Advance</span>
              <strong>{formatCurrency(stats.advance)}</strong>
            </div>
          </div>
        </section>

        <div className="payroll-tabs">
          <button type="button" className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
            <FiFolder /> Payroll Dashboard
          </button>
          <button type="button" className={activeTab === "setup" ? "active" : ""} onClick={() => setActiveTab("setup")}>
            <FiSettings /> Setup
          </button>
          <button type="button" className={activeTab === "staff" ? "active" : ""} onClick={() => setActiveTab("staff")}>
            <FiFolder /> Staff Registration
          </button>
          <button type="button" className={activeTab === "advance" ? "active" : ""} onClick={() => setActiveTab("advance")}>
            <span className="payroll-naira-icon">₦</span> Staff Salary Advance
          </button>
          <button type="button" className={activeTab === "disbursement" ? "active" : ""} onClick={() => setActiveTab("disbursement")}>
            <span className="payroll-naira-icon">₦</span> Salary Disbursement
          </button>
        </div>

        {notice ? <div className="payroll-notice">{notice}</div> : null}

        {activeTab === "dashboard" ? (
          <section className="payroll-card">
            <header className="payroll-card-header">
              <h2>Payroll Dashboard</h2>
              <p>Complete overview of staff payroll, salary advances, and repayment schedules.</p>
            </header>

            <div className="payroll-section">
              <h3>Staff Payroll Summary</h3>
              <div className="payroll-dashboard-grid">
                <div className="dashboard-stat-box">
                  <span>Total Staff</span>
                  <strong>{staffRows.length}</strong>
                </div>
                <div className="dashboard-stat-box">
                  <span>Active Staff</span>
                  <strong>{activeStaff.length}</strong>
                </div>
                <div className="dashboard-stat-box">
                  <span>Total Gross Salary</span>
                  <strong>{formatCurrency(stats.gross)}</strong>
                </div>
                <div className="dashboard-stat-box">
                  <span>Total Deductions</span>
                  <strong>{formatCurrency(staffRows.reduce((sum, row) => sum + sumSalaryRows(row.deductions || []), 0))}</strong>
                </div>
              </div>

              <div className="payroll-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Staff ID</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Group</th>
                      <th>Basic Salary</th>
                      <th>Gross Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffRows.length === 0 ? (
                      <tr><td colSpan="7">No staff registered yet.</td></tr>
                    ) : staffRows.map((row) => (
                      <tr key={row.staffId}>
                        <td>{row.staffId}</td>
                        <td>{row.fullName}</td>
                        <td>{row.department}</td>
                        <td>{row.staffGroup}</td>
                        <td>{formatCurrency(row.basicSalary)}</td>
                        <td>{formatCurrency(row.grossSalary)}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="payroll-section">
              <h3>Salary Advance Status</h3>
              <div className="payroll-dashboard-grid">
                {(() => {
                  const pendingCount = advanceRows.filter(row => String(row.status || "PENDING").toUpperCase() === "PENDING").length;
                  const approvedCount = advanceRows.filter(row => String(row.status || "PENDING").toUpperCase() === "APPROVED").length;
                  const disbursedCount = advanceRows.filter(row => String(row.status || "PENDING").toUpperCase() === "DISBURSED").length;
                  const pendingAmount = advanceRows
                    .filter(row => String(row.status || "PENDING").toUpperCase() === "PENDING")
                    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
                  const approvedAmount = advanceRows
                    .filter(row => String(row.status || "PENDING").toUpperCase() === "APPROVED")
                    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
                  const disbursedAmount = advanceRows
                    .filter(row => String(row.status || "PENDING").toUpperCase() === "DISBURSED")
                    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

                  return (
                    <>
                      <div className="dashboard-status-box pending">
                        <span>Pending Requests</span>
                        <strong>{pendingCount}</strong>
                        <small>{formatCurrency(pendingAmount)}</small>
                      </div>
                      <div className="dashboard-status-box approved">
                        <span>Approved</span>
                        <strong>{approvedCount}</strong>
                        <small>{formatCurrency(approvedAmount)}</small>
                      </div>
                      <div className="dashboard-status-box disbursed">
                        <span>Disbursed</span>
                        <strong>{disbursedCount}</strong>
                        <small>{formatCurrency(disbursedAmount)}</small>
                      </div>
                      <div className="dashboard-stat-box">
                        <span>Total Advances</span>
                        <strong>{formatCurrency(stats.advance)}</strong>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="payroll-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Request Date</th>
                      <th>Amount</th>
                      <th>Tenure</th>
                      <th>Monthly Deduction</th>
                      <th>Status</th>
                      <th>Repaid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advanceRows.length === 0 ? (
                      <tr><td colSpan="7">No advance records found.</td></tr>
                    ) : advanceRows.map((row) => {
                      const staffMatch = staffRows.find(s => String(s.id) === String(row.staffId));
                      const displayName = row.staffName || staffMatch?.fullName || "";
                      const displayDate = row.requestDate || (row.createdAt ? String(row.createdAt).slice(0, 10) : "—");
                      const repaidAmount = row.totalRepaid || 0;
                      const remainingAmount = (Number(row.amount || 0) - Number(repaidAmount));

                      return (
                        <tr key={row.id}>
                          <td>{row.staffCode || row.staffId}{displayName ? ` — ${displayName}` : ""}</td>
                          <td>{displayDate}</td>
                          <td>{formatCurrency(row.amount)}</td>
                          <td>{row.tenure} months</td>
                          <td>{row.monthlyDeduction ? formatCurrency(row.monthlyDeduction) : "—"}</td>
                          <td><span className={`payroll-badge status-${String(row.status || "PENDING").toLowerCase()}`}>{row.status || "PENDING"}</span></td>
                          <td>{formatCurrency(repaidAmount)} / {formatCurrency(row.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="payroll-section">
              <h3>Advance Repayment Schedule</h3>
              <p>Track monthly repayments for all active salary advances.</p>
              <div className="payroll-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Advance Amount</th>
                      <th>Monthly Deduction</th>
                      <th>Total Tenure</th>
                      <th>Remaining Months</th>
                      <th>Total Repaid</th>
                      <th>Remaining Balance</th>
                      <th>Completion %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advanceRows.filter(row => String(row.status || "PENDING").toUpperCase() !== "PENDING").length === 0 ? (
                      <tr><td colSpan="8">No active repayments in progress.</td></tr>
                    ) : advanceRows
                      .filter(row => String(row.status || "PENDING").toUpperCase() !== "PENDING")
                      .map((row) => {
                        const staffMatch = staffRows.find(s => String(s.id) === String(row.staffId));
                        const displayName = row.staffName || staffMatch?.fullName || "";
                        const totalAmount = Number(row.amount || 0);
                        const totalRepaid = Number(row.totalRepaid || 0);
                        const remaining = totalAmount - totalRepaid;
                        const tenure = Number(row.tenure || 1);
                        const monthlyDeduction = Number(row.monthlyDeduction || totalAmount / tenure);
                        const remainingMonths = Math.ceil(remaining / (monthlyDeduction || 1));
                        const completionPercentage = tenure > 0 ? Math.min(100, Math.round((totalRepaid / totalAmount) * 100)) : 0;

                        return (
                          <tr key={row.id}>
                            <td>{row.staffCode || row.staffId} — {displayName}</td>
                            <td>{formatCurrency(totalAmount)}</td>
                            <td>{formatCurrency(monthlyDeduction)}</td>
                            <td>{tenure} months</td>
                            <td>{Math.max(0, remainingMonths)} months</td>
                            <td>{formatCurrency(totalRepaid)}</td>
                            <td>{formatCurrency(Math.max(0, remaining))}</td>
                            <td>
                              <div className="payroll-progress-bar">
                                <div className="payroll-progress-fill" style={{ width: `${completionPercentage}%` }}></div>
                                <span>{completionPercentage}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "setup" ? (
          <section className="payroll-card">
            <header className="payroll-card-header">
              <h2>Payroll Setup</h2>
              <p>Configure payroll posting accounts, frequency, and next payroll processing date.</p>
            </header>
            <div className="payroll-two-column">
              <div className="payroll-form-panel">
                <div className="payroll-grid two">
                  <Field label="Payroll Frequency">
                    <select value={setup.frequency} onChange={(e) => updateSetup("frequency", e.target.value)}>
                      <option>Monthly</option>
                      <option>Bi-weekly</option>
                      <option>Weekly</option>
                    </select>
                  </Field>
                  <Field label="Next Payroll Date">
                    <input type="date" value={setup.nextPayrollDate} onChange={(e) => updateSetup("nextPayrollDate", e.target.value)} />
                  </Field>
                  {[
                    ["salaryExpenseGl", "Salary Expense GL"],
                  ].map(([field, label]) => (
                    <Field key={field} label={label}>
                      <AccountPicker
                        accounts={accounts}
                        value={setup[field]}
                        onChange={(nextValue) => updateSetup(field, nextValue)}
                        placeholder={`Search ${label.toLowerCase()} by GL code or name`}
                      />
                    </Field>
                  ))}
                </div>
              </div>

              <aside className="payroll-mapping-panel">
                <h3>Current Payroll Mapping</h3>
                {[
                  ["Salary Expense GL", setup.salaryExpenseGl],
                  ["Next Payroll Run", setup.nextPayrollDate],
                ].map(([label, value]) => (
                  <div key={label} className="payroll-map-row">
                    <span>{label}</span>
                    <strong>{label.includes("Next") ? value || "Not scheduled" : accountLabel(value)}</strong>
                  </div>
                ))}
              </aside>
            </div>

            <div className="payroll-section">
              <h3>Breakdown</h3>
              <div className="payroll-salary-breakdown payroll-setup-breakdown">
                <SetupBreakdownRows
                  title="Basic Salary & Allowances"
                  rows={setup.earningsBreakdown}
                  type="earningsBreakdown"
                  accountLabel="Account to Debit"
                  accounts={accounts}
                  onAdd={addSetupBreakdownRow}
                  onChange={updateSetupBreakdownRow}
                  onRemove={removeSetupBreakdownRow}
                />
                <SetupBreakdownRows
                  title="Deductions"
                  rows={setup.deductionsBreakdown}
                  type="deductionsBreakdown"
                  accountLabel="Account to Credit"
                  accounts={accounts}
                  onAdd={addSetupBreakdownRow}
                  onChange={updateSetupBreakdownRow}
                  onRemove={removeSetupBreakdownRow}
                />
              </div>
            </div>

            {/* Single save at the bottom persists the whole setup form (mapping
                accounts, frequency, next date, and both breakdown tables) at once. */}
            <div className="payroll-actions">
              <button type="button" className="payroll-secondary" onClick={() => setSetup(createDefaultSetup())}>Clear Form</button>
              <button type="button" className="payroll-primary" onClick={saveSetup} disabled={saving}><FiSave /> {saving ? "Saving..." : "Save Payroll Setup"}</button>
            </div>
          </section>
        ) : null}

        {activeTab === "staff" ? (
          <section className="payroll-card">
            <header className="payroll-card-header">
              <h2>Staff Registration</h2>
              <p>Capture personal, employment, statutory, and payment information for payroll processing.</p>
            </header>
            <form onSubmit={saveStaff}>
              <div className="payroll-section">
                <h3>Personal Information</h3>
                <div className="payroll-grid three">
                  <Field label="Staff ID" required>
                    <input value={staffForm.staffId} placeholder="Auto-generated after selecting Staff Group & Date" readOnly />
                  </Field>
                  <Field label="Title">
                    <select value={staffForm.title} onChange={(e) => updateStaff("title", e.target.value)}>
                      <option value="">Select title</option>
                      <option>Mr</option>
                      <option>Mrs</option>
                      <option>Miss</option>
                      <option>Dr</option>
                    </select>
                  </Field>
                  <Field label="Full Name" required>
                    <input value={staffForm.fullName} onChange={(e) => updateStaff("fullName", e.target.value)} />
                  </Field>
                  <Field label="Gender">
                    <select value={staffForm.gender} onChange={(e) => updateStaff("gender", e.target.value)}>
                      <option value="">Select gender</option>
                      <option>Female</option>
                      <option>Male</option>
                    </select>
                  </Field>
                  <Field label="Date of Birth">
                    <input type="date" value={staffForm.dateOfBirth} onChange={(e) => updateStaff("dateOfBirth", e.target.value)} />
                  </Field>
                  <Field label="Phone Number">
                    <input value={staffForm.phoneNumber} onChange={(e) => updateStaff("phoneNumber", e.target.value)} />
                  </Field>
                  <Field label="Email Address">
                    <input type="email" value={staffForm.emailAddress} onChange={(e) => updateStaff("emailAddress", e.target.value)} />
                  </Field>
                  <Field label="Home Address" className="span-two">
                    <input value={staffForm.homeAddress} onChange={(e) => updateStaff("homeAddress", e.target.value)} />
                  </Field>
                  <Field label="State of Origin">
                    <input value={staffForm.stateOfOrigin} onChange={(e) => updateStaff("stateOfOrigin", e.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="payroll-section">
                <h3>Next of Kin</h3>
                <div className="payroll-grid three">
                  <Field label="Full Name">
                    <input value={staffForm.nextOfKinName} onChange={(e) => updateStaff("nextOfKinName", e.target.value)} />
                  </Field>
                  <Field label="Phone Number">
                    <input value={staffForm.nextOfKinPhone} onChange={(e) => updateStaff("nextOfKinPhone", e.target.value)} />
                  </Field>
                  <Field label="Relationship">
                    <select value={staffForm.relationship} onChange={(e) => updateStaff("relationship", e.target.value)}>
                      <option value="">Select relationship</option>
                      <option>Spouse</option>
                      <option>Parent</option>
                      <option>Sibling</option>
                      <option>Child</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="payroll-section">
                <h3>Employment Details</h3>
                <div className="payroll-grid three">
                  <Field label="Department" required>
                    <select value={staffForm.department} onChange={(e) => updateStaff("department", e.target.value)}>
                      <option value="">Select department</option>
                      <option>Finance</option>
                      <option>Operations</option>
                      <option>Sales</option>
                      <option>Admin</option>
                    </select>
                  </Field>
                  <Field label="Designation" required>
                    <input value={staffForm.designation} onChange={(e) => updateStaff("designation", e.target.value)} />
                  </Field>
                  <Field label="Staff Group" required>
                    <select value={staffForm.staffGroup} onChange={(e) => updateStaff("staffGroup", e.target.value)}>
                      <option value="">Select staff group</option>
                      <option>Management</option>
                      <option>Senior Staff</option>
                      <option>Junior Staff</option>
                      <option>Contract</option>
                    </select>
                  </Field>
                  <Field label="Employment Type">
                    <select value={staffForm.employmentType} onChange={(e) => updateStaff("employmentType", e.target.value)}>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                    </select>
                  </Field>
                  <Field label="Employment Date" required>
                    <input type="date" value={staffForm.employmentDate} onChange={(e) => updateStaff("employmentDate", e.target.value)} />
                  </Field>
                  <Field label="Salary Grade / Level">
                    <input value={staffForm.salaryGrade} placeholder="e.g. GL 10 / Step 3" onChange={(e) => updateStaff("salaryGrade", e.target.value)} />
                  </Field>
                  <Field label="Status">
                    <select value={staffForm.status} onChange={(e) => updateStaff("status", e.target.value)}>
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Suspended</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="payroll-section">
                <h3>Salary Breakdown</h3>
                <div className="payroll-grid three payroll-salary-basic">
                  <Field label="Basic Salary (NGN)" required>
                    <input type="number" min="0" value={staffForm.basicSalary} onChange={(e) => updateStaff("basicSalary", e.target.value)} />
                  </Field>
                  <Field label="Gross Salary (NGN)" required>
                    <input type="number" value={staffForm.grossSalary} readOnly />
                  </Field>
                  <Field label="Net Salary (NGN)">
                    <input type="number" value={salarySummary.net || ""} readOnly />
                  </Field>
                </div>

                <div className="payroll-salary-breakdown">
                  <SalaryRows
                    title="Allowances"
                    rows={staffForm.allowances}
                    type="allowances"
                    onAdd={addSalaryRow}
                    onChange={updateSalaryRow}
                    onRemove={removeSalaryRow}
                  />
                  <SalaryRows
                    title="Deductions"
                    rows={staffForm.deductions}
                    type="deductions"
                    onAdd={addSalaryRow}
                    onChange={updateSalaryRow}
                    onRemove={removeSalaryRow}
                  />
                </div>

                <div className="payroll-salary-summary">
                  <div>
                    <span>Basic</span>
                    <strong>{formatCurrency(salarySummary.basic)}</strong>
                  </div>
                  <div>
                    <span>Total Allowance</span>
                    <strong>{formatCurrency(salarySummary.allowanceTotal)}</strong>
                  </div>
                  <div>
                    <span>Total Deduction</span>
                    <strong>{formatCurrency(salarySummary.deductionTotal)}</strong>
                  </div>
                  <div>
                    <span>Net Salary</span>
                    <strong>{formatCurrency(salarySummary.net)}</strong>
                  </div>
                </div>
              </div>

              <div className="payroll-section">
                <h3>Statutory & Tax Information</h3>
                <div className="payroll-grid three">
                  <Field label="Tax ID / TIN">
                    <input value={staffForm.taxId} onChange={(e) => updateStaff("taxId", e.target.value)} />
                  </Field>
                  <Field label="Pension PIN (RSA)">
                    <input value={staffForm.pensionPin} onChange={(e) => updateStaff("pensionPin", e.target.value)} />
                  </Field>
                  <Field label="NHF Number">
                    <input value={staffForm.nhfNumber} onChange={(e) => updateStaff("nhfNumber", e.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="payroll-section">
                <h3>Bank & Payment Details</h3>
                <div className="payroll-grid three">
                  <Field label="Bank Name">
                    <select value={staffForm.bankCode} onChange={(e) => updateStaffBank(e.target.value)}>
                      <option value="">{banksLoading ? "Loading Paystack banks..." : "Select bank"}</option>
                      {bankOptions.map((bank) => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Account Number">
                    <input value={staffForm.accountNumber} onChange={(e) => updateStaff("accountNumber", e.target.value)} />
                  </Field>
                  <Field label="Account Name">
                    <input value={staffForm.accountName} onChange={(e) => updateStaff("accountName", e.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="payroll-actions">
                <button type="button" className="payroll-secondary" onClick={() => setStaffForm(createDefaultStaff())}>Clear Form</button>
                <button type="submit" className="payroll-primary" disabled={saving}><FiSave /> {saving ? "Saving..." : "Save Staff Registration"}</button>
              </div>
            </form>

            <div className="payroll-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Group</th>
                    <th>Gross Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffRows.length === 0 ? (
                    <tr><td colSpan="7">No staff registered on the backend yet.</td></tr>
                  ) : staffRows.map((row) => (
                    <tr key={row.staffId}>
                      <td>{row.staffId}</td>
                      <td>{row.fullName}</td>
                      <td>{row.department}</td>
                      <td>{row.staffGroup}</td>
                      <td>{formatCurrency(row.grossSalary)}</td>
                      <td>{row.status}</td>
                      <td>
                        <button
                          type="button"
                          className="payroll-danger"
                          disabled={saving}
                          onClick={() => removeStaff(row)}
                          title="Delete staff (e.g. sacked)"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "advance" ? (
          <section className="payroll-card">
            <header className="payroll-card-header">
              <h2>Staff Salary Advance</h2>
              <p>Record salary advance requests, repayment months, approval status, and reason.</p>
            </header>
            <form onSubmit={saveAdvance} className="payroll-section">
              <div className="payroll-grid three">
                <Field label="Staff" required>
                  <select value={advanceForm.staffId} onChange={(e) => updateAdvance("staffId", e.target.value)}>
                    <option value="">Search staff by ID or name</option>
                    {activeStaff.map((staff) => (
                      <option key={staff.staffId} value={staff.staffId}>{staff.staffId} - {staff.fullName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Request Date">
                  <input type="date" value={advanceForm.requestDate} onChange={(e) => updateAdvance("requestDate", e.target.value)} />
                </Field>
                <Field label="Amount" required>
                  <input type="number" min="0" value={advanceForm.amount} onChange={(e) => updateAdvance("amount", e.target.value)} />
                </Field>
                <Field label="Tenure (Repayment Months)" required>
                  <input type="number" min="1" value={advanceForm.repaymentMonths} onChange={(e) => updateAdvance("repaymentMonths", e.target.value)} />
                </Field>
                <Field label="Interest Rate (%)">
                  <input type="number" min="0" step="0.01" value={advanceForm.interestRate} onChange={(e) => updateAdvance("interestRate", e.target.value)} />
                </Field>
                <Field label="Receiver Account Name">
                  <input value={advanceForm.receiverAccountName} onChange={(e) => updateAdvance("receiverAccountName", e.target.value)} />
                </Field>
                <Field label="Receiver Account Number">
                  <input value={advanceForm.receiverAccountNumber} onChange={(e) => updateAdvance("receiverAccountNumber", e.target.value)} />
                </Field>
                <Field label="Receiver Bank">
                  <input value={advanceForm.receiverBankName} onChange={(e) => updateAdvance("receiverBankName", e.target.value)} />
                </Field>
                <Field label="Reason" className="span-three">
                  <textarea value={advanceForm.reason} onChange={(e) => updateAdvance("reason", e.target.value)} />
                </Field>
              </div>
              <div className="payroll-actions">
                <button type="button" className="payroll-secondary" onClick={() => setAdvanceForm(DEFAULT_ADVANCE)}>Clear Form</button>
                <button type="submit" className="payroll-primary" disabled={saving}><FiSave /> {saving ? "Saving..." : "Save Advance"}</button>
              </div>
            </form>

            <div className="payroll-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Request Date</th>
                    <th>Amount</th>
                    <th>Tenure</th>
                    <th>Monthly Deduction</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advanceRows.length === 0 ? (
                    <tr><td colSpan="7">No advance records found.</td></tr>
                  ) : advanceRows.map((row) => {
                    const status = String(row.status || "PENDING").toUpperCase();
                    // Older rows may lack a resolved staff name / request date; fall
                    // back to the loaded staff list and the record's created date.
                    const staffMatch = staffRows.find(
                      (s) => String(s.id) === String(row.staffId)
                    );
                    const displayName = row.staffName || staffMatch?.fullName || "";
                    const displayDate =
                      row.requestDate ||
                      (row.createdAt ? String(row.createdAt).slice(0, 10) : "—");
                    return (
                    <tr key={row.id}>
                      <td>{row.staffCode || row.staffId}{displayName ? ` — ${displayName}` : ""}</td>
                      <td>{displayDate}</td>
                      <td>{formatCurrency(row.amount)}</td>
                      <td>{row.tenure} months</td>
                      <td>{row.monthlyDeduction ? formatCurrency(row.monthlyDeduction) : "—"}</td>
                      <td>{status}</td>
                      <td>
                        {status === "PENDING" && (
                          <button
                            type="button"
                            className="payroll-secondary"
                            disabled={saving}
                            onClick={() => handleApproveAdvance(row)}
                          >
                            Approve
                          </button>
                        )}
                        {status === "APPROVED" && (
                          <button
                            type="button"
                            className="payroll-primary"
                            disabled={saving}
                            onClick={() => handleDisburseAdvance(row)}
                          >
                            Disburse
                          </button>
                        )}
                        {status === "DISBURSED" && <span className="payroll-pill">Disbursed</span>}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "disbursement" ? (
          <section className="payroll-card">
            <header className="payroll-card-header">
              <h2>Salary Disbursement</h2>
              <p>Prepare and process staff salary payments from registered payroll records.</p>
            </header>
            <div className="payroll-section">
              <h3>Disbursement Batch</h3>
              <div className="payroll-grid three">
                <Field label="Payroll Period">
                  <input type="month" value={disbursementForm.payrollPeriod} onChange={(e) => updateDisbursement("payrollPeriod", e.target.value)} />
                </Field>
                <Field label="Payment Date">
                  <input type="date" value={disbursementForm.paymentDate} onChange={(e) => updateDisbursement("paymentDate", e.target.value)} />
                </Field>
                <div className="payroll-disburse-action">
                  <button type="button" className="payroll-primary" onClick={disburseSalary} disabled={saving}>
                    <FiSend /> {saving ? "Submitting..." : "Initiate Payroll"}
                  </button>
                </div>
              </div>
            </div>

            <div className="payroll-section payroll-print-area">
              <div className="payroll-payslip-toolbar">
                <h3>Staff Pay Slip</h3>
                <div>
                  <select value={disbursementForm.staffId} onChange={(e) => updateDisbursement("staffId", e.target.value)}>
                    <option value="">Select staff</option>
                    {staffRows.map((staff) => (
                      <option key={staff.staffId} value={staff.staffId}>{staff.staffId} - {staff.fullName}</option>
                    ))}
                  </select>
                  <button type="button" className="payroll-primary" onClick={printPayslip}>
                    <FiPrinter /> Print Pay Slip
                  </button>
                </div>
              </div>

              {selectedPayslipStaff ? (
                <div className="payroll-payslip-card">
                  <div className="payroll-payslip-head">
                    <div>
                      <span>Pay Slip</span>
                      <h4>{selectedPayslipStaff.fullName}</h4>
                      <p>{selectedPayslipStaff.staffId} • {selectedPayslipStaff.department || "Department"} • {selectedPayslipStaff.designation || "Designation"}</p>
                    </div>
                    <div>
                      <span>Period</span>
                      <strong>{disbursementForm.payrollPeriod || "Not selected"}</strong>
                      <small>{disbursementForm.paymentDate || "Payment date pending"}</small>
                    </div>
                  </div>

                  <div className="payroll-payslip-summary">
                    <div>
                      <span>Basic Salary</span>
                      <strong>{formatCurrency(selectedPayslipSummary.basic)}</strong>
                    </div>
                    <div>
                      <span>Gross Salary</span>
                      <strong>{formatCurrency(selectedPayslipSummary.gross)}</strong>
                    </div>
                    <div>
                      <span>Deductions</span>
                      <strong>{formatCurrency(selectedPayslipSummary.deductionTotal)}</strong>
                    </div>
                    <div>
                      <span>Net Pay</span>
                      <strong>{formatCurrency(selectedPayslipSummary.net)}</strong>
                    </div>
                  </div>

                  <div className="payroll-payslip-lines">
                    <div>
                      <h5>Allowances</h5>
                      {(selectedPayslipStaff.allowances || []).map((row) => (
                        <p key={row.id}><span>{row.name}</span><strong>{formatCurrency(row.amount)}</strong></p>
                      ))}
                    </div>
                    <div>
                      <h5>Deductions</h5>
                      {(selectedPayslipStaff.deductions || []).map((row) => (
                        <p key={row.id}><span>{row.name}</span><strong>{formatCurrency(row.amount)}</strong></p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="payroll-empty-payslip">No staff registered yet — register a staff member to print a payslip.</div>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default StaffPayroll;
