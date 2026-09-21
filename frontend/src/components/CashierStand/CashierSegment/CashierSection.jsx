import React, { useEffect, useState } from "react";
import img from "../../../assets/images/stand.png";
import LPayModal from "../LoanPayment/LPayModal";
import CallOverModal from "../CallOver/CallOverModal";
import BalanceModal from "../BalanceEnquiry/BalanceModal";
import { Link } from "react-router-dom";

// Cash Payment was removed from the cashier per QA: cashiers should not debit a customer's
// wallet with the total balance from here.
const CashierSection = ({ selectedLoanAccount = "" }) => {
  const [modalLoanPayment, setModalLoanPayment] = useState(false);
  const [modalCallOver, setModalCallOver] = useState(false);
  const [modalBalance, setModalBalance] = useState(false);
  const toggleLPayModal = () => {
    setModalLoanPayment(!modalLoanPayment);
  };
  const toggleCOModal = () => {
    setModalCallOver(!modalCallOver);
  };
  const toggleBalanceModal = () => {
    setModalBalance(!modalBalance);
  };
  const openBalanceFromLoan = () => {
    setModalLoanPayment(false);
    setModalBalance(true);
  };

  useEffect(() => {
    if (selectedLoanAccount) {
      setModalLoanPayment(true);
    }
  }, [selectedLoanAccount]);

  return (
    <>
      <div className="cashier-container  ">
        <div className="cashier-grid">
          <div className="animate__animated animate__zoomIn">
            <img src={img} alt="stock image" className="stock-img" />
          </div>
          <div className="cashier-grid-2">
            <div className="cashier-col-1">
              <Link to="/cashier-report" className="text-decoration-none">
                <div className="stock-options  animate__animated animate__zoomIn ">
                  <p>report</p>
                </div>
              </Link>

              <div
                className="stock-options  animate__animated animate__zoomIn balance-mt"
                onClick={toggleLPayModal}
              >
                <p>payment</p>
              </div>
            </div>
            <div className="cashier-col-2">
              <div
                className="stock-options  animate__animated animate__zoomIn"
                onClick={toggleBalanceModal}
              >
                <p>balance enquiry</p>
              </div>
            </div>
            <div className="cashier-col-3 animate__animated animate__zoomIn">
              <div
                className="stock-options  animate__animated animate__zoomIn"
                onClick={toggleCOModal}
              >
                <p>call over</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CONTENT DISPLAY FOR LOAN PAYMENT */}
      <LPayModal
        isOpen={modalLoanPayment}
        toggleLPayModal={toggleLPayModal}
        openBalanceFromLoan={openBalanceFromLoan}
        selectedAccountNumber={selectedLoanAccount}
      />
      {/* MODAL CONTENT DISPLAY FOR CALL OVER */}
      <CallOverModal isOpen={modalCallOver} toggleCOModal={toggleCOModal} />
      {/* MODAL CONTENT DISPLAY FOR BALANCE ENQUIRY*/}
      <BalanceModal
        isOpen={modalBalance}
        toggleBalanceModal={toggleBalanceModal}
      />
    </>
  );
};

export default CashierSection;
