import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PMlogo from "../../../../assets/images/PMlogo.png";
import { apiRequest } from "../../../../lib/config";
import { useBranchOptions } from "../../../../lib/useBranchOptions";
import "./ProductReports.css";

const ITEMS_PER_PAGE = 10;

const toText = (value, fallback = "--") => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return (
      value.name ||
      value.productName ||
      value.categoryName ||
      value.subCategoryName ||
      value.description ||
      fallback
    );
  }
  return fallback;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

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

const normalizeProduct = (product, index) => ({
  id: product?.id || product?.productId || `product-${index + 1}`,
  name: toText(product?.productName || product?.name, "Unknown Product"),
  description: toText(
    product?.productDescription || product?.description,
    "No description"
  ),
  category: toText(product?.category || product?.categoryName),
  supplier: toText(product?.supplier || product?.supplierName),
  quantity: toNumber(
    product?.quantity ||
      product?.amountSupplied ||
      product?.quantityInStore ||
      product?.stockQuantity
  ),
  price: toNumber(product?.sellingPrice || product?.price || product?.costPrice),
});

const ProductReport = ({ toggleReportOrModal }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportRows, setReportRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [branchId, setBranchId] = useState("");
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();

  const handleClose = () => {
    if (toggleReportOrModal) toggleReportOrModal();
    else navigate(-1);
  };

  useEffect(() => {
    const fetchProductReport = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiRequest(
          "/admin/inventory/reports/product",
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
        setReportRows(products.map(normalizeProduct));
        setCurrentPage(1);
      } catch (err) {
        setError(err?.message || "Failed to load product report.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductReport();
  }, [branchId]);

  const totalPages = Math.max(1, Math.ceil(reportRows.length / ITEMS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return reportRows.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, reportRows]);

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const totalQuantity = reportRows.reduce((sum, item) => sum + item.quantity, 0);

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
            <h2>Product Report</h2>
            <p>
              Review the current product register with a cleaner, standard list of
              names, suppliers, stock volume, and pricing details.
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
            htmlFor="product-report-branch"
            style={{ fontWeight: 700, color: "#274b78", fontSize: "0.9rem" }}
          >
            Branch
          </label>
          <select
            id="product-report-branch"
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
        </div>

        <div className="inventory-report-stats">
          <div className="inventory-report-stat">
            <span>Total Products</span>
            <strong>{reportRows.length}</strong>
          </div>
          <div className="inventory-report-stat">
            <span>Units Recorded</span>
            <strong>{totalQuantity}</strong>
          </div>
          <div className="inventory-report-stat">
            <span>Current Page</span>
            <strong>
              {currentPage}/{totalPages}
            </strong>
          </div>
        </div>

        <section className="inventory-report-card">
          <div className="inventory-report-card-header">
            <div>
              <h3>Product Register</h3>
              <p>Standard product summary for review, printing, and quick checks.</p>
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
            <div className="inventory-report-status">Loading product report...</div>
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
                      <th>Description</th>
                      <th>Supplier</th>
                      <th>Category</th>
                      <th>Amount Supplied</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, index) => (
                      <tr key={row.id}>
                        <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.description}</td>
                        <td>{row.supplier}</td>
                        <td>{row.category}</td>
                        <td>{row.quantity}</td>
                        <td>{row.price}</td>
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

export default ProductReport;
