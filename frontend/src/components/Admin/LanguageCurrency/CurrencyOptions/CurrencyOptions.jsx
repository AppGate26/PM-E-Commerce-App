import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNav from "../../Navigation/AdminNav";
import "../../Admin.css";
import "./CurrencyOptions.css";
import { useLanguage } from "../../../../context/LanguageContext";
import {
  fetchAdminCurrencySetting,
  updateAdminCurrencySetting,
} from "../../../../lib/adminApi";

const CurrencyOptions = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedCurrency, setSelectedCurrency] = useState("NAIRA");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const currencies = [
    { name: "NAIRA", code: "NRA" },
    { name: "DINAR", code: "BHD" },
    { name: "POUND", code: "GBP" },
    { name: "FRANC", code: "CHF" },
    { name: "EURO", code: "EUR" },
    { name: "DOLLAR", code: "USD" },
    { name: "CFA FRANC", code: "XOF" },
    { name: "ROUBLE", code: "RUB" },
  ];

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const payload = await fetchAdminCurrencySetting();
        if (payload.value) {
          setSelectedCurrency(String(payload.value).toUpperCase());
        }
      } catch (error) {
        toast.error(error.message || t("Unable to load currency setting"));
      } finally {
        setLoading(false);
      }
    };

    loadCurrency();
  }, [t]);

  const handleCurrencyChange = (currencyName) => {
    setSelectedCurrency(currencyName);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdminCurrencySetting(selectedCurrency);
      toast.success(`${t("Currency options")}: ${selectedCurrency} ${t("selected")}`);
    } catch (error) {
      toast.error(error.message || t("Unable to save currency setting"));
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToLanguages = () => {
    navigate("/admin/language-currency/language-options");
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="currency-main">
        <h1 className="currency-heading">{t("Currency options").toUpperCase()}</h1>

        <div className="currency-box">
          <div className="currency-tab-container">
            <button
              className="currency-tab-btn active"
            >
              {t("Currencies").toUpperCase()}
            </button>
            <button
              className="currency-tab-btn"
              onClick={handleSwitchToLanguages}
            >
              {t("Languages").toUpperCase()}
            </button>
          </div>

          <div className="currency-content">
            <div className="currency-list">
              {currencies.map((currency) => (
                <div key={currency.code} className="currency-item">
                  <input
                    type="radio"
                    name="admin-currency"
                    id={`currency-${currency.code}`}
                    checked={selectedCurrency === currency.name}
                    onChange={() => handleCurrencyChange(currency.name)}
                    className="currency-checkbox"
                  />
                  <label
                    htmlFor={`currency-${currency.code}`}
                    className="currency-label"
                  >
                    {currency.name} ({currency.code})
                  </label>
                </div>
              ))}
            </div>

            <div className="currency-selected-panel">
              <div className="currency-selected-text">
                {loading
                  ? t("Loading...").toUpperCase()
                  : `${selectedCurrency} ${t("selected").toUpperCase()}`}
              </div>
            </div>
          </div>

          <div className="currency-btn-container">
            <button className="currency-save-btn" onClick={handleSave} disabled={saving || loading}>
              {saving ? t("Saving...").toUpperCase() : t("Save").toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyOptions;
