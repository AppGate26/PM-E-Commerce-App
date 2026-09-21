import React, { useState, useEffect } from "react";
import BranchBadge from "../../../../shared/BranchBadge";
import Dashboard from "../../../../ui/DashboardBtn";
import { apiRequest } from "../../../../../lib/config";
import { fetchSalesReference, printSalesReference } from "../../../../../lib/salesReference";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";

const getCustomerTypeLabel = (order = {}) => {
  const raw = (order.customerType || order.customer_type || "").toString().toUpperCase();
  if (raw === "ONLINE") return "ONLINE";
  if (raw === "WALKIN" || raw === "WALK_IN" || raw === "WALK-IN") return "WALK-IN";
  return "UNKNOWN";
};

const OneOfOrder = ({ toggleOneOfOrdModal }) => {
  const closeModal = () => {
    toggleOneOfOrdModal();
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [referenceNumbers, setReferenceNumbers] = useState([]);
  const [fetchingRefs, setFetchingRefs] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [salesReference, setSalesReference] = useState("");
  const [generatingRef, setGeneratingRef] = useState(false);
  const [settling, setSettling] = useState(false);
  const [customerTypeFilter, setCustomerTypeFilter] = useState("ALL");

  const handleGenerateSalesReference = async () => {
    const orderId = orderData?.id;
    if (!orderId) {
      setError("Please select a reference number first.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setGeneratingRef(true);
    try {
      const ref = await fetchSalesReference(orderId);
      setSalesReference(ref);
      printSalesReference(ref, {
        "Order Ref": formData.productInfo.referenceNo,
        Customer: formData.customerInfo.customerName,
        Product: formData.productInfo.productName,
        Amount: formData.productInfo.price,
      });
      // Minting the reference is what takes the order off this screen - the backing query
      // lists ONE_OFF orders with salesReference IS NULL - so drop it from the dropdown
      // rather than leaving a row whose only remaining action is a no-op. The printed
      // reference above stays on screen; only the selection is cleared.
      setReferenceNumbers((prev) => prev.filter((entry) => entry.orderId !== orderId));
      setSuccess("Sales reference generated. This order now appears under Completed Payments.");
      resetForm();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err?.message || "Failed to generate sales reference.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setGeneratingRef(false);
    }
  };

  // Settles a staff-entered one-off order (isPaid=true) and folds in the charges entered
  // above. Only applies to orders that arrive unpaid: a mobile one-off order is mirrored in
  // already settled, and settleOneOffOrder rejects it outright ("Order has already been
  // paid"), which is why the button is hidden for those - see selectedOrderIsPaid below.
  // Settling does not take the order off this screen; generating its sales reference does.
  const handleSettlePayment = async () => {
    const orderId = orderData?.id;
    if (!orderId) {
      setError("Please select a reference number first.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setSettling(true);
    setError("");
    try {
      await apiRequest(`/sales/orders/${orderId}/settle-one-off`, "PUT", {
        insurance: parseFloat(formData.charges.insurance) || 0,
        deliveryCharges: parseFloat(formData.charges.deliveryCharges) || 0,
        vat: parseFloat(formData.charges.vat) || 0,
      });
      setSuccess("Order marked as paid. Generate its sales reference to close it out.");
      // Stays on the list - it still has no sales reference - but is now flagged paid so the
      // Mark As Paid button drops away and only Generate Sales Reference is left.
      setOrderData((prev) => (prev ? { ...prev, isPaid: true } : prev));
      setReferenceNumbers((prev) =>
        prev.map((entry) =>
          entry.orderId === orderId
            ? { ...entry, order: { ...entry.order, isPaid: true } }
            : entry
        )
      );
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err?.message || "Failed to mark order as paid.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSettling(false);
    }
  };

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

  // Fetch all order reference numbers
  const fetchReferenceNumbers = async () => {
    try {
      setFetchingRefs(true);
      setError("");
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("OneOfOrder: FETCHING ORDER REFERENCE NUMBERS");
      console.log("═══════════════════════════════════════════════════════════");
      
      // ONE_OFF orders that still need a sales reference (SalesService.getMobileOrdersPaidInFull),
      // queried off SalesOrder's own orderType/salesReference columns rather than the shared
      // incomplete-payments list, whose isPaid/status rules were silently dropping eligible
      // orders. Not filtered on isPaid either way: mobile one-off orders arrive already
      // settled and staff-entered ones arrive unpaid, so the missing reference is the only
      // thing they have in common - and it is what this screen is for. Carries the
      // referenceNo the dropdown is built from.
      let response;
      try {
        response = await apiRequest("/sales/orders/mobile-paid-in-full?size=500", "GET");
      } catch (_err) {
        response = await apiRequest("/api/sales/orders/mobile-paid-in-full?size=500", "GET");
      }
      
      let ordersList = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        ordersList = response.response.content;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (response?.content && Array.isArray(response.content)) {
        ordersList = response.content;
      } else if (response?.response && Array.isArray(response.response)) {
        ordersList = response.response;
      } else if (Array.isArray(response)) {
        ordersList = response;
      }
      
      // Extract unique reference numbers
      const refs = ordersList
        .filter(order => order.referenceNo)
        .map(order => ({
          referenceNo: order.referenceNo,
          // The list returns orderId; keep id as a fallback for any other shape
          // this list might carry.
          orderId: order.orderId || order.id,
          customerType: getCustomerTypeLabel(order),
          order: { ...order, id: order.orderId || order.id },
        }));
      
      console.log(`Found ${refs.length} reference numbers`);
      setReferenceNumbers(refs);
      
      if (refs.length === 0) {
        setError("No order reference found yet. Create/complete a sales order first.");
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

  // Calculate total amount with charges
  const calculateTotal = () => {
    const unitPrice = parseFloat(formData.productInfo.unitPrice) || 0;
    const quantity = parseInt(formData.productInfo.quantity) || 1;
    const discount = parseFloat(formData.productInfo.discount) || 0;
    const insurance = parseFloat(formData.charges.insurance) || 0;
    const delivery = parseFloat(formData.charges.deliveryCharges) || 0;
    const vat = parseFloat(formData.charges.vat) || 0;
    
    const subtotal = unitPrice * quantity;
    const total = subtotal - discount + insurance + delivery + vat;
    return total;
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
      charges: {
        insurance: "0",
        deliveryCharges: "0",
        vat: "0"
      }
    });
    setOrderData(null);
  };

  // A mobile one-off order arrives already settled (the mirror copies the app's paid state),
  // a staff-entered one does not - the two branches of this screen's workflow.
  const selectedOrderIsPaid = orderData?.isPaid === true;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };  // Styles
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
      minWidth: "44px",
      flex: "0 0 44px",
      display: "flex",
      justifyContent: "flex-start"
    },
    headerRight: {
      width: "96px",
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "8px"
    },
    logo: {
      width: "42px",
      height: "42px",
      display: "block",
      objectFit: "contain",
      borderRadius: "8px",
      background: "#ffffff",
      padding: "4px",
      border: "1px solid #d7e6ff"
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
      display: "block",
      textAlign: "center"
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

  const totalAmount = calculateTotal();

  const filteredReferenceNumbers = referenceNumbers.filter((ref) => {
    if (customerTypeFilter === "ALL") return true;
    return customerTypeFilter === "ONLINE" ? ref.customerType === "ONLINE" : ref.customerType === "WALK-IN";
  });

  const handleCustomerTypeFilterChange = (e) => {
    setCustomerTypeFilter(e.target.value);
    resetForm();
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img
            src='/pm-logo.png'
            alt='PM Logo'
            style={styles.logo}
          />
        </div>
        <h1 style={styles.title}>One-Off Order</h1>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <div style={styles.headerRight}>
          <Dashboard />
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

      {fetchingRefs && (
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p>Loading reference numbers...</p>
        </div>
      )}

      <div>
        {/* Customer Type Filter */}
        <div style={styles.formBox}>
          <div style={styles.field}>
            <label style={styles.label}>Filter by Customer Type</label>
            <select
              value={customerTypeFilter}
              onChange={handleCustomerTypeFilterChange}
              style={styles.select}
              disabled={loading}
            >
              <option value="ALL">All Customers</option>
              <option value="ONLINE">Online Customers</option>
              <option value="WALKIN">Walk-in Customers</option>
            </select>
          </div>
        </div>

        {/* Reference Number Selection */}
        <div style={styles.formBox}>
          <div style={styles.field}>
            <label style={styles.label}>CHS Reference Number *</label>
            <select
              value={formData.productInfo.referenceNo}
              onChange={handleReferenceSelect}
              style={styles.select}
              disabled={loading}
            >
              <option value="">-- Select Reference Number --</option>
              {filteredReferenceNumbers.map((ref) => (
                <option key={ref.referenceNo} value={ref.referenceNo}>
                  [{ref.customerType}] {ref.referenceNo}
                </option>
              ))}
            </select>
            <small style={{ display: "block", marginTop: "6px", fontSize: "0.85rem", color: "#6b7280" }}>
              Showing {filteredReferenceNumbers.length} of {referenceNumbers.length} unpaid order reference{referenceNumbers.length === 1 ? "" : "s"}.
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

              {/* Total Calculation Display */}
              <div style={styles.calculationBox}>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Subtotal (Price × Quantity)</span>
                  <span style={styles.calculationValue}>
                    {formatCurrency((parseFloat(formData.productInfo.unitPrice) || 0) * (parseInt(formData.productInfo.quantity) || 1))}
                  </span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Discount</span>
                  <span style={styles.calculationValue}>- {formatCurrency(parseFloat(formData.productInfo.discount) || 0)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Insurance</span>
                  <span style={styles.calculationValue}>+ {formatCurrency(parseFloat(formData.charges.insurance) || 0)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Delivery Charges</span>
                  <span style={styles.calculationValue}>+ {formatCurrency(parseFloat(formData.charges.deliveryCharges) || 0)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>VAT</span>
                  <span style={styles.calculationValue}>+ {formatCurrency(parseFloat(formData.charges.vat) || 0)}</span>
                </div>
                <div style={{ ...styles.calculationRow, borderBottom: "none", marginTop: "10px", paddingTop: "10px", borderTop: "2px solid #0867db" }}>
                  <span style={{ ...styles.calculationLabel, fontWeight: "bold", color: "#0867db" }}>TOTAL AMOUNT</span>
                  <span style={{ ...styles.calculationValue, fontSize: "1.1rem", fontWeight: "bold", color: "#10b981" }}>
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Settle / Mark As Paid + Generate Sales Reference. Mark As Paid is only shown
                for an order that is actually unpaid: mobile one-off orders are mirrored in
                already settled, and settle-one-off rejects those, so the button would do
                nothing but raise "Order has already been paid". */}
            <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {!selectedOrderIsPaid && (
                <button
                  type="button"
                  onClick={handleSettlePayment}
                  disabled={settling}
                  style={{
                    ...styles.button,
                    backgroundColor: settling ? "#9ca3af" : "#1b5fbe",
                    marginTop: 0,
                    flex: "1 1 220px",
                    cursor: settling ? "not-allowed" : "pointer",
                  }}
                >
                  {settling ? "PROCESSING..." : "MARK AS PAID"}
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateSalesReference}
                disabled={generatingRef}
                style={{
                  ...styles.button,
                  backgroundColor: generatingRef ? "#9ca3af" : "#10b981",
                  marginTop: 0,
                  flex: "1 1 220px",
                  cursor: generatingRef ? "not-allowed" : "pointer",
                }}
              >
                {generatingRef ? "GENERATING..." : "GENERATE SALES REFERENCE"}
              </button>
              {salesReference && (
                <div
                  style={{
                    flexBasis: "100%",
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

export default OneOfOrder;


