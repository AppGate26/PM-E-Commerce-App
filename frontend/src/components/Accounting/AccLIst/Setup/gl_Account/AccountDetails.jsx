import React, { useEffect, useMemo, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import AccountNavSm from "../../../AccountNavSm";
import ReuseableChartNav from "./chart_account/ReusableChartNav";
import {
  createAccountDetail,
  deleteAccountDetail,
  getAccountDetails,
  getAccountTypes,
  getChartOfAccounts,
  getControlAccounts,
  updateAccountDetail,
} from "../../../../../lib/accountingApi";

const AccountDetails = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("");
  const [controlAccount, setControlAccount] = useState("");
  const [chartOfAccount, setChartOfAccount] = useState("");
  const [accountDetailsCode, setAccountDetailsCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountTypes, setAccountTypes] = useState([]);
  const [controlAccounts, setControlAccounts] = useState([]);
  const [chartAccounts, setChartAccounts] = useState([]);
  const [rows, setRows] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const [types, controls, charts, details] = await Promise.all([
        getAccountTypes(),
        getControlAccounts(),
        getChartOfAccounts(),
        getAccountDetails(),
      ]);
      const typeMap = new Map(types.map((type) => [String(type.id), type]));
      const controlMap = new Map(controls.map((control) => [String(control.id), control]));
      const chartMap = new Map(charts.map((chart) => [String(chart.id), chart]));

      setAccountTypes(types);
      setControlAccounts(controls);
      setChartAccounts(charts);
      setRows(
        details.map((row, index) => {
          const type = typeMap.get(String(row.accountTypeId));
          const control = controlMap.get(String(row.controlAccountId));
          const chart = chartMap.get(String(row.chartOfAccountId));
          return {
            ...row,
            sn: index + 1,
            accountType: String(type?.name || row.accountTypeName || "").toUpperCase(),
            accountDetailsCode: String(row.accountDetailsCode || row.id || ""),
            accountDetailsName: row.accountDetailsName || "",
            accountName: row.accountDetailsName || "",
            controlAccount: String(row.controlAccountId || ""),
            controlAccountName: control?.name || row.controlAccountName || "",
            chartOfAccount: String(row.chartOfAccountId || ""),
            chartOfAccountName: chart?.description || row.chartOfAccountName || "",
          };
        })
      );
    } catch (requestError) {
      setRows([]);
      setError(requestError?.message || "Unable to load account details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const chartNameMap = useMemo(
    () =>
      Object.fromEntries(
        chartAccounts.map((row) => [String(row.id), row.description || row.id])
      ),
    [chartAccounts]
  );

  const controlNameMap = useMemo(
    () => Object.fromEntries(controlAccounts.map((row) => [String(row.id), row.name || row.id])),
    [controlAccounts]
  );

  const controlAccountOptions = useMemo(() => {
    return controlAccounts.filter((row) =>
      accountType ? String(row.accountTypeId) === String(accountType) : true
    );
  }, [accountType, controlAccounts]);

  const chartOfAccountOptions = useMemo(() => {
    return chartAccounts.filter((row) => {
      const typeMatch = accountType ? String(row.accountTypeId) === String(accountType) : true;
      const controlMatch = controlAccount ? String(row.controlAccountId) === String(controlAccount) : true;
      return typeMatch && controlMatch;
    });
  }, [accountType, controlAccount, chartAccounts]);

  const tableRows = useMemo(() => {
    return rows.filter((row) => {
      const typeMatch = accountType ? String(row.accountTypeId) === String(accountType) : true;
      const controlMatch = controlAccount
        ? String(row.controlAccount) === String(controlAccount)
        : true;
      const chartMatch = chartOfAccount
        ? String(row.chartOfAccount) === String(chartOfAccount)
        : true;
      return typeMatch && controlMatch && chartMatch;
    });
  }, [rows, accountType, controlAccount, chartOfAccount]);

  const clearForm = () => {
    setAccountType("");
    setControlAccount("");
    setChartOfAccount("");
    setAccountDetailsCode("");
    setAccountName("");
    setEditingIndex(null);
  };

  const handleAddOrUpdate = async () => {
    if (!accountType || !controlAccount || !chartOfAccount || !accountName.trim()) {
      setError("Account type, control account, chart of account, and account name are required.");
      return;
    }

    const editingRow = editingIndex !== null ? rows[editingIndex] : null;

    if (!editingRow && !accountDetailsCode.trim()) {
      setError("Account details code is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingRow) {
        await updateAccountDetail(editingRow.id, { accountDetailsName: accountName.trim() });
      } else {
        await createAccountDetail({
          accountTypeId: accountType,
          controlAccountId: controlAccount,
          chartOfAccountId: chartOfAccount,
          accountDetailsCode: accountDetailsCode.trim(),
          accountDetailsName: accountName.trim(),
        });
      }

      await loadRows();
      clearForm();
    } catch (requestError) {
      setError(requestError?.message || "Unable to save account details.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (index) => {
    const row = rows[index];
    if (!row) return;
    setAccountType(String(row.accountTypeId || ""));
    setControlAccount(row.controlAccount);
    setChartOfAccount(row.chartOfAccount);
    setAccountDetailsCode(row.accountDetailsCode);
    setAccountName(row.accountName || "");
    setEditingIndex(index);
  };

  const handleDelete = async (index) => {
    const row = rows[index];
    if (!row) return;

    try {
      setSaving(true);
      setError("");
      await deleteAccountDetail(row.id);
      await loadRows();
      if (editingIndex === index) clearForm();
    } catch (requestError) {
      setError(requestError?.message || "Unable to delete account details.");
    } finally {
      setSaving(false);
    }
  };

  const handleAccountTypeChange = (value) => {
    setAccountType(value);
    setControlAccount("");
    setChartOfAccount("");
  };

  const handleControlAccountChange = (value) => {
    setControlAccount(value);
    setChartOfAccount("");
  };

  return (
    <div>
      <div className="AccountNavSm">
        <AccountNavSm title="account id" />
      </div>
      <div className="rm-acc-Nav-sm">
        <ReuseableChartNav title="account id" />
      </div>

      <div className="chart-acc-box bg-white account-details-panel">
        <div className="acc-type-back-wrap">
          <button
            type="button"
            className="acc-type-back-btn"
            onClick={() => navigate("/Accounting/Setup")}
            aria-label="Go back to setup"
          >
            <IoArrowBack size={20} />
          </button>
        </div>

        <div className="account-selector account-details-selector">
          <div className="account-details-title-row">
            <div>
              <h3 className="account-details-title">Account ID Register</h3>
              <p className="account-details-subtitle">
                Add, edit, and remove account IDs from the backend account details table.
              </p>
            </div>
            <div className="account-details-header-actions">
              <span className="account-details-count">
                {tableRows.length} record{tableRows.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                className="account-details-soft-btn"
                onClick={loadRows}
                disabled={loading || saving}
              >
                Refresh
              </button>
            </div>
          </div>

          {error && <div className="text-danger mb-3">{error}</div>}

          <div className="account-details-form-card">
            <div className="account-details-form-grid">
              <div className="chart-acc-select">
                <label>Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => handleAccountTypeChange(e.target.value)}
                >
                  <option value="">Choose account type</option>
                  {accountTypes.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="chart-acc-select">
                <label>Control Account</label>
                <select
                  value={controlAccount}
                  onChange={(e) => handleControlAccountChange(e.target.value)}
                >
                  <option value="">Select control account</option>
                  {controlAccountOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.controlId || option.id} - {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="chart-acc-select">
                <label>Chart Of Account</label>
                <select
                  value={chartOfAccount}
                  onChange={(e) => setChartOfAccount(e.target.value)}
                >
                  <option value="">Select chart of account</option>
                  {chartOfAccountOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.code || option.id} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="chart-acc-select">
                <label>Account Details Code</label>
                <input
                  type="text"
                  className="border text-start border-primary"
                  value={accountDetailsCode}
                  onChange={(e) => setAccountDetailsCode(e.target.value)}
                  placeholder="Enter account details code"
                  disabled={editingIndex !== null}
                />
              </div>
              <div className="chart-acc-select account-details-name-field">
                <label>Account Name</label>
                <input
                  type="text"
                  className="border text-start border-primary"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Enter account name"
                />
              </div>
            </div>

            <div className="account-details-btn-row">
              <button
                type="button"
                onClick={clearForm}
                className="account-details-clear-btn"
                disabled={saving}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleAddOrUpdate}
                className="btn btn-primary btn-chart-acc-select account-details-save-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : editingIndex !== null ? "Update Account Details" : "Add Account Details"}
              </button>
            </div>
          </div>

          <div className="chart-account-select-table-box account-details-table-box">
            <table className="chart-acc-select-table account-details-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>ACCOUNT TYPE</th>
                  <th>CONTROL ACCOUNT</th>
                  <th>CHART OF ACCOUNT</th>
                  <th>ACCOUNT DETAILS</th>
                  <th>ACCOUNT NAME</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">Loading account details...</td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan="7">No account details found.</td>
                  </tr>
                ) : (
                  tableRows.map((row) => {
                    const actualIndex = rows.findIndex((item) => item.id === row.id);
                    return (
                      <tr key={`${row.id}-${row.accountDetailsCode}`}>
                        <td>{row.sn}</td>
                        <td>{row.accountType}</td>
                        <td>{controlNameMap[row.controlAccount] || row.controlAccount}</td>
                        <td>{chartNameMap[row.chartOfAccount] || row.chartOfAccount}</td>
                        <td>{row.accountDetailsCode}</td>
                        <td>{row.accountName}</td>
                        <td>
                          <div className="account-details-action-row">
                            <button
                              type="button"
                              className="control-action-btn edit"
                              onClick={() => handleEdit(actualIndex)}
                              aria-label="Edit row"
                              disabled={saving}
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              type="button"
                              className="control-action-btn delete"
                              onClick={() => handleDelete(actualIndex)}
                              aria-label="Remove row"
                              disabled={saving}
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
