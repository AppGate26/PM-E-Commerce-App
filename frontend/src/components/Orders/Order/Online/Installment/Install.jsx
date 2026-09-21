import React, { useEffect, useState } from "react";
import Dashboard from "../../../../ui/DashboardBtn";
import { apiRequest } from "../../../../../lib/config";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import pmLogo from "../../../../../assets/images/PMlogo.png";
import "./Install.css";

const Install = ({ toggleInstallModal }) => {
  const closeModal = () => {
    toggleInstallModal();
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
      quantity: "",
      discount: "",
      coupon: "",
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
      assetType: "",
      productAmount: "",
      principalRepayment: "",
      duration: "",
      rate: "",
      repaymentMethod: "",
      startDate: "",
      expirationDate: "",
    },
    charges: {
      insurance: "",
      deliveryCharges: "",
      vat: "",
    },
  });

  const [customers, setCustomers] = useState([]);
  const [referenceNumbers, setReferenceNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchReferenceNumbers();
    fetchCustomers();
  }, []);

  const fetchReferenceNumbers = async () => {
    try {
      setLoadingRefs(true);
      let response;
      try {
        response = await apiRequest("/sales/orders?size=500", "GET");
      } catch (_err) {
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
          quantity: order.quantity || "",
          discount: order.discount || "",
          price: order.totalAmount || order.amount || order.price || 0,
          order,
        }));

      setReferenceNumbers(refs);
    } catch (err) {
      console.error("Failed to fetch reference numbers", err);
      setReferenceNumbers([]);
    } finally {
      setLoadingRefs(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setFetching(true);
      let response;
      try {
        response = await apiRequest("/api/admin/customers", "GET");
      } catch (_err) {
        response = await apiRequest("/admin/customers", "GET");
      }

      let list = [];
      if (response?.response && Array.isArray(response.response)) {
        list = response.response;
      } else if (Array.isArray(response)) {
        list = response;
      } else if (response?.data && Array.isArray(response.data)) {
        list = response.data;
      }

      setCustomers(list);
    } catch (err) {
      console.error("Failed to fetch customers", err);
      setCustomers([]);
    } finally {
      setFetching(false);
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
          unitPrice: "",
          quantity: "",
          discount: "",
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

      const accountNumber =
        selected.accountNumber || details?.accountNumber || details?.streamnumber || "";

      const linkedCustomer = customers.find(
        (c) =>
          (c.accountNumber && c.accountNumber === accountNumber) ||
          (c.accountNo && c.accountNo === accountNumber),
      );

      const customerName = linkedCustomer
        ? `${linkedCustomer.firstName || ""} ${linkedCustomer.surname || ""}`.trim()
        : selected.customerName || details?.customerName || "";

      const resolvedPrice = selected.price || details?.totalAmount || details?.price || "";

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
          price: resolvedPrice.toString(),
          unitPrice: resolvedPrice.toString(),
          quantity: (details?.quantity || selected.quantity || "").toString(),
          discount: (details?.discount || selected.discount || "").toString(),
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
      console.error("Failed to auto-fill installment order by reference", err);
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
      const requestBody = {
        productName: formData.productInfo.productName || "",
        productId: formData.productInfo.productId || "",
        referenceNo: formData.productInfo.referenceNo || "",
        category: formData.productInfo.category || "",
        subCategory: formData.productInfo.subCategory || "",
        description: formData.productInfo.description || "",
        price: parseFloat(formData.productInfo.price) || 0,
        unitPrice: parseFloat(formData.productInfo.unitPrice) || 0,
        quantity: parseInt(formData.productInfo.quantity, 10) || 1,
        discount: parseFloat(formData.productInfo.discount) || 0,
        coupon: formData.productInfo.coupon || "",

        customerName: formData.customerInfo.customerName || "",
        accountNumber: formData.customerInfo.accountNumber || "",
        email: formData.customerInfo.email || "",
        phoneNumber: formData.customerInfo.phoneNumber || "",
        address: formData.customerInfo.address || "",
        dob: formData.customerInfo.dob || "",
        gender: formData.customerInfo.gender || "",
        occupation: formData.customerInfo.occupation || "",
        customerBankAccount: formData.customerInfo.customerBankAccount || "",

        loanType: formData.loanInfo.assetType || "",
      };

      const response = await apiRequest("/sales/orders/installment", "POST", requestBody);

      const isSuccessful =
        response?.status === 200 ||
        response?.status === 201 ||
        response?.status === "success" ||
        response?.data?.status === "success" ||
        response?.response?.status === "successful" ||
        response?.message === "successful";

      if (!isSuccessful) {
        throw new Error("API response indicates an issue with the request");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      let errorMessage = "Failed to submit installment order.";
      if (err.response?.data?.message) errorMessage = err.response.data.message;
      else if (err.response?.data?.error) errorMessage = err.response.data.error;
      else if (err.message) errorMessage = err.message;
      setError(errorMessage);
      setTimeout(() => setError(""), 6000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='install-order-wrapper'>
      <div className='install-order-container'>
        <div className='install-order-header'>
          <div className='install-order-header-left'>
            <img src={pmLogo} alt='PM Logo' className='install-order-logo' />
          </div>
          <h1 className='install-order-title'>INSTALLMENT ORDER</h1>
          <div className='install-order-header-right'>
            <Dashboard />
            <IoGridOutline className='install-order-grid-icon' />
            <button type='button' className='install-order-close-btn' onClick={closeModal}>
              <FaTimes />
            </button>
          </div>
        </div>

        {error && <div className='alert alert-danger' role='alert'>{error}</div>}
        {success && <div className='alert alert-success' role='alert'>Installment order submitted successfully!</div>}
        {fetching && <div className='alert alert-info' role='alert'>Loading products and customers...</div>}
        {loadingRefs && <div className='alert alert-info' role='alert'>Loading reference numbers...</div>}

        <form onSubmit={handleSubmit}>
          <div className='install-section'>
            <div className='install-section-heading'>
              <h5 className='install-section-title'>PRODUCT INFO</h5>
            </div>
            <div className='product-box'>
              <div className='product-box_grid'>
                <div>
                  <label>reference number</label>
                  <br />
                  <select className='py-1 product-box-select' value={formData.productInfo.referenceNo} onChange={handleReferenceSelect} disabled={fetching || loadingRefs}>
                    <option value=''>{loadingRefs ? 'Loading references...' : referenceNumbers.length === 0 ? 'No references' : 'Select reference'}</option>
                    {referenceNumbers.map((ref) => (
                      <option key={`${ref.referenceNo}-${ref.orderId || ''}`} value={ref.referenceNo}>
                        {ref.referenceNo}{ref.productName ? ` - ${ref.productName}` : ''}{ref.customerName ? ` / ${ref.customerName}` : ''}
                      </option>
                    ))}
                  </select>
                  <label>category</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.productInfo.category} disabled />
                  <label>quantity</label>
                  <br />
                  <input type='number' className='product-box-inputs' value={formData.productInfo.quantity} disabled />
                </div>

                <div>
                  <label>product name</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.productInfo.productName} disabled placeholder='Auto-filled from reference' />
                  <label>sub-category</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.productInfo.subCategory} disabled />
                  <label>discount</label>
                  <br />
                  <input type='number' className='product-box-inputs' value={formData.productInfo.discount} disabled />
                </div>

                <div>
                  <label>product id</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.productInfo.productId} disabled placeholder='Auto-filled from reference' />
                  <label>description</label>
                  <br />
                  <textarea className='product-msg-box' cols='30' rows='10' value={formData.productInfo.description} disabled />
                  <label>price</label>
                  <br />
                  <input type='number' className='product-box-inputs' value={formData.productInfo.price} disabled />
                </div>
              </div>
            </div>
          </div>

          <div className='install-section'>
            <div className='install-section-heading'>
              <h5 className='install-section-title'>CUSTOMER INFO</h5>
            </div>
            <div className='product-box'>
              <div className='product-box_grid'>
                <div>
                  <label>customer name</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.customerInfo.customerName} disabled />
                  <label>address</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.customerInfo.address} disabled />
                  <label>DOB</label>
                  <br />
                  <input type='date' className='product-box-inputs' value={formData.customerInfo.dob} disabled />
                </div>
                <div>
                  <label>account number</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.customerInfo.accountNumber} disabled />
                  <label>email</label>
                  <br />
                  <input type='email' className='product-box-inputs' value={formData.customerInfo.email} disabled />
                  <label>gender</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.customerInfo.gender} disabled />
                </div>
                <div>
                  <label>customer bank account</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.customerInfo.customerBankAccount} disabled />
                  <label>phone number</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.customerInfo.phoneNumber} disabled />
                  <label>occupation</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.customerInfo.occupation} disabled />
                </div>
              </div>
            </div>
          </div>

          <div className='install-section'>
            <div className='install-section-heading'>
              <h5 className='install-section-title'>LOAN</h5>
            </div>
            <div className='product-box'>
              <div className='product-box_grid'>
                <div>
                  <label>ASSET TYPE</label>
                  <br />
                  <select className='py-1 product-box-select' value={formData.loanInfo.assetType} onChange={(e) => handleChange(e, 'loanInfo', 'assetType')}>
                    <option value=''>CHOOSE ASSET TYPE</option>
                    <option value='ELECTRONICS'>ELECTRONICS</option>
                    <option value='FURNITURE'>FURNITURE</option>
                    <option value='APPLIANCES'>APPLIANCES</option>
                    <option value='OTHER'>OTHER</option>
                  </select>
                  <label>DURATION</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.loanInfo.duration} onChange={(e) => handleChange(e, 'loanInfo', 'duration')} placeholder='e.g., 12 months' />
                  <label>START DATE</label>
                  <br />
                  <input type='date' className='product-box-inputs' value={formData.loanInfo.startDate} onChange={(e) => handleChange(e, 'loanInfo', 'startDate')} />
                </div>
                <div>
                  <label>PRODUCT AMOUNT</label>
                  <br />
                  <input type='number' className='product-box-inputs' value={formData.loanInfo.productAmount} onChange={(e) => handleChange(e, 'loanInfo', 'productAmount')} />
                  <label>RATE</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.loanInfo.rate} onChange={(e) => handleChange(e, 'loanInfo', 'rate')} placeholder='e.g., 5%' />
                  <label>EXPIRATION DATE</label>
                  <br />
                  <input type='date' className='product-box-inputs' value={formData.loanInfo.expirationDate} onChange={(e) => handleChange(e, 'loanInfo', 'expirationDate')} />
                </div>
                <div>
                  <label>PRINCIPAL REPAYMENT</label>
                  <br />
                  <input type='number' className='product-box-inputs' value={formData.loanInfo.principalRepayment} onChange={(e) => handleChange(e, 'loanInfo', 'principalRepayment')} />
                  <label>REPAYMENT METHOD</label>
                  <br />
                  <input type='text' className='product-box-inputs' value={formData.loanInfo.repaymentMethod} onChange={(e) => handleChange(e, 'loanInfo', 'repaymentMethod')} placeholder='e.g., Monthly' />
                </div>
              </div>
            </div>
          </div>

          <div className='install-section'>
            <div className='install-section-heading'>
              <h5 className='install-section-title'>CHARGES</h5>
            </div>
            <div className='product-box'>
              <div className='product-box_grid'>
                <div>
                  <label>INSURANCE</label>
                  <br />
                  <input type='number' className='product-box-inputs' value={formData.charges.insurance} onChange={(e) => handleChange(e, 'charges', 'insurance')} placeholder='0.00' />
                </div>
                <div>
                  <label>DELIVERY CHARGES</label>
                  <br />
                  <input type='number' className='product-box-inputs' value={formData.charges.deliveryCharges} onChange={(e) => handleChange(e, 'charges', 'deliveryCharges')} placeholder='0.00' />
                </div>
                <div>
                  <label>VAT</label>
                  <br />
                  <input type='number' className='product-box-inputs' value={formData.charges.vat} onChange={(e) => handleChange(e, 'charges', 'vat')} placeholder='0.00' />
                </div>
              </div>
            </div>
          </div>

          <div className='install-submit-wrap'>
            <input type='submit' value={loading ? 'SUBMITTING...' : 'SAVE'} disabled={loading || fetching || !formData.productInfo.referenceNo} className='install-save-btn' />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Install;
