import React from "react";
import "./Agreement.css";
import PMlogo from "../../../../assets/images/PMlogo.png";
import { exportSupplierPaymentPdf } from "../../../../lib/supplierPaymentTemplate";

const Agreement = ({ isOpen, toggleAgreementGeneration, agreementData }) => {
  if (!isOpen) return null;

  return (
    <div className="agreement-overlay">
      <div className="agreement-card">
        {/* Header with Logo and Title */}
        <div className="agreement-header">
          <img src={PMlogo} alt="Logo" className="agreement-logo" />
          <h2 className="agreement-title">GENERATED AGREEMENT</h2>
        </div>

        {/* Agreement Details Grid */}
        <div className="agreement-content">
          {/* Invoice Number */}
          <div className="agreement-item">
            <span className="agreement-label">INVOICE NUMBER</span>
            <span className="agreement-value">{agreementData?.invoiceNumber || "-"}</span>
          </div>

          {/* Supplier ID */}
          <div className="agreement-item">
            <span className="agreement-label">SUPPLIER ID</span>
            <span className="agreement-value">{agreementData?.supplierId || "-"}</span>
          </div>

          {/* Period of Payment */}
          <div className="agreement-item">
            <span className="agreement-label">PERIOD OF PAYMENT</span>
            <span className="agreement-value">{agreementData?.periodOfPayment || "-"}</span>
          </div>

          {/* Invoice Amount */}
          <div className="agreement-item">
            <span className="agreement-label">INVOICE AMOUNT</span>
            <span className="agreement-value">{agreementData?.invoiceAmount ? `₦${agreementData.invoiceAmount}` : "-"}</span>
          </div>

          {/* Rules for Payment */}
          <div className="agreement-item">
            <span className="agreement-label">RULES FOR PAYMENT</span>
            <span className="agreement-value">{agreementData?.rulesForPayment || "-"}</span>
          </div>

          {/* Advance Payment Plans Details */}
          <div className="agreement-item">
            <span className="agreement-label">ADVANCE PAYMENT PLANS DETAILS</span>
            <span className="agreement-value">{agreementData?.advancePaymentPlansDetails || "-"}</span>
          </div>

          {/* Percentage Made */}
          <div className="agreement-item">
            <span className="agreement-label">PERCENTAGE MADE</span>
            <span className="agreement-value">{agreementData?.percentageMade ? `${agreementData.percentageMade}%` : "-"}</span>
          </div>

          {/* Tenure of Delivery Goods */}
          <div className="agreement-item">
            <span className="agreement-label">TENURE OF DELIVERY GOODS</span>
            <span className="agreement-value">{agreementData?.tenureOfDeliveryGoods || "-"}</span>
          </div>

          {/* Process Incase of Non-Delivery */}
          <div className="agreement-item">
            <span className="agreement-label">PROCESS INCASE OF NON-DELIVERY</span>
            <span className="agreement-value">{agreementData?.processIncaseOfNonDelivery || "-"}</span>
          </div>

          {/* Accepted Payment Method */}
          <div className="agreement-item">
            <span className="agreement-label">ACCEPTED PAYMENT METHOD</span>
            <span className="agreement-value">{agreementData?.acceptedPaymentMethods || "-"}</span>
          </div>

          {/* Payment Date */}
          <div className="agreement-item">
            <span className="agreement-label">PAYMENT DATE</span>
            <span className="agreement-value">{agreementData?.paymentDate || "-"}</span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="agreement-footer">
          <button className="agreement-close-button" onClick={toggleAgreementGeneration}>
            CLOSE
          </button>
          <button
            className="agreement-close-button"
            style={{ marginLeft: "1rem", backgroundColor: "#0867db", color: "#fff", border: "none" }}
            onClick={() => exportSupplierPaymentPdf(agreementData || {})}
          >
            DOWNLOAD PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Agreement;
