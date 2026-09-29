import React, { useCallback, useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import BranchBadge from "../../../shared/BranchBadge";
import Dashboard from "../../../ui/DashboardBtn";
import SalesReceipt from "../../../Admin/Approvals/shared/SalesReceipt";
import { receiptFromInvoice } from "../../../Admin/Approvals/shared/receiptUtils";
import { salesApi } from "../../../../lib/salesApi";
import pmLogo from "../../../../assets/images/PMlogo.png";
import "../CompletedPayments/CompletedPayments.css";
import "./CompletedOrders.css";

const PAGE_SIZE = 20;

const formatCurrency = (value) =>
  `₦${(Number(value) || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const customerTypeLabel = (order) => {
  if (order.channel === "MOBILE") return "MOBILE";
  return String(order.customerType || "").toUpperCase() === "WALKIN" ? "WALK-IN" : "ONLINE";
};

// Approved orders (PROCESSING onward - see SalesInvoiceService.INVOICE_READY_STATUSES)
// with a button to open each one's invoice, or receipt once it is paid in full.
const CompletedOrders = ({ toggleCompletedOrdersModal }) => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await salesApi.getInvoiceableOrders({ search: query, page, size: PAGE_SIZE });
      setOrders(Array.isArray(result?.content) ? result.content : []);
      setTotalPages(result?.totalPages || 0);
    } catch (err) {
      setError(err?.message || "Unable to load completed orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(0);
    setQuery(search);
  };

  const openInvoice = async (orderId) => {
    setOpeningId(orderId);
    setError("");
    try {
      const invoice = await salesApi.getOrderInvoice(orderId);
      setReceipt(receiptFromInvoice(invoice));
    } catch (err) {
      setError(err?.message || "Unable to generate the invoice for this order.");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="cmp-pay-modal-content">
      <div className="cmp-pay-header cmp-pay-header-standard">
        <div className="cmp-pay-header-left">
          <img
            src={pmLogo}
            alt="PM Logo"
            className="cmp-pay-logo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/pm-logo.png";
            }}
          />
        </div>
        <h2>COMPLETED ORDERS</h2>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <div className="cmp-pay-header-right">
          <Dashboard />
          <IoGridOutline className="cmp-pay-header-icon" />
          <button className="close-btn" onClick={toggleCompletedOrdersModal}>
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="cmp-pay-body">
        <form className="cmo-search" onSubmit={handleSearch}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, product or reference"
            className="order-select"
          />
          <button type="submit" className="cmo-btn">Search</button>
        </form>
        <small className="helper-text">
          Orders approved by admin (or paid walk-in cash sales). Open one to print or save its invoice —
          it becomes a receipt once the order is paid in full.
        </small>

        {error ? (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading completed orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <p className="cmo-empty">No approved orders found.</p>
        ) : (
          <div className="cmo-table-wrap">
            <table className="cmo-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th className="cmo-r">Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{order.salesReference || order.referenceNo}</td>
                    <td>{order.customerName || "Walk-in Customer"}</td>
                    <td>{order.productName || "—"}</td>
                    <td>
                      {customerTypeLabel(order)} · {order.orderType}
                    </td>
                    <td className="cmo-r">{formatCurrency(order.totalAmount)}</td>
                    <td>{String(order.status || "").replace(/_/g, " ")}</td>
                    <td>
                      <button
                        type="button"
                        className="cmo-btn"
                        onClick={() => openInvoice(order.id)}
                        disabled={openingId !== null}
                      >
                        {openingId === order.id ? "Opening..." : order.isPaid ? "Receipt" : "Invoice"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="cmo-pager">
            <button type="button" className="cmo-btn" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              className="cmo-btn"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <SalesReceipt receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
};

export default CompletedOrders;
