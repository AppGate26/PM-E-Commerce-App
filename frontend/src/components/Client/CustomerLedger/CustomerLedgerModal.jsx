import React from "react";
import "./CustomerLedgerModal.css";
// CLIENT #1: the basic customer ledger was replaced with the more mature
// "Ledger Balance Enquiry" experience used in the Cashier Stand. It shows the
// customer profile (name, account, BVN, wallet/loan balances, passport) plus the
// full debit/credit/balance ledger table, reusing the same component.
import Balance from "../../CashierStand/BalanceEnquiry/Balance";

const CustomerLedgerModal = ({ isOpen, toggleCustomerLedgerModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div
        className="Csh_modal_overlay"
        onClick={toggleCustomerLedgerModal}
      />
      <div
        className="Csh_modal_content"
        style={{
          maxWidth: "min(1200px, 96vw)",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: "12px"
        }}
      >
        <Balance toggleBalanceModal={toggleCustomerLedgerModal} />
      </div>
    </div>
  );
};

export default CustomerLedgerModal;
