import React from "react";
import RefundReturnReport from "./RefundReturnReport";

const RefundReturnReportModal = ({ isOpen, toggleRefundReturnReportModal }) => {
  if (!isOpen) return null;
  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={toggleRefundReturnReportModal}></div>
      <div className="Csh_modal-content">
        <RefundReturnReport toggleRefundReturnReportModal={toggleRefundReturnReportModal} />
      </div>
    </div>
  );
};

export default RefundReturnReportModal;
