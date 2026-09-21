import React, { useState } from "react";
import { apiRequest } from "../../../lib/config";

const RecoveryNotificationDetail = ({ notification, onClose }) => {
  const [formData, setFormData] = useState({
    customerName: notification?.customerName || "",
    productId: notification?.productId || "",
    productCategory: notification?.productCategory || "",
    productImage: notification?.productImage || null,
    officerId: notification?.officerId || "",
    officerName: notification?.officerName || "",
    salesRef: notification?.salesRef || "",
  });
  
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isRecovered = notification?.status === "Recovered";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInsert = () => {
    if (!formData.customerName || !formData.productId || !formData.officerId) {
      setError("Please fill all required fields");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const newEntry = {
      id: Date.now(),
      sn: tableData.length + 1,
      customerName: formData.customerName,
      salesRef: formData.salesRef,
      productName: notification?.productName || "ITEL PHONE",
      productCategory: formData.productCategory,
      quantity: "2",
      officerId: formData.officerId,
      officerName: formData.officerName,
      totalBoxed: "4"
    };

    setTableData(prev => [...prev, newEntry]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleSave = async () => {
    if (tableData.length === 0) {
      setError("No data to save. Please insert items first.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("RecoveryNotificationDetail: Saving recovery box data...");

      const response = await apiRequest("/admin/recovery-box/bulk", "POST", {
        notificationId: notification.id,
        items: tableData
      });

      console.log("RecoveryNotificationDetail: ✅ Data saved successfully");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("RecoveryNotificationDetail: ❌ Error saving data:", err);
      setError(err.message || "Failed to save data.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = (id) => {
    setTableData(prev => prev.filter(item => item.id !== id));
  };

  // If status is "Recovered", show VIEW DETAILS only
  if (isRecovered) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          width: '95%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px'
          }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#0066cc', borderRadius: '8px' }}></div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#0066cc',
              margin: 0,
              letterSpacing: '1px'
            }}>
              VIEW DETAILS
            </h1>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#0066cc',
                fontSize: '28px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ←
            </button>
          </div>

          {/* Order ID */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0066cc', margin: 0 }}>
              {notification?.orderId || "SAL10000/1/24"}
            </h2>
          </div>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '40px'
          }}>
            {/* Left Column */}
            <div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Product ID:
                </label>
                <input
                  type="text"
                  value={notification?.productId || ""}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: '15px',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Product Name:
                </label>
                <input
                  type="text"
                  value={notification?.productName || ""}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: '15px',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Product Description
                </label>
                <textarea
                  value={notification?.productDescription || ""}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: '15px',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    outline: 'none',
                    resize: 'none',
                    minHeight: '60px',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Customer Address
                </label>
                <textarea
                  value={notification?.customerAddress || ""}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: '15px',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    outline: 'none',
                    resize: 'none',
                    minHeight: '80px',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Middle Column */}
            <div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Rider's ID:
                </label>
                <input
                  type="text"
                  value={notification?.riderId || ""}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: '15px',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Rider's name
                </label>
                <input
                  type="text"
                  value={notification?.riderName || ""}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: '15px',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Rider's phone No
                </label>
                <input
                  type="text"
                  value={notification?.riderPhone || ""}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: '15px',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Delivery Date:
                </label>
                <input
                  type="text"
                  value={notification?.deliveryDate || ""}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: '15px',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Right Column - Images */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
                  Rider's Image
                </label>
                <div style={{
                  height: '180px',
                  border: '2px dashed #ccc',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f8f9fa',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#999', fontSize: '14px' }}>Image Placeholder</span>
                </div>
                <button style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#0066cc',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}>
                  View Bigger
                </button>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
                  Product Image
                </label>
                <div style={{
                  height: '180px',
                  border: '2px dashed #ccc',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f8f9fa',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#999', fontSize: '14px' }}>Image Placeholder</span>
                </div>
                <button style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#0066cc',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}>
                  View Bigger
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If status is "To be Recovered", show RECOVERY BOX form
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#e9f3ff',
        borderRadius: '12px',
        width: '95%',
        maxWidth: '1400px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '30px 40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <div style={{ width: '70px', height: '70px', backgroundColor: '#0066cc', borderRadius: '8px' }}></div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#0066cc',
            margin: 0,
            letterSpacing: '1px'
          }}>
            RECOVERY BOX
          </h1>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#0066cc',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ⟲
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '12px 20px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#efe',
            color: '#3c3',
            padding: '12px 20px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            Item added successfully!
          </div>
        )}

        {/* Form Card */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          border: '3px solid #0066cc',
          padding: '30px 40px'
        }}>
          {/* Form Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '25px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                CUSTOMERS NAME
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Aginlinti Ayorinde"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                PRODUCT CATEGORY
              </label>
              <input
                type="text"
                name="productCategory"
                value={formData.productCategory}
                onChange={handleInputChange}
                placeholder="Gadget"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                PRODUCT ID
              </label>
              <input
                type="text"
                name="productId"
                value={formData.productId}
                onChange={handleInputChange}
                placeholder="78439854"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                OFFICER'S ID
              </label>
              <input
                type="text"
                name="officerId"
                value={formData.officerId}
                onChange={handleInputChange}
                placeholder="78439854"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                PRODUCT IMAGE
              </label>
              <div style={{
                width: '120px',
                height: '120px',
                border: '2px dashed #ccc',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <span style={{ color: '#999', fontSize: '12px' }}>Image</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                OFFICER'S NAME
              </label>
              <input
                type="text"
                name="officerName"
                value={formData.officerName}
                onChange={handleInputChange}
                placeholder="Aginlinti Ayorinde"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Insert Button */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <button
              onClick={handleInsert}
              style={{
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 50px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0052a3'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}
            >
              INSERT
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#0066cc', color: 'white' }}>
                  <th style={{ padding: '14px', textAlign: 'left', fontSize: '13px', borderTopLeftRadius: '8px' }}>S/N</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontSize: '13px' }}>CUSTOMER'S NAME</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontSize: '13px' }}>SALES REF</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontSize: '13px' }}>PRODUCT NAME</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontSize: '13px' }}>PRODUCT CATEGORY</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontSize: '13px' }}>QUANTITY</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontSize: '13px' }}>OFFICER'S ID</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontSize: '13px' }}>OFFICER'S NAME</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontSize: '13px', borderTopRightRadius: '8px' }}>TOTAL BOXED</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr style={{ backgroundColor: '#f6faff' }}>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                      No items added yet
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, index) => (
                    <tr key={row.id} style={{ backgroundColor: index % 2 === 0 ? '#f6faff' : '#fff' }}>
                      <td style={{ padding: '14px', fontSize: '14px' }}>{row.sn}</td>
                      <td style={{ padding: '14px', fontSize: '14px' }}>{row.customerName}</td>
                      <td style={{ padding: '14px', fontSize: '14px' }}>{row.salesRef}</td>
                      <td style={{ padding: '14px', fontSize: '14px' }}>{row.productName}</td>
                      <td style={{ padding: '14px', fontSize: '14px' }}>{row.productCategory}</td>
                      <td style={{ padding: '14px', fontSize: '14px' }}>{row.quantity}</td>
                      <td style={{ padding: '14px', fontSize: '14px' }}>{row.officerId}</td>
                      <td style={{ padding: '14px', fontSize: '14px' }}>{row.officerName}</td>
                      <td style={{ padding: '14px', fontSize: '14px' }}>{row.totalBoxed}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleSave}
              disabled={loading || tableData.length === 0}
              style={{
                backgroundColor: loading || tableData.length === 0 ? '#ccc' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 60px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading || tableData.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading && tableData.length > 0) {
                  e.currentTarget.style.backgroundColor = '#0052a3';
                }
              }}
              onMouseOut={(e) => {
                if (!loading && tableData.length > 0) {
                  e.currentTarget.style.backgroundColor = '#0066cc';
                }
              }}
            >
              {loading ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryNotificationDetail;