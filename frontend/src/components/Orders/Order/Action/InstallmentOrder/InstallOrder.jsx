import React, { useState, useEffect } from "react";
import BranchBadge from "../../../../shared/BranchBadge";
import Dashboard from "../../../../ui/DashboardBtn";
import { apiRequest } from "../../../../../lib/config";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import pmLogo from "../../../../../assets/images/PMlogo.png";

const InstallOrder = ({ toggleInstallOrdModal }) => {
  const closeModal = () => {
    toggleInstallOrdModal();
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [referenceNumbers, setReferenceNumbers] = useState([]);
  const [fetchingRefs, setFetchingRefs] = useState(false);
  const [orderData, setOrderData] = useState(null);
  
  const [formData, setFormData] = useState({
    productInfo: {
      productName: "",
      productId: "",
      referenceNo: "",
      category: "",
      subCategory: "",
      description: "",
      price: "",
      unitPrice: "",
      quantity: "1",
      discount: "0",
      coupon: ""
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
      startDate: new Date().toISOString().split('T')[0],
      expirationDate: "",
      officerInCharge: "",
      upfrontCharges: "0"
    },
    charges: {
      insurance: "0",
      deliveryCharges: "0",
      vat: "0"
    }
  });

  // Fetch all reference numbers on mount
  useEffect(() => {
    fetchReferenceNumbers();
  }, []);

  // Auto-calculate loan when relevant fields change
  useEffect(() => {
    calculateLoan();
  }, [formData.loanInfo.productAmount, formData.loanInfo.rate, formData.loanInfo.duration]);

  // Fetch all order reference numbers
  const fetchReferenceNumbers = async () => {
    try {
      setFetchingRefs(true);
      setError("");
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("InstallOrder: FETCHING ORDER REFERENCE NUMBERS");
      console.log("═══════════════════════════════════════════════════════════");
      
      // Fetch all walk-in credit sales to get reference numbers
      const today = new Date();
      const startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const response = await apiRequest(
        `/sales/reports/walk-in/credit?startDate=${startDate}T00:00:00&endDate=${endDate}T23:59:59`,
        "GET"
      );
      
      let ordersList = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        ordersList = response.response.content;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (Array.isArray(response)) {
        ordersList = response;
      }
      
      // Extract unique reference numbers
      const refs = ordersList
        .filter(order => order.referenceNo)
        .map(order => ({
          referenceNo: order.referenceNo,
          orderId: order.id,
          order: order
        }));
      
      console.log(`Found ${refs.length} reference numbers`);
      setReferenceNumbers(refs);
      
      if (refs.length === 0) {
        setError("No orders found. Please create a credit sale first.");
      }
      
    } catch (err) {
      console.error("Error fetching reference numbers:", err);
      setError("Failed to load reference numbers");
    } finally {
      setFetchingRefs(false);
    }
  };

  // Handle reference number selection
  const handleReferenceSelect = async (e) => {
    const selectedRef = e.target.value;
    console.log(`Selected reference number: ${selectedRef}`);
    
    if (!selectedRef) {
      resetForm();
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Find the selected order
      const selectedOrder = referenceNumbers.find(ref => ref.referenceNo === selectedRef);
      
      if (selectedOrder && selectedOrder.order) {
        const order = selectedOrder.order;
        console.log("Selected order data:", order);
        
        // Fetch detailed order information
        const orderDetailsResponse = await apiRequest(`/sales/orders/${order.id}/details`, "GET");
        let details = null;
        if (orderDetailsResponse?.data) {
          details = orderDetailsResponse.data;
        } else if (orderDetailsResponse?.response) {
          details = orderDetailsResponse.response;
        } else {
          details = orderDetailsResponse;
        }
        
        console.log("Order details:", details);
        
        // Populate form with order data
        setFormData({
          productInfo: {
            productName: order.productName || details?.productName || "",
            productId: order.productId || details?.productId || "",
            referenceNo: order.referenceNo || "",
            category: order.category || details?.category || "",
            subCategory: order.subCategory || details?.subCategory || "",
            description: order.description || details?.description || "",
            price: order.totalAmount || details?.totalAmount || order.amount || 0,
            unitPrice: order.unitPrice || details?.unitPrice || 0,
            quantity: order.quantity || details?.quantity || 1,
            discount: order.discount || details?.discount || "0",
            coupon: ""
          },
          customerInfo: {
            customerName: order.customerName || details?.customerName || "",
            accountNumber: order.accountNumber || details?.accountNumber || "",
            email: order.email || details?.email || "",
            phoneNumber: order.phoneNumber || details?.phoneNumber || "",
            address: order.address || details?.address || "",
            dob: order.dob || details?.dob || "",
            gender: order.gender || details?.gender || "",
            occupation: order.occupation || details?.occupation || "",
            customerBankAccount: order.customerBankAccount || details?.customerBankAccount || ""
          },
          loanInfo: {
            ...formData.loanInfo,
            productAmount: order.totalAmount || details?.totalAmount || order.amount || 0,
            startDate: new Date().toISOString().split('T')[0],
            expirationDate: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0]
          },
          charges: {
            insurance: "0",
            deliveryCharges: "0",
            vat: "0"
          }
        });
        
        setOrderData(order);
        console.log("Form populated successfully");
      }
      
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  // Calculate loan interest and payments
  const calculateLoan = () => {
    const productAmount = parseFloat(formData.loanInfo.productAmount) || 0;
    const rate = parseFloat(formData.loanInfo.rate) || 0;
    const duration = parseInt(formData.loanInfo.duration) || 0;
    
    console.log(`Calculating loan: Amount=${productAmount}, Rate=${rate}%, Duration=${duration} months`);
    
    if (productAmount > 0 && rate > 0 && duration > 0) {
      // Calculate interest: (Amount * Rate * Duration) / 100 / 12
      const interest = (productAmount * rate * duration) / 100 / 12;
      // Principal repayment per month
      const principal = productAmount / duration;
      // Monthly payment
      const monthlyPayment = principal + (interest / duration);
      
      console.log(`Calculated: Interest=${interest.toFixed(2)}, Principal=${principal.toFixed(2)}, Monthly=${monthlyPayment.toFixed(2)}`);
      
      setFormData(prev => ({
        ...prev,
        loanInfo: {
          ...prev.loanInfo,
          interestOnLoan: interest.toFixed(2),
          principalRepayment: principal.toFixed(2),
          monthlyPayment: monthlyPayment.toFixed(2)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        loanInfo: {
          ...prev.loanInfo,
          interestOnLoan: "",
          principalRepayment: ""
        }
      }));
    }
  };

  // Handle form field changes
  const handleChange = (section, field, value) => {
    console.log(`Changing ${section}.${field}: ${value}`);
    
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle charges changes
  const handleChargesChange = (field, value) => {
    console.log(`Changing charges.${field}: ${value}`);
    setFormData(prev => ({
      ...prev,
      charges: {
        ...prev.charges,
        [field]: value
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("═══════════════════════════════════════════════════════════");
    console.log("InstallOrder: SUBMITTING INSTALLMENT ORDER");
    console.log("═══════════════════════════════════════════════════════════");
    
    if (!formData.productInfo.referenceNo) {
      setError("Please select a reference number first");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (!formData.loanInfo.loanType) {
      setError("Please select a loan type");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const requestBody = {
        productInfo: {
          productName: formData.productInfo.productName,
          productId: formData.productInfo.productId,
          referenceNo: formData.productInfo.referenceNo,
          category: formData.productInfo.category,
          subCategory: formData.productInfo.subCategory,
          description: formData.productInfo.description,
          price: parseFloat(formData.productInfo.price) || 0,
          unitPrice: parseFloat(formData.productInfo.unitPrice) || 0,
          quantity: parseInt(formData.productInfo.quantity) || 1,
          discount: parseFloat(formData.productInfo.discount) || 0,
          coupon: formData.productInfo.coupon || ""
        },
        customerInfo: {
          customerName: formData.customerInfo.customerName,
          accountNumber: formData.customerInfo.accountNumber,
          email: formData.customerInfo.email,
          phoneNumber: formData.customerInfo.phoneNumber,
          address: formData.customerInfo.address,
          dob: formData.customerInfo.dob,
          gender: formData.customerInfo.gender,
          occupation: formData.customerInfo.occupation,
          customerBankAccount: formData.customerInfo.customerBankAccount
        },
        loanInfo: {
          loanType: formData.loanInfo.loanType,
          productAmount: parseFloat(formData.loanInfo.productAmount) || 0,
          repaymentMethod: formData.loanInfo.repaymentMethod,
          duration: formData.loanInfo.duration,
          rate: parseFloat(formData.loanInfo.rate) || 0,
          interestOnLoan: parseFloat(formData.loanInfo.interestOnLoan) || 0,
          principalRepayment: parseFloat(formData.loanInfo.principalRepayment) || 0,
          startDate: formData.loanInfo.startDate,
          expirationDate: formData.loanInfo.expirationDate,
          officerInCharge: formData.loanInfo.officerInCharge || "",
          upfrontCharges: parseFloat(formData.loanInfo.upfrontCharges) || 0
        }
      };
      
      console.log("Request Body:", JSON.stringify(requestBody, null, 2));
      
      const response = await apiRequest("/sales/orders/installment", "POST", requestBody);
      
      console.log("Response:", response);
      
      if (response?.status === 200 || response?.status === 201 || response?.success === true) {
        setSuccess("✅ Installment order created successfully!");
        
        setTimeout(() => {
          setSuccess("");
          toggleInstallOrdModal();
        }, 2000);
      } else {
        throw new Error(response?.message || "Failed to create installment order");
      }
      
    } catch (err) {
      console.error("Error creating installment order:", err);
      setError(err?.message || "Failed to create installment order. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productInfo: {
        productName: "",
        productId: "",
        referenceNo: "",
        category: "",
        subCategory: "",
        description: "",
        price: "",
        unitPrice: "",
        quantity: "1",
        discount: "0",
        coupon: ""
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
        startDate: new Date().toISOString().split('T')[0],
        expirationDate: "",
        officerInCharge: "",
        upfrontCharges: "0"
      },
      charges: {
        insurance: "0",
        deliveryCharges: "0",
        vat: "0"
      }
    });
    setOrderData(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Styles
  const styles = {
    container: {
      maxWidth: "1180px",
      margin: "0 auto",
      padding: "14px",
      fontFamily: "'Montserrat', sans-serif",
      background: "#f8fbff",
      border: "1px solid #c5d6ef",
      borderRadius: "18px",
      boxShadow: "0 20px 45px rgba(18, 57, 110, 0.12)"
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      background: "linear-gradient(90deg, #103b7a 0%, #1b5cb8 100%)",
      border: "1px solid #114583",
      borderRadius: "12px",
      marginBottom: "14px",
      padding: "14px 16px"
    },
    headerLeft: {
      width: "44px",
      minWidth: "44px",
      flex: "0 0 44px",
      display: "flex",
      justifyContent: "flex-start"
    },
    logo: {
      width: "42px",
      height: "42px",
      display: "block",
      objectFit: "contain",
      borderRadius: "8px",
      background: "#ffffff",
      border: "1px solid #d7e6ff",
      padding: "4px"
    },
    title: {
      fontSize: "1.7rem",
      fontWeight: "700",
      color: "#eef5ff",
      textTransform: "uppercase",
      margin: "0",
      letterSpacing: "0.05em"
    },
    headerRight: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    headerIcon: {
      color: "#e8f2ff",
      fontSize: "1.2rem"
    },
    closeBtn: {
      background: "transparent",
      color: "#e8f2ff",
      border: "none",
      fontSize: "1rem",
      cursor: "pointer",
      width: "30px",
      height: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
      transition: "all 0.3s"
    },
    sectionTitle: {
      fontSize: "1.18rem",
      fontWeight: "700",
      color: "#103b7a",
      margin: "18px 0 12px 0",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      borderBottom: "2px solid #1b5cb8",
      display: "inline-block",
      paddingBottom: "5px"
    },
    formBox: {
      backgroundColor: "#fff",
      border: "1px solid #cdddf3",
      borderRadius: "12px",
      padding: "18px",
      marginBottom: "14px",
      boxShadow: "0 4px 14px rgba(17, 69, 131, 0.06)"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "16px"
    },
    field: {
      marginBottom: "12px"
    },
    label: {
      display: "block",
      fontSize: "0.84rem",
      fontWeight: "700",
      color: "#5e7ca8",
      textTransform: "uppercase",
      marginBottom: "6px",
      letterSpacing: "0.5px"
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1rem",
      fontFamily: "inherit",
      transition: "border-color 0.2s ease",
      outline: "none",
      backgroundColor: "#fff"
    },
    select: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1rem",
      fontFamily: "inherit",
      backgroundColor: "#fff",
      cursor: "pointer"
    },
    textarea: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1rem",
      fontFamily: "inherit",
      resize: "vertical",
      minHeight: "80px"
    },
    readonlyInput: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1rem",
      backgroundColor: "#eef5ff",
      color: "#22426f"
    },
    button: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#1b5cb8",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "1rem",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.2s ease",
      marginTop: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    buttonDisabled: {
      backgroundColor: "#9ca3af",
      cursor: "not-allowed"
    },
    alert: {
      padding: "12px 20px",
      borderRadius: "8px",
      marginBottom: "12px",
      fontSize: "0.9rem",
      fontWeight: "500",
      textAlign: "center"
    },
    alertError: {
      backgroundColor: "#fff4e5",
      color: "#8a5b12",
      border: "1px solid #ffd9a8"
    },
    alertSuccess: {
      backgroundColor: "#dcfce7",
      color: "#16a34a",
      border: "1px solid #bbf7d0"
    },
    loadingSpinner: {
      textAlign: "center",
      padding: "20px",
      color: "#6b7280"
    },
    spinner: {
      border: "3px solid #f3f4f6",
      borderTop: "3px solid #1b5cb8",
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      animation: "spin 1s linear infinite",
      margin: "0 auto 12px"
    },
    calculationBox: {
      backgroundColor: "#eef5ff",
      padding: "15px",
      borderRadius: "10px",
      marginTop: "12px",
      border: "1px solid #c8daf1"
    },
    calculationRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #e5e7eb"
    },
    calculationLabel: {
      fontSize: "0.8rem",
      fontWeight: "500",
      color: "#6b7280"
    },
    calculationValue: {
      fontSize: "0.95rem",
      fontWeight: "700",
      color: "#1b5cb8"
    }
  };

  return (
    <div style={styles.container}>
            {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img
            src={pmLogo}
            alt="PM Logo"
            style={styles.logo}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/pm-logo.png";
            }}
          />
        </div>
        <h1 style={styles.title}>INSTALLMENT ORDER</h1>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <div style={styles.headerRight}>
          <Dashboard />
          <IoGridOutline style={styles.headerIcon} />
          <button
            onClick={closeModal}
            style={styles.closeBtn}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          Alert: {error}
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          Success: {success}
        </div>
      )}

      {fetchingRefs && (
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p>Loading reference numbers...</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Reference Number Selection */}
        <div style={styles.formBox}>
          <div style={styles.field}>
            <label style={styles.label}>CHS Reference Number *</label>
            <select 
              value={formData.productInfo.referenceNo}
              onChange={handleReferenceSelect}
              style={styles.select}
              disabled={loading || saving}
            >
              <option value="">-- Select Reference Number --</option>
              {referenceNumbers.map((ref) => (
                <option key={ref.referenceNo} value={ref.referenceNo}>
                  {ref.referenceNo}
                </option>
              ))}
            </select>
            <small style={{ display: "block", marginTop: "8px", color: "#1b5cb8", fontWeight: "700" }}>
              Showing installment references. Total on list: {referenceNumbers.length}
            </small>
          </div>
        </div>

        {loading && (
          <div style={styles.loadingSpinner}>
            <div style={styles.spinner}></div>
            <p>Loading order details...</p>
          </div>
        )}

        {!loading && formData.productInfo.referenceNo && (
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
                  <input type="text" value={formatCurrency(formData.productInfo.unitPrice)} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Quantity</label>
                  <input type="text" value={formData.productInfo.quantity} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Discount (%)</label>
                  <input type="text" value={formData.productInfo.discount} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Total Amount (₦)</label>
                  <input type="text" value={formatCurrency(formData.productInfo.price)} style={styles.readonlyInput} readOnly />
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
                  <label style={styles.label}>Gender</label>
                  <input type="text" value={formData.customerInfo.gender} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Occupation</label>
                  <input type="text" value={formData.customerInfo.occupation} style={styles.readonlyInput} readOnly />
                </div>
              </div>
            </div>

            {/* Loan Info */}
            <h3 style={styles.sectionTitle}>Loan Details</h3>
            <div style={styles.formBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Loan Type *</label>
                  <select 
                    value={formData.loanInfo.loanType}
                    onChange={(e) => handleChange("loanInfo", "loanType", e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="Installment">Installment Loan</option>
                    <option value="Personal">Personal Loan</option>
                    <option value="Business">Business Loan</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Product Amount (₦)</label>
                  <input 
                    type="number" 
                    value={formData.loanInfo.productAmount}
                    style={styles.readonlyInput}
                    readOnly
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Repayment Method</label>
                  <select 
                    value={formData.loanInfo.repaymentMethod}
                    onChange={(e) => handleChange("loanInfo", "repaymentMethod", e.target.value)}
                    style={styles.select}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-Annual">Bi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Duration (Months)</label>
                  <input 
                    type="number" 
                    value={formData.loanInfo.duration}
                    onChange={(e) => handleChange("loanInfo", "duration", e.target.value)}
                    style={styles.input}
                    min="1"
                    step="1"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Interest Rate (%)</label>
                  <input 
                    type="number" 
                    value={formData.loanInfo.rate}
                    onChange={(e) => handleChange("loanInfo", "rate", e.target.value)}
                    style={styles.input}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Start Date</label>
                  <input 
                    type="date" 
                    value={formData.loanInfo.startDate}
                    onChange={(e) => handleChange("loanInfo", "startDate", e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Expiration Date</label>
                  <input 
                    type="date" 
                    value={formData.loanInfo.expirationDate}
                    onChange={(e) => handleChange("loanInfo", "expirationDate", e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Officer In Charge</label>
                  <input 
                    type="text" 
                    value={formData.loanInfo.officerInCharge}
                    onChange={(e) => handleChange("loanInfo", "officerInCharge", e.target.value)}
                    style={styles.input}
                    placeholder="Enter officer name"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Upfront Charges (₦)</label>
                  <input 
                    type="number" 
                    value={formData.loanInfo.upfrontCharges}
                    onChange={(e) => handleChange("loanInfo", "upfrontCharges", e.target.value)}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Loan Calculation Display */}
              {formData.loanInfo.interestOnLoan && (
                <div style={styles.calculationBox}>
                  <div style={styles.calculationRow}>
                    <span style={styles.calculationLabel}>Total Interest on Loan</span>
                    <span style={styles.calculationValue}>{formatCurrency(formData.loanInfo.interestOnLoan)}</span>
                  </div>
                  <div style={styles.calculationRow}>
                    <span style={styles.calculationLabel}>Principal Repayment (per month)</span>
                    <span style={styles.calculationValue}>{formatCurrency(formData.loanInfo.principalRepayment)}</span>
                  </div>
                  <div style={styles.calculationRow}>
                    <span style={styles.calculationLabel}>Monthly Payment (Principal + Interest)</span>
                    <span style={styles.calculationValue}>{formatCurrency(formData.loanInfo.monthlyPayment)}</span>
                  </div>
                  <div style={styles.calculationRow}>
                    <span style={styles.calculationLabel}>Total Repayment</span>
                    <span style={styles.calculationValue}>
                      {formatCurrency((parseFloat(formData.loanInfo.productAmount) || 0) + (parseFloat(formData.loanInfo.interestOnLoan) || 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Charges */}
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving || !formData.productInfo.referenceNo}
              style={{
                ...styles.button,
                ...((saving || !formData.productInfo.referenceNo) ? styles.buttonDisabled : {})
              }}
              onMouseEnter={(e) => {
                if (!saving && formData.productInfo.referenceNo) {
                  e.target.style.backgroundColor = "#144a94";
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && formData.productInfo.referenceNo) {
                  e.target.style.backgroundColor = "#1b5cb8";
                }
              }}
            >
              {saving ? "PROCESSING..." : "CREATE INSTALLMENT ORDER"}
            </button>
          </>
        )}
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InstallOrder;

