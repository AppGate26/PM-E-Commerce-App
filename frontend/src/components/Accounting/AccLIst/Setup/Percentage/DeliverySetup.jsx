import React, { useEffect, useState } from "react";
import AccDashboard from "../../../AccDashboard";
import ReuseableNav from "./ReuseableNav";
import { Link } from "react-router-dom";
import AccountNavSm from "../../../AccountNavSm";
import {
  createDeliverySetup,
  deleteDeliverySetup,
  getAccountOptions,
  getDeliverySetups,
  updateDeliverySetup,
} from "../../../../../lib/accountingApi";
import { fetchInventoryCategories } from "../../../../../lib/inventoryApi";

// Fixed weight/distance brackets. Finer-grained at the light end (parcels,
// phones) and coarser at the heavy/far end (appliances, cross-town trips) --
// the last option in each list is open-ended ("and above").
const WEIGHT_RANGE_OPTIONS = [
  { min: 0, max: 5 },
  { min: 5, max: 10 },
  { min: 10, max: 15 },
  { min: 15, max: 20 },
  { min: 20, max: 30 },
  { min: 30, max: 50 },
  { min: 50, max: 80 },
  { min: 80, max: 120 },
  { min: 120, max: 200 },
  { min: 200, max: null },
].map((range) => ({
  ...range,
  label: range.max == null ? `${range.min}kg and above` : `${range.min}kg - ${range.max}kg`,
}));

const DISTANCE_RANGE_OPTIONS = [
  { min: 0, max: 5 },
  { min: 5, max: 10 },
  { min: 10, max: 15 },
  { min: 15, max: 20 },
  { min: 20, max: 30 },
  { min: 30, max: 50 },
  { min: 50, max: 100 },
  { min: 100, max: null },
].map((range) => ({
  ...range,
  label: range.max == null ? `${range.min}km and above` : `${range.min}km - ${range.max}km`,
}));

const numOrEmpty = (value) => (value === null || value === undefined || value === "" ? "" : Number(value));

const rangeKey = (min, max) => `${numOrEmpty(min)}:${numOrEmpty(max)}`;

const emptyRow = () => ({
  id: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  categoryId: "",
  weightMinKg: "",
  weightMaxKg: "",
  distanceMinKm: "",
  distanceMaxKm: "",
  deliveryFee: "",
  accountToCredit: "",
  isActive: true,
  isDraft: true,
});

