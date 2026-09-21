import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../../lib/deliveryApi";
import CheckPrompt from "./CheckPrompt/CheckPrompt";

const RbDisplay = ({ toggleRbdModal }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [riderId, setRiderId] = useState("");
  const [riders, setRiders] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [displayOptions, setDisplayOptions] = useState({
    all: false,
    byDate: false,
    salesRef: false,
    boxed: false,
  });
  const [boxData, setBoxData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkModal, setCheckModal] = useState(false);
  const [reportType, setReportType] = useState("all");

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoadingRiders(true);
      const ridersList = await deliveryApi.getRiders();
      setRiders(ridersList);
    } catch (err) {
      console.error("Error fetching riders:", err);
      setError("Failed to load riders list.");
    } finally {
      setLoadingRiders(false);
    }
  };

  const handleDisplay = async () => {
    if (!riderId) {
      setError("Please select a Rider ID");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (displayOptions.byDate) params.append("byDate", "true");
      if (displayOptions.salesRef) params.append("bySalesRef", "true");
      if (displayOptions.boxed) params.append("byBoxed", "true");

      const queryString = params.toString();
      const boxList = await deliveryApi.getRiderBoxDisplayReport(
        riderId,
        queryString
      );

      setBoxData(boxList);
      
      // Determine report type for CheckPrompt
      if (displayOptions.all) {
        setReportType("all");
      } else if (displayOptions.byDate && !displayOptions.salesRef && !displayOptions.boxed) {
        setReportType("byDate");
      } else if (displayOptions.salesRef && !displayOptions.byDate && !displayOptions.boxed) {
        setReportType("salesRef");
      } else if (displayOptions.boxed && !displayOptions.byDate && !displayOptions.salesRef) {
        setReportType("boxed");
      } else {
        setReportType("all");
      }

      // Open check modal if data exists or if "all" is selected
      if (boxList.length > 0 || displayOptions.all) {
        setCheckModal(true);
      }
    } catch (err) {
      console.error("Error fetching rider box display:", err);
      setError(err?.message || "Failed to load rider box display.");
      setBoxData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (option) => {
    if (option === "all") {
      const newValue = !displayOptions.all;
      setDisplayOptions({
        all: newValue,
        byDate: newValue,
        salesRef: newValue,
        boxed: newValue,
      });
    } else {
      const newOptions = {
        ...displayOptions,
        [option]: !displayOptions[option],
        all: false,
      };
      
      // Check if all individual options are selected, then set all to true
      if (newOptions.byDate && newOptions.salesRef && newOptions.boxed) {
        newOptions.all = true;
      }
      
      setDisplayOptions(newOptions);
    }
  };

  const checkToggleModal = () => {
    setCheckModal(!checkModal);
  };

  const closeModal = () => {
    toggleRbdModal();
  };

  // Inline styles matching Figma design
  const styles = {
    container: {
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      padding: "30px 40px",
      width: "100%",
      maxWidth: "900px",
      margin: "0 auto",
      position: "relative",
    },
    header: {
      textAlign: "center",
      marginBottom: "30px",
      position: "relative",
    },
    title: {
      color: "#0066cc",
      fontSize: "24px",
      fontWeight: "700",
      textTransform: "uppercase",
      margin: "0",
      letterSpacing: "0.5px",
    },
    closeButton: {
      position: "absolute",
      right: "0",
      top: "0",
      background: "none",
      border: "none",
      fontSize: "24px",
      color: "#0066cc",
      cursor: "pointer",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      transition: "background-color 0.2s",
    },
    formContainer: {
      border: "1px solid #0066cc",
      borderRadius: "8px",
      padding: "30px",
      backgroundColor: "#ffffff",
    },
    topRow: {
      display: "flex",
      gap: "20px",
      marginBottom: "25px",
      flexWrap: "wrap",
    },
    inputGroup: {
      flex: "1",
      minWidth: "200px",
    },
    label: {
      display: "block",
      fontSize: "12px",
      fontWeight: "600",
      color: "#333333",
      marginBottom: "8px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    dateInput: {
      width: "100%",
      padding: "10px 15px",
      border: "1px solid #cccccc",
      borderRadius: "6px",
      fontSize: "14px",
      color: "#333333",
      backgroundColor: "#ffffff",
      cursor: "pointer",
    },
    select: {
      width: "100%",
      padding: "10px 15px",
      border: "1px solid #cccccc",
      borderRadius: "6px",
      fontSize: "14px",
      color: "#666666",
      backgroundColor: "#ffffff",
      cursor: "pointer",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 15px center",
      paddingRight: "40px",
    },
    allCheckboxRow: {
      marginBottom: "20px",
    },
    checkboxLabel: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      color: "#666666",
      textTransform: "uppercase",
    },
    checkbox: {
      width: "20px",
      height: "20px",
      cursor: "pointer",
      accentColor: "#0066cc",
    },
    optionsContainer: {
      border: "1px solid #e0e0e0",
      borderRadius: "6px",
      padding: "25px 30px",
      position: "relative",
    },
    optionsHeader: {
      position: "absolute",
      top: "-12px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#ffffff",
      padding: "0 20px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#666666",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    optionsGrid: {
      display: "flex",
      justifyContent: "space-around",
      gap: "30px",
      flexWrap: "wrap",
    },
    optionItem: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
    },
    optionText: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#999999",
      textTransform: "uppercase",
    },
    displayButtonContainer: {
      textAlign: "center",
      marginTop: "30px",
    },
    displayButton: {
      backgroundColor: "#0066cc",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      padding: "12px 50px",
      fontSize: "16px",
      fontWeight: "600",
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    displayButtonDisabled: {
      backgroundColor: "#cccccc",
      cursor: "not-allowed",
    },
    dashboardButton: {
      position: "absolute",
      left: "0",
      top: "0",
      backgroundColor: "#0066cc",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      padding: "8px 20px",
      fontSize: "14px",
      fontWeight: "600",
      textDecoration: "none",
    },
    errorAlert: {
      backgroundColor: "#f8d7da",
      color: "#721c24",
      padding: "12px 20px",
      borderRadius: "6px",
      marginBottom: "20px",
      border: "1px solid #f5c6cb",
    },
  };

  return (
    <div style={styles.container}>
      {/* Dashboard Button */}
      <Link
        to="/adminDashboard"
        style={styles.dashboardButton}
      >
        Dashboard
      </Link>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>RIDER&apos;S BOX DISPLAY OPTIONS</h1>
        <button
          style={styles.closeButton}
          onClick={closeModal}
          onMouseOver={(e) => e.target.style.backgroundColor = "#f0f0f0"}
          onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
        >
          ✕
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.errorAlert} role="alert">
          {error}
        </div>
      )}

      {/* Form Container */}
      <div style={styles.formContainer}>
        {/* Top Row - Date Inputs and Rider Select */}
        <div style={styles.topRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>START DATE</label>
            <input
              type="date"
              style={styles.dateInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>END DATE</label>
            <input
              type="date"
              style={styles.dateInput}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>RIDERS ID</label>
            <select
              style={styles.select}
              value={riderId}
              onChange={(e) => setRiderId(e.target.value)}
              disabled={loadingRiders}
            >
              <option value="">SELECT</option>
              {riders.map((rider) => (
                <option
                  key={rider.id || rider.riderId}
                  value={rider.id || rider.riderId}
                >
                  {rider.id || rider.riderId} -{" "}
                  {rider.firstName && rider.lastName
                    ? `${rider.firstName} ${rider.lastName}`
                    : rider.fullName || rider.name || "Unknown"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ALL Checkbox */}
        <div style={styles.allCheckboxRow}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={displayOptions.all}
              onChange={() => handleCheckboxChange("all")}
            />
            <span>ALL</span>
          </label>
        </div>

        {/* Display Options */}
        <div style={styles.optionsContainer}>
          <span style={styles.optionsHeader}>DISPLAY OPTIONS</span>
          <div style={styles.optionsGrid}>
            <label style={styles.optionItem}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={displayOptions.byDate}
                onChange={() => handleCheckboxChange("byDate")}
              />
              <span style={styles.optionText}>BY DATE</span>
            </label>

            <label style={styles.optionItem}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={displayOptions.salesRef}
                onChange={() => handleCheckboxChange("salesRef")}
              />
              <span style={styles.optionText}>SALES REF</span>
            </label>

            <label style={styles.optionItem}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={displayOptions.boxed}
                onChange={() => handleCheckboxChange("boxed")}
              />
              <span style={styles.optionText}>BOXED</span>
            </label>
          </div>
        </div>

        {/* Display Button */}
        <div style={styles.displayButtonContainer}>
          <button
            style={{
              ...styles.displayButton,
              ...(loading || !riderId ? styles.displayButtonDisabled : {}),
            }}
            onClick={handleDisplay}
            disabled={loading || !riderId}
            onMouseOver={(e) => {
              if (!loading && riderId) {
                e.target.style.backgroundColor = "#0052a3";
              }
            }}
            onMouseOut={(e) => {
              if (!loading && riderId) {
                e.target.style.backgroundColor = "#0066cc";
              }
            }}
          >
            {loading ? "LOADING..." : "DISPLAY"}
          </button>
        </div>
      </div>

      {/* CheckPrompt Modal */}
      <CheckPrompt
        isOpen={checkModal}
        checkToggleModal={checkToggleModal}
        reportData={boxData}
        reportType={reportType}
        startDate={startDate}
        endDate={endDate}
        riderId={riderId}
        riders={riders}
      />
    </div>
  );
};

export default RbDisplay;
