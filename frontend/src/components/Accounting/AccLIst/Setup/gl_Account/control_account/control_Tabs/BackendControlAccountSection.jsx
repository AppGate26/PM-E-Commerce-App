import React, { useEffect, useMemo, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  createControlAccount,
  deleteControlAccount,
  getControlAccounts,
  updateControlAccount,
} from "../../../../../../../lib/accountingApi";

const normalizeControlRows = (controls = [], accountType) =>
  controls
    .map((control, index) => ({
      id: control.id,
      sn: index + 1,
      accountType,
      accountTypeId: control.accountTypeId,
      controlId: control.controlId || control.id,
      controlName: String(control.name || "").toUpperCase(),
    }))
    .sort((left, right) => Number(left.controlId) - Number(right.controlId))
    .map((control, index) => ({
      ...control,
      sn: index + 1,
    }));

const BackendControlAccountSection = ({ accountType = "", accountTypeId = "" }) => {
  const [controls, setControls] = useState([]);
  const [controlId, setControlId] = useState("");
  const [newControlName, setNewControlName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const backendAccountType = String(accountType || "").toUpperCase();

  const loadControls = async () => {
    try {
      setLoading(true);
      const data = await getControlAccounts({ accountTypeId });
      setControls(normalizeControlRows(data, backendAccountType));
    } catch (error) {
      setControls([]);
      toast.error(error?.message || "Unable to load control accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadControls();
  }, [backendAccountType, accountTypeId]);

  useEffect(() => {
    if (editingId) return;

    setControlId("");
    setNewControlName("");
  }, [backendAccountType, editingId]);

  const editingRow = useMemo(
    () => controls.find((row) => row.id && row.id === editingId) || null,
    [controls, editingId]
  );

  const clearForm = () => {
    setControlId("");
    setNewControlName("");
    setEditingId(null);
  };

  const handleSaveControl = async (event) => {
    event?.preventDefault();

    const controlName = newControlName.trim().toUpperCase();
    const backendId = controlId.trim();

    if (!accountTypeId || !backendId || !controlName) {
      toast.error("Fill ACCOUNT TYPE, CONTROL ID, and CONTROL NAME");
      return;
    }

    if (!Number.isFinite(Number(backendId))) {
      toast.error("Control ID must be a number.");
      return;
    }

    if (!editingRow && !Number.isFinite(Number(accountTypeId))) {
      toast.error("Create this account type in the backend before saving a new control account.");
      return;
    }

    try {
      setSaving(true);
      if (editingRow) {
        await updateControlAccount(editingRow.id, { backendId, name: controlName });
      } else {
        await createControlAccount({ id: backendId, accountTypeId, name: controlName });
      }
      await loadControls();
      clearForm();
      toast.success(editingRow ? "Control account updated" : "Control account saved");
    } catch (error) {
      toast.error(error?.message || "Unable to save control account");
    } finally {
      setSaving(false);
    }
  };

  const handleEditControl = (row) => {
    setControlId(String(row.controlId || row.id || ""));
    setNewControlName(row.controlName);
    setEditingId(row.id || "");
  };

  const handleDeleteControl = async (row) => {
    if (!row?.id) {
      toast.error("Select a backend control account first.");
      return;
    }

    try {
      setSaving(true);
      await deleteControlAccount(row.id);
      await loadControls();
      if (editingId === row.id) clearForm();
      toast.success("Control account deleted");
    } catch (error) {
      toast.error(error?.message || "Unable to delete control account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="control-register-panel">
      <div className="control-register-header">
        <div>
          <h3>Control Account Register</h3>
          <p>Add, edit, and remove control accounts from the backend table.</p>
        </div>
        <button
          type="button"
          className="account-details-soft-btn"
          onClick={loadControls}
          disabled={loading || saving}
        >
          Refresh
        </button>
      </div>

      <form className="control-register-form" onSubmit={handleSaveControl}>
        <div className="control-register-grid">
          <div className="control-register-field">
            <label>Control ID</label>
            <input
              type="text"
              value={controlId}
              onChange={(event) => setControlId(event.target.value)}
              placeholder="Enter control ID"
            />
          </div>
          <div className="control-register-field">
            <label>Account Type</label>
            <input type="text" value={backendAccountType} disabled readOnly />
          </div>
          <div className="control-register-field control-register-name-field">
            <label>Control Name</label>
            <input
              type="text"
              value={newControlName}
              onChange={(event) => setNewControlName(event.target.value)}
              placeholder="Enter control account name"
            />
          </div>
        </div>

        <div className="control-register-actions">
          <button
            type="button"
            className="account-details-clear-btn"
            onClick={clearForm}
            disabled={saving}
          >
            Clear
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-chart-acc-select account-details-save-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : editingRow ? "Update Control Account" : "Add Control Account"}
          </button>
        </div>
      </form>

      <div className="chart-account-select-table-box control-register-table-box">
        <table className="chart-acc-select-table control-register-table">
          <thead>
            <tr>
              <th>S/NO</th>
              <th>ACCOUNT TYPE</th>
              <th>CONTROL ID</th>
              <th>CONTROL NAME</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Loading control accounts...</td>
              </tr>
            ) : controls.length === 0 ? (
              <tr>
                <td colSpan="5">No backend control accounts found.</td>
              </tr>
            ) : (
              controls.map((row) => (
                <tr key={`${row.controlId}-${row.id || row.sn}`}>
                  <td>{row.sn}</td>
                  <td>{row.accountType}</td>
                  <td>{row.controlId}</td>
                  <td>{row.controlName || "Unnamed control account"}</td>
                  <td>
                    <div className="account-details-action-row">
                      <button
                        type="button"
                        className="control-action-btn edit"
                        onClick={() => handleEditControl(row)}
                        aria-label="Edit control row"
                        disabled={saving}
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        type="button"
                        className="control-action-btn delete"
                        onClick={() => handleDeleteControl(row)}
                        aria-label="Delete control row"
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
  );
};

export default BackendControlAccountSection;