const DeliverySetup = () => {
  const [rows, setRows] = useState([emptyRow()]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSetupData = async () => {
    try {
      setLoading(true);
      setError("");
      const [accountRows, setupRows, categoryRows] = await Promise.all([
        getAccountOptions(),
        getDeliverySetups({ activeOnly: false }),
        fetchInventoryCategories(),
      ]);

      setAccountOptions(
        accountRows.filter((account) => account.accountType === "INCOME")
      );
      setCategoryOptions(categoryRows);
      setRows(
        setupRows.length
          ? setupRows.map((row) => ({ ...row, isDraft: false }))
          : [emptyRow()]
      );
    } catch (requestError) {
      setError(requestError?.message || "Unable to load delivery setup.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetupData();
  }, []);

  const addRow = () => {
    setRows((prevRows) => [...prevRows, emptyRow()]);
  };

  const updateRow = (id, field, value) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const updateRowRange = (id, minField, maxField, min, max) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, [minField]: min, [maxField]: max } : row
      )
    );
  };

  const removeRow = async (row) => {
    if (!row.isDraft) {
      try {
        setSaving(true);
        await deleteDeliverySetup(row.id);
      } catch (requestError) {
        setError(requestError?.message || "Unable to delete delivery setup.");
        setSaving(false);
        return;
      }
    }

    setRows((prevRows) => {
      const nextRows = prevRows.filter((item) => item.id !== row.id);
      return nextRows.length ? nextRows : [emptyRow()];
    });
    setSaving(false);
  };

  const handleSave = async () => {
    const invalidRow = rows.find(
      (row) =>
        !row.categoryId ||
        row.weightMinKg === "" ||
        row.distanceMinKm === "" ||
        row.deliveryFee === "" ||
        row.deliveryFee === null ||
        !row.accountToCredit
    );

    if (invalidRow) {
      setError(
        "Category, Weight Range, Distance Range, Rate per km, and Account to Credit are required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await Promise.all(
        rows.map((row) => {
          const payload = {
            categoryId: Number(row.categoryId),
            weightMinKg: Number(row.weightMinKg),
            weightMaxKg: row.weightMaxKg === "" || row.weightMaxKg === null ? null : Number(row.weightMaxKg),
            distanceMinKm: Number(row.distanceMinKm),
            distanceMaxKm:
              row.distanceMaxKm === "" || row.distanceMaxKm === null ? null : Number(row.distanceMaxKm),
            deliveryFee: Number(row.deliveryFee) || 0,
            accountToCredit: row.accountToCredit,
            isActive: row.isActive,
          };

          return row.isDraft
            ? createDeliverySetup(payload)
            : updateDeliverySetup(row.id, payload);
        })
      );

      setMessage("Delivery setup saved successfully.");
      await loadSetupData();
    } catch (requestError) {
      setError(requestError?.message || "Unable to save delivery setup.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="AccountNavSm">
        <AccountNavSm title="Delivery Setup" />
      </div>
      <div className="rm-acc-Nav-sm">
        <ReuseableNav title="Delivery Setup" />
      </div>
      <div className="d-flex loan-percentage-box">
        <div className="rm-acc-dashboard">
          <AccDashboard />
        </div>
        <div className="loan-percentage-table-box">
          {error && <div className="text-danger mb-3">{error}</div>}
          {message && <div className="text-success mb-3">{message}</div>}
          <table className="loan-percentage-table-width">
            <thead>
              <tr>
                <th>Category</th>
                <th>Weight Range</th>
                <th>Distance Range</th>
                <th>Rate (₦ per km)</th>
                <th>Account to Credit</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading setup...</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <select
                        value={row.categoryId}
                        onChange={(event) =>
                          updateRow(row.id, "categoryId", event.target.value)
                        }
                      >
                        <option value="">Select category</option>
                        {categoryOptions.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={rangeKey(row.weightMinKg, row.weightMaxKg)}
                        onChange={(event) => {
                          const option = WEIGHT_RANGE_OPTIONS.find(
                            (opt) => rangeKey(opt.min, opt.max) === event.target.value
                          );
                          if (!option) return;
                          updateRowRange(row.id, "weightMinKg", "weightMaxKg", option.min, option.max);
                        }}
                      >
                        <option value="">Select weight range</option>
                        {WEIGHT_RANGE_OPTIONS.map((option) => (
                          <option key={option.label} value={rangeKey(option.min, option.max)}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={rangeKey(row.distanceMinKm, row.distanceMaxKm)}
                        onChange={(event) => {
                          const option = DISTANCE_RANGE_OPTIONS.find(
                            (opt) => rangeKey(opt.min, opt.max) === event.target.value
                          );
                          if (!option) return;
                          updateRowRange(row.id, "distanceMinKm", "distanceMaxKm", option.min, option.max);
                        }}
                      >
                        <option value="">Select distance range</option>
                        {DISTANCE_RANGE_OPTIONS.map((option) => (
                          <option key={option.label} value={rangeKey(option.min, option.max)}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.deliveryFee}
                        onChange={(event) =>
                          updateRow(row.id, "deliveryFee", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={row.accountToCredit}
                        onChange={(event) =>
                          updateRow(row.id, "accountToCredit", event.target.value)
                        }
                      >
                        <option value="">Select account</option>
                        {accountOptions.map((account) => (
                          <option key={account.code} value={account.code}>
                            {account.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.isActive}
                        onChange={(event) =>
                          updateRow(row.id, "isActive", event.target.checked)
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-primary py-2 px-4 fw-bold"
                        onClick={() => removeRow(row)}
                        disabled={saving}
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between loan-effect-bnt-box">
        <div>
          <div className="add-to-table-loanPercentage-btn" onClick={addRow}>
            <span className="add-loan-btn-1">+</span>
            <span className="add-loan-btn-2">ADD</span>
          </div>
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between loan-effect-bnt-box">
        <button className="loan-effect-bnt" onClick={handleSave} disabled={saving}>
          {saving ? "SAVING..." : "EFFECT CHANGE"}
        </button>
        <Link to="/Accounting/Setup">
          <button className="loan-effect-bnt">EXIT</button>
        </Link>
      </div>
    </div>
  );
};

export default DeliverySetup;
