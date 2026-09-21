import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../Navigation/AdminNav";
import "../Admin.css";
import {
  fetchAdminCurrencySetting,
  fetchAdminLanguageSetting,
} from "../../../lib/adminApi";
import { useLanguage } from "../../../context/LanguageContext";

const LanguageCurrency = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    language: t("Not set"),
    currency: t("Not set"),
  });

  useEffect(() => {
    const loadSettings = async () => {
      const [language, currency] = await Promise.all([
        fetchAdminLanguageSetting().catch(() => ({ value: t("Not set") })),
        fetchAdminCurrencySetting().catch(() => ({ value: t("Not set") })),
      ]);

      setSettings({
        language: language.value || t("Not set"),
        currency: currency.value || t("Not set"),
      });
    };

    loadSettings();
  }, [t]);

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="admin-main-content">
        <div className="admin-dashboard-content">
          <h1 className="admin-dashboard-title">
            <span className="admin-title-blue">{t("Language And Currency").toUpperCase()}</span>
          </h1>
          <p className="admin-page-copy">
            {t("Current defaults are now loaded from the admin settings API.")}
          </p>
          <div className="admin-overview-grid">
            <div className="admin-overview-card">
              <span>{t("Language")}</span>
              <strong className="compact">{settings.language}</strong>
              <p>{t("Current selected platform language")}</p>
            </div>
            <div className="admin-overview-card">
              <span>{t("Currency")}</span>
              <strong className="compact">{settings.currency}</strong>
              <p>{t("Current selected transaction currency")}</p>
            </div>
          </div>
          <div className="admin-quick-links">
            <Link to="/admin/language-currency/language-options" className="admin-quick-link-btn">
              {t("Manage language")}
            </Link>
            <Link to="/admin/language-currency/currency-options" className="admin-quick-link-btn secondary">
              {t("Manage currency")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageCurrency;
