import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import pmLogo from "../../../../../assets/images/PMlogo.png";
import Dashboard from "../../../../ui/DashboardBtn";
import OnlineCancellationPanel from "./OnlineCancellationPanel";
import WalkInCancellationPanel from "./WalkInCancellationPanel";
import "./CancelledOrder.css";

// "Cancel Order" screen. Online and walk-in customers are handled by two separate tabs that
// never mix orders from the other customer type:
//  - Online Customers: real cancellation requests from the mobile app - sales can only
//    forward to admin or reject.
//  - Walk-in Customers: no self-service request exists, so sales picks an order and raises
//    the request itself - it still goes to admin to approve/reject.
// When opened pre-selected (from the Mark As Paid screen), the tab matching that order's
// customer type is shown and locked - the other tab is not offered.
const CancelledOrder = ({ toggleCancelModal, initialOrderId = "", initialOrder = null }) => {
  const isPreselectedFlow = Boolean(initialOrderId);
  const preselectedTab = initialOrder?.customerType === "WALKIN" ? "walkin" : "online";
  const [activeTab, setActiveTab] = useState(preselectedTab);

  return (
    <div className="cancel-order-container">
      <div className="cancel-order-header">
        <img
          src={pmLogo}
          alt="PM Logo"
          className="cancel-order-logo"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/pm-logo.png";
          }}
        />
        <h1 className="cancel-order-title">CANCEL ORDER</h1>
        <div className="cancel-order-header-right">
          <Dashboard />
          <IoGridOutline style={{ color: "#e8f2ff", fontSize: "1.2rem" }} />
          <button
            onClick={toggleCancelModal}
            className="cancel-order-close-btn"
            onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {!isPreselectedFlow && (
        <div className="cancel-order-tabs">
          <button
            type="button"
            className={`cancel-order-tab ${activeTab === "online" ? "cancel-order-tab-active" : ""}`}
            onClick={() => setActiveTab("online")}
          >
            Online Customers
          </button>
          <button
            type="button"
            className={`cancel-order-tab ${activeTab === "walkin" ? "cancel-order-tab-active" : ""}`}
            onClick={() => setActiveTab("walkin")}
          >
            Walk-in Customers
          </button>
        </div>
      )}

      {activeTab === "online" ? (
        <OnlineCancellationPanel
          toggleCancelModal={toggleCancelModal}
          initialOrderId={initialOrderId}
          initialOrder={initialOrder}
          isPreselectedFlow={isPreselectedFlow}
        />
      ) : (
        <WalkInCancellationPanel
          toggleCancelModal={toggleCancelModal}
          initialOrderId={initialOrderId}
          initialOrder={initialOrder}
        />
      )}
    </div>
  );
};

export default CancelledOrder;
