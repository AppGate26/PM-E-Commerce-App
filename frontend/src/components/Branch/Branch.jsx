import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IoGridOutline } from "react-icons/io5";
import { FiPrinter, FiDownload } from "react-icons/fi";
import logo from "../../assets/images/PMlogo.png";
import ModuleUserChip from "../shared/ModuleUserChip";
import { useAuth } from "../../context/AuthContext";
import {
  fetchBranches,
  fetchBranchStock,
  fetchBranchSales,
  fetchBranchAccount,
  fetchBranchSummary,
} from "../../lib/branchApi";
import "./Branch.css";

const BRANCH_TABS = [
  { key: "stock", label: "Branch Stock" },
  { key: "sales", label: "Branch Sales" },
  { key: "account", label: "Branch Account" },
];
// Consolidated across all branches — only meaningful for head office / admin.
const SUMMARY_TAB = { key: "summary", label: "All Branches (Consolidated)" };

const formatCurrency = (value) => {
  const n = Number(value || 0);
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Turn an array of row objects into CSV and trigger a download.
const exportCsv = (rows, columns, filename) => {
  if (!rows.length) return;
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = typeof c.value === "function" ? c.value(row) : row[c.value];
          return `"${String(raw ?? "").replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const Branch = () => {
  const { user, isAdmin } = useAuth();
  // A branch user's own backend branch id. Head-office/admin users have none and
  // keep the free branch selector; a branch user is locked to their own branch so
  // they never see head-office or other branches' data.
  const ownBranchId =
    user?.branch?.id ?? user?.raw?.branch?.id ?? user?.branchId ?? user?.raw?.branchId ?? null;
  const lockedToOwnBranch = !isAdmin && ownBranchId != null;

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(lockedToOwnBranch ? String(ownBranchId) : "");
  const [activeTab, setActiveTab] = useState("stock");
  const [range, setRange] = useState({ from: "", to: "" });

  const [stockRows, setStockRows] = useState([]);
  const [salesRows, setSalesRows] = useState([]);
  const [account, setAccount] = useState({ journalEntries: [], totalDebit: 0, totalCredit: 0 });
  const [summary, setSummary] = useState({ branches: [], totals: {} });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Head-office / admin users also get the consolidated all-branches tab.
  const tabs = lockedToOwnBranch ? BRANCH_TABS : [...BRANCH_TABS, SUMMARY_TAB];

  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchBranches();
        setBranches(rows);
      } catch {
        setError("Unable to load branches.");
      }
    })();
  }, []);

  // The selected branch's real numeric backend id (Head Office carries it as backendId).
  const selectedBranch = useMemo(
    () => branches.find((b) => String(b.backendId ?? b.id) === String(branchId)),
    [branches, branchId]
  );

  const loadData = async () => {
    // The consolidated tab spans all branches, so it needs no branch selection.
    if (activeTab !== "summary" && !branchId) {
      setError("Select a branch first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (activeTab === "stock") {
        setStockRows(await fetchBranchStock(branchId));
      } else if (activeTab === "sales") {
        setSalesRows(await fetchBranchSales(branchId, range));
      } else if (activeTab === "account") {
        setAccount(await fetchBranchAccount(branchId, range));
      } else {
        setSummary(await fetchBranchSummary());
      }
    } catch (err) {
      setError(err?.message || "Unable to load branch data.");
    } finally {
      setLoading(false);
    }
  };

  const branchName = selectedBranch?.branchName || "—";

  // Total income for the branch = sum of sales order totals (answers "income from each branch").
  const salesIncome = useMemo(
    () => salesRows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0),
    [salesRows]
  );

  return (
    <div className="branch-page">
      <header className="branch-topbar">
        <div className="branch-brand">
          <img src={logo} alt="PM logo" />
          <div>
            <span>Branch Module</span>
            <strong>Branch Operations</strong>
          </div>
        </div>
        <div className="branch-actions">
          <ModuleUserChip user={user} />
          <Link to="/adminDashboard" className="branch-icon-btn" aria-label="Dashboard">
            <IoGridOutline />
          </Link>
        </div>
      </header>

      <main className="branch-main">
        <section className="branch-controls">
          <label className="branch-field">
            <span>Branch</span>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={lockedToOwnBranch}
              title={lockedToOwnBranch ? "You can only view your own branch" : undefined}
            >
              <option value="">Select branch</option>
              {branches.map((b) => {
                const id = b.backendId ?? b.id;
                return (
                  <option key={b.id} value={id}>
                    {b.branchName} {b.branchCode ? `(${b.branchCode})` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          {activeTab !== "stock" && (
            <>
              <label className="branch-field">
                <span>From</span>
                <input
                  type="date"
                  value={range.from}
                  onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                />
              </label>
              <label className="branch-field">
                <span>To</span>
                <input
                  type="date"
                  value={range.to}
                  onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                />
              </label>
            </>
          )}

          <button type="button" className="branch-primary" onClick={loadData} disabled={loading}>
            {loading ? "Loading..." : "Run"}
          </button>
        </section>

        <nav className="branch-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {error ? (
          <div className="branch-alert" role="alert">
            {error}
          </div>
        ) : null}

        <section className="branch-card branch-print-area">
          <div className="branch-card-head">
            <h2>
              {tabs.find((t) => t.key === activeTab)?.label}
              {activeTab === "summary" ? "" : ` — ${branchName}`}
            </h2>
            <div className="branch-card-actions">
              <button type="button" className="branch-secondary" onClick={() => window.print()}>
                <FiPrinter /> Print
              </button>
              {activeTab === "stock" && (
                <button
                  type="button"
                  className="branch-secondary"
                  onClick={() =>
                    exportCsv(
                      stockRows,
                      [
                        { label: "Stock Ref", value: (r) => r.stockRef || r.id },
                        { label: "Product", value: (r) => r.product?.productName || r.description || "—" },
                        { label: "Quantity", value: "quantity" },
                        { label: "Unit Price", value: "unitPrice" },
                      ],
                      `branch-stock-${branchId}.csv`
                    )
                  }
                >
                  <FiDownload /> CSV
                </button>
              )}
              {activeTab === "sales" && (
                <button
                  type="button"
                  className="branch-secondary"
                  onClick={() =>
                    exportCsv(
                      salesRows,
                      [
                        { label: "Reference", value: (r) => r.referenceNo || r.id },
                        { label: "Type", value: "orderType" },
                        { label: "Customer", value: (r) => r.customerName || "" },
                        { label: "Product", value: (r) => r.productName || "" },
                        { label: "Qty", value: "quantity" },
                        { label: "Total", value: "totalAmount" },
                        { label: "Status", value: "status" },
                      ],
                      `branch-sales-${branchId}.csv`
                    )
                  }
                >
                  <FiDownload /> CSV
                </button>
              )}
            </div>
          </div>

          {activeTab === "stock" && (
            <div className="branch-table-wrap">
              <table className="branch-table">
                <thead>
                  <tr>
                    <th>Stock Ref</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRows.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No stock for this branch. Run the report after selecting a branch.</td>
                    </tr>
                  ) : (
                    stockRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.stockRef || row.id}</td>
                        <td>{row.product?.productName || row.description || "—"}</td>
                        <td>{row.quantity ?? "—"}</td>
                        <td>{row.unitPrice ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "sales" && (
            <div className="branch-table-wrap">
              <table className="branch-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRows.length === 0 ? (
                    <tr>
                      <td colSpan={7}>No sales for this branch/range. Run the report after selecting a branch.</td>
                    </tr>
                  ) : (
                    salesRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.referenceNo || row.id}</td>
                        <td>{row.orderType}</td>
                        <td>{row.customerName || "—"}</td>
                        <td>{row.productName || "—"}</td>
                        <td>{row.quantity ?? "—"}</td>
                        <td>{formatCurrency(row.totalAmount)}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {salesRows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={5}>Total income from this branch</td>
                      <td>{formatCurrency(salesIncome)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {activeTab === "account" && (
            <div className="branch-table-wrap">
              <table className="branch-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {account.journalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No journal entries for this branch/range.</td>
                    </tr>
                  ) : (
                    account.journalEntries.map((row) => (
                      <tr key={row.id}>
                        <td>{row.journalReference}</td>
                        <td>{row.transactionDate}</td>
                        <td>{row.journalType}</td>
                        <td>{row.description || "—"}</td>
                        <td>{row.isApproved ? "Yes" : "No"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {account.journalEntries.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={3} />
                      <td>Total Debit</td>
                      <td>{formatCurrency(account.totalDebit)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} />
                      <td>Total Credit</td>
                      <td>{formatCurrency(account.totalCredit)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {activeTab === "summary" && (
            <div className="branch-table-wrap">
              <table className="branch-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Code</th>
                    <th>Stock Items</th>
                    <th>Stock Qty</th>
                    <th>Warehouse Qty</th>
                    <th>Sales Count</th>
                    <th>Sales Total</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.branches.length === 0 ? (
                    <tr>
                      <td colSpan={10}>No branch data. Click Run to load the consolidated report.</td>
                    </tr>
                  ) : (
                    summary.branches.map((row) => (
                      <tr key={row.branchId}>
                        <td>{row.branchName}</td>
                        <td>{row.branchCode}</td>
                        <td>{row.stockItems ?? 0}</td>
                        <td>{row.stockQuantity ?? 0}</td>
                        <td>{row.warehouseQuantity ?? 0}</td>
                        <td>{row.salesCount ?? 0}</td>
                        <td>{formatCurrency(row.salesTotal)}</td>
                        <td>{formatCurrency(row.totalDebit)}</td>
                        <td>{formatCurrency(row.totalCredit)}</td>
                        <td>{formatCurrency(row.netPosition)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {summary.branches.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Totals</td>
                      <td>{summary.totals.stockItems ?? 0}</td>
                      <td>{summary.totals.stockQuantity ?? 0}</td>
                      <td>{summary.totals.warehouseQuantity ?? 0}</td>
                      <td />
                      <td>{formatCurrency(summary.totals.salesTotal)}</td>
                      <td>{formatCurrency(summary.totals.totalDebit)}</td>
                      <td>{formatCurrency(summary.totals.totalCredit)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Branch;
