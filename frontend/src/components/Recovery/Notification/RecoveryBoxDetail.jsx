import React from "react";
import { Link } from "react-router-dom";
import "../../../Styles/Delivery/Delivery.css";

const RecoveryBoxDetail = ({ notification, detailData, onClose }) => {
  // Mock data for recovery box detail matching Figma
  const recoveryBoxData = {
    customerName: "PM/ID/234",
    salesRef: "SF/3456",
    productName: "ITEL PHONE",
    productCategory: "GADGET",
    quantity: "2",
    officerId: "PM//456",
    officerName: "BENSON SHALOM",
    totalBoxed: "4",
  };

  return (
    <div className="modal-overlay-custom" onClick={onClose} style={{ zIndex: 1070 }}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "95%", maxHeight: "95vh", overflowY: "auto", zIndex: 1071 }}>
        <div className="Csh-container pt-1">
          <div className="sticky-top header-form">
            <button
              className="btn btn-primary fw-bold"
              style={{ position: "absolute", left: "1em", top: "1em" }}
            >
              <Link to="/adminDashboard" className="text-white">
                Dashboard
              </Link>
            </button>
            <h1 className="text-center mt-2" style={{ fontFamily: "Montserrat, sans-serif" }}>RECOVERY BOX</h1>
            <span className="adjust-cancel-btn" onClick={onClose}>
              X
            </span>
          </div>

          <div className="product-box">
            <div className="text-center mb-4">
              <button
                className="btn btn-primary"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: "600",
                  fontSize: "1.4rem",
                  padding: "1rem 3rem",
                  textTransform: "uppercase",
                }}
              >
                INSERT
              </button>
            </div>

            <div className="rider-box my-3">
              <div
                className="table-scroll-bar rider-box-transit"
                style={{ height: "300px", overflowX: "auto", overflowY: "auto" }}
              >
                <table className="mt-0 manage-riders-table" style={{ width: "100%", minWidth: "1200px" }}>
                  <thead>
                    <tr>
                      <th style={{ fontFamily: "Montserrat, sans-serif" }}>S/N</th>
                      <th style={{ fontFamily: "Montserrat, sans-serif" }}>CUSTOMER'S NAME</th>
                      <th style={{ fontFamily: "Montserrat, sans-serif" }}>SALES REF</th>
                      <th style={{ fontFamily: "Montserrat, sans-serif" }}>PRODUCT NAME</th>
                      <th style={{ fontFamily: "Montserrat, sans-serif" }}>PRODUCT CATEGORY</th>
                      <th style={{ fontFamily: "Montserrat, sans-serif" }}>QUANTITY</th>
                      <th style={{ fontFamily: "Montserrat, sans-serif" }}>OFFICER'S ID</th>
                      <th style={{ fontFamily: "Montserrat, sans-serif" }}>OFFICER'S NAME</th>
                      <th style={{ fontFamily: "Montserrat, sans-serif" }}>TOTAL BOXED</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontFamily: "Montserrat, sans-serif" }}>1.</td>
                      <td style={{ fontFamily: "Montserrat, sans-serif" }}>{recoveryBoxData.customerName}</td>
                      <td style={{ fontFamily: "Montserrat, sans-serif" }}>{recoveryBoxData.salesRef}</td>
                      <td style={{ fontFamily: "Montserrat, sans-serif" }}>{recoveryBoxData.productName}</td>
                      <td style={{ fontFamily: "Montserrat, sans-serif" }}>{recoveryBoxData.productCategory}</td>
                      <td style={{ fontFamily: "Montserrat, sans-serif" }}>{recoveryBoxData.quantity}</td>
                      <td style={{ fontFamily: "Montserrat, sans-serif" }}>{recoveryBoxData.officerId}</td>
                      <td style={{ fontFamily: "Montserrat, sans-serif" }}>{recoveryBoxData.officerName}</td>
                      <td style={{ fontFamily: "Montserrat, sans-serif" }}>{recoveryBoxData.totalBoxed}</td>
                    </tr>
                    <tr>
                      <td colSpan="9" style={{ background: "#f0f8ff", height: "50px" }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="text-center mt-4">
              <button 
                className="btn btn-primary delivery-info-save"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: "600",
                  fontSize: "1.4rem",
                  padding: "1rem 3rem",
                  textTransform: "uppercase",
                }}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryBoxDetail;
