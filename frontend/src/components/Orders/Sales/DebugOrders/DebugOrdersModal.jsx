// DebugOrdersModal.jsx
import React from "react";
import DebugOrders from "./DebugOrders";
import "./DebugOrders.css";

const DebugOrdersModal = ({ isOpen, toggleDebugOrdersModal }) => {
  if (!isOpen) return null;

  return (
    <div className="dbg-ord-modal-wrapper">
      <div className="dbg-ord-modal-overlay" onClick={toggleDebugOrdersModal}></div>
      <div className="dbg-ord-modal-container">
        <DebugOrders toggleDebugOrdersModal={toggleDebugOrdersModal} />
      </div>
    </div>
  );
};

export default DebugOrdersModal;
