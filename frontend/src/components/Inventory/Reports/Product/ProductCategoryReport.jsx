import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PMlogo from "../../../../assets/images/PMlogo.png";
import { apiRequest } from "../../../../lib/config";
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
    return value.name || value.categoryName || value.title || fallback;
  }
  return fallback;
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

const ProductCategoryReport = ({ toggleReportOrModal }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const handleClose = () => {
    if (toggleReportOrModal) toggleReportOrModal();
    else navigate(-1);
  };

  useEffect(() => {
    const fetchCategoryReport = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiRequest("/admin/inventory/reports/product/category", "GET");
        const payload = response?.response || response?.data || response || {};
        const rawCategories = Array.isArray(payload?.categories)
          ? payload.categories
          : Array.isArray(payload)
          ? payload
          : [];

        const normalized = rawCategories.map((category, index) => ({
          id: category?.id || `category-${index + 1}`,
          name: toText(category, "Unknown Category"),
        }));
        setCategories(normalized);
      } catch (err) {
        setError(err?.message || "Failed to load product category report.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryReport();
  }, []);

  const totalPages = Math.max(1, Math.ceil(categories.length / ITEMS_PER_PAGE));
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return categories.slice(start, start + ITEMS_PER_PAGE);
  }, [categories, currentPage]);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

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
            <h2>Product Category Report</h2>
            <p>
              Track every available product category in a simpler, cleaner report
              view that matches the newer inventory standard.
            </p>
          </div>
          <div className="inventory-report-count">{categories.length} Categories</div>
        </section>

        <div className="inventory-report-stats">
          <div className="inventory-report-stat">
            <span>Total Categories</span>
            <strong>{categories.length}</strong>
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
              <h3>Category Register</h3>
              <p>Clean category listing for setup review and reporting.</p>
            </div>
            {!loading && !error && categories.length > 0 && (
              <span className="inventory-report-page-note">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, categories.length)} of{" "}
                {categories.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="inventory-report-status">Loading category report...</div>
          ) : error ? (
            <div className="inventory-report-status inventory-report-error">{error}</div>
          ) : paginatedCategories.length === 0 ? (
            <div className="inventory-report-empty">No categories found.</div>
          ) : (
            <>
              <div className="inventory-report-table-wrap">
                <table className="inventory-report-table">
                  <thead>
                    <tr>
                      <th>S/N</th>
                      <th>Category Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.map((category, index) => (
                      <tr key={category.id}>
                        <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td>{category.name}</td>
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

export default ProductCategoryReport;
