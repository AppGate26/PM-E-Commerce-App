import React, { useEffect, useState } from "react";
import AdminNav from "./Navigation/AdminNav";
import "./Admin.css";
import admin from '../../assets/images/admin.png'
import { fetchAdminOverview } from "../../lib/adminApi";
import { useLanguage } from "../../context/LanguageContext";
const AdminDashboard = () => {
  const { t } = useLanguage();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const payload = await fetchAdminOverview();
        setOverview(payload);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const pendingApprovalCount = Number(overview?.approvalsCount || 0);

  const statCards = [
    {
      label: t("Users"),
      value: overview?.usersCount ?? 0,
      caption: t("Managed through security setup"),
    },
    {
      label: t("Active Sessions"),
      value: overview?.sessionsCount ?? 0,
      caption: t("Current signed-in sessions"),
    },
    {
      label: t("Pending Approvals"),
      value: pendingApprovalCount,
      caption: t("Awaiting admin action"),
      hidden: pendingApprovalCount === 0,
    },
    {
      label: t("Default Settings"),
      value: `${overview?.language ?? t("Not set")} / ${overview?.currency ?? t("Not set")}`,
      caption: t("Current language and currency"),
      compact: true,
    },
  ];

  return (
    <div className="admin-container">
      <AdminNav />

      <div className="admin-main-content">
        <div className="admin-hero-figure">
          <img src={admin} alt="Admin dashboard illustration" />
        </div>
        <div className="admin-dashboard-content">
          <h1 className="admin-dashboard-title">
            <span className="admin-title-gray">{t("Admin").toUpperCase()}</span>{" "}
            <span className="admin-title-blue">{t("Dashboard").toUpperCase()}</span>
          </h1>
          <p className="admin-page-copy">
            {loading
              ? t("Loading admin overview...")
              : t("Live admin summary from users, settings, sessions, and approval queues.")}
          </p>
          <div className="admin-overview-grid">
            {statCards.filter((card) => !card.hidden).map((card) => (
              <div key={card.label} className="admin-overview-card">
                <span>{card.label}</span>
                <strong className={card.compact ? "compact" : ""}>
                  {card.value}
                </strong>
                <p>{card.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
