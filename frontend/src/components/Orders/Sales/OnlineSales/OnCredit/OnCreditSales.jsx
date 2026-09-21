import React, { useState, useEffect } from "react";
import BranchBadge from "../../../../shared/BranchBadge";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { apiRequest } from "../../../../../lib/config";
import { fetchSalesReference, printSalesReference } from "../../../../../lib/salesReference";
import pmLogo from "../../../../../assets/images/PMlogo.png";

const OnCreditSales = ({ toggleOcsModal }) => {
  const closeModal = () => {
    toggleOcsModal();
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [referenceNumbers, setReferenceNumbers] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Order currently under review (for generate-reference / reject / send-to-admin)
  // + decision/generation in-flight flags.
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [salesReference, setSalesReference] = useState("");
  const [generatingRef, setGeneratingRef] = useState(false);

  // Installment payment progress (%) of the selected order - once this passes 50%
  // the order can no longer be finalised as a fresh credit sale outright; sales must
  // reject it or forward it to admin instead (see requiresApproval below).
  const [orderPaymentProgress, setOrderPaymentProgress] = useState(0);

  const [formData, setFormData] = useState({
    referenceNo: "",
    productInfo: {
      productName: "",
      productId: "",
      category: "",
      subCategory: "",
      description: "",
      price: "",
      quantity: "1",
      discount: "0"
    },
    customerInfo: {
      customerName: "",
      accountNumber: "",
      email: "",
      phoneNumber: "",
      address: "",
      dob: "",
      gender: "",
      occupation: "",
      customerBankAccount: ""
    },
    loanInfo: {
      loanType: "Installment",
      productAmount: "",
      repaymentMethod: "Monthly",
      duration: "12",
      rate: "10",
      interestOnLoan: "",
      principalRepayment: "",
      monthlyPayment: ""
    },
    charges: {
      insurance: "0",
      deliveryCharges: "0",
      vat: "0"
    }
  });

  useEffect(() => {
    fetchReferenceNumbers();
  }, []);

  // Auto-calculate loan figures whenever the selected order's amount changes.
  useEffect(() => {
    calculateLoan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.loanInfo.productAmount, formData.loanInfo.rate, formData.loanInfo.duration]);

  const fetchReferenceNumbers = async () => {
    try {
      setLoadingRefs(true);
      console.log("🔵 OnlineCreditSales: Fetching orders ready for credit-sale finalisation...");

      // Orders with an installment payment progress of at least 50% are the ones
      // eligible to be finalised as an online credit sale. incomplete-payments is the
      // reliable, server-computed source (see SalesService.resolvePaymentProgress).
      const response = await apiRequest("/sales/orders/incomplete-payments?size=500", "GET");

      let ordersList = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        ordersList = response.response.content;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (Array.isArray(response)) {
        ordersList = response;
      }

      const refs = ordersList
        .filter((order) => order.referenceNo)
        .filter((order) => (order.paymentPercentage || 0) >= 50)
        .map(order => ({
          referenceNo: order.referenceNo,
          orderId: order.orderId,
          customerName: order.customerName,
          accountNumber: order.accountNumber,
          productName: order.productName,
          totalAmount: order.totalAmount,
          order: order
        }));

      setReferenceNumbers(refs);
      console.log(`✅ Loaded ${refs.length} reference numbers eligible for finalisation`);
    } catch (err) {
      console.error("Error fetching reference numbers:", err);
    } finally {
      setLoadingRefs(false);
    }
  };

  const resetSelection = () => {
    setFormData(prev => ({
      ...prev,
      referenceNo: "",
      productInfo: { productName: "", productId: "", category: "", subCategory: "", description: "", price: "", quantity: "1", discount: "0" },
      customerInfo: { customerName: "", accountNumber: "", email: "", phoneNumber: "", address: "", dob: "", gender: "", occupation: "", customerBankAccount: "" },
      loanInfo: { ...prev.loanInfo, productAmount: "", interestOnLoan: "", principalRepayment: "", monthlyPayment: "" },
      charges: { insurance: "0", deliveryCharges: "0", vat: "0" }
    }));
    setSelectedOrderId("");
    setOrderPaymentProgress(0);
    setSalesReference("");
  };

  const handleReferenceSelect = async (e) => {
    const selectedRef = e.target.value;
    console.log(`Selected reference: ${selectedRef}`);

    if (!selectedRef) {
      resetSelection();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const selected = referenceNumbers.find(ref => ref.referenceNo === selectedRef);

      if (selected && selected.orderId) {
        setSelectedOrderId(selected.orderId);
        setSalesReference(selected.order?.salesReference || "");

        const orderResponse = await apiRequest(`/sales/orders/${selected.orderId}/details`, "GET");
        let details = orderResponse?.data || orderResponse?.response || orderResponse;

        const price = selected.totalAmount || details?.totalAmount || 0;
        const quantity = details?.quantity || 1;
        const progress = parseFloat(selected.order?.paymentPercentage ?? details?.paymentProgress) || 0;
        setOrderPaymentProgress(progress);

        setFormData(prev => ({
          ...prev,
          referenceNo: selectedRef,
          productInfo: {
            productName: selected.productName || details?.productName || "",
            productId: selected.productId || details?.productId || "",
            category: details?.category || "",
            subCategory: details?.subCategory || "",
            description: details?.description || "",
            price: price.toString(),
            quantity: quantity.toString(),
            discount: details?.discount || "0"
          },
          customerInfo: {
            customerName: selected.customerName || details?.customerName || "",
            accountNumber: selected.accountNumber || details?.accountNumber || "",
            email: details?.email || "",
            phoneNumber: details?.phoneNumber || "",
            address: details?.address || "",
            dob: details?.dob || "",
            gender: details?.gender || "",
            occupation: details?.occupation || "",
            customerBankAccount: details?.customerBankAccount || ""
          },
          loanInfo: {
            ...prev.loanInfo,
            productAmount: price.toString()
          },
          charges: { insurance: "0", deliveryCharges: "0", vat: "0" }
        }));

        console.log("✅ Form auto-populated");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChargesChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      charges: { ...prev.charges, [field]: value }
    }));
  };

  const calculateLoan = () => {
    const productAmount = parseFloat(formData.loanInfo.productAmount) || 0;
    const rate = parseFloat(formData.loanInfo.rate) || 0;
    const duration = parseInt(formData.loanInfo.duration) || 0;

    if (productAmount > 0 && rate > 0 && duration > 0) {
      const interest = (productAmount * rate * duration) / 100 / 12;
      const principal = productAmount / duration;
      const monthlyPayment = principal + (interest / duration);

      setFormData(prev => ({
        ...prev,
        loanInfo: {
          ...prev.loanInfo,
          interestOnLoan: interest.toFixed(2),
          principalRepayment: principal.toFixed(2),
          monthlyPayment: monthlyPayment.toFixed(2)
        }
      }));
    }
  };

  const calculateTotalAmount = () => {
    const price = parseFloat(formData.productInfo.price) || 0;
    const quantity = parseInt(formData.productInfo.quantity) || 1;
    const discount = parseFloat(formData.productInfo.discount) || 0;
    const productTotal = price * quantity - discount;

    const insurance = parseFloat(formData.charges.insurance) || 0;
    const delivery = parseFloat(formData.charges.deliveryCharges) || 0;
    const vat = parseFloat(formData.charges.vat) || 0;

    return productTotal + insurance + delivery + vat;
  };

  // Reject or forward-for-approval the selected, already-existing online order. This
  // updates that order's status in place - it never creates a new order.
  const handleDecision = async (decision) => {
    if (!selectedOrderId) {
      setError("Select a reference number first.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setDecisionLoading(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/sales/orders/${selectedOrderId}/${decision}`, "PUT", { comment: "" });
      setSuccess(
        decision === "reject"
          ? "Order rejected successfully."
          : "Order sent to admin for approval."
      );
      resetSelection();
      await fetchReferenceNumbers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || `Failed to ${decision === "reject" ? "reject" : "forward"} order.`);
      setTimeout(() => setError(""), 5000);
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleGenerateSalesReference = async () => {
    if (!selectedOrderId) {
      setError("Please select a reference number first.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setGeneratingRef(true);
    setError("");
    try {
      const ref = await fetchSalesReference(selectedOrderId);
      setSalesReference(ref);
      printSalesReference(ref, {
        "Order Ref": formData.referenceNo,
        Customer: formData.customerInfo.customerName,
        Product: formData.productInfo.productName,
        Amount: formatCurrency(calculateTotalAmount()),
      });
    } catch (err) {
      setError(err?.message || "Failed to generate sales reference.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setGeneratingRef(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const totalAmount = calculateTotalAmount();
  // An order whose installment payment has passed 50% can't be finalised as a credit
  // sale outright - sales must either reject it or forward it to admin instead.
  const requiresApproval = Boolean(selectedOrderId) && orderPaymentProgress > 50;

  const styles = {
    container: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "16px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: "#f8fbff",
      border: "1px solid #c5d6ef",
      borderRadius: "18px",
      boxShadow: "0 20px 45px rgba(18, 57, 110, 0.12)"
    },
    header: {
      marginBottom: "16px",
      background: "linear-gradient(90deg, #103b7a 0%, #1b5cb8 100%)",
      border: "1px solid #114583",
      borderRadius: "12px",
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px"
    },
    headerLeft: {
      width: "44px",
      display: "flex",
      justifyContent: "flex-start"
    },
    headerRight: {
      width: "72px",
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "8px"
    },
    logo: {
      width: "42px",
      height: "42px",
      objectFit: "contain",
      borderRadius: "8px",
      background: "#ffffff",
      padding: "4px"
    },
    title: {
      fontSize: "2rem",
      fontWeight: "700",
      color: "#eef5ff",
      margin: "0",
      letterSpacing: "0.06em",
      textTransform: "uppercase"
    },
    headerIcon: {
      color: "#e8f2ff",
      fontSize: "1.2rem"
    },
    closeBtn: {
      background: "transparent",
      border: "none",
      fontSize: "1.08rem",
      cursor: "pointer",
      color: "#e8f2ff",
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
      transition: "all 0.2s ease"
    },
    sectionTitle: {
      fontSize: "1.2rem",
      fontWeight: "700",
      color: "#f4f8ff",
      margin: "16px 0 0",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      background: "#1c5ebb",
      borderRadius: "12px 12px 0 0",
      padding: "12px 14px",
      display: "block"
    },
    formBox: {
      backgroundColor: "#fff",
      border: "1px solid #cdddf3",
      borderTop: "0",
      borderRadius: "0 0 12px 12px",
      padding: "16px",
      marginBottom: "12px"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "14px"
    },
    field: {
      marginBottom: "10px"
    },
    label: {
      display: "block",
      fontSize: "1rem",
      fontWeight: "700",
      color: "#5e7ca8",
      textTransform: "uppercase",
      marginBottom: "6px",
      letterSpacing: "0.5px"
    },
    input: {
      width: "100%",
      padding: "11px 12px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1.12rem",
      fontFamily: "inherit",
      transition: "border-color 0.2s ease",
      outline: "none",
      backgroundColor: "#fff"
    },
    select: {
      width: "100%",
      padding: "11px 12px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1.12rem",
      fontFamily: "inherit",
      backgroundColor: "#fff",
      cursor: "pointer"
    },
    textarea: {
      width: "100%",
      padding: "11px 12px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1.12rem",
      fontFamily: "inherit",
      resize: "vertical",
      minHeight: "80px"
    },
    readonlyInput: {
      width: "100%",
      padding: "11px 12px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1.12rem",
      backgroundColor: "#f4f7fb",
      color: "#486892"
    },
    button: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#1b5fbe",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "1.2rem",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.2s ease",
      marginTop: "20px"
    },
    buttonDisabled: {
      backgroundColor: "#9ca3af",
      cursor: "not-allowed"
    },
    alert: {
      padding: "12px 16px",
      borderRadius: "10px",
      marginBottom: "20px",
      fontSize: "1rem",
      fontWeight: "600",
      textAlign: "center"
    },
    alertError: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      border: "1px solid #fecaca"
    },
    alertSuccess: {
      backgroundColor: "#dcfce7",
      color: "#16a34a",
      border: "1px solid #bbf7d0"
    },
    loadingSpinner: {
      textAlign: "center",
      padding: "20px",
      color: "#486892",
      fontSize: "1.02rem"
    },
    spinner: {
      border: "3px solid #f3f4f6",
      borderTop: "3px solid #0867db",
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      animation: "spin 1s linear infinite",
      margin: "0 auto 12px"
    },
    calculationBox: {
      backgroundColor: "#f9fafb",
      padding: "15px",
      borderRadius: "10px",
      marginTop: "15px"
    },
    calculationRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #e5e7eb"
    },
    calculationLabel: {
      fontSize: "1rem",
      fontWeight: "500",
      color: "#6b7280"
    },
    calculationValue: {
      fontSize: "1.08rem",
      fontWeight: "600",
      color: "#0867db"
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={pmLogo} alt="PM Logo" style={styles.logo} />
        </div>
        <h1 style={styles.title}>Online Credit Sales</h1>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <div style={styles.headerRight}>
          <IoGridOutline style={styles.headerIcon} />
          <button
            onClick={closeModal}
            style={styles.closeBtn}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#f3f4f6"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          {error}
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          {success}
        </div>
      )}

      {loadingRefs && (
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p>Loading reference numbers...</p>
        </div>
      )}

      <div>
        {/* Reference Number Selection */}
        <div style={styles.formBox}>
          <div style={styles.field}>
            <label style={styles.label}>Reference Number *</label>
            <select
              value={formData.referenceNo}
              onChange={handleReferenceSelect}
              style={styles.select}
              disabled={loading}
            >
              <option value="">-- Select Reference Number --</option>
              {referenceNumbers.map((ref) => (
                <option key={ref.referenceNo} value={ref.referenceNo}>
                  {ref.referenceNo} {ref.customerName ? `- ${ref.customerName}` : ""}
                </option>
              ))}
            </select>
            <small style={{ fontSize: "0.95rem", color: "#5f7ca6", marginTop: "6px", display: "block" }}>
              Showing orders at least 50% paid and eligible for credit-sale finalisation.
            </small>
          </div>
        </div>

        {loading && (
          <div style={styles.loadingSpinner}>
            <div style={styles.spinner}></div>
            <p>Loading order details...</p>
          </div>
        )}

        {!loading && formData.referenceNo && (
          <>
            {/* Product Info - Read Only */}
            <h3 style={styles.sectionTitle}>Product Information</h3>
            <div style={styles.formBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Product Name</label>
                  <input type="text" value={formData.productInfo.productName} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Product ID</label>
                  <input type="text" value={formData.productInfo.productId} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Category</label>
                  <input type="text" value={formData.productInfo.category} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Sub-Category</label>
                  <input type="text" value={formData.productInfo.subCategory} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Unit Price (₦)</label>
                  <input type="text" value={formatCurrency(formData.productInfo.price)} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Quantity</label>
                  <input type="text" value={formData.productInfo.quantity} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Discount (₦)</label>
                  <input type="text" value={formatCurrency(formData.productInfo.discount)} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Description</label>
                  <textarea value={formData.productInfo.description} style={styles.readonlyInput} readOnly rows="2" />
                </div>
              </div>
            </div>

            {/* Customer Info - Read Only */}
            <h3 style={styles.sectionTitle}>Customer Information</h3>
            <div style={styles.formBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Customer Name</label>
                  <input type="text" value={formData.customerInfo.customerName} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Account Number</label>
                  <input type="text" value={formData.customerInfo.accountNumber} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Email</label>
                  <input type="text" value={formData.customerInfo.email} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Phone Number</label>
                  <input type="text" value={formData.customerInfo.phoneNumber} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Address</label>
                  <input type="text" value={formData.customerInfo.address} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Date of Birth</label>
                  <input type="text" value={formData.customerInfo.dob} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Gender</label>
                  <input type="text" value={formData.customerInfo.gender} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Occupation</label>
                  <input type="text" value={formData.customerInfo.occupation} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Bank Account</label>
                  <input type="text" value={formData.customerInfo.customerBankAccount} style={styles.readonlyInput} readOnly />
                </div>
              </div>
            </div>

            {/* Loan Info - Read Only */}
            <h3 style={styles.sectionTitle}>Loan Details</h3>
            <div style={styles.formBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Loan Type</label>
                  <input type="text" value={formData.loanInfo.loanType} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Product Amount (₦)</label>
                  <input type="text" value={formatCurrency(formData.loanInfo.productAmount)} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Repayment Method</label>
                  <input type="text" value={formData.loanInfo.repaymentMethod} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Duration (Months)</label>
                  <input type="text" value={formData.loanInfo.duration} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Interest Rate (%)</label>
                  <input type="text" value={formData.loanInfo.rate} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Interest on Loan (₦)</label>
                  <input type="text" value={formatCurrency(formData.loanInfo.interestOnLoan)} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Monthly Payment (₦)</label>
                  <input type="text" value={formatCurrency(formData.loanInfo.monthlyPayment)} style={styles.readonlyInput} readOnly />
                </div>
              </div>
            </div>

            {/* Charges - Editable */}
            <h3 style={styles.sectionTitle}>Additional Charges</h3>
            <div style={styles.formBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Insurance (₦)</label>
                  <input
                    type="number"
                    value={formData.charges.insurance}
                    onChange={(e) => handleChargesChange("insurance", e.target.value)}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Delivery Charges (₦)</label>
                  <input
                    type="number"
                    value={formData.charges.deliveryCharges}
                    onChange={(e) => handleChargesChange("deliveryCharges", e.target.value)}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>VAT (₦)</label>
                  <input
                    type="number"
                    value={formData.charges.vat}
                    onChange={(e) => handleChargesChange("vat", e.target.value)}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div style={styles.calculationBox}>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Product Price</span>
                  <span style={styles.calculationValue}>{formatCurrency(formData.productInfo.price)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Discount</span>
                  <span style={styles.calculationValue}>- {formatCurrency(formData.productInfo.discount)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Insurance</span>
                  <span style={styles.calculationValue}>+ {formatCurrency(formData.charges.insurance)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Delivery Charges</span>
                  <span style={styles.calculationValue}>+ {formatCurrency(formData.charges.deliveryCharges)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>VAT</span>
                  <span style={styles.calculationValue}>+ {formatCurrency(formData.charges.vat)}</span>
                </div>
                <div style={{ ...styles.calculationRow, borderBottom: "none", marginTop: "10px", paddingTop: "10px", borderTop: "2px solid #0867db" }}>
                  <span style={{ ...styles.calculationLabel, fontWeight: "bold", color: "#0867db" }}>TOTAL AMOUNT</span>
                  <span style={{ ...styles.calculationValue, fontSize: "1.1rem", fontWeight: "bold", color: "#10b981" }}>
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary action: Generate Sales Reference, unless the order is over 50% paid */}
            {requiresApproval ? (
              <>
                <div style={{ ...styles.alert, ...styles.alertError, marginTop: "20px", marginBottom: 0 }}>
                  ⚠️ This order is {orderPaymentProgress}% paid (over 50%) - it can&apos;t be finalised here.
                  Reject it or send it to admin for approval instead.
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => handleDecision("reject")}
                    disabled={decisionLoading}
                    style={{
                      ...styles.button,
                      ...(decisionLoading ? styles.buttonDisabled : { backgroundColor: "#dc2626" }),
                      marginTop: 0,
                      flex: 1
                    }}
                  >
                    {decisionLoading ? "SUBMITTING..." : "REJECT"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision("submit-for-approval")}
                    disabled={decisionLoading}
                    style={{
                      ...styles.button,
                      ...(decisionLoading ? styles.buttonDisabled : { backgroundColor: "#f59e0b" }),
                      marginTop: 0,
                      flex: 1
                    }}
                  >
                    {decisionLoading ? "SUBMITTING..." : "SEND TO ADMIN FOR APPROVAL"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={handleGenerateSalesReference}
                  disabled={generatingRef}
                  style={{
                    ...styles.button,
                    backgroundColor: generatingRef ? "#9ca3af" : "#10b981",
                    marginTop: 0,
                    cursor: generatingRef ? "not-allowed" : "pointer",
                  }}
                >
                  {generatingRef ? "GENERATING..." : "GENERATE SALES REFERENCE"}
                </button>
                {salesReference && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      color: "#065f46",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      textAlign: "center",
                    }}
                  >
                    Sales Reference: {salesReference}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OnCreditSales;
