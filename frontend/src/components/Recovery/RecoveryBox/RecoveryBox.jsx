import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BranchBadge from "../../shared/BranchBadge";
import "./RecoveryBox.css";
import { apiRequest } from "../../../lib/config";
import img from "../../../assets/images/Flogo.png";

const asArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.response)) return response.response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.response?.content)) return response.response.content;
  return [];
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
};

const isSixMonthDefault = (item) => {
  const monthsOverdue = Number(
    item?.monthsOverdue ??
      item?.overdueMonths ??
      item?.monthOverdue ??
      item?.defaultedMonths ??
      0
  );
  if (Number.isFinite(monthsOverdue) && monthsOverdue >= 6) return true;

  const daysOverdue = Number(item?.daysOverdue ?? item?.overdueDays ?? 0);
  if (Number.isFinite(daysOverdue) && daysOverdue >= 180) return true;

  const durationText = String(
    item?.durationOfRepayment ?? item?.duration ?? item?.term ?? item?.tenure ?? ""
  ).toLowerCase();
  return durationText.includes("6 month");
};

const RecoveryBox = ({ toggleRecoveryBoxModal }) => {
  const [formData, setFormData] = useState({
    goodsRecoveryId: "",
    productId: "",
    productName: "",
    productCategory: "",
    customerName: "",
    customerAddress: "",
    customerId: "",
    deliveryDate: "",
    salesRef: "",
    quantity: "",
    totalBoxed: "",
    notes: "",
    recoveryAgentId: "",
    officerName: "",
    productImage: null,
    status: "To be Recovered",
  });

  const [, setProducts] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [, setDefaultedLoanRecords] = useState([]);
  const [pendingRecoveries, setPendingRecoveries] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tempItemsCount = useMemo(
    () => tableData.filter((item) => String(item.id).startsWith("temp-")).length,
    [tableData]
  );

  const clearForm = () => {
    setFormData({
      goodsRecoveryId: "",
      productId: "",
      productName: "",
      productCategory: "",
      customerName: "",
      customerAddress: "",
      customerId: "",
      deliveryDate: "",
      salesRef: "",
      quantity: "",
      totalBoxed: "",
      notes: "",
      recoveryAgentId: "",
      officerName: "",
      productImage: null,
      status: "To be Recovered",
    });
  };

  const fetchRecoveryBoxData = async () => {
    const response = await apiRequest("/admin/recovery-box", "GET");
    const records = asArray(response);

    const mapped = records.map((item, index) => ({
      id: item.id || item.recoveryBoxId || `api-${index}-${Date.now()}`,
      goodsRecoveryId: item.goodsRecoveryId || item.id || Date.now(),
      recoveryAgentId: item.recoveryAgentId || item.officerId || "",
      officerName:
        item.recoveryAgentName ||
        item.officerName ||
        `${item?.recoveryAgent?.firstName || ""} ${item?.recoveryAgent?.lastName || ""}`.trim() ||
        "-",
      customerName: item.customerName || item.customer?.name || "-",
      customerAddress: item.customerAddress || item.customer?.address || "",
      customerId: item.customerId || item.customer?.id || "",
      productId: item.productId || item.product?.id || "",
      productName: item.productName || item.product?.name || "-",
      productCategory: item.productCategory || item.product?.category || "",
      salesRef: item.salesRef || item.referenceNumber || "",
      quantity: item.quantity || item.itemsToRecover || 0,
      totalBoxed: item.totalBoxed || item.amount || 0,
      status: item.status || "To be Recovered",
      deliveryDate: formatDate(item.deliveryDate || item.delivery_date || item.createdAt || item.date),
      notes: item.notes || "",
      productImage: item.productImage || item.product?.image || null,
    }));

    setTableData(mapped);
  };

  // Pending goods-recovery records are the authoritative source of valid goodsRecoveryId values.
  // The backend rejects a recovery-box save whose goodsRecoveryId does not match an existing record.
  const fetchPendingRecoveries = async () => {
    let rows = [];
    try {
      const response = await apiRequest("/goods-recovery/pending?size=500", "GET");
      const payload = response?.response || response?.data || response;
      rows = Array.isArray(payload?.content)
        ? payload.content
        : asArray(payload);
    } catch {
      rows = [];
    }
    setPendingRecoveries(rows);
    return rows;
  };

  const handleSelectRecovery = (goodsRecoveryId) => {
    const record = pendingRecoveries.find(
      (item) => String(item.goodsRecoveryId || item.id) === String(goodsRecoveryId)
    );
    if (!record) {
      setFormData((prev) => ({ ...prev, goodsRecoveryId, productId: goodsRecoveryId }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      goodsRecoveryId: record.goodsRecoveryId || record.id,
      // No dedicated product number on the summary, so surface the recovery reference as the number.
      productId: String(record.goodsRecoveryId || record.id),
      customerName: record.customerName || prev.customerName,
      customerId: record.customerId || prev.customerId,
      quantity: record.numberOfItems ?? prev.quantity,
      status: record.recoveryStatus || prev.status,
    }));
  };

  const fetchProducts = async () => {
    const response = await apiRequest("/products", "GET");
    const list = asArray(response).map((item, index) => {
      const id = item.id || item.productId || item._id || `product-${index + 1}`;
      return {
        id: String(id),
        name: item.name || item.productName || `Product ${index + 1}`,
        category: item.category || item.productCategory || item.type || "Uncategorized",
        image: item.image || item.productImage || item.imageUrl || null,
      };
    });
    setProducts(list);
  };

  const fetchOfficers = async () => {
    const response = await apiRequest("/admin/recovery-agents", "GET");
    const list = asArray(response).map((item) => {
      const id = item.id || item.recoveryAgentId;
      const name =
        item.name || `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email || "Unnamed Officer";
      return {
        id: String(id),
        name,
      };
    });
    setOfficers(list);
  };

  const fetchDefaultedLoanRecords = async () => {
    let records = [];

    try {
      const response = await apiRequest("/admin/loan-notifications/type/DEFAULT_NOTICE?limit=500", "GET");
      records = asArray(response);
    } catch (err) {
      records = [];
    }

    if (!records.length) {
      try {
        const response = await apiRequest("/admin/loan-notifications/type/PAYMENT_OVERDUE?limit=500", "GET");
        records = asArray(response);
      } catch (err) {
        records = [];
      }
    }

    const sixMonthRecords = records.filter(isSixMonthDefault);
    setDefaultedLoanRecords(sixMonthRecords);
    return sixMonthRecords;
  };

  const fetchAll = async () => {
    setFetching(true);
    setError("");
    try {
      await Promise.all([
        fetchRecoveryBoxData(),
        fetchProducts(),
        fetchOfficers(),
        fetchDefaultedLoanRecords(),
        fetchPendingRecoveries(),
      ]);
    } catch (err) {
      setError(err?.message || "Failed to load recovery box data.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "recoveryAgentId") {
      const selected = officers.find((officer) => String(officer.id) === String(value));
      if (selected) {
        setFormData((prev) => ({ ...prev, officerName: selected.name }));
      }
    }
  };

  const handleInsert = () => {
    if (!formData.goodsRecoveryId || !formData.customerName || !formData.recoveryAgentId) {
      setError("Select a defaulted product/recovery, customer, and officer.");
      setTimeout(() => setError(""), 2800);
      return;
    }

    const row = {
      id: `temp-${Date.now()}`,
      goodsRecoveryId: formData.goodsRecoveryId,
      recoveryAgentId: Number(formData.recoveryAgentId) || formData.recoveryAgentId,
      officerName: formData.officerName,
      customerName: formData.customerName,
      customerAddress: formData.customerAddress,
      customerId: formData.customerId,
      productId: formData.productId,
      productName: formData.productName,
      productCategory: formData.productCategory,
      salesRef: formData.salesRef,
      quantity: formData.quantity || 0,
      totalBoxed: formData.totalBoxed || 0,
      status: formData.status,
      deliveryDate: formData.deliveryDate || "-",
      notes:
        formData.notes ||
        `Sales Ref: ${formData.salesRef || "N/A"} - Product: ${formData.productName || "N/A"}`,
      productImage: formData.productImage,
    };

    setTableData((prev) => [...prev, row]);
    clearForm();
    setSuccess("Inserted into table.");
    setTimeout(() => setSuccess(""), 1600);
  };

  const handleSave = async () => {
    const newItems = tableData.filter((item) => String(item.id).startsWith("temp-"));
    if (!newItems.length) {
      setError("No new inserted rows to save.");
      setTimeout(() => setError(""), 2500);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let saved = 0;
      const errors = [];

      for (const item of newItems) {
        const payload = {
          goodsRecoveryId: Number(item.goodsRecoveryId) || Date.now(),
          recoveryAgentId: Number(item.recoveryAgentId) || item.recoveryAgentId,
          customerName: item.customerName,
          customerAddress: item.customerAddress || "",
          itemsToRecover: Number(item.quantity) || 0,
          notes:
            item.notes ||
            `Sales Ref: ${item.salesRef || "N/A"} - Product: ${item.productName || "N/A"} - Delivery: ${item.deliveryDate || "-"}`,
        };

        try {
          await apiRequest("/admin/recovery-box", "POST", payload);
          saved += 1;
        } catch (err) {
          errors.push(`${item.customerName || item.productId}: ${err?.message || "Failed"}`);
        }
      }

      if (saved > 0) {
        setSuccess(`Saved ${saved} item(s) successfully.`);
        await fetchRecoveryBoxData();
      }

      if (errors.length) {
        setError(`Some rows failed: ${errors.join(", ")}`);
      }
    } catch (err) {
      setError(err?.message || "Failed to save recovery box records.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = async (id) => {
    const isTemp = String(id).startsWith("temp-");
    if (isTemp) {
      setTableData((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    if (!window.confirm("Delete this recovery box entry?")) return;

    setLoading(true);
    try {
      await apiRequest(`/admin/recovery-box/${id}`, "DELETE");
      setTableData((prev) => prev.filter((item) => item.id !== id));
      setSuccess("Entry deleted.");
      setTimeout(() => setSuccess(""), 1800);
    } catch (err) {
      setError(err?.message || "Delete failed.");
      setTimeout(() => setError(""), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recovery-box-container">
      <div className="recovery-box-header">
        <div className="header-content">
          <div className="logo-section">
            <img src={img} alt="logo" style={{ height: "5vh" }} />
          </div>
          <h1 className="header-title">RECOVERY BOX</h1>
          <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
            <BranchBadge />
          </div>
          <div className="header-actions">
            <Link to="/adminDashboard" className="btn-refresh" title="Dashboard">
              DB
            </Link>
            <button className="btn-refresh" onClick={fetchAll} disabled={fetching} title="Refresh">
              ↻
            </button>
            <button className="btn-close-header" onClick={toggleRecoveryBoxModal}>
              ↩
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="recovery-box-content">
        <div className="form-card">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label>PRODUCT NUMBER <span className="required">*</span></label>
                <select
                  name="goodsRecoveryId"
                  value={formData.goodsRecoveryId}
                  onChange={(event) => handleSelectRecovery(event.target.value)}
                  className="form-input"
                  disabled={fetching}
                >
                  <option value="">
                    {pendingRecoveries.length === 0
                      ? "No defaulted recovery records"
                      : "Select defaulted product / recovery"}
                  </option>
                  {pendingRecoveries.map((record) => {
                    const id = record.goodsRecoveryId || record.id;
                    return (
                      <option key={id} value={id}>
                        #{id}
                        {record.customerName ? ` - ${record.customerName}` : ""}
                        {record.numberOfItems ? ` (${record.numberOfItems} item(s))` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>PRODUCT NAME</label>
                <input type="text" value={formData.productName} className="form-input" readOnly />
              </div>

              <div className="form-group">
                <label>PRODUCT CATEGORY</label>
                <input type="text" value={formData.productCategory} className="form-input" readOnly />
              </div>

              <div className="form-group">
                <label>CUSTOMER NAME</label>
                <input type="text" value={formData.customerName} className="form-input" readOnly />
              </div>

              <div className="form-group">
                <label>CUSTOMER ADDRESS</label>
                <input type="text" value={formData.customerAddress} className="form-input" readOnly />
              </div>

              <div className="form-group">
                <label>DELIVERED DATE</label>
                <input type="text" value={formData.deliveryDate} className="form-input" readOnly />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label>SALES REF</label>
                <input type="text" name="salesRef" value={formData.salesRef} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label>QUANTITY</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="form-input" min="0" />
              </div>

              <div className="form-group">
                <label>TOTAL BOXED</label>
                <input type="number" name="totalBoxed" value={formData.totalBoxed} onChange={handleInputChange} className="form-input" min="0" step="0.01" />
              </div>

              <div className="form-group">
                <label>OFFICER ID <span className="required">*</span></label>
                <select name="recoveryAgentId" value={formData.recoveryAgentId} onChange={handleInputChange} className="form-select" disabled={fetching}>
                  <option value="">Select Recovery Officer</option>
                  {officers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.id} - {officer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>OFFICER NAME</label>
                <input type="text" value={formData.officerName} className="form-input" readOnly />
              </div>

              <div className="form-group">
                <label>NOTES</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="form-input" rows="3" />
              </div>

              <div className="form-group">
                <label>PRODUCT IMAGE</label>
                <div className="image-upload image-preview-box">
                  {formData.productImage ? (
                    <img src={formData.productImage} alt="Product" className="preview-image" />
                  ) : (
                    <div className="upload-placeholder">No image</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-insert" onClick={handleInsert} disabled={fetching || loading}>
              INSERT
            </button>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <h3>Recovery Box Items ({tableData.length})</h3>
          </div>

          <div className="table-wrapper">
            <table className="recovery-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>CUSTOMER NAME</th>
                  <th>PRODUCT NUMBER</th>
                  <th>PRODUCT NAME</th>
                  <th>DELIVERED DATE</th>
                  <th>SALES REF</th>
                  <th>OFFICER</th>
                  <th>QUANTITY</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="empty-table">No recovery box items found.</td>
                  </tr>
                ) : (
                  tableData.map((item, index) => (
                    <tr key={item.id} className={String(item.id).startsWith("temp-") ? "new-row" : ""}>
                      <td>{index + 1}</td>
                      <td>{item.customerName || "-"}</td>
                      <td>{item.productId || "-"}</td>
                      <td>{item.productName || "-"}</td>
                      <td>{item.deliveryDate || "-"}</td>
                      <td>{item.salesRef || "-"}</td>
                      <td>{item.officerName || item.recoveryAgentId || "-"}</td>
                      <td>{item.quantity || 0}</td>
                      <td>{item.status || "-"}</td>
                      <td>
                        <button className="btn-delete" onClick={() => handleDeleteRow(item.id)} disabled={loading}>
                          ×
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-actions">
            <button className="btn-save" onClick={handleSave} disabled={loading || !tempItemsCount}>
              {loading ? "SAVING..." : `SAVE (${tempItemsCount} new)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryBox;
