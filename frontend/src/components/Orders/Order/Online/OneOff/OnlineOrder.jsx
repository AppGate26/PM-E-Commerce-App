import React, { useState, useEffect } from "react";
import "./OnlineOrder.css";
import Dashboard from "../../../../ui/DashboardBtn";
import { apiRequest } from "../../../../../lib/config";
import { fetchSellableProducts } from "../../../../../lib/inventoryApi";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import pmLogo from "../../../../../assets/images/PMlogo.png";

const OnlineOrder = ({ toggleOnOrsModal }) => {
  const closeModal = () => {
    toggleOnOrsModal();
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
      discount: "",
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
      customerBankAccount: "",
    },
    loanInfo: {
      loanType: "",
    },
    charges: {
      insurance: "",
      deliveryCharges: "",
      vat: "",
    },
  });

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [referenceNumbers, setReferenceNumbers] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    console.log("OnlineOrder component mounted");
    fetchReferenceNumbers();
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchReferenceNumbers = async () => {
    try {
      setLoadingRefs(true);
      let response;

      try {
        response = await apiRequest("/sales/orders?size=500", "GET");
      } catch (err) {
        response = await apiRequest("/api/sales/orders?size=500", "GET");
      }

      let ordersList = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        ordersList = response.response.content;
      } else if (Array.isArray(response)) {
        ordersList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (response?.content && Array.isArray(response.content)) {
        ordersList = response.content;
      }

      const refs = ordersList
        .filter((order) => order?.referenceNo)
        .map((order) => ({
          referenceNo: order.referenceNo,
          orderId: order.id,
          customerName: order.customerName || "",
          accountNumber: order.accountNumber || "",
          productName: order.productName || "",
          productId: order.productId || "",
          category: order.category || "",
          subCategory: order.subCategory || "",
          description: order.description || "",
          price: order.totalAmount || order.amount || order.price || 0,
        }));

      setReferenceNumbers(refs);
      console.log(`OnlineOrder: Loaded ${refs.length} reference numbers`);
    } catch (err) {
      console.error("OnlineOrder: Error fetching reference numbers:", err);
      setReferenceNumbers([]);
    } finally {
      setLoadingRefs(false);
    }
  };
  const fetchProducts = async () => {
    try {
      console.log("📦 OnlineOrder: Fetching in-stock products...");
      setFetching(true);
      // Orders sell from stock (on-hand quantity + stock price), not the product register.
      const productsList = await fetchSellableProducts();
      console.log(`✅ Processed ${productsList.length} in-stock products`);
      setProducts(productsList);
    } catch (err) {
      console.error("❌ OnlineOrder: Error fetching products:", err);
      console.error("Error details:", err.response || err);
      setProducts([]);
    } finally {
      setFetching(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      console.log("👥 OnlineOrder: Fetching customers from API...");
      console.log("🔗 Trying multiple customer endpoints...");
      setFetching(true);

      let response;

      // Try multiple endpoints
      try {
        console.log("🔄 Trying customer endpoint: /api/admin/customers");
        response = await apiRequest("/api/admin/customers", "GET");
        console.log("✅ Success from /api/admin/customers:", response);
      } catch (err) {
        console.log("❌ Failed for /api/admin/customers:", err.message);
        try {
          console.log("🔄 Trying customer endpoint: /admin/customers");
          response = await apiRequest("/admin/customers", "GET");
          console.log("✅ Success from /admin/customers:", response);
        } catch (fallbackErr) {
          console.log("❌ All customer endpoints failed");
          throw new Error("Could not fetch customers");
        }
      }

      let customersList = [];

      // Check multiple response formats
      if (response?.response && Array.isArray(response.response)) {
        customersList = response.response;
        console.log(
          `✅ Found ${customersList.length} customers in response.response`,
        );
      } else if (Array.isArray(response)) {
        customersList = response;
        console.log(
          `✅ Found ${customersList.length} customers in array response`,
        );
      } else if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
        console.log(
          `✅ Found ${response.data.length} customers in response.data`,
        );
      } else if (response?.content && Array.isArray(response.content)) {
        customersList = response.content;
        console.log(
          `✅ Found ${response.content.length} customers in response.content`,
        );
      } else {
        console.warn("⚠️ Unexpected response format for customers:", response);
      }

      if (customersList.length === 0) {
        console.log("📝 No customers found in API response");
      } else {
        console.log("📋 Sample customer data:", customersList[0]);
      }

      console.log(`✅ Processed ${customersList.length} customers`);
      setCustomers(customersList);
    } catch (err) {
      console.error("❌ OnlineOrder: Error fetching customers:", err);
      console.error(
        "Error details:",
        err.response?.data || err.response || err,
      );
      setCustomers([]);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e, section, field) => {
    const value = e.target.value;
    console.log(`📝 OnlineOrder: Changing ${section}.${field} to:`, value);

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    // When product is selected by NAME - auto-fill all product fields
    if (section === "productInfo" && field === "productName") {
      console.log("🔍 OnlineOrder: Looking for product with name:", value);
      const selectedProduct = products.find(
        (p) =>
          (p.productName &&
            p.productName.toLowerCase() === value.toLowerCase()) ||
          (p.name && p.name.toLowerCase() === value.toLowerCase()),
      );

      if (selectedProduct) {
        console.log("✅ OnlineOrder: Found product:", selectedProduct);
        setFormData((prev) => ({
          ...prev,
          productInfo: {
            ...prev.productInfo,
            productName:
              selectedProduct.productName || selectedProduct.name || "",
            productId:
              selectedProduct.id?.toString() || selectedProduct.productId || "",
            category:
              selectedProduct.category?.name || selectedProduct.category || "",
            subCategory:
              selectedProduct.subCategory?.name ||
              selectedProduct.subCategory ||
              selectedProduct.subcategory ||
              "",
            description:
              selectedProduct.productDescription ||
              selectedProduct.description ||
              "",
            price:
              selectedProduct.sellingPrice?.toString() ||
              selectedProduct.price?.toString() ||
              selectedProduct.unitPrice?.toString() ||
              "",
          },
        }));
      }
    }

    // When product is selected by ID
    if (section === "productInfo" && field === "productId") {
      console.log("🔍 OnlineOrder: Looking for product with ID:", value);
      const selectedProduct = products.find(
        (p) =>
          (p.id && p.id.toString() === value) ||
          (p.productId && p.productId.toString() === value),
      );

      if (selectedProduct) {
        console.log("✅ OnlineOrder: Found product:", selectedProduct);
        setFormData((prev) => ({
          ...prev,
          productInfo: {
            ...prev.productInfo,
            productId: value,
            productName:
              selectedProduct.productName || selectedProduct.name || "",
            category:
              selectedProduct.category?.name || selectedProduct.category || "",
            subCategory:
              selectedProduct.subCategory?.name ||
              selectedProduct.subCategory ||
              selectedProduct.subcategory ||
              "",
            description:
              selectedProduct.productDescription ||
              selectedProduct.description ||
              "",
            price:
              selectedProduct.sellingPrice?.toString() ||
              selectedProduct.price?.toString() ||
              selectedProduct.unitPrice?.toString() ||
              "",
          },
        }));
      }
    }

    // When customer is selected - auto-fill ALL customer fields
    if (section === "customerInfo" && field === "customerName") {
      console.log(
        "🔍 OnlineOrder: Looking for customer with selection:",
        value,
      );

      let accountNumber = "";
      let customerName = value;

      // Extract account number from parentheses like in OnOneSales
      if (value.includes("(") && value.includes(")")) {
        const match = value.match(/\(([^)]+)\)/);
        if (match) {
          accountNumber = match[1].trim();
          customerName = value.split("(")[0].trim();
          console.log(
            "🔍 OnlineOrder: Extracted account number:",
            accountNumber,
          );
          console.log("🔍 OnlineOrder: Customer name:", customerName);
        }
      }

      const selectedCustomer = customers.find((c) => {
        const fullName = `${c.firstName || ""} ${c.surname || ""}`.trim();
        return (
          (c.accountNumber && c.accountNumber === accountNumber) ||
          (fullName && fullName.toLowerCase() === customerName.toLowerCase()) ||
          (c.customerName &&
            c.customerName.toLowerCase() === customerName.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === customerName.toLowerCase())
        );
      });

      if (selectedCustomer) {
        console.log(
          "✅ OnlineOrder: Found customer with complete data:",
          selectedCustomer,
        );

        const customerData = {
          customerName:
            `${selectedCustomer.firstName || ""} ${selectedCustomer.surname || ""}`.trim() ||
            selectedCustomer.customerName ||
            selectedCustomer.name ||
            customerName,
          accountNumber:
            selectedCustomer.accountNumber || selectedCustomer.accountNo || "",
          email: selectedCustomer.email || "",
          phoneNumber:
            selectedCustomer.phoneNumber || selectedCustomer.phone || "",
          address:
            selectedCustomer.contactAddress ||
            selectedCustomer.officeAddress ||
            selectedCustomer.address ||
            "",
          dob: selectedCustomer.dob || selectedCustomer.dateOfBirth || "",
          gender: selectedCustomer.gender || "",
          occupation: selectedCustomer.occupation || "",
          customerBankAccount:
            selectedCustomer.customerBankAccount ||
            selectedCustomer.bankAccount ||
            "",
        };

        console.log(
          "📝 OnlineOrder: Auto-populating customer form with:",
          customerData,
        );

        setFormData((prev) => ({
          ...prev,
          customerInfo: customerData,
        }));
      }
    }
  };
  const handleReferenceSelect = async (e) => {
    const selectedRef = e.target.value;

    if (!selectedRef) {
      setFormData((prev) => ({
        ...prev,
        productInfo: {
          ...prev.productInfo,
          referenceNo: "",
          productName: "",
          productId: "",
          category: "",
          subCategory: "",
          description: "",
          price: "",
        },
        customerInfo: {
          ...prev.customerInfo,
          customerName: "",
          accountNumber: "",
          email: "",
          phoneNumber: "",
          address: "",
          dob: "",
          gender: "",
          occupation: "",
          customerBankAccount: "",
        },
      }));
      return;
    }

    const selected = referenceNumbers.find((ref) => ref.referenceNo === selectedRef);
    if (!selected) return;

    setLoading(true);
    try {
      let details = null;
      if (selected.orderId) {
        try {
          const orderResponse = await apiRequest(`/sales/orders/${selected.orderId}/details`, "GET");
          details = orderResponse?.data || orderResponse?.response || orderResponse;
        } catch (_err) {
          // fallback to list payload
        }
      }

      const accountNumber = selected.accountNumber || details?.accountNumber || details?.streamnumber || "";
      const linkedCustomer = customers.find(
        (c) =>
          (c.accountNumber && c.accountNumber === accountNumber) ||
          (c.accountNo && c.accountNo === accountNumber),
      );

      const customerName = linkedCustomer
        ? `${linkedCustomer.firstName || ""} ${linkedCustomer.surname || ""}`.trim()
        : selected.customerName || details?.customerName || "";

      setFormData((prev) => ({
        ...prev,
        productInfo: {
          ...prev.productInfo,
          referenceNo: selectedRef,
          productName: selected.productName || details?.productName || "",
          productId:
            (selected.productId && selected.productId.toString()) ||
            (details?.productId && details.productId.toString()) ||
            "",
          category: selected.category || details?.category || "",
          subCategory: selected.subCategory || details?.subCategory || "",
          description: selected.description || details?.description || "",
          price: (selected.price || details?.totalAmount || details?.price || "").toString(),
        },
        customerInfo: {
          ...prev.customerInfo,
          customerName,
          accountNumber: accountNumber || "",
          email: linkedCustomer?.email || details?.email || "",
          phoneNumber:
            linkedCustomer?.phoneNumber || linkedCustomer?.phone || details?.phoneNumber || "",
          address:
            linkedCustomer?.contactAddress ||
            linkedCustomer?.officeAddress ||
            linkedCustomer?.address ||
            details?.address ||
            "",
          dob: linkedCustomer?.dob || linkedCustomer?.dateOfBirth || details?.dob || "",
          gender: linkedCustomer?.gender || details?.gender || "",
          occupation: linkedCustomer?.occupation || details?.occupation || "",
          customerBankAccount:
            linkedCustomer?.customerBankAccount ||
            linkedCustomer?.bankAccount ||
            details?.customerBankAccount ||
            "",
        },
      }));
    } catch (err) {
      console.error("OnlineOrder: failed to auto-fill by reference", err);
      setError("Failed to load data from selected reference number.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!formData.productInfo.referenceNo) {
      setError("Please select a Reference No to auto-fill customer and product details.");
      setLoading(false);
      return;
    }

    try {
      console.log(
        "═══════════════════════════════════════════════════════════",
      );
      console.log("🚀 OnlineOrder: SUBMITTING ONE-OFF ORDER");
      console.log(
        "═══════════════════════════════════════════════════════════",
      );

      // Map to API structure from your screenshot
      const requestBody = {
        production: {
          production: formData.productInfo.productName || "",
          resources: formData.productInfo.productId || "",
          extremember: formData.productInfo.referenceNo || "",
          customer: formData.productInfo.category || "",
          subcategory: formData.productInfo.subCategory || "",
          description: formData.productInfo.description || "",
          print: parseFloat(formData.productInfo.price) || 0,
          calibrator: 0,
          emissions: 0,
          discount: parseFloat(formData.productInfo.discount) || 0,
          common: "",
        },
        customers: {
          customershow: formData.customerInfo.customerName || "",
          streamnumber: formData.customerInfo.accountNumber || "",
          email: formData.customerInfo.email || "",
          photographer: formData.customerInfo.phoneNumber || "",
          adversary: formData.customerInfo.address || "",
          cab: formData.customerInfo.dob || "",
          gender: formData.customerInfo.gender || "",
          occupation: formData.customerInfo.occupation || "",
          customersandaccount: formData.customerInfo.customerBankAccount || "",
        },
        bounders: {
          bounders: formData.loanInfo.loanType || "",
          downloads: "",
        },
      };

      console.log(
        "📦 OnlineOrder: Request body prepared for /api/sales/orders/one-off:",
      );
      console.log(JSON.stringify(requestBody, null, 2));

      console.log("📤 OnlineOrder: Calling POST /api/sales/orders/one-off");
      console.log("🔗 Endpoint: /api/sales/orders/one-off");
      console.log("📝 Method: POST");
      console.log("📄 Request Body:", requestBody);

      const response = await apiRequest(
        "/sales/orders/one-off",
        "POST",
        requestBody,
      );

      console.log("✅ OnlineOrder: API Response received:");
      console.log("📊 Response status:", response?.status);
      console.log("📊 Response data:", response?.data || response?.response);
      console.log("📊 Full response:", response);

      // Check for success
      const isSuccessful =
        response?.status === 200 ||
        response?.status === 201 ||
        response?.status === "success" ||
        response?.data?.status === "success" ||
        response?.response?.status === "successful";

      if (isSuccessful) {
        console.log("🎉 OnlineOrder: SUCCESS - One-off order submitted!");
        console.log(
          "═══════════════════════════════════════════════════════════",
        );
        setSuccess(true);

        // Reset form
        setFormData({
          productInfo: {
            productName: "",
            productId: "",
            referenceNo: "",
            category: "",
            subCategory: "",
            description: "",
            price: "",
            discount: "",
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
            customerBankAccount: "",
          },
          loanInfo: {
            loanType: "",
          },
          charges: {
            insurance: "",
            deliveryCharges: "",
            vat: "",
          },
        });

        console.log("🔄 OnlineOrder: Form reset to initial state");

        setTimeout(() => setSuccess(false), 5000);
      } else {
        console.warn(
          "⚠️ OnlineOrder: Response indicates possible issue:",
          response,
        );
        throw new Error("API response indicates an issue with the request");
      }
    } catch (err) {
      console.error(
        "═══════════════════════════════════════════════════════════",
      );
      console.error("❌ OnlineOrder: ERROR SUBMITTING ONE-OFF ORDER");
      console.error(
        "═══════════════════════════════════════════════════════════",
      );
      console.error("Error object:", err);
      console.error("Error message:", err.message);
      console.error("Error response:", err.response);
      console.error("Error response data:", err.response?.data);

      let errorMessage = "Failed to submit one-off order. ";

      if (err.response?.data?.message) {
        errorMessage += `Server says: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage += err.message;
      } else if (err.response?.statusText) {
        errorMessage += `Status: ${err.response.statusText}`;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else {
        errorMessage += "Please check your network connection and try again.";
      }

      setError(errorMessage);
      setTimeout(() => setError(""), 8000);
    } finally {
      setLoading(false);
      console.log("🏁 OnlineOrder: Submit process completed");
    }
  };

  return (
    <div className='online-order-wrapper'>
      <div className='online-order-container'>
        <div className='online-order-header'>
          <div className='online-order-header-left'>
            <img src={pmLogo} alt='PM Logo' className='online-order-logo' />
          </div>
          <h1 className='online-order-title'>ONE OFF ORDER</h1>
          <div className='online-order-header-right'>
            <Dashboard />
            <IoGridOutline className='online-order-grid-icon' />
            <button
              type='button'
              className='online-order-close-btn'
              onClick={closeModal}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {fetching && (
          <div className='alert alert-info' role='alert'>
            Loading data...
          </div>
        )}
        {loadingRefs && (
          <div className='alert alert-info' role='alert'>
            Loading reference numbers...
          </div>
        )}

        {error && (
          <div className='alert alert-danger' role='alert'>
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className='alert alert-success' role='alert'>
            <strong>Success!</strong> One-off order submitted successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECTION 1: PRODUCT INFO */}
          <div className='online-order-section'>
            <div className='online-order-section-heading'>
              <h5 style={{ textAlign: "center" }}>PRODUCT INFO</h5>
            </div>
            <div className='online-order-section-body'>
              <div className='online-order-grid'>
                <div>
                  <label>REFERENCE NO</label>
                  <br />
                  <select
                    name='referenceNo'
                    className='form-select'
                    value={formData.productInfo.referenceNo}
                    onChange={handleReferenceSelect}
                    disabled={fetching || loadingRefs}
                  >
                    <option value=''>
                      {loadingRefs
                        ? "LOADING REFERENCE..."
                        : referenceNumbers.length === 0
                          ? "NO REFERENCES"
                          : "SELECT REFERENCE"}
                    </option>
                    {referenceNumbers.map((ref) => (
                      <option
                        key={`${ref.referenceNo}-${ref.orderId || ""}`}
                        value={ref.referenceNo}
                      >
                        {ref.referenceNo} {ref.customerName ? `- ${ref.customerName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>PRODUCT NAME</label>
                  <br />
                  <input
                    type='text'
                    className='form-input'
                    value={formData.productInfo.productName}
                    disabled
                    placeholder='Auto-filled from reference'
                  />
                </div>

                <div>
                  <label>PRODUCT ID</label>
                  <br />
                  <input
                    type='text'
                    className='form-input'
                    value={formData.productInfo.productId}
                    disabled
                    placeholder='Auto-filled from reference'
                  />
                </div>

                <div>
                  <label>CATEGORY</label>
                  <br />
                  <input
                    type='text'
                    className='form-input'
                    name='category'
                    value={formData.productInfo.category}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>

                <div>
                  <label>SUB-CATEGORY</label>
                  <br />
                  <input
                    type='text'
                    name='subCategory'
                    className='form-input'
                    value={formData.productInfo.subCategory}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>

                <div>
                  <label>DESCRIPTION</label>
                  <br />
                  <textarea
                    name='description'
                    className='form-textarea'
                    cols='30'
                    rows='4'
                    value={formData.productInfo.description}
                    disabled
                    placeholder='Auto-filled'
                  ></textarea>
                </div>

                <div>
                  <label>PRICE</label>
                  <br />
                  <input
                    type='number'
                    className='form-input'
                    name='price'
                    value={formData.productInfo.price}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>

                <div>
                  <label>DISCOUNT</label>
                  <br />
                  <input
                    type='number'
                    name='discount'
                    className='form-input'
                    value={formData.productInfo.discount}
                    onChange={(e) => handleChange(e, "productInfo", "discount")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CUSTOMER INFO */}
          <div className='online-order-section'>
            <div className='online-order-section-heading'>
              <h5 style={{ textAlign: "center" }}>CUSTOMER INFO</h5>
            </div>
            <div className='online-order-section-body'>
              <div className='online-order-grid'>
                <div>
                  <label>CUSTOMER NAME</label>
                  <br />
                  <input
                    type='text'
                    className='form-input'
                    value={formData.customerInfo.customerName}
                    disabled
                    placeholder='Auto-filled from reference'
                  />
                </div>

                <div>
                  <label>ACCOUNT NUMBER</label>
                  <br />
                  <input
                    type='text'
                    name='accountNo'
                    className='form-input'
                    value={formData.customerInfo.accountNumber}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>

                <div>
                  <label>EMAIL</label>
                  <br />
                  <input
                    type='email'
                    name='email'
                    className='form-input'
                    value={formData.customerInfo.email}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>

                <div>
                  <label>GENDER</label>
                  <br />
                  <input
                    type='text'
                    name='gender'
                    className='form-input'
                    value={formData.customerInfo.gender}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>

                <div>
                  <label>DOB</label>
                  <br />
                  <input
                    type='text'
                    name='dob'
                    className='form-input'
                    value={formData.customerInfo.dob}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>

                <div>
                  <label>ADDRESS</label>
                  <br />
                  <textarea
                    name='address'
                    className='form-textarea'
                    cols='30'
                    rows='4'
                    value={formData.customerInfo.address}
                    disabled
                    placeholder='Auto-filled'
                  ></textarea>
                </div>

                <div>
                  <label>OCCUPATION</label>
                  <br />
                  <input
                    type='text'
                    className='form-input'
                    name='occupation'
                    value={formData.customerInfo.occupation}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>

                <div>
                  <label>PHONE NUMBER</label>
                  <br />
                  <input
                    type='text'
                    className='form-input'
                    name='phoneNumber'
                    value={formData.customerInfo.phoneNumber}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>

                <div>
                  <label>CUSTOMER BANK ACCOUNT</label>
                  <br />
                  <input
                    type='text'
                    className='form-input'
                    name='customerBankAccount'
                    value={formData.customerInfo.customerBankAccount}
                    disabled
                    placeholder='Auto-filled'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: CHARGES */}
          <div className='online-order-section'>
            <div className='online-order-section-heading'>
              <h5 style={{ textAlign: "center" }}>CHARGES</h5>
            </div>
            <div className='online-order-section-body'>
              <div className='online-order-grid'>
                <div>
                  <label>INSURANCE</label>
                  <br />
                  <input
                    type='text'
                    name='insurance'
                    className='form-input'
                    value={formData.charges.insurance}
                    onChange={(e) => handleChange(e, "charges", "insurance")}
                  />
                </div>

                <div>
                  <label>DELIVERY CHARGES</label>
                  <br />
                  <input
                    type='text'
                    name='deliveryCharges'
                    className='form-input'
                    value={formData.charges.deliveryCharges}
                    onChange={(e) =>
                      handleChange(e, "charges", "deliveryCharges")
                    }
                  />
                </div>

                <div>
                  <label>VAT</label>
                  <br />
                  <input
                    type='text'
                    name='vat'
                    className='form-input'
                    value={formData.charges.vat}
                    onChange={(e) => handleChange(e, "charges", "vat")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className='online-order-submit-wrap'>
            <input
              type='submit'
              value={loading ? "SUBMITTING..." : "SAVE"}
              className='online-order-save-btn'
              disabled={loading || fetching}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnlineOrder;




