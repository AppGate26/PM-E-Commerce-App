import React, { useEffect, useMemo, useState } from "react";
import { FaEdit, FaSyncAlt, FaTrash } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import AccountNavSm from "../../../../AccountNavSm";
import {
  createChartOfAccount,
  deleteChartOfAccount,
  getAccountTypes,
  getChartOfAccounts,
  getControlAccounts,
  updateChartOfAccount,
} from "../../../../../../lib/accountingApi";
import ReuseableChartNav from "./ReusableChartNav";
import { exportChartRowsToExcel } from "./exportChartRowsToExcel";

const normalizeAccountRows = (accounts = [], accountType, controlId) =>
  accounts
    .map((account, index) => ({
      id: account.id,
      sn: index + 1,
      controlId,
      chartOfAccount: account.code || account.id || "",
      accountName: account.description || "",
      accountType: String(account.accountTypeName || accountType).toUpperCase(),
      accountTypeId: account.accountTypeId,
      raw: account.raw || account,
    }));

const BackendChartAccountSection = ({
  accountType,
  controlId,
  controlName,
  navTitle,
  exportFilePrefix,
}) => {
  const navigate = useNavigate();
  const { controlId: routeControlId } = useParams();
  const effectiveControlId = controlId || routeControlId || "";
  const [backendAccountType, setBackendAccountType] = useState(accountType || "");
  const effectiveAccountType = accountType || backendAccountType;
  const [rows, setRows] = useState([]);
  const [backendControlName, setBackendControlName] = useState(controlName || "");
  const [backendControlId, setBackendControlId] = useState(controlId || routeControlId || "");
  const [chartId, setChartId] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const [types, controls, charts] = await Promise.all([
        getAccountTypes(),
        getControlAccounts(),
        getChartOfAccounts({ controlAccountId: effectiveControlId }),
      ]);
      const controlRow = controls.find(
        (control) => String(control.id) === String(effectiveControlId)
      );
      const accountTypeRow = types.find(
        (type) => String(type.id) === String(controlRow?.accountTypeId)
      );
      const nextAccountType = String(accountType || accountTypeRow?.name || controlRow?.accountTypeName || "").toUpperCase();
      setBackendAccountType(nextAccountType);
      const nextControlName = controlName || controlRow?.name || effectiveControlId;
      setBackendControlName(nextControlName);
      const nextControlId = controlRow?.controlId || effectiveControlId;
      setBackendControlId(nextControlId);
      setRows(normalizeAccountRows(charts, nextAccountType, nextControlId));
    } catch (requestError) {
      setRows([]);
      setError(requestError?.message || "Unable to load chart of account.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [accountType, effectiveControlId]);

  const editingRow = useMemo(
    () => rows.find((row) => row.id === editingId) || null,
    [editingId, rows]
  );

  const handleAddOrUpdate = async () => {
    const value = description.trim();
    if (!value) {
      setError("Account name is required.");
      return;
    }
    const controlAccountId = Number(effectiveControlId);
    if (!controlAccountId) {
      setError("Backend control account ID is required.");
      return;
    }

    const chartOfAccountId = chartId.trim();
    if (!editingRow && !chartOfAccountId) {
      setError("Chart of account ID is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      if (editingRow) {
        await updateChartOfAccount(editingRow.id, { description: value });
      } else {
        const accountTypeId =
          editingRow?.accountTypeId ||
          rows.find((row) => row.accountTypeId)?.accountTypeId ||
          (await getControlAccounts()).find(
            (control) => String(control.id) === String(controlAccountId)
          )?.accountTypeId;
        await createChartOfAccount({
          accountTypeId,
          controlAccountId,
          chartOfAccountId,
          description: value,
        });
      }
      await loadRows();
      setDescription("");
      setChartId("");
      setEditingId(null);
    } catch (requestError) {
      setError(requestError?.message || "Unable to save chart account.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setDescription(row.accountName);
    setChartId(String(row.chartOfAccount || ""));
    setEditingId(row.id);
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;

    try {
      setSaving(true);
      setError("");
      await deleteChartOfAccount(row.id);
      await loadRows();
      if (editingId === row.id) {
        setDescription("");
        setChartId("");
        setEditingId(null);
      }
    } catch (requestError) {
      setError(requestError?.message || "Unable to delete chart account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="AccountNavSm">
        <AccountNavSm title="chart of account" />
      </div>
      <div className="rm-acc-Nav-sm">
        <ReuseableChartNav title={navTitle || effectiveAccountType.toLowerCase()} />
      </div>
      <div className="chart-acc-box bg-white">
        <div className="acc-type-back-wrap">
          <button
            type="button"
            className="acc-type-back-btn"
            onClick={() => navigate("/chartAccount")}
            aria-label="Go back to chart account"
          >
            <IoArrowBack size={20} />
          </button>
        </div>

        <div className="account-selector">
          {error && <div className="text-danger mb-3">{error}</div>}

          <div className="chart-acc-select">
            <label className="text-primary fw-bold">Account Type</label>
            <input
              type="text"
              disabled
              className="bg-white border border-primary"
              value={effectiveAccountType.toLowerCase()}
            />
          </div>
          <div className="chart-acc-select">
            <label className="text-primary fw-bold">Control Account</label>
            <input
              type="text"
              disabled
              className="bg-white border border-primary"
              value={[backendControlId, backendControlName].filter(Boolean).join(" - ")}
            />
          </div>
          <div className="chart-acc-select">
            <label className="text-primary fw-bold">Chart Of Account ID</label>
            <input
              type="text"
              value={chartId}
              onChange={(event) => setChartId(event.target.value)}
              className="border text-start border-primary"
              placeholder="Enter chart of account ID"
              disabled={Boolean(editingRow)}
            />
          </div>
          <div className="chart-acc-select w-chart-acc-select">
            <label className="text-primary fw-bold">Description</label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="border text-start border-primary"
              placeholder="Account name"
            />
          </div>
          <div className="text-end">
            <button
              type="button"
              onClick={handleAddOrUpdate}
              className="btn btn-primary btn-chart-acc-select py-2 fw-medium px-5"
              disabled={saving}
            >
              {saving ? "SAVING..." : editingRow ? "UPDATE" : "ADD"}
            </button>
          </div>

          <div className="text-end mt-2 d-flex justify-content-end gap-2">
            <button
              type="button"
              onClick={loadRows}
              className="btn btn-outline-primary btn-chart-acc-select py-2 fw-medium px-4"
              disabled={loading || saving}
            >
              <FaSyncAlt className="me-2" />
              REFRESH
            </button>
            <button
              type="button"
              onClick={() => exportChartRowsToExcel(rows, exportFilePrefix)}
              className="btn btn-outline-success btn-chart-acc-select py-2 fw-medium px-4"
              disabled={rows.length === 0}
            >
              EXPORT EXCEL
            </button>
          </div>

          <div className="chart-account-select-table-box">
            <table className="chart-acc-select-table">
              <thead>
                <tr>
                  <th>s/no</th>
                  <th>control id</th>
                  <th>chart id</th>
                  <th>description</th>
                  <th>actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">Loading chart accounts...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="5">No backend chart accounts found.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={`${row.id}-${row.chartOfAccount}`}>
                      <td>{row.sn}</td>
                      <td>{row.controlId}</td>
                      <td>{row.chartOfAccount}</td>
                      <td>{row.accountName}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <button
                            type="button"
                            className="control-action-btn edit"
                            onClick={() => handleEdit(row)}
                            aria-label="Edit row"
                            disabled={saving}
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            type="button"
                            className="control-action-btn delete"
                            onClick={() => handleDelete(row)}
                            aria-label="Delete row"
                            disabled={saving}
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendChartAccountSection;
