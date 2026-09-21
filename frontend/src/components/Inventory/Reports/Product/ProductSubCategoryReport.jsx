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
    return value.name || value.subCategoryName || value.parentCategoryName || fallback;
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

const ProductSubCategoryReport = ({ toggleReportOrModal }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const handleClose = () => {
    if (toggleReportOrModal) toggleReportOrModal();
    else navigate(-1);
  };

  useEffect(() => {
    const fetchSubCategoryReport = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiRequest(
          "/admin/inventory/reports/product/sub-category",
          "GET"
        );
        const payload = response?.response || response?.data || response || {};
        const rawSubCategories = Array.isArray(payload?.subCategories)
          ? payload.subCategories
          : Array.isArray(payload)
          ? payload
          : [];

        const normalized = rawSubCategories.map((subCategory, index) => ({
          id: subCategory?.id || `subcategory-${index + 1}`,
          name: toText(subCategory?.subCategoryName || subCategory?.name, "Unknown Sub-Category"),
          parent: toText(
            subCategory?.parentCategoryName || subCategory?.categoryName,
            "Uncategorized"
          ),
        }));

        setSubCategories(normalized);
      } catch (err) {
        setError(err?.message || "Failed to load product sub-category report.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubCategoryReport();
  }, []);

  const totalPages = Math.max(1, Math.ceil(subCategories.length / ITEMS_PER_PAGE));
  const paginatedSubCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return subCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, subCategories]);

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
            <h2>Product Sub-Category Report</h2>
            <p>
              Review each sub-category together with its parent category in one
              cleaner, standard table layout.
            </p>
          </div>
          <div className="inventory-report-count">
            {subCategories.length} Sub-Categories
          </div>
        </section>

        <div className="inventory-report-stats">
          <div className="inventory-report-stat">
            <span>Total Sub-Categories</span>
            <strong>{subCategories.length}</strong>
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
              <h3>Sub-Category Register</h3>
              <p>Clear parent-to-child structure for inventory review and setup.</p>
            </div>
            {!loading && !error && subCategories.length > 0 && (
              <span className="inventory-report-page-note">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, subCategories.length)} of{" "}
                {subCategories.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="inventory-report-status">
              Loading sub-category report...
            </div>
          ) : error ? (
            <div className="inventory-report-status inventory-report-error">{error}</div>
          ) : paginatedSubCategories.length === 0 ? (
            <div className="inventory-report-empty">No sub-categories found.</div>
          ) : (
            <>
              <div className="inventory-report-table-wrap">
                <table className="inventory-report-table">
                  <thead>
                    <tr>
                      <th>S/N</th>
                      <th>Parent Category</th>
                      <th>Sub-Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubCategories.map((subCategory, index) => (
                      <tr key={subCategory.id}>
                        <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td>{subCategory.parent}</td>
                        <td>{subCategory.name}</td>
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

export default ProductSubCategoryReport;
