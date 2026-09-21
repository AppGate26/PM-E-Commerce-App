import React, { useState, useEffect, useRef } from "react";
import BranchBadge from "../../../../shared/BranchBadge";
import "../../../../../Styles/OrderSegment/Sales/CashSales/CashSales.css";
import { apiRequest } from "../../../../../lib/config";
import { fetchSellableProducts } from "../../../../../lib/inventoryApi";
import { salesApi } from "../../../../../lib/salesApi";
import { IoGridOutline } from "react-icons/io5";
import { FaTimes, FaSearch, FaChevronDown } from "react-icons/fa";
import pmLogo from "../../../../../assets/images/PMlogo.png";

const CashSales = ({ toggleCshModal }) => {
  const closeModal = () => {
    toggleCshModal();
  };

  // State for form data
  const [formData, setFormData] = useState({
    fulfillmentType: "pickup",
    productInfo: {
      productName: "",
      productId: "",
      referenceNo: "",
      category: "",
      subCategory: "",
      description: "",
      price: "",
      quantity: "",
      discount: "",
    },
    customerInfo: {
      customerName: "",
      address: "",
      phoneNumber: "",
      email: "",
      accountNumber: "",
      surname: "",
      firstName: "",
      dob: "",
      occupation: "",
      nationality: "",
      nin: "",
      gender: "",
      customerBankAccount: "",
    },
    shipment: {
      shippingMethod: "",
      shippingStatus: "",
      trackingNumber: "",
      vehiclePlateNumber: "",
      shippingAddress: "",
      shippingCost: "",
    },
    transactionInfo: {
      transactionId: "",
      transactionDate: "",
      transactionAmount: "",
    },
    vat: {
      transactionId: "",
      transactionDate: "",
      transactionAmount: "",
    },
  });

  // Search states
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productSearchRef = useRef(null);

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef(null);

  // "search" = pick a registered customer (existing behaviour); "walkin" = free-text
  // entry for an anonymous customer who doesn't want to register.
  const [customerMode, setCustomerMode] = useState("search");
  const [paystackLoading, setPaystackLoading] = useState(false);

  const [productTable, setProductTable] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Set once "MAKE PAYMENT" is verified as successful — the order already exists at that
  // point, so the cart/customer fields stay on screen (read-only in spirit) purely so the
  // cashier can print a "PAID" receipt or close the modal. paidReference is the Paystack
  // reference of that confirmed payment, used on the receipt in place of the draft transaction id.
  const [isPaid, setIsPaid] = useState(false);
  const [paidReference, setPaidReference] = useState("");

  // Generate auto-reference number
  const generateReferenceNo = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PM-REF-${timestamp}${random}`;
  };

  // Anonymous walk-ins have no real account — this placeholder just satisfies the
  // "a customer was chosen" validation; the backend doesn't validate it against any
  // Customer record either way.
  const generateWalkInAccountNumber = () => `WALKIN-${Date.now()}`;

  useEffect(() => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const vatRandom = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    setFormData(prev => ({
      ...prev,
      productInfo: { ...prev.productInfo, referenceNo: generateReferenceNo() },
      shipment: {
        ...prev.shipment,
        trackingNumber: `TRK-${timestamp}${random}`,
      },
      transactionInfo: {
        ...prev.transactionInfo,
        transactionId: `TXN-${timestamp}${random}`,
      },
      vat: {
        ...prev.vat,
        transactionId: `TXN-${timestamp}${vatRandom}`,
      },
    }));
  }, [productTable.length]);

  // Auto-populate shippingCost from active delivery setup
  useEffect(() => {
    const fetchDeliveryCost = async () => {
      try {
        const response = await apiRequest("/admin/delivery-setups/active", "GET");
        let setups = [];
        if (Array.isArray(response)) setups = response;
        else if (Array.isArray(response?.data)) setups = response.data;
        else if (Array.isArray(response?.response)) setups = response.response;
        if (setups.length > 0) {
          const fee = setups[0].deliveryFee ?? setups[0].amount ?? "";
          setFormData(prev => ({
            ...prev,
            shipment: { ...prev.shipment, shippingCost: fee.toString() },
          }));
        }
      } catch {
        // non-fatal
      }
    };
    fetchDeliveryCost();
  }, []);

  // Filter products - simplified
  useEffect(() => {
    if (!productSearchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }

    const term = productSearchTerm.toLowerCase();
    const filtered = products.filter(p => {
      const name = (p.productName || p.name || "").toLowerCase();
      const id = (p.id?.toString() || p.productId?.toString() || "").toLowerCase();
      const cat = (p.category?.name || p.category || "").toLowerCase();
      return name.includes(term) || id.includes(term) || cat.includes(term);
    }).slice(0, 50);
    
    setFilteredProducts(filtered);
  }, [productSearchTerm, products]);

  // Filter customers - matches the locally loaded list first, then falls back to a
  // live backend search so customers registered after this screen opened are found.
  useEffect(() => {
    if (!customerSearchTerm.trim()) {
      setFilteredCustomers([]);
      return;
    }

    const term = customerSearchTerm.toLowerCase();
    const matches = (c) => {
      const name = `${c.firstName || ""} ${c.surname || ""}`.toLowerCase();
      const account = (c.accountNumber || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phoneNumber || "").toLowerCase();
      return name.includes(term) || account.includes(term) || email.includes(term) || phone.includes(term);
    };

    const localMatches = customers.filter(matches).slice(0, 10);
    setFilteredCustomers(localMatches);

    if (localMatches.length > 0 || customerSearchTerm.trim().length < 3) {
      return;
    }

    // No local match — query the backend so freshly registered accounts resolve.
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await apiRequest(
          `/admin/customers/search?query=${encodeURIComponent(customerSearchTerm.trim())}`,
          "GET"
        );
        const rows =
          response?.response?.content ||
          response?.data?.content ||
          response?.content ||
          (Array.isArray(response?.response) ? response.response : null) ||
          (Array.isArray(response) ? response : null) ||
          [];
        if (!cancelled && Array.isArray(rows) && rows.length > 0) {
          setFilteredCustomers(rows.slice(0, 10));
        }
      } catch {
        // Keep the (empty) local result if the backend search fails.
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customerSearchTerm, customers]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productSearchRef.current && !productSearchRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  // Sales must sell from stock (not the product register), so only products that
  // currently have stock on hand appear here — priced from the stock record.
  const fetchProducts = async () => {
    try {
      setFetching(true);
      const productsList = await fetchSellableProducts();
      setProducts(productsList);
    } catch (err) {
      console.error("Error fetching stock for sale:", err);
      setProducts([]);
    } finally {
      setFetching(false);
    }
  };

  // ✅ FIXED: Removed extra /api/ from endpoints
  const fetchCustomers = async () => {
    try {
      setFetching(true);
      const response = await apiRequest("/admin/customers", "GET");
      
      let customersList = [];
      if (response?.response && Array.isArray(response.response)) {
        customersList = response.response;
      } else if (Array.isArray(response)) {
        customersList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
      }
      
      setCustomers(customersList);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    } finally {
      setFetching(false);
    }
  };

  const selectProduct = (product) => {
    setFormData(prev => ({
      ...prev,
      productInfo: {
        ...prev.productInfo,
        productName: product.productName || product.name || "",
        productId: (product.id?.toString() || product.productId?.toString() || ""),
        // Friendly system-generated code (PM-PD-####) for display; productId stays numeric for the API.
        // Falls back to a padded sequential code derived from the numeric id so the
        // PRODUCT ID always follows a system sequence, never a bare/blank number.
        productCode:
          product.productCode ||
          (product.id != null ? `PM-PD-${String(product.id).padStart(4, "0")}` : ""),
        category: product.category?.name || product.category || "",
        subCategory: product.subCategory?.name || product.subCategory || "",
        description: product.productDescription || product.description || "",
        price: product.sellingPrice?.toString() || product.price?.toString() || product.unitPrice?.toString() || "",
        quantity: "1",
        discount: "",
      }
    }));
    setProductSearchTerm(product.productName || product.name || "");
    setShowProductDropdown(false);
  };

  const selectCustomer = (customer) => {
    const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || 
                     customer.customerName || customer.name || "Unknown";
    
    setFormData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        customerName: fullName,
        accountNumber: customer.accountNumber || "",
        email: customer.email || "",
        phoneNumber: customer.phoneNumber || "",
        address: customer.contactAddress || customer.officeAddress || "",
        surname: customer.surname || "",
        firstName: customer.firstName || "",
        dob: customer.dob || "",
        occupation: customer.occupation || "",
        nationality: customer.nationality || "",
        nin: customer.nin || "",
        gender: customer.gender || "",
        customerBankAccount: customer.bvn || "",
      }
    }));
    setCustomerSearchTerm(fullName);
    setShowCustomerDropdown(false);
    
    if (!formData.shipment.shippingAddress && customer.address) {
      setFormData(prev => ({
        ...prev,
        shipment: {
          ...prev.shipment,
          shippingAddress: customer.address
        }
      }));
    }
  };

  const handleChange = (e, section, field) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleFulfillmentTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, fulfillmentType: value }));
  };

  const handleCustomerModeChange = (mode) => {
    setCustomerMode(mode);
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);
    setFormData((prev) => ({
      ...prev,
      customerInfo: mode === "walkin"
        ? {
            ...prev.customerInfo,
            customerName: "",
            address: "",
            phoneNumber: "",
            email: "",
            gender: "",
            surname: "",
            firstName: "",
            accountNumber: generateWalkInAccountNumber(),
          }
        : { ...prev.customerInfo, accountNumber: "" },
    }));
  };

  const handleInsertRecord = (e) => {
    e.preventDefault();
    
    if (!formData.productInfo.productName || !formData.productInfo.price) {
      setError("Please select a valid product");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const newProduct = {
      id: Date.now(),
      productName: formData.productInfo.productName,
      productId: formData.productInfo.productId || `PROD-${Date.now()}`,
      description: formData.productInfo.description,
      category: formData.productInfo.category,
      subCategory: formData.productInfo.subCategory,
      unitPrice: formData.productInfo.price,
      quantity: formData.productInfo.quantity || 1,
      discount: formData.productInfo.discount || 0,
      referenceNo: formData.productInfo.referenceNo || "",
    };

    setProductTable([...productTable, newProduct]);
    
    setFormData((prev) => ({
      ...prev,
      productInfo: {
        productName: "",
        productId: "",
        referenceNo: generateReferenceNo(),
        category: "",
        subCategory: "",
        description: "",
        price: "",
        quantity: "",
        discount: "",
      },
    }));
    setProductSearchTerm("");
  };

  // Builds the per-line-item payload shape sent to the Paystack initialize-payment call.
  const buildSaleItems = () => {
    return productTable.map((product) => {
      const price = parseFloat(product.unitPrice) || 0;
      const quantity = parseInt(product.quantity) || 1;
      const discount = parseFloat(product.discount) || 0;

      return {
        productInfo: {
          productName: product.productName || "",
          productId: product.productId || "",
          referenceNo: product.referenceNo || "",
          category: product.category || "",
          subCategory: product.subCategory || "",
          description: product.description || "",
          price: price,
          unitPrice: price,
          quantity: quantity,
          discount: discount,
          coupon: "",
        },
        customerInfo: {
          customerName: formData.customerInfo.customerName || "",
          accountNumber: formData.customerInfo.accountNumber || "",
          email: formData.customerInfo.email || "",
          phoneNumber: formData.customerInfo.phoneNumber || "",
          address: formData.customerInfo.address || "",
          dob: formData.customerInfo.dob || "",
          gender: formData.customerInfo.gender || "",
          occupation: formData.customerInfo.occupation || "",
          customerBankAccount: formData.customerInfo.customerBankAccount || "",
        },
        loanInfo: {
          loanType: "",
          productAmount: 0,
          repaymentMethod: "",
          duration: "",
          rate: 0,
          interestOnLoan: 0,
          principalRepayment: 0,
          startDate: "",
          expirationDate: "",
          officerInCharge: "",
          upfrontCharges: 0
        },
        fulfillmentType: formData.fulfillmentType === "delivery" ? "DELIVERY" : "PICKUP",
      };
    });
  };

  // Opens Paystack's hosted checkout in a popup (instead of navigating this tab away) so
  // the cart/customer data entered here survives the round trip. CashSalesPaymentCallback
  // runs inside that popup, verifies the payment, creates the paid SalesOrder(s), and closes
  // itself; we then re-verify (idempotent — just returns the already-created order) to learn
  // the outcome and unlock the "paid" receipt watermark without ever leaving this modal.
  const handleMakePayment = async () => {
    setError("");
    setSuccess(false);

    if (productTable.length === 0) {
      setError("Please add at least one product");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!formData.customerInfo.customerName || !formData.customerInfo.accountNumber) {
      setError("Please select or enter a valid customer");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setPaystackLoading(true);
    try {
      const items = buildSaleItems();
      const totalAmount = calculateTotal();
      const callbackUrl = `${window.location.origin}/orders/cash-sales/payment/callback`;

      const response = await salesApi.initializeWalkInCashPayment({
        items,
        amount: totalAmount,
        email: formData.customerInfo.email || "",
        customerName: formData.customerInfo.customerName || "",
        callbackUrl,
      });

      const authorizationUrl =
        response?.authorizationUrl ||
        response?.authorization_url ||
        response?.checkoutUrl ||
        response?.checkout_url;
      const reference = response?.reference;

      if (!authorizationUrl || !reference) {
        throw new Error(response?.message || "Could not start Paystack payment. Please try again.");
      }

      const popup = window.open(
        authorizationUrl,
        "paystack_cash_sale",
        "width=520,height=720,menubar=no,toolbar=no,location=yes,status=no"
      );

      if (!popup) {
        throw new Error("Please allow popups for this site to pay via Paystack.");
      }

      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (popup.closed) {
            clearInterval(interval);
            resolve();
          }
        }, 1200);
      });

      const result = await salesApi.verifyWalkInCashPayment(reference);
      if (result?.status === "success") {
        setIsPaid(true);
        setPaidReference(reference);
        setSuccess(true);
      } else {
        setError(
          result?.message ||
            "We could not confirm this payment. If you were debited, please contact support."
        );
        setTimeout(() => setError(""), 6000);
      }
    } catch (err) {
      console.error("Paystack init error:", err);
      setError(err.message || "Failed to start Paystack payment");
      setTimeout(() => setError(""), 5000);
    } finally {
      setPaystackLoading(false);
    }
  };

  // Subtotal across product lines (selling price × qty, less any line discount).
  const calculateSubtotal = () => {
    return productTable.reduce((sum, product) => {
      const price = parseFloat(product.unitPrice) || 0;
      const quantity = parseInt(product.quantity) || 1;
      const discount = parseFloat(product.discount) || 0;
      return sum + (price * quantity * (1 - discount/100));
    }, 0);
  };

  // Transaction amount auto-computes as selling price (subtotal) + VAT + shipping.
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const vat = parseFloat(formData.vat?.transactionAmount) || 0;
    const shipping = formData.fulfillmentType === "delivery" ? (parseFloat(formData.shipment?.shippingCost) || 0) : 0;
    return subtotal + vat + shipping;
  };

  const removeProduct = (index) => {
    const newTable = productTable.filter((_, i) => i !== index);
    setProductTable(newTable);
  };

  const handlePrintReceipt = () => {
    const receipt = `
CASH SALES RECEIPT
${new Date().toLocaleString()}

CUSTOMER INFO
Customer: ${formData.customerInfo.customerName}
Account: ${formData.customerInfo.accountNumber}
Phone: ${formData.customerInfo.phoneNumber}
Address: ${formData.customerInfo.address}

FULFILLMENT: ${formData.fulfillmentType === "delivery" ? "Delivery" : "Pickup"}

PRODUCTS
${productTable.map((p, idx) => `${idx + 1}. ${p.productName} - Qty: ${p.quantity} x ₦${parseFloat(p.unitPrice).toLocaleString()} = ₦${(parseFloat(p.unitPrice) * p.quantity).toLocaleString()}`).join('\n')}

SUMMARY
Subtotal: ₦${calculateSubtotal().toLocaleString()}
VAT: ₦${(parseFloat(formData.vat?.transactionAmount) || 0).toLocaleString()}
Shipping: ₦${(formData.fulfillmentType === "delivery" ? (parseFloat(formData.shipment?.shippingCost) || 0) : 0).toLocaleString()}
Total: ₦${calculateTotal().toLocaleString()}

Reference: ${paidReference || formData.transactionInfo.transactionId}
    `;

    const watermarkText = isPaid ? "PAID" : "UNPAID";
    const watermarkColor = isPaid ? "rgba(11, 143, 58, 0.28)" : "rgba(214, 44, 44, 0.28)";

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cash Sale Receipt</title>
          <style>
            body { margin: 0; }
            .csh-receipt-wrapper { position: relative; padding: 24px; overflow: hidden; }
            .csh-receipt-watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-35deg);
              font-size: 96px;
              font-weight: bold;
              letter-spacing: 8px;
              color: ${watermarkColor};
              z-index: 9999;
              pointer-events: none;
              white-space: nowrap;
            }
            pre { position: relative; z-index: 1; margin: 0; }
          </style>
        </head>
        <body>
          <div class="csh-receipt-wrapper">
            <div class="csh-receipt-watermark">${watermarkText}</div>
            <pre>${receipt}</pre>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="csh-modal-wrapper">
      <div className="csh-container">
        {/* Header */}
        <div className="csh-header">
          <div className="csh-header-left">
            <img src={pmLogo} alt="PM Logo" className="csh-logo" />
          </div>
          <h1 className="csh-title">CASH SALES</h1>
          <div className="csh-header-right">
            <IoGridOutline className="csh-grid-icon" />
            <FaTimes className="csh-close-icon" onClick={closeModal} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "0 0 0.75rem" }}>
          <BranchBadge />
        </div>

        {error && (
          <div className="csh-alert csh-alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && isPaid && (
          <div className="csh-alert csh-alert-success">
            <span>Payment confirmed. The order has been created — print the receipt or close this window.</span>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          {/* PRODUCT INFO */}
          <div className="csh-section">
            <div className="csh-section-header">
              <h5>PRODUCT INFO</h5>
            </div>
            <div className="csh-section-body">
              <div className="csh-grid-3">
                <div className="csh-field" ref={productSearchRef} style={{ position: "relative" }}>
                  <label>SEARCH PRODUCT</label>
                  <div style={{ position: "relative" }}>
                    <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "14px", pointerEvents: "none" }} />
                    <input
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => {
                        setProductSearchTerm(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="csh-input"
                      placeholder="Name, ID, or category..."
                      style={{ paddingLeft: "32px" }}
                    />
                    <FaChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "12px", pointerEvents: "none" }} />
                  </div>
                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: "200px",
                      overflowY: "auto",
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      zIndex: 1000,
                      marginTop: "4px"
                    }}>
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => selectProduct(product)}
                          style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                          onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                          onMouseLeave={(e) => e.target.style.background = "white"}
                        >
                          <div style={{ fontWeight: 500 }}>{product.productName || product.name}</div>
                          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                            Code: {product.productCode || product.id} • ₦{product.sellingPrice || product.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="csh-field">
                  <label>PRODUCT ID</label>
                  <input
                    type="text"
                    value={formData.productInfo.productCode || formData.productInfo.productId}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>

                <div className="csh-field">
                  <label>REFERENCE NO</label>
                  <input
                    type="text"
                    value={formData.productInfo.referenceNo}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5", color: "#0867db", fontWeight: 500 }}
                  />
                </div>
              </div>

              <div className="csh-grid-3">
                <div className="csh-field">
                  <label>CATEGORY</label>
                  <input
                    type="text"
                    value={formData.productInfo.category}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>

                <div className="csh-field">
                  <label>SUB-CATEGORY</label>
                  <input
                    type="text"
                    value={formData.productInfo.subCategory}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>

                <div className="csh-field">
                  <label>DESCRIPTION</label>
                  <textarea
                    value={formData.productInfo.description}
                    className="csh-textarea"
                    rows="2"
                    readOnly
                    style={{ background: "#f5f5f5", resize: "none" }}
                  />
                </div>
              </div>

              <div className="csh-grid-3">
                <div className="csh-field">
                  <label>PRICE (₦)</label>
                  <input
                    type="number"
                    value={formData.productInfo.price}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5", fontWeight: "bold", color: "#2e7d32" }}
                  />
                </div>

                <div className="csh-field">
                  <label>QUANTITY</label>
                  <input
                    type="number"
                    value={formData.productInfo.quantity}
                    onChange={(e) => handleChange(e, "productInfo", "quantity")}
                    className="csh-input"
                    min="1"
                    defaultValue="1"
                  />
                </div>

                <div className="csh-field">
                  <label>DISCOUNT (%)</label>
                  <input
                    type="number"
                    value={formData.productInfo.discount}
                    onChange={(e) => handleChange(e, "productInfo", "discount")}
                    className="csh-input"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMER INFO */}
          <div className="csh-section">
            <div className="csh-section-header">
              <h5>CUSTOMER INFO</h5>
            </div>
            <div className="csh-section-body">
              <div className="csh-customer-mode-toggle">
                <label className={`csh-customer-mode-option ${customerMode === "search" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="customerMode"
                    value="search"
                    checked={customerMode === "search"}
                    onChange={() => handleCustomerModeChange("search")}
                  />
                  <span>Search Existing</span>
                </label>
                <label className={`csh-customer-mode-option ${customerMode === "walkin" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="customerMode"
                    value="walkin"
                    checked={customerMode === "walkin"}
                    onChange={() => handleCustomerModeChange("walkin")}
                  />
                  <span>Walk-in / Anonymous</span>
                </label>
              </div>

              <div className="csh-grid-2">
                {customerMode === "search" ? (
                  <div className="csh-field" ref={customerSearchRef} style={{ position: "relative" }}>
                    <label>SEARCH CUSTOMER</label>
                    <div style={{ position: "relative" }}>
                      <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "14px", pointerEvents: "none" }} />
                      <input
                        type="text"
                        value={customerSearchTerm}
                        onChange={(e) => {
                          setCustomerSearchTerm(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="csh-input"
                        placeholder="Name, account, email, or phone..."
                        style={{ paddingLeft: "32px" }}
                      />
                      <FaChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "12px", pointerEvents: "none" }} />
                    </div>
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        maxHeight: "200px",
                        overflowY: "auto",
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "4px"
                      }}>
                        {filteredCustomers.map((customer) => {
                          const name = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || customer.customerName || "Unknown";
                          return (
                            <div
                              key={customer.id || customer.accountNumber}
                              onClick={() => selectCustomer(customer)}
                              style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                              onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                              onMouseLeave={(e) => e.target.style.background = "white"}
                            >
                              <div style={{ fontWeight: 500 }}>{name}</div>
                              <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                                Acct: {customer.accountNumber || "N/A"} • {customer.phoneNumber || "No phone"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="csh-field">
                    <label>CUSTOMER NAME</label>
                    <input
                      type="text"
                      value={formData.customerInfo.customerName}
                      onChange={(e) => handleChange(e, "customerInfo", "customerName")}
                      className="csh-input"
                      placeholder="Walk-in customer's name"
                    />
                  </div>
                )}

                <div className="csh-field">
                  <label>ACCOUNT NUMBER</label>
                  <input
                    type="text"
                    value={formData.customerInfo.accountNumber}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>
              </div>

              <div className="csh-grid-2">
                <div className="csh-field">
                  <label>ADDRESS</label>
                  <input
                    type="text"
                    value={formData.customerInfo.address}
                    onChange={(e) => handleChange(e, "customerInfo", "address")}
                    className="csh-input"
                    readOnly={customerMode === "search"}
                    style={customerMode === "search" ? { background: "#f5f5f5" } : undefined}
                  />
                </div>

                <div className="csh-field">
                  <label>PHONE NUMBER</label>
                  <input
                    type="text"
                    value={formData.customerInfo.phoneNumber}
                    onChange={(e) => handleChange(e, "customerInfo", "phoneNumber")}
                    className="csh-input"
                    readOnly={customerMode === "search"}
                    style={customerMode === "search" ? { background: "#f5f5f5" } : undefined}
                  />
                </div>
              </div>

              <div className="csh-grid-2">
                <div className="csh-field">
                  <label>EMAIL</label>
                  <input
                    type="email"
                    value={formData.customerInfo.email}
                    onChange={(e) => handleChange(e, "customerInfo", "email")}
                    className="csh-input"
                    readOnly={customerMode === "search"}
                    style={customerMode === "search" ? { background: "#f5f5f5" } : undefined}
                  />
                </div>

                <div className="csh-field">
                  <label>GENDER</label>
                  {customerMode === "search" ? (
                    <input
                      type="text"
                      value={formData.customerInfo.gender}
                      className="csh-input"
                      readOnly
                      style={{ background: "#f5f5f5" }}
                    />
                  ) : (
                    <select
                      value={formData.customerInfo.gender}
                      onChange={(e) => handleChange(e, "customerInfo", "gender")}
                      className="csh-select"
                    >
                      <option value="">SELECT</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FULFILLMENT */}
          <div className="csh-section">
            <div className="csh-section-header">
              <h5>FULFILLMENT</h5>
            </div>
            <div className="csh-section-body">
              <div className="csh-fulfillment-toggle">
                <label className={`csh-fulfillment-option ${formData.fulfillmentType === "pickup" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="cashFulfillmentType"
                    value="pickup"
                    checked={formData.fulfillmentType === "pickup"}
                    onChange={() => handleFulfillmentTypeChange("pickup")}
                  />
                  <span>Pickup</span>
                </label>
                <label className={`csh-fulfillment-option ${formData.fulfillmentType === "delivery" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="cashFulfillmentType"
                    value="delivery"
                    checked={formData.fulfillmentType === "delivery"}
                    onChange={() => handleFulfillmentTypeChange("delivery")}
                  />
                  <span>Delivery</span>
                </label>
              </div>
            </div>
          </div>

          {/* SHIPMENT - only relevant when the customer chose delivery */}
          {formData.fulfillmentType === "delivery" && (
            <div className="csh-section">
              <div className="csh-section-header">
                <h5>SHIPMENT</h5>
              </div>
              <div className="csh-section-body">
                <div className="csh-grid-3">
                  <div className="csh-field">
                    <label>SHIPPING METHOD</label>
                    <input type="text" value={formData.shipment.shippingMethod} onChange={(e) => handleChange(e, "shipment", "shippingMethod")} className="csh-input" />
                  </div>
                  <div className="csh-field">
                    <label>SHIPPING STATUS</label>
                    <select value={formData.shipment.shippingStatus} onChange={(e) => handleChange(e, "shipment", "shippingStatus")} className="csh-select">
                      <option value="">SELECT</option>
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                  <div className="csh-field">
                    <label>TRACKING NUMBER</label>
                    <input type="text" value={formData.shipment.trackingNumber} onChange={(e) => handleChange(e, "shipment", "trackingNumber")} className="csh-input" />
                  </div>
                </div>
                <div className="csh-grid-3">
                  <div className="csh-field">
                    <label>VEHICLE PLATE</label>
                    <input type="text" value={formData.shipment.vehiclePlateNumber} onChange={(e) => handleChange(e, "shipment", "vehiclePlateNumber")} className="csh-input" />
                  </div>
                  <div className="csh-field">
                    <label>SHIPPING ADDRESS</label>
                    <input type="text" value={formData.shipment.shippingAddress} onChange={(e) => handleChange(e, "shipment", "shippingAddress")} className="csh-input" />
                  </div>
                  <div className="csh-field">
                    <label>SHIPPING COST</label>
                    <input type="number" value={formData.shipment.shippingCost} onChange={(e) => handleChange(e, "shipment", "shippingCost")} className="csh-input" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTION INFO */}
          <div className="csh-section">
            <div className="csh-section-header">
              <h5>TRANSACTION INFO</h5>
            </div>
            <div className="csh-section-body">
              <div className="csh-grid-3">
                <div className="csh-field">
                  <label>TRANSACTION ID</label>
                  <input type="text" value={formData.transactionInfo.transactionId} onChange={(e) => handleChange(e, "transactionInfo", "transactionId")} className="csh-input" />
                </div>
                <div className="csh-field">
                  <label>TRANSACTION DATE</label>
                  <input type="date" value={formData.transactionInfo.transactionDate} onChange={(e) => handleChange(e, "transactionInfo", "transactionDate")} className="csh-input" />
                </div>
                <div className="csh-field">
                  <label>TOTAL AMOUNT (selling price + VAT + shipping)</label>
                  <input type="number" value={calculateTotal().toFixed(2)} className="csh-input" readOnly style={{ fontWeight: "bold", color: "#2e7d32", background: "#f5f5f5" }} />
                </div>
              </div>
            </div>
          </div>

          {/* VAT */}
          <div className="csh-section">
            <div className="csh-section-header">
              <h5>VAT</h5>
            </div>
            <div className="csh-section-body">
              <div className="csh-grid-3">
                <div className="csh-field">
                  <label>TRANSACTION ID</label>
                  <input type="text" value={formData.vat.transactionId} onChange={(e) => handleChange(e, "vat", "transactionId")} className="csh-input" />
                </div>
                <div className="csh-field">
                  <label>TRANSACTION DATE</label>
                  <input type="date" value={formData.vat.transactionDate} onChange={(e) => handleChange(e, "vat", "transactionDate")} className="csh-input" />
                </div>
                <div className="csh-field">
                  <label>TRANSACTION AMOUNT</label>
                  <input type="number" value={formData.vat.transactionAmount} onChange={(e) => handleChange(e, "vat", "transactionAmount")} className="csh-input" />
                </div>
              </div>
            </div>
          </div>

          {/* INSERT RECORD BUTTON */}
          <div className="csh-button-container">
            <button type="button" onClick={handleInsertRecord} className="text-white csh-btn bg-primary" disabled={!formData.productInfo.productName}>
              INSERT RECORD
            </button>
          </div>

          {/* PRODUCT TABLE */}
          <div className="csh-section">
            <div className="csh-table-container" style={{ overflowX: 'auto' }}>
              <table className="csh-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '20%' }}>PRODUCT</th>
                    <th style={{ width: '12%' }}>ID</th>
                    <th style={{ width: '20%' }}>DESCRIPTION</th>
                    <th style={{ width: '12%' }}>CATEGORY</th>
                    <th style={{ width: '8%' }}>PRICE</th>
                    <th style={{ width: '8%' }}>QTY</th>
                    <th style={{ width: '8%' }}>DISC</th>
                    <th style={{ width: '7%' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {productTable.length === 0 ? (
                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No products added</td></tr>
                  ) : (
                    productTable.map((product, idx) => (
                      <tr key={product.id}>
                        <td>{idx + 1}</td>
                        <td>{product.productName}</td>
                        <td>{product.productId}</td>
                        <td>{product.description || "-"}</td>
                        <td>{product.category || "-"}</td>
                        <td>₦{parseFloat(product.unitPrice).toLocaleString()}</td>
                        <td>{product.quantity}</td>
                        <td>{product.discount > 0 ? `${product.discount}%` : "-"}</td>
                        <td><button onClick={() => removeProduct(idx)} style={{ background: '#ff4444', color: 'white', border: 'none', borderRadius: '3px', padding: '4px 8px', cursor: 'pointer' }}>✕</button></td>
                      </tr>
                    ))
                  )}
                  {productTable.length > 0 && (
                    <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                      <td colSpan="6" style={{ textAlign: 'right' }}>TOTAL:</td>
                      <td colSpan="2">₦{calculateTotal().toLocaleString()}</td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYMENT & PRINT BUTTONS */}
          <div className="csh-button-container" style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleMakePayment}
              className="csh-btn"
              style={{ background: isPaid ? "#6c757d" : "#0b8f3a", color: "white", flex: 1 }}
              disabled={paystackLoading || isPaid || productTable.length === 0 || !formData.customerInfo.customerName || !formData.customerInfo.accountNumber}
            >
              {paystackLoading ? "PROCESSING..." : isPaid ? "PAYMENT COMPLETED" : "MAKE PAYMENT"}
            </button>
            <button type="button" onClick={handlePrintReceipt} className="csh-btn" style={{ background: "#0867db", color: "white", flex: 1 }} disabled={productTable.length === 0 || !formData.customerInfo.customerName}>
              🖨 PRINT RECEIPT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashSales;
