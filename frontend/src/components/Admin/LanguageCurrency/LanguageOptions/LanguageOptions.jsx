import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNav from "../../Navigation/AdminNav";
import "../../Admin.css";
import "./LanguageOptions.css";
import { useLanguage } from "../../../../context/LanguageContext";
import {
  fetchAdminLanguageSetting,
  updateAdminLanguageSetting,
} from "../../../../lib/adminApi";

const LanguageOptions = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState("SPANISH");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoadedInitialLanguage = useRef(false);

  const languages = supportedLanguages;

  useEffect(() => {
    if (hasLoadedInitialLanguage.current) return;
    hasLoadedInitialLanguage.current = true;

    const loadLanguage = async () => {
      try {
        const payload = await fetchAdminLanguageSetting();
        if (payload.value) {
          const normalizedLanguage = String(payload.value).toUpperCase();
          setSelectedLanguage(normalizedLanguage);
          setLanguage(normalizedLanguage);
        }
      } catch (error) {
        toast.error(error.message || t("Unable to load language setting"));
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, [setLanguage]);

  useEffect(() => {
    if (!loading && language) {
      setSelectedLanguage(language);
    }
  }, [language, loading]);

  const handleLanguageChange = (languageName) => {
    setSelectedLanguage(languageName);
    setLanguage(languageName);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdminLanguageSetting(selectedLanguage);
      toast.success(`${t("Language options")}: ${selectedLanguage} ${t("selected")}`);
    } catch (error) {
      toast.error(error.message || t("Unable to save language setting"));
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToCurrencies = () => {
    navigate("/admin/language-currency/currency-options");
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="language-main">
        <h1 className="language-heading">{t("Language options").toUpperCase()}</h1>

        <div className="language-box">
          <div className="language-tab-container">
            <button
              className="language-tab-btn"
              onClick={handleSwitchToCurrencies}
            >
              {t("Currencies").toUpperCase()}
            </button>
            <button
              className="language-tab-btn active"
            >
              {t("Languages").toUpperCase()}
            </button>
          </div>

          <div className="language-content">
            <div className="language-list">
              {languages.map((language) => (
                <div key={language} className="language-item">
                  <input
                    type="radio"
                    name="admin-language"
                    id={`language-${language}`}
                    checked={selectedLanguage === language}
                    onChange={() => handleLanguageChange(language)}
                    className="language-checkbox"
                  />
                  <label
                    htmlFor={`language-${language}`}
                    className="language-label"
                  >
                    {language}
                  </label>
                </div>
              ))}
            </div>

            <div className="language-selected-panel">
              <div className="language-selected-text">
                {loading
                  ? t("Loading...").toUpperCase()
                  : `${selectedLanguage} ${t("selected").toUpperCase()}`}
              </div>
            </div>
          </div>

          <div className="language-btn-container">
            <button className="language-save-btn" onClick={handleSave} disabled={saving || loading}>
              {saving ? t("Saving...").toUpperCase() : t("Save").toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageOptions;
