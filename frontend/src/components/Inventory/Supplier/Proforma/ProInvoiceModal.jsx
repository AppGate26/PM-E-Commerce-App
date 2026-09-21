import React from "react";
import logo from "../../../../assets/images/adminLogo.png";

const ProInvoiceModal = ({ isOpen, toggleProInvoice, invoiceData }) => {
  if (!isOpen || !invoiceData) return null;

  const subtotal = invoiceData.items?.reduce((acc, item) => acc + (item.rate * item.quantity), 0) || 0;
  const tax = invoiceData.tax || 0;
  const total = subtotal + tax;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>   
      <div 
        onClick={toggleProInvoice}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer'
        }} 
      ></div>
 
      {/* Modal Content */} 
      <div style={{
        position: 'relative', backgroundColor: 'white', width: '90%', maxWidth: '850px',
        padding: '40px', borderRadius: '8px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src={logo} alt="logo" style={{ width: '60px' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#666', letterSpacing: '2px' }}>PROFORMA</h3>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#0056b3' }}>INVOICE</h1>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px', color: '#444' }}>
            <p style={{ margin: 0 }}><strong>{invoiceData.companyName || "PEACE OF MIND PLC"}</strong></p>
            <p style={{ margin: 0 }}>{invoiceData.companyAddress || "214 AVENUE IKOYI, LAGOS"}</p>
            <p style={{ margin: 0 }}>{invoiceData.companyPhone || "+234-9031567689"}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div>
            <h6 style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>BILLED TO</h6>
            <p style={{ fontSize: '14px', margin: 0 }}><strong>{invoiceData.customerName}</strong></p>
            <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>{invoiceData.customerAddress}</p>
          </div>
          <div>
            <h6 style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>DATE ISSUED</h6>
            <p style={{ fontSize: '13px', margin: 0 }}>{invoiceData.invoiceDate}</p>
            <h6 style={{ fontSize: '11px', color: '#888', marginTop: '15px', marginBottom: '8px' }}>DATE DUE</h6>
            <p style={{ fontSize: '13px', margin: 0 }}>{invoiceData.dueDate}</p>
          </div>
          <div>
            <h6 style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>INVOICE NUMBER</h6>
            <p style={{ fontSize: '13px', margin: 0 }}>{invoiceData.invoiceNumber}</p>
          </div>
          <div>
            <h6 style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>AMOUNT DUE</h6>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', margin: 0 }}>
              ₦{total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>DESCRIPTION</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>RATE</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>QUANTITY</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items?.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{item.description}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>₦{item.rate.toLocaleString()}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                  ₦{(item.rate * item.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>Tax</span>
              <span>₦{tax.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #007bff', marginTop: '10px', fontWeight: 'bold', fontSize: '16px' }}>
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div style={{ marginTop: '40px', fontSize: '12px', color: '#777', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px' }}>TERMS AND CONDITIONS</p>
          <p style={{ textAlign: 'center', margin: 0 }}>
            {invoiceData.notes || "Thank you for your business. Please ensure payment is made by the due date mentioned above."}
          </p>
        </div>

        {/* Close Button for UX */}
        <button 
          onClick={toggleProInvoice}
          style={{
            position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none',
            fontSize: '24px', cursor: 'pointer', color: '#888'
          }}
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ProInvoiceModal;