import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PMlogo from "../../../../assets/images/PMlogo.png";
import { apiRequest } from "../../../../lib/config";
import { useBranchOptions } from "../../../../lib/useBranchOptions";
import "./ProductReports.css";

const ITEMS_PER_PAGE = 10;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => `₦${toNumber(value).toLocaleString()}`;

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 1) return [1];
  const pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    return pages;
  }
  if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];
  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

const normalizeRow = (row, index) => ({
  id: row?.productId ?? `product-${index + 1}`,
  name: row?.productName || "Unknown Product",
  category: row?.categoryName || "--",
  bought: toNumber(row?.bought),
  sold: toNumber(row?.sold),
  amountSold: toNumber(row?.amountSold),
  balance: toNumber(row?.balance),
});

const ProductMovementReport = ({ toggleReportOrModal }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportRows, setReportRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();

  const handleClose = () => {
    if (toggleReportOrModal) toggleReportOrModal();
    else navigate(-1);
  };

  useEffect(() => {
    const fetchMovementReport = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        if (startDate && endDate) {
          params.set("startDate", startDate);
          params.set("endDate", endDate);
        }
        const query = params.toString();
        const response = await apiRequest(
          `/admin/inventory/reports/product/movement${query ? `?${query}` : ""}`,
          "GET",
          null,
          true,
          branchId || undefined
        );
        const payload = response?.response || response?.data || response || {};
        const products = Array.isArray(payload?.products)
          ? payload.products
          : Array.isArray(payload)
          ? payload
          : [];
        setReportRows(products.map(normalizeRow));
        setCurrentPage(1);
      } catch (err) {
        setError(err?.message || "Failed to load product movement report.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovementReport();
  }, [branchId, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(reportRows.length / ITEMS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return reportRows.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, reportRows]);

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const totals = reportRows.reduce(
    (acc, item) => ({
      bought: acc.bought + item.bought,
      sold: acc.sold + item.sold,
      amountSold: acc.amountSold + item.amountSold,
      balance: acc.balance + item.balance,
    }),
    { bought: 0, sold: 0, amountSold: 0, balance: 0 }
  );

  return (
    <div className="inventory-report-page">
      <div className="inventory-report-shell">
        <div className="inventory-report-topbar">
          <div className="inventory-report-brand">
            <div className="inventory-report-logo-wrap">
              <img src={PMlogo} alt="Peace of Mind" className="inventory-report-logo" />
            </div>
            <div>
              <h1>Peace Of Mind Electronics</h1>
              <p>Inventory reporting workspace</p>
            </div>
          </div>
          <button className="inventory-report-close" onClick={handleClose}>
            Back
          </button>
        </div>

        <section className="inventory-report-hero">
          <div>
            <span className="inventory-report-kicker">Inventory Report</span>
            <h2>Product Movement Report</h2>
            <p>
              See how much of each product came in, how much sold, the revenue it
              brought in, and what's left on the shelf.
            </p>
          </div>
          <div className="inventory-report-count">{reportRows.length} Products</div>
        </section>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            margin: "0 0 18px 0",
            padding: "14px 18px",
            background: "#f4f8ff",
            border: "1px solid #d9e6fb",
            borderRadius: "12px",
          }}
        >
          <label
            htmlFor="movement-report-branch"
            style={{ fontWeight: 700, color: "#274b78", fontSize: "0.9rem" }}
          >
            Branch
          </label>
          <select
            id="movement-report-branch"
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            disabled={branchesLoading}
            style={{
              minWidth: "220px",
              padding: "10px 14px",
              border: "1.5px solid #c6daf7",
              borderRadius: "8px",
              fontSize: "0.95rem",
              background: "white",
              color: "#274b78",
              cursor: "pointer",
            }}
          >
            <option value="">All Branches</option>
            {branchOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {branchesLoading && (
            <span style={{ color: "#5c7ba6", fontSize: "0.85rem" }}>Loading branches…</span>
          )}

          <label
            htmlFor="movement-report-start"
            style={{ fontWeight: 700, color: "#274b78", fontSize: "0.9rem", marginLeft: "12px" }}
          >
            From
          </label>
          <input
            id="movement-report-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            style={{
              padding: "10px 14px",
              border: "1.5px solid #c6daf7",
              borderRadius: "8px",
              fontSize: "0.95rem",
              background: "white",
              color: "#274b78",
            }}
          />
          <label
            htmlFor="movement-report-end"
            style={{ fontWeight: 700, color: "#274b78", fontSize: "0.9rem" }}
          >
            To
          </label>
          <input
            id="movement-report-end"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            style={{
              padding: "10px 14px",
              border: "1.5px solid #c6daf7",
              borderRadius: "8px",
              fontSize: "0.95rem",
              background: "white",
              color: "#274b78",
            }}
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#0d6efd",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear dates
            </button>
          )}
        </div>

        <div className="inventory-report-stats">
          <div className="inventory-report-stat">
            <span>Total Bought</span>
            <strong>{totals.bought}</strong>
          </div>
          <div className="inventory-report-stat">
            <span>Total Sold</span>
            <strong>{totals.sold}</strong>
          </div>
          <div className="inventory-report-stat">
            <span>Amount Sold</span>
            <strong>{formatCurrency(totals.amountSold)}</strong>
          </div>
          <div className="inventory-report-stat">
            <span>Balance</span>
            <strong>{totals.balance}</strong>
          </div>
        </div>

        <section className="inventory-report-card">
          <div className="inventory-report-card-header">
            <div>
              <h3>Product Movement</h3>
              <p>Bought, sold, amount sold, and remaining balance per product.</p>
            </div>
            {!loading && !error && reportRows.length > 0 && (
              <span className="inventory-report-page-note">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, reportRows.length)} of{" "}
                {reportRows.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="inventory-report-status">Loading product movement report...</div>
          ) : error ? (
            <div className="inventory-report-status inventory-report-error">{error}</div>
          ) : paginatedRows.length === 0 ? (
            <div className="inventory-report-empty">No products found.</div>
          ) : (
            <>
              <div className="inventory-report-table-wrap">
                <table className="inventory-report-table">
                  <thead>
                    <tr>
                      <th>S/N</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Bought</th>
                      <th>Sold</th>
                      <th>Amount Sold</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, index) => (
                      <tr key={row.id}>
                        <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.category}</td>
                        <td>{row.bought}</td>
                        <td>{row.sold}</td>
                        <td>{formatCurrency(row.amountSold)}</td>
                        <td>{row.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="inventory-report-pagination">
                  <div className="inventory-report-pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="inventory-report-pagination-buttons">
                    <button
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </button>
                    {pageNumbers.map((page, index) =>
                      page === "..." ? (
                        <span key={`dots-${index}`} className="inventory-report-dot">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          className={page === currentPage ? "active" : ""}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductMovementReport;
