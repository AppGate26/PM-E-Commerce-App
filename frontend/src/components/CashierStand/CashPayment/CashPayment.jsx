import React, { useState, useEffect } from "react";
import BranchBadge from "../../shared/BranchBadge";
import "../../../Styles/CashierStand/CashPayment/CashPayment.css";
import { Link } from "react-router-dom";
import { cashierApi } from "../../../lib/cashierApi";
import CashierBackButton from "../CashierBackButton";

const CashPayment = ({ toggleCPayModal, selectedReferenceNumber = "" }) => {
  const closeModal = () => {
    toggleCPayModal();
  };

  const [formData, setFormData] = useState({
    referenceNumber: "",
    tillBox: "",
    address: "",
    phoneNumber: "",
    customerName: "",
    paymentMethod: "",
    enteredBy: "",
    totalBalance: "",
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      productName: "",
      description: "",
      category: "",
      unitPrice: "",
      quantity: "",
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [referenceOptions, setReferenceOptions] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [tillBalances, setTillBalances] = useState({});
  const [accountNumber, setAccountNumber] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);

  const tillKey = (formData.tillBox || "MAIN").trim().toUpperCase();
  const currentTillBalance = Number(tillBalances[tillKey]) || 0;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubmenu = (index) => {
    setIsSubmenuOpen(isSubmenuOpen === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentId(null);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Search a customer by account number and auto-fill their details from the DB.
  const handleSearchByAccount = async () => {
    const value = accountNumber.trim();
    if (!value) {
      setError("Enter an account number to search");
      setTimeout(() => setError(""), 3000);
      return;
    }
    try {
      setSearchingCustomer(true);
      setError("");
      const info = await cashierApi.searchCustomerByAccount(value);
      if (!info || info.found === false) {
        setCustomerInfo(null);
        setError("No customer found for this account number");
        setTimeout(() => setError(""), 4000);
        return;
      }
      setCustomerInfo(info);
      setFormData((prev) => ({
        ...prev,
        customerName: info.accountName || prev.customerName,
        phoneNumber: info.phoneNumber || prev.phoneNumber,
        address: info.address || prev.address,
      }));
    } catch (err) {
      setCustomerInfo(null);
      setError(err?.message || "Unable to search customer by account number");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const applyReferenceNumber = (selectedReference, options = referenceOptions) => {
    setPaymentId(null);
    const selectedOrder = options.find(
      (option) => option.referenceNumber === selectedReference,
    );

    setFormData((prev) => ({
      ...prev,
      referenceNumber: selectedReference,
      customerName: selectedOrder?.customerName || prev.customerName || "",
      address: selectedOrder?.address || prev.address || "",
      phoneNumber: selectedOrder?.phoneNumber || prev.phoneNumber || "",
    }));

    if (selectedOrder?.productName || selectedOrder?.productId || selectedOrder?.productCategory) {
      setProducts([
        {
          id: selectedOrder.productId || Date.now(),
          productName: selectedOrder.productName || "",
          description: selectedOrder.productId ? `Product ID: ${selectedOrder.productId}` : "",
          category: selectedOrder.productCategory || "",
          unitPrice: selectedOrder.unitPrice || "",
          quantity: selectedOrder.quantity || "",
        },
      ]);
    }
  };

  const handleReferenceNumberChange = (e) => {
    applyReferenceNumber(e.target.value);
  };

  const handleProductChange = (id, field, value) => {
    setPaymentId(null);
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, [field]: value } : product,
      ),
    );
  };

  const addProduct = () => {
    setPaymentId(null);
    setProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        productName: "",
        description: "",
        category: "",
        unitPrice: "",
        quantity: "",
      },
    ]);
  };

  const removeProduct = (id) => {
    setPaymentId(null);
    if (products.length > 1) {
      setProducts((prev) => prev.filter((product) => product.id !== id));
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentId(null);
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
    setIsOpen(false);
  };

  useEffect(() => {
    const total = products.reduce((sum, product) => {
      const price = parseFloat(product.unitPrice) || 0;
      const qty = parseFloat(product.quantity) || 0;
      return sum + price * qty;
    }, 0);

    setFormData((prev) => ({
      ...prev,
      totalBalance: total.toFixed(2),
    }));
  }, [products]);

  useEffect(() => {
    const fetchSalesReferences = async () => {
      try {
        setLoadingReferences(true);
        const references = await cashierApi.getSalesOrderReferences();
        const referenceList = Array.isArray(references) ? references : [];
        setReferenceOptions(referenceList);
        if (selectedReferenceNumber) {
          applyReferenceNumber(selectedReferenceNumber, referenceList);
        }
      } catch (err) {
        console.error("CashPayment: Failed to load sales references", err);
      } finally {
        setLoadingReferences(false);
      }
    };

    fetchSalesReferences();
  }, [selectedReferenceNumber]);

  useEffect(() => {
    if (selectedReferenceNumber && referenceOptions.length) {
      applyReferenceNumber(selectedReferenceNumber, referenceOptions);
    }
  }, [selectedReferenceNumber, referenceOptions]);

  // Load the cashier's running till balances from the backend (per cashier name).
  const cashierName = formData.enteredBy.trim();
  useEffect(() => {
    if (!cashierName) {
      setTillBalances({});
      return;
    }
    let active = true;
    cashierApi
      .getTillBalances(cashierName)
      .then((balances) => {
        if (active) setTillBalances(balances || {});
      })
      .catch(() => {
        if (active) setTillBalances({});
      });
    return () => {
      active = false;
    };
  }, [cashierName]);

  const handleGenerateInvoice = async (e) => {
    e?.preventDefault?.();

    if (!paymentId) {
      setError("Please save the payment first before generating invoice");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setGeneratingInvoice(true);
    setError("");

    try {
      const response = await cashierApi.generateCashPaymentInvoice(paymentId);
      const invoiceUrl =
        response?.invoiceUrl ||
        response?.url ||
        response?.data?.invoiceUrl ||
        response?.data?.url ||
        response?.response?.invoiceUrl ||
        response?.response?.url;

      if (invoiceUrl) {
        window.open(invoiceUrl, "_blank");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to generate invoice. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (
        !formData.referenceNumber ||
        !formData.customerName ||
        !formData.paymentMethod ||
        !formData.enteredBy ||
        products.length === 0
      ) {
        setError(
          "Please fill in all required fields and add at least one product",
        );
        setLoading(false);
        return;
      }

      const validProducts = products.filter(
        (p) => p.productName && p.unitPrice && p.quantity,
      );

      if (validProducts.length === 0) {
        setError(
          "Please fill in product details (name, unit price, and quantity)",
        );
        setLoading(false);
        return;
      }

      const normalizedPaymentMethod = formData.paymentMethod.trim().toUpperCase();
      if (!["CASH", "BANK"].includes(normalizedPaymentMethod)) {
        setError("Payment method must be CASH or BANK");
        setLoading(false);
        return;
      }

      const paymentAmount = parseFloat(formData.totalBalance) || 0;

      const requestBody = {
        referenceNumber: formData.referenceNumber.trim(),
        tillBox: formData.tillBox.trim() || "",
        till_box: formData.tillBox.trim() || "",
        address: formData.address.trim() || "",
        phoneNumber: formData.phoneNumber.trim() || "",
        customerName: formData.customerName.trim(),
        products: validProducts.map((product) => ({
          productName: product.productName.trim(),
          description: product.description.trim() || "",
          category: product.category.trim() || "",
          unitPrice: parseFloat(product.unitPrice),
          quantity: parseInt(product.quantity),
        })),
        paymentMethod: normalizedPaymentMethod,
        enteredBy: formData.enteredBy.trim(),
        totalBalance: paymentAmount,
      };

      const response = await cashierApi.submitCashPayment(requestBody);

      let extractedPaymentId = null;
      if (response?.id) {
        extractedPaymentId = response.id;
      } else if (response?.data?.id) {
        extractedPaymentId = response.data.id;
      } else if (response?.paymentId) {
        extractedPaymentId = response.paymentId;
      } else if (response?.data?.paymentId) {
        extractedPaymentId = response.data.paymentId;
      } else if (response?.response?.id) {
        extractedPaymentId = response.response.id;
      } else if (response?.response?.paymentId) {
        extractedPaymentId = response.response.paymentId;
      } else if (response?.data?.response?.id) {
        extractedPaymentId = response.data.response.id;
      } else if (response?.data?.response?.paymentId) {
        extractedPaymentId = response.data.response.paymentId;
      }

      if (extractedPaymentId) {
        setPaymentId(extractedPaymentId);
      } else {
        setError("Payment saved but payment ID not returned. Please try save again.");
        setTimeout(() => setError(""), 5000);
      }

      if (normalizedPaymentMethod === "CASH" && paymentAmount > 0) {
        // The backend updates the till balance when the cash payment is saved;
        // re-read the authoritative running total instead of computing it here.
        try {
          const balances = await cashierApi.getTillBalances(formData.enteredBy.trim());
          setTillBalances(balances || {});
        } catch {
          // non-fatal: balance display will refresh on next load
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to process cash payment. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='cPay-shell'>
      <div className='CPay-container'>
        <header className='cPay-header'>
          <div className='cPay-topbar'>
            <CashierBackButton onClick={closeModal} />
            <Link to='/adminDashboard' className='cPay-dashboard-link'>
              Dashboard
            </Link>
            <button
              type='button'
              className='adjust-cancel-btn cash-payment-cancel'
              onClick={closeModal}
            >
              X
            </button>
          </div>

          <div className='cPay-title-wrap'>
            <h1 className='cash-payment-h1'>Cash Payment</h1>
            <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
              <BranchBadge />
            </div>
            <p className='cPay-subtitle'>Record and process customer payments</p>
            <div className='cPay-total-chip'>
              ₦
              {formData.totalBalance
                ? parseFloat(formData.totalBalance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0,000.00"}
            </div>
            <div className='cPay-till-chip'>
              Till: ₦
              {currentTillBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </header>

        {error && (
          <div className='alert alert-danger' role='alert'>
            {error}
          </div>
        )}

        {success && (
          <div className='alert alert-success' role='alert'>
            {paymentId
              ? "Cash payment saved. You can now generate payment invoice."
              : "Cash payment processed successfully!"}
          </div>
        )}

        <section className='cPay-section'>
          <div className='cPay-grid'>
            <form onSubmit={(e) => e.preventDefault()}>
              <label className='fw-bold'>reference number</label>
              <select
                name='referenceNumber'
                value={formData.referenceNumber}
                onChange={handleReferenceNumberChange}
                className='cPay-input'
                required
              >
                <option value=''>
                  {loadingReferences
                    ? "Loading reference numbers..."
                    : "Select reference number"}
                </option>
                {referenceOptions.map((option) => (
                  <option key={option.referenceNumber} value={option.referenceNumber}>
                    {option.referenceNumber}
                  </option>
                ))}
              </select>
            </form>

            <form onSubmit={(e) => { e.preventDefault(); handleSearchByAccount(); }}>
              <label className='fw-bold'>account number</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type='text'
                  name='accountNumber'
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className='cPay-input'
                  placeholder='Enter account number to fetch customer'
                />
                <button
                  type='submit'
                  className='cPay-product'
                  disabled={searchingCustomer}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {searchingCustomer ? "Searching..." : "Search"}
                </button>
              </div>
            </form>

            {customerInfo ? (
              <div className='cPay-customer-info' style={{ margin: "8px 0", padding: "10px", border: "1px solid #d0d7de", borderRadius: "8px", background: "#f6f8fa" }}>
                <div><strong>Customer:</strong> {customerInfo.accountName || "—"}</div>
                <div><strong>Phone:</strong> {customerInfo.phoneNumber || "—"}</div>
                <div><strong>Email:</strong> {customerInfo.email || "—"}</div>
                <div><strong>BVN:</strong> {customerInfo.bvn || "—"}</div>
                <div><strong>Wallet Balance:</strong> {Number(customerInfo.walletBalance || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</div>
              </div>
            ) : null}

            <form onSubmit={(e) => e.preventDefault()}>
              <label className='fw-bold'>address</label>
              <input
                type='text'
                name='address'
                value={formData.address}
                onChange={handleInputChange}
                className='cPay-input'
              />
            </form>

            <form onSubmit={(e) => e.preventDefault()}>
              <label className='fw-bold'>phone number</label>
              <input
                type='text'
                name='phoneNumber'
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className='cPay-input'
              />
            </form>

            <form onSubmit={(e) => e.preventDefault()}>
              <label className='fw-bold'>customer name</label>
              <input
                type='text'
                name='customerName'
                value={formData.customerName}
                onChange={handleInputChange}
                className='cPay-input'
                required
              />
            </form>
          </div>
        </section>

        <section className='cPay-section'>
          <div className='cPay-table-head'>
            <h3 className='cPay-section-title'>Products</h3>
            <button type='button' onClick={addProduct} className='cPay-product'>
              + Add Product
            </button>
          </div>

          <div className='cPay-table'>
            <table>
              <thead>
                <tr>
                  <th>s/n</th>
                  <th>product name</th>
                  <th>description</th>
                  <th>category</th>
                  <th>unit price</th>
                  <th>quantity</th>
                  <th>action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type='text'
                        value={product.productName}
                        onChange={(e) =>
                          handleProductChange(product.id, "productName", e.target.value)
                        }
                        className='cPay-table-input'
                      />
                    </td>
                    <td>
                      <input
                        type='text'
                        value={product.description}
                        onChange={(e) =>
                          handleProductChange(product.id, "description", e.target.value)
                        }
                        className='cPay-table-input'
                      />
                    </td>
                    <td>
                      <input
                        type='text'
                        value={product.category}
                        onChange={(e) =>
                          handleProductChange(product.id, "category", e.target.value)
                        }
                        className='cPay-table-input'
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        value={product.unitPrice}
                        onChange={(e) =>
                          handleProductChange(product.id, "unitPrice", e.target.value)
                        }
                        className='cPay-table-input'
                        step='0.01'
                        min='0'
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        value={product.quantity}
                        onChange={(e) =>
                          handleProductChange(product.id, "quantity", e.target.value)
                        }
                        className='cPay-table-input'
                        min='1'
                      />
                    </td>
                    <td>
                      {products.length > 1 && (
                        <button
                          type='button'
                          onClick={() => removeProduct(product.id)}
                          className='cPay-remove-btn'
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className='cPay-section'>
          <h3 className='cPay-section-title'>Settlement</h3>
          <div className='cPay-grid cPay-grid-compact'>
            <form onSubmit={(e) => e.preventDefault()}>
              <label className='fw-bold'>till box</label>
              <input
                type='text'
                name='tillBox'
                value={formData.tillBox}
                onChange={handleInputChange}
                className='cPay-input'
                placeholder='Enter till box'
              />
            </form>

            <div>
              <label className='fw-bold'>payment method</label>
              <div className='custom-dropdown'>
                <button
                  type='button'
                  className={`custom-dropdown-button ${isOpen ? "open" : ""}`}
                  onClick={toggleDropdown}
                >
                  <span className='d-flex justify-content-between fw-bold w-100'>
                    {formData.paymentMethod || "Select"} <span>&#9660;</span>
                  </span>
                  <i className='custom-icon fa-solid fa-caret-down' />
                </button>

                <ul className={`custom-menu ${isOpen ? "open" : ""}`}>
                  <li className='custom-menu-item'>
                    <a
                      href='#'
                      className='method-list-cash'
                      onClick={(e) => {
                        e.preventDefault();
                        handlePaymentMethodSelect("CASH");
                      }}
                    >
                      Cash
                    </a>
                  </li>
                  <li className='custom-menu-item'>
                    <a
                      href='#'
                      className='custom-submenu-toggle'
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSubmenu(1);
                      }}
                    >
                      <span className='method-list-cash'>Banks</span>
                      <i className='custom-icon fa-solid fa-caret-right' />
                    </a>
                    <ul
                      className={`custom-submenu ${
                        isSubmenuOpen === 1 ? "open" : ""
                      }`}
                    >
                      {["Gt bank", "First bank", "Zenith", "Access"].map((bank) => (
                        <li className='custom-submenu-item' key={bank}>
                          <a
                            href='#'
                            className='method-list-cash'
                            onClick={(e) => {
                              e.preventDefault();
                              handlePaymentMethodSelect("BANK");
                            }}
                          >
                            {bank}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              <label className='fw-bold'>entered by</label>
              <input
                type='text'
                name='enteredBy'
                value={formData.enteredBy}
                onChange={handleInputChange}
                className='cPay-input'
                required
              />
            </form>

            <form onSubmit={(e) => e.preventDefault()}>
              <label className='fw-bold'>total balance</label>
              <input
                type='number'
                name='totalBalance'
                value={formData.totalBalance}
                onChange={handleInputChange}
                className='cPay-input'
                readOnly
                step='0.01'
              />
            </form>
          </div>
        </section>

        <div className='cPay-submit'>
          <button
            type='button'
            className='cPay-save'
            onClick={handleSubmit}
            disabled={loading || generatingInvoice}
          >
            {loading ? "SAVING..." : "SAVE PAYMENT"}
          </button>
          <button
            type='button'
            className='cPay-gen'
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice || loading}
            title={
              paymentId
                ? "Generate payment invoice"
                : "Save payment first, then generate invoice"
            }
          >
            {generatingInvoice ? "GENERATING..." : "GENERATE PAYMENT INVOICE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashPayment;
