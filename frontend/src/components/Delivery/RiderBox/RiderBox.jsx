import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BranchBadge from "../../shared/BranchBadge";
import "../../../Styles/Delivery/Delivery.css";
import { apiRequest } from "../../../lib/config";
import { deliveryApi } from "../../../lib/deliveryApi";
import { useAuth } from "../../../context/AuthContext";
import DeleteConfirmModalSimple from "../../Inventory/Edit/shared/DeleteConfirmModalSimple";

const STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "DELIVERED"];

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.response)) return response.response;
  if (Array.isArray(response?.response?.data)) return response.response.data;
  if (Array.isArray(response?.response?.content)) return response.response.content;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  return [];
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return null;
  return Number.parseInt(digits, 10);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const formatRiderName = (item) => {
  const rider = item?.rider || {};
  const first = rider.otherName || rider.firstName || item?.firstName || "";
  const last = rider.surName || rider.lastName || item?.lastName || "";
  const fallback = item?.riderName || item?.name || "-";
  const full = `${last} ${first}`.trim();
  return full || fallback;
};

const extractRiderId = (item) => {
  return (
    item?.riderId ||
    item?.rider_id ||
    item?.rider?.riderId ||
    item?.rider?.id ||
    item?.rider?.rider_id ||
    ""
  );
};

const isForbiddenError = (error) => {
  const status = Number(error?.status || error?.httpStatus || error?.code || 0);
  return status === 403 || String(error?.message || "").toLowerCase().includes("forbidden");
};

