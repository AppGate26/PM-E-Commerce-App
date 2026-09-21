import React, { useEffect, useMemo, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import ReuseableNav from "../Percentage/ReuseableNav";
import AccountNavSm from "../../../AccountNavSm";
import {
  createAccountType,
  deleteAccountType,
  getAccountTypes,
  updateAccountType,
} from "../../../../../lib/accountingApi";

const AccountType = () => {
  const navigate = useNavigate();
  const [accountTypes, setAccountTypes] = useState([]);
  const [accountTypeId, setAccountTypeId] = useState("");
  const [accountTypeName, setAccountTypeName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAccountTypes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAccountTypes();
      setAccountTypes(data);
    } catch (requestError) {
      setAccountTypes([]);
      setError(requestError?.message || "Unable to load account types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountTypes();
  }, []);

  const rows = useMemo(() => {
    return accountTypes
      .filter((accountType) => accountType?.id || accountType?.name)
      .sort((left, right) => String(left.id || "").localeCompare(String(right.id || "")))
      .map((accountType, index) => ({
        id: accountType.id,
        sn: index + 1,
        accountType: String(accountType.name || "").toUpperCase(),
      }));
  }, [accountTypes]);

  const clearForm = () => {
    setAccountTypeId("");
    setAccountTypeName("");
    setEditingId(null);
  };

  const handleSave = async () => {
    const backendId = accountTypeId.trim();
    const name = accountTypeName.trim();
    if (!backendId) {
      setError("Backend ID is required.");
      return;
    }

    if (!Number.isFinite(Number(backendId))) {
      setError("Backend ID must be a number.");
      return;
    }

    if (!name) {
      setError("Account type name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      if (editingId) {
        await updateAccountType(editingId, { backendId, name });
      } else {
        await createAccountType({ id: backendId, name });
      }
      await loadAccountTypes();
      clearForm();
    } catch (requestError) {
      setError(requestError?.message || "Unable to save account type.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setAccountTypeId(String(row.id || ""));
    setAccountTypeName(row.accountType);
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;

    try {
      setSaving(true);
      setError("");
      await deleteAccountType(row.id);
      await loadAccountTypes();
      if (editingId === row.id) clearForm();
    } catch (requestError) {
      setError(requestError?.message || "Unable to remove account type.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="AccountNavSm">
        <AccountNavSm title="account type" />
      </div>
      <div className="rm-acc-Nav-sm">
        <ReuseableNav title="account type" />
      </div>

      <div className="acc-type-container">
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

        <div className="acc-type-header">
          <div>
            <h3>Account Type Setup</h3>
            <p>Add and remove account type records from the backend table.</p>
          </div>
          <button
            type="button"
            className="acc-type-secondary-btn"
            onClick={loadAccountTypes}
            disabled={loading || saving}
          >
            Refresh
          </button>
        </div>

        {error && <div className="text-danger fw-semibold mb-3">{error}</div>}

        <div className="acc-type-add-form">
          <div className="acc-type-field">
            <label>Backend ID</label>
            <input
              type="text"
              value={accountTypeId}
              onChange={(event) => setAccountTypeId(event.target.value)}
              placeholder="Enter backend ID"
            />
          </div>
          <div className="acc-type-field">
            <label>Account Type</label>
            <input
              type="text"
              value={accountTypeName}
              onChange={(event) => setAccountTypeName(event.target.value)}
              placeholder="Enter account type name"
            />
          </div>
          <div className="acc-type-form-actions">
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
            <button
              type="button"
              className="acc-type-clear-btn"
              onClick={clearForm}
              disabled={saving}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="acc-type-container-table">
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>ACCOUNT TYPE</th>
                <th>BACKEND ID</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">Loading account types...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="4">No backend account types found.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.sn}</td>
                    <td className="fw-bold">{row.accountType}</td>
                    <td>{row.id}</td>
                    <td>
                      <div className="acc-type-action-row">
                        <button
                          type="button"
                          className="control-action-btn edit"
                          onClick={() => handleEdit(row)}
                          disabled={saving}
                          aria-label="Edit account type"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          type="button"
                          className="control-action-btn delete"
                          onClick={() => handleDelete(row)}
                          disabled={saving}
                          aria-label="Remove account type"
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
    </>
  );
};

export default AccountType;
