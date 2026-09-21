import React, { useEffect, useState } from "react";
import AccDashboard from "../../../AccDashboard";
import ReuseableNav from "./ReuseableNav";
import { Link } from "react-router-dom";
import AccountNavSm from "../../../AccountNavSm";
import {
  createLoanPercentageSetup,
  deleteLoanPercentageSetup,
  getAccountOptions,
  getLoanPercentageSetups,
  updateLoanPercentageSetup,
} from "../../../../../lib/accountingApi";
import { fetchInventoryProducts } from "../../../../../lib/inventoryApi";

const emptyRow = () => ({
  id: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  productName: "",
  setupRate: "",
  newRate: "",
  incomeGlCode: "",
  isDraft: true,
});

const getProductName = (product = {}) =>
  product.productName || product.name || product.title || `Product ${product.id}`;

const LoanPercentage = () => {
  const [rows, setRows] = useState([emptyRow()]);
  const [products, setProducts] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [loanInterestType, setLoanInterestType] = useState("fixed");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSetupData = async () => {
    try {
      setLoading(true);
      setError("");
      const [productRows, accountRows, setupRows] = await Promise.all([
        fetchInventoryProducts(),
        getAccountOptions(),
        getLoanPercentageSetups({ activeOnly: false }),
      ]);

      setProducts(productRows);
      setAccountOptions(
        accountRows.filter((account) => account.accountType === "INCOME")
      );
      setRows(
        setupRows.length
          ? setupRows.map((row) => ({ ...row, isDraft: false }))
          : [emptyRow()]
      );
      const firstType = setupRows.find((row) => row.loanInterestType)?.loanInterestType;
      if (firstType) setLoanInterestType(firstType);
    } catch (requestError) {
      setError(requestError?.message || "Unable to load loan percentage setup.");
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

  const removeRow = async (row) => {
    if (!row.isDraft) {
      try {
        setSaving(true);
        await deleteLoanPercentageSetup(row.id);
      } catch (requestError) {
        setError(requestError?.message || "Unable to delete loan percentage setup.");
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
      (row) => !row.productName || !row.newRate || !row.incomeGlCode
    );

    if (invalidRow) {
      setError("Product Name, New Rate, and Income GL are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await Promise.all(
        rows.map((row) => {
          const payload = {
            categoryName: row.productName,
            setupRate: Number(row.setupRate) || 0,
            newRate: Number(row.newRate) || 0,
            incomeGlCode: row.incomeGlCode,
            loanInterestType,
            isActive: true,
          };

          return row.isDraft
            ? createLoanPercentageSetup(payload)
            : updateLoanPercentageSetup(row.id, payload);
        })
      );

      setMessage("Loan percentage setup saved successfully.");
      await loadSetupData();
    } catch (requestError) {
      setError(requestError?.message || "Unable to save loan percentage setup.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="AccountNavSm">
        <AccountNavSm title="loan percentage set-up" />
      </div>
      <div className="rm-acc-Nav-sm">
        <ReuseableNav title="loan percentage set-up" />
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
                <th>Product Name</th>
                <th>Set-up Rate</th>
                <th>New Rate</th>
                <th>Income GL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">Loading setup...</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <select
                        value={row.productName}
                        onChange={(event) =>
                          updateRow(row.id, "productName", event.target.value)
                        }
                      >
                        <option value="">Select product</option>
                        {products.map((product) => {
                          const productName = getProductName(product);
                          return (
                            <option key={product.id || productName} value={productName}>
                              {productName}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.setupRate}
                        onChange={(event) =>
                          updateRow(row.id, "setupRate", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.newRate}
                        onChange={(event) =>
                          updateRow(row.id, "newRate", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={row.incomeGlCode}
                        onChange={(event) =>
                          updateRow(row.id, "incomeGlCode", event.target.value)
                        }
                      >
                        <option value="">Select income GL</option>
                        {accountOptions.map((account) => (
                          <option key={account.code} value={account.code}>
                            {account.label}
                          </option>
                        ))}
                      </select>
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
        <div className="d-flex LOAN-INTEREST-TYPE-box">
          <label htmlFor="loan-interest-type">LOAN INTEREST TYPE</label>
          <select
            id="loan-interest-type"
            value={loanInterestType}
            onChange={(event) => setLoanInterestType(event.target.value)}
          >
            <option value="">Select</option>
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
          </select>
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between loan-effect-bnt-box">
        <button className="loan-effect-bnt" onClick={handleSave} disabled={saving}>
          {saving ? "SAVING..." : "SAVE"}
        </button>
        <Link to="/Accounting/Setup">
          <button className="loan-effect-bnt">EXIT</button>
        </Link>
      </div>
    </div>
  );
};

export default LoanPercentage;
