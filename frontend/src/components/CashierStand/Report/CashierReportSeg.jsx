import React, { useState } from "react";
import img from "../../../assets/images/report.png";
import DrModal from "./Deposit/DrModal";
import CrModal from "./Cash/CrModal";
import BrModal from "./Bank/BrModal";

const CashierReportSeg = () => {
  const [modalDeposit, setModalDeposit] = useState(false);
  const [modalCash, setModalCash] = useState(false);
  const [modalBank, setModalBank] = useState(false);
  const toggleDrModal = () => {
    setModalDeposit(!modalDeposit);
  };
  const toggleCrModal = () => {
    setModalCash(!modalCash);
  };
  const toggleBrModal = () => {
    setModalBank(!modalBank);
  };
  return (
    <>
      <section className="CR-grid ">
        <div className="animate__animated animate__zoomIn">
          <img src={img} alt="" id="cashier-report-img" />
        </div>
        <div className="reports-boxes_grid pt-5">
          <div className="">
            <div
              className="reports-boxes stock-options animate__animated animate__zoomIn"
              onClick={toggleDrModal}
            >
              all deposit report
            </div>
            <div
              className="reports-boxes stock-options animate__animated animate__zoomIn"
              onClick={toggleBrModal}
            >
              bank report
            </div>
          </div>
          <div className="">
            <div
              className="reports-boxes stock-options animate__animated animate__zoomIn"
              onClick={toggleCrModal}
            >
              cash report
            </div>
          </div>
        </div>
      </section>

      {/* MODAL CONTENT DISPLAY FOR DEPOSIT REPORT */}
      <DrModal isOpen={modalDeposit} toggleDrModal={toggleDrModal} />
      {/* MODAL CONTENT DISPLAY FOR CASH REPORT */}
      <CrModal isOpen={modalCash} toggleCrModal={toggleCrModal} />
      {/* MODAL CONTENT DISPLAY FOR BANK REPORT */}
      <BrModal isOpen={modalBank} toggleBrModal={toggleBrModal} />
    </>
  );
};

export default CashierReportSeg;