const RiderBox = ({ toggleBoxModal, selectedRiderId }) => {
  const { allowedModules, isAdmin } = useAuth();
  // Anyone granted the "delivery" module needs the same access as an admin here - the
  // dropdown/actions used to be admin-only, which silently left non-admin delivery staff
  // (e.g. QA) staring at an empty Rider ID dropdown with no indication why.
  const canFetchAdminDeliveryData = Boolean(isAdmin || allowedModules?.includes("delivery"));
  const [formData, setFormData] = useState({
    orderId: "",
    orderReferenceNo: "",
    productName: "",
    productCategory: "",
    customerName: "",
    deliveryAddress: "",
    riderId: selectedRiderId || "",
    riderName: "",
  });

  const [riders, setRiders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [boxData, setBoxData] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (selectedRiderId) {
      setFormData((prev) => ({ ...prev, riderId: String(selectedRiderId) }));
      if (canFetchAdminDeliveryData) {
        fetchRiderAssignments(selectedRiderId);
      }
    }
    fetchRiders();
    fetchReadyOrders();
  }, [selectedRiderId, canFetchAdminDeliveryData]);

  const fetchRiders = async () => {
    if (!canFetchAdminDeliveryData) {
      setRiders([]);
      setLoadingRiders(false);
      return;
    }

    try {
      setLoadingRiders(true);
      const response = await deliveryApi.getRiders();
      setRiders(normalizeList(response));
    } catch (err) {
      setRiders([]);
      setError(isForbiddenError(err) ? "" : err?.message || "Failed to load riders.");
    } finally {
      setLoadingRiders(false);
    }
  };

  // Orders an admin has approved (status PROCESSING) and that are linked to a mobile-app
  // checkout - only those can actually be handed to a rider (see
  // SalesOrderRepository.findOrdersReadyForRiderAssignment on the backend).
  const fetchReadyOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await deliveryApi.getOrdersReadyForRider();
      setReadyOrders(Array.isArray(response) ? response : []);
    } catch (err) {
      setReadyOrders([]);
      setError(isForbiddenError(err) ? "" : err?.message || "Failed to load orders ready for rider assignment.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderSelect = (event) => {
    const orderId = event.target.value;
    const selectedOrder = readyOrders.find((row) => String(row.id) === orderId);

    if (!selectedOrder) {
      resetOrderFields();
      return;
    }

    setFormData((prev) => ({
      ...prev,
      orderId: String(selectedOrder.id),
      orderReferenceNo: selectedOrder.referenceNo || "",
      productName: selectedOrder.productName || "",
      productCategory: selectedOrder.category || "",
      customerName: selectedOrder.customerName || "",
      deliveryAddress: selectedOrder.address || "",
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "riderId") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/[^0-9]/g, "") }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRiderSelect = (event) => {
    const selectedId = event.target.value;
    const selectedRider = riders.find(
      (item) => String(item?.riderId || item?.id || "") === selectedId
    );
    const selectedName = selectedRider
      ? `${selectedRider?.surName || selectedRider?.lastName || ""} ${
          selectedRider?.otherName || selectedRider?.firstName || ""
        }`.trim()
      : "";

    setFormData((prev) => ({
      ...prev,
      riderId: selectedId,
      riderName: selectedName || prev.riderName || "",
    }));
  };

  const fetchRiderAssignments = async (riderIdInput) => {
    if (!canFetchAdminDeliveryData) {
      setBoxData([]);
      setSuccessMessage("Rider assignments are restricted for this account.");
      setError("");
      return;
    }

    const riderId = String(riderIdInput || "").trim();
    const numericRiderId = toNumberOrNull(riderId);
    if (!riderId) {
      setError("Enter Rider ID to fetch assignments.");
      setSuccessMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      let rows = [];
      const candidateEndpoints = [
        `/admin/rider-boxes?riderId=${riderId}`,
        `/admin/rider-boxes?rider_id=${riderId}`,
        `/admin/rider-boxes?status=PENDING&riderId=${riderId}`,
        `/admin/rider-boxes?status=PENDING&rider_id=${riderId}`,
        `/admin/rider-boxes/rider/${riderId}`,
        `/admin/rider-boxes/find-by-rider/${riderId}`,
      ];

      for (const endpoint of candidateEndpoints) {
        try {
          const response = await apiRequest(endpoint, "GET");
          const found = normalizeList(response);
          if (found.length) {
            rows = found;
            break;
          }
        } catch (err) {
          if (isForbiddenError(err)) break;
        }
      }

      if (!rows.length) {
        const allRows = [];
        for (const status of STATUSES) {
          try {
            const response = await deliveryApi.getRiderBoxesByStatus(status);
            allRows.push(...normalizeList(response));
          } catch (err) {
            if (isForbiddenError(err)) break;
          }
        }
        rows = allRows;
      }

      rows = rows.filter((item) => {
        const rowRiderIdRaw = extractRiderId(item);
        if (!rowRiderIdRaw) return false;
        const rowRiderId = String(rowRiderIdRaw).trim();
        const rowRiderIdNum = toNumberOrNull(rowRiderId);
        return rowRiderId === riderId || (!!numericRiderId && rowRiderIdNum === numericRiderId);
      });

      setBoxData(rows);

      if (!rows.length) {
        setSuccessMessage("No assignments found for this rider.");
      } else {
        setSuccessMessage(`Loaded ${rows.length} assignment(s).`);
      }

      const firstName = rows.length ? formatRiderName(rows[0]) : "";
      setFormData((prev) => ({ ...prev, riderId, riderName: firstName === "-" ? prev.riderName : firstName }));
    } catch (err) {
      setBoxData([]);
      setError(err?.message || "Failed to fetch rider assignments.");
    } finally {
      setLoading(false);
    }
  };

  const resetOrderFields = () => {
    setFormData((prev) => ({
      ...prev,
      orderId: "",
      orderReferenceNo: "",
      productName: "",
      productCategory: "",
      customerName: "",
      deliveryAddress: "",
    }));
  };

  const handleAssignToRider = async (event) => {
    event.preventDefault();

    if (!canFetchAdminDeliveryData) {
      setError("Assigning orders to riders is restricted for this account.");
      setSuccessMessage("");
      return;
    }

    const riderId = toNumberOrNull(formData.riderId);
    const salesOrderId = toNumberOrNull(formData.orderId);

    if (!riderId) {
      setError("Rider ID is required.");
      setSuccessMessage("");
      return;
    }

    if (!salesOrderId) {
      setError("Order reference is required.");
      setSuccessMessage("");
      return;
    }

    try {
      setInserting(true);
      setError("");
      setSuccessMessage("");

      await deliveryApi.assignProductToRider({ salesOrderId, riderId });

      setSuccessMessage(`Order ${formData.orderReferenceNo} assigned to rider successfully.`);

      await Promise.all([
        fetchRiderAssignments(riderId),
        fetchReadyOrders(),
      ]);

      resetOrderFields();
    } catch (err) {
      setError(err?.message || "Failed to assign order to rider.");
      setSuccessMessage("");
    } finally {
      setInserting(false);
    }
  };

  const queueDelete = (boxItemId, orderId) => {
    setConfirmDeleteId({ boxItemId, orderId });
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    if (!canFetchAdminDeliveryData) {
      setError("Deleting rider box assignments is restricted for this account.");
      setSuccessMessage("");
      return;
    }

    const { boxItemId, orderId } = confirmDeleteId;
    const idToUse = boxItemId || orderId;

    try {
      setDeletingId(idToUse);
      setError("");
      setSuccessMessage("");

      if (boxItemId) {
        try {
          await deliveryApi.deleteRiderBoxById(boxItemId);
        } catch {
          await deliveryApi.deleteRiderBoxByAltId(idToUse);
        }
      } else {
        await deliveryApi.deleteRiderBoxByAltId(idToUse);
      }

      setSuccessMessage("Assignment deleted successfully.");
      setConfirmDeleteId(null);

      if (formData.riderId) {
        await fetchRiderAssignments(formData.riderId);
      }
      await fetchReadyOrders();
    } catch (err) {
      setError(err?.message || "Failed to delete assignment.");
      setSuccessMessage("");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusAction = async (action, riderBoxId) => {
    if (!riderBoxId) return;
    if (!canFetchAdminDeliveryData) {
      setError("Updating rider box status is restricted for this account.");
      setSuccessMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      if (action === "ACCEPT") await deliveryApi.acceptRiderBox(riderBoxId);
      if (action === "REJECT") await deliveryApi.rejectRiderBox(riderBoxId);
      if (action === "DELIVER") await deliveryApi.deliverRiderBox(riderBoxId);

      setSuccessMessage(`Rider box ${riderBoxId} updated successfully.`);

      if (formData.riderId) {
        await fetchRiderAssignments(formData.riderId);
      }
    } catch (err) {
      setError(err?.message || "Failed to update rider box status.");
      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    toggleBoxModal();
  };

  const referenceOptions = useMemo(() => readyOrders, [readyOrders]);

  return (
    <div className="riderbox-standard-card">
      <div className="riderbox-standard-header">
        <div>
          <h1 className="riderbox-standard-title">Rider Box Management</h1>
          <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
            <BranchBadge />
          </div>
          <p className="riderbox-standard-subtitle">Assign orders, manage statuses, and track rider assignments.</p>
        </div>
        <div className="riderbox-standard-header-actions">
          <Link to="/adminDashboard" className="manage-riders-btn manage-riders-btn-primary">Dashboard</Link>
          <button type="button" className="manage-riders-btn-icon" onClick={closeModal} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {error && <div className="manage-riders-alert">{error}</div>}
      {successMessage && <div className="riderbox-success-alert">{successMessage}</div>}

      <form onSubmit={handleAssignToRider} className="riderbox-standard-form">
        <div className="riderbox-standard-grid">
          <div className="riderbox-field">
            <label>Order Reference</label>
            <select
              className="product-box-inputs"
              value={formData.orderId}
              onChange={handleOrderSelect}
              disabled={loadingOrders}
              required
            >
              <option value="">
                {loadingOrders ? "Loading orders..." : "Select Order Reference"}
              </option>
              {referenceOptions.map((row) => (
                <option key={row.id} value={row.id}>
                  {[row.referenceNo, row.customerName].filter(Boolean).join(" - ")}
                </option>
              ))}
            </select>
          </div>

          <div className="riderbox-field">
            <label>Customer Name</label>
            <input type="text" name="customerName" className="product-box-inputs" value={formData.customerName} onChange={handleInputChange} readOnly />
          </div>

          <div className="riderbox-field">
            <label>Product Name</label>
            <input type="text" name="productName" className="product-box-inputs" value={formData.productName} onChange={handleInputChange} readOnly />
          </div>

          <div className="riderbox-field">
            <label>Product Category</label>
            <input type="text" name="productCategory" className="product-box-inputs" value={formData.productCategory} onChange={handleInputChange} readOnly />
          </div>

          <div className="riderbox-field">
            <label>Delivery Address</label>
            <input
              type="text"
              name="deliveryAddress"
              className="product-box-inputs"
              value={formData.deliveryAddress}
              onChange={handleInputChange}
              placeholder="Auto-filled from selected order"
              readOnly
            />
          </div>

          <div className="riderbox-field">
            <label>Rider ID</label>
            <div className="riderbox-fetch-row">
              <select
                className="product-box-inputs"
                value={formData.riderId}
                onChange={handleRiderSelect}
                disabled={loadingRiders}
                required
              >
                <option value="">
                  {loadingRiders ? "Loading riders..." : "Select Rider"}
                </option>
                {riders.map((rider) => {
                  const riderId = rider?.riderId || rider?.id || "";
                  const riderName = `${rider?.surName || rider?.lastName || ""} ${
                    rider?.otherName || rider?.firstName || ""
                  }`.trim();
                  return (
                    <option key={riderId} value={String(riderId)}>
                      {riderId} {riderName ? `- ${riderName}` : ""}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                className="manage-riders-btn manage-riders-btn-primary riderbox-fetch-btn"
                onClick={() => fetchRiderAssignments(formData.riderId)}
                disabled={loading || !formData.riderId}
              >
                {loading ? "Loading..." : "Fetch"}
              </button>
            </div>
          </div>

          <div className="riderbox-field">
            <label>Rider Name</label>
            <input
              type="text"
              name="riderName"
              className="product-box-inputs"
              value={formData.riderName}
              onChange={handleInputChange}
              readOnly
            />
          </div>

        </div>

        <div className="riderbox-standard-summary">
          <span>Orders awaiting rider assignment: {referenceOptions.length}</span>
        </div>

        <div className="riderbox-standard-submit-row">
          <button
            type="submit"
            disabled={inserting || !formData.orderId}
            className="manage-riders-btn manage-riders-btn-primary riderbox-submit-btn"
          >
            {inserting ? "Assigning..." : "Assign Order To Rider"}
          </button>
        </div>
      </form>

      <div className="manage-riders-table-shell riderbox-standard-table-wrap">
        {loading ? (
          <div className="manage-riders-loading">Loading rider box data...</div>
        ) : (
          <table className="manage-riders-table manage-riders-table-standard">
            <thead>
              <tr>
                <th>S/N</th>
                <th>Rider Box ID</th>
                <th>Product</th>
                <th>Ref No</th>
                <th>Status</th>
                <th>Rider ID</th>
                <th>Rider Name</th>
                <th>Created At</th>
                <th className="manage-riders-col-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {boxData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="manage-riders-empty-row">
                    No rider box records found. Enter Rider ID and click Fetch.
                  </td>
                </tr>
              ) : (
                boxData.map((item, index) => {
                  const riderBoxId = item.riderBoxId || item.id || "";
                  const orderReferenceNo = item.orderReferenceNo || item.saleRef || item.sale_ref || "-";
                  const status = item.status || "PENDING";
                  const riderId = extractRiderId(item) || "-";

                  return (
                    <tr key={`${riderBoxId}-${index}`} className={index % 2 === 0 ? "manage-riders-row-even" : "manage-riders-row-odd"}>
                      <td>{index + 1}</td>
                      <td>{riderBoxId || "-"}</td>
                      <td>{item.productName || "-"}</td>
                      <td>{orderReferenceNo}</td>
                      <td>
                        <span className={`riderbox-status-pill riderbox-status-${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>{riderId}</td>
                      <td>{formatRiderName(item)}</td>
                      <td>{formatDate(item.createdAt || item.date)}</td>
                      <td className="manage-riders-col-center">
                        <div className="manage-riders-row-actions">
                          {status === "PENDING" && (
                            <>
                              <button type="button" className="manage-riders-btn manage-riders-btn-small manage-riders-btn-primary" onClick={() => handleStatusAction("ACCEPT", riderBoxId)}>
                                Accept
                              </button>
                              <button type="button" className="manage-riders-btn manage-riders-btn-small manage-riders-btn-danger" onClick={() => handleStatusAction("REJECT", riderBoxId)}>
                                Reject
                              </button>
                            </>
                          )}
                          {status === "ACCEPTED" && (
                            <button type="button" className="manage-riders-btn manage-riders-btn-small manage-riders-btn-primary" onClick={() => handleStatusAction("DELIVER", riderBoxId)}>
                              Deliver
                            </button>
                          )}
                          {status === "DELIVERED" && <span className="riderbox-delivered-text">Delivered</span>}
                          <button
                            type="button"
                            className="manage-riders-btn manage-riders-btn-small manage-riders-btn-danger"
                            onClick={() => queueDelete(riderBoxId, item.orderId)}
                            disabled={deletingId === (riderBoxId || item.orderId)}
                          >
                            {deletingId === (riderBoxId || item.orderId) ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <DeleteConfirmModalSimple
        isOpen={!!confirmDeleteId}
        title="Delete Rider Box Item?"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default RiderBox;
