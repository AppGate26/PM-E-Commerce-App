import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../Navigation/AdminNav";
import "../Admin.css";
import "./Approvals.css";
import { fetchApprovalCounts, APPROVAL_CATEGORIES } from "../../../lib/adminApi";
import { useLanguage } from "../../../context/LanguageContext";

const Approvals = () => {
  const { t } = useLanguage();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const payload = await fetchApprovalCounts();
      setApprovals(payload);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const pendingTotal = approvals.reduce(
    (total, item) => total + Number(item.count || 0),
    0
  );

  // A count that failed to load (expired session, network error, ...) still gets stored as
  // 0 by fetchApprovalCounts — `ok` is how we tell "checked, genuinely zero" apart from
  // "couldn't check" so the two don't look identical on the card.
  const hasFetchErrors = approvals.some((item) => item.ok === false);

  const normalizedSearch = search.trim().toLowerCase();

  // Every approval type is always shown, grouped by category, so a queue that never has a
  // pending request (e.g. one nothing creates yet) is still discoverable — not just the ones
  // with a current pending count.
  const categorizedApprovals = useMemo(() => {
    return APPROVAL_CATEGORIES.map((category) => ({
      ...category,
      items: approvals
        .filter((item) => item.category === category.key)
        .filter((item) =>
          normalizedSearch ? t(item.label).toLowerCase().includes(normalizedSearch) : true
        ),
    })).filter((category) => category.items.length > 0);
  }, [approvals, normalizedSearch, t]);

  const hasAnyResults = categorizedApprovals.length > 0;

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="admin-main-content admin-approvals-page">
        <div className="admin-dashboard-content">
          <h1 className="admin-dashboard-title admin-approvals-title-compact">
            <span className="admin-title-gray">{t("Approval").toUpperCase()}</span>{" "}
            <span className="admin-title-blue">{t("Queue").toUpperCase()}</span>
          </h1>
          <p className="admin-page-copy">
            {loading
              ? t("Loading pending approval queues...")
              : t("Browse every approval type by category, or search to jump straight to one.")}
          </p>

          {!loading && pendingTotal > 0 ? (
            <div className="admin-approval-counter" role="status">
              <span>{t("Pending Approvals")}</span>
              <strong>{pendingTotal}</strong>
            </div>
          ) : null}

          {/* {!loading && hasFetchErrors ? (
            <div className="admin-approval-error-banner" role="alert">
              <span>
                {t(
                  "Some approval counts could not be checked — your session may have expired. Cards marked \"?\" are not confirmed zero."
                )}
              </span>
              <button type="button" onClick={loadApprovals}>
                {t("Retry")}
              </button>
            </div>
          ) : null} */}

          <div className="admin-approval-search-wrap">
            <input
              type="search"
              className="admin-approval-search"
              placeholder={t("Search approval types (e.g. warehouse, customer, sales)...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t("Search approval types")}
            />
          </div>

          {loading ? (
            <div className="admin-approval-empty-card">
              <strong>{t("Checking approvals...")}</strong>
              <p>{t("Loading every approval queue and its pending count.")}</p>
            </div>
          ) : hasAnyResults ? (
            categorizedApprovals.map((category) => (
              <section className="admin-approval-category" key={category.key}>
                <h2 className="admin-approval-category-title">{t(category.label)}</h2>
                <div className="admin-overview-grid admin-approval-live-grid">
                  {category.items.map((item) => {
                    const count = Number(item.count || 0);
                    const isLive = count > 0;
                    const failed = item.ok === false;
                    return (
                      <Link
                        key={item.key}
                        to={item.route}
                        className={`admin-overview-card admin-overview-link ${
                          isLive ? "admin-approval-live-card" : "admin-approval-idle-card"
                        } ${failed ? "admin-approval-error-card" : ""}`}
                      >
                        {!item.noCount ? (
                          <em
                            className={`admin-approval-card-counter ${
                              failed
                                ? "admin-approval-card-counter-error"
                                : isLive
                                ? ""
                                : "admin-approval-card-counter-idle"
                            }`}
                          >
                            {failed ? "?" : count}
                          </em>
                        ) : null}
                        <span>{t(item.label)}</span>
                        <p>
                          {item.noCount
                            ? t("Review queue")
                            : failed
                            ? t("Unable to check")
                            : isLive
                            ? t("Pending request awaiting approval")
                            : t("No pending requests")}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <div className="admin-approval-empty-card">
              <strong>{t("No matching approval type")}</strong>
              <p>{t("Try a different search term.")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Approvals;
