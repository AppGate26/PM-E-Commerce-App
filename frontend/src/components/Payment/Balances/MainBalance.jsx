import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IoCloseCircle } from "react-icons/io5";
import logo from "../../../assets/images/adminLogo.png";
import { cashierApi } from "../../../lib/cashierApi";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const MainBalance = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      const today = new Date().toISOString().slice(0, 10);
      try {
        setLoading(true);
        const rows = await cashierApi.getAllDepositsReport({
          startDate: "2000-01-01",
          endDate: today,
        });
        setTransactions(rows);
      } catch (error) {
        console.error("MainBalance: failed to load backend balances:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const totalWalletBalance = useMemo(
    () =>
      transactions.reduce(
        (sum, row) =>
          sum +
          Number(
            row.amount ||
              row.amountPaid ||
              row.depositAmount ||
              row.creditAmount ||
              row.totalAmount ||
              0
          ),
        0
      ),
    [transactions]
  );

  return (
    <div style={{ backgroundColor: "white", minHeight: "100vh" }}>
      <div
        style={{
          padding: "1rem 2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <Link to="/payment">
          <img src={logo} alt="pm logo" style={{ height: "40px" }} />
        </Link>
        <h2
          style={{
            color: "#0867db",
            fontWeight: "bold",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          MAIN BALANCE
        </h2>
        <Link to="/payment">
          <IoCloseCircle size={40} style={{ color: "#0867db" }} />
        </Link>
      </div>

      <div style={{ padding: "0 2.5rem", flex: 1 }}>
        <div
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: "1rem",
            padding: "2rem",
            marginBottom: "2rem",
            textAlign: "center",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3 style={{ color: "#6c757d", fontSize: "1.5rem", fontWeight: "normal" }}>
            Total Wallet Balance
          </h3>
          <h1 style={{ color: "#0867db", fontSize: "3.5rem", fontWeight: "bold" }}>
            {formatCurrency(totalWalletBalance)}
          </h1>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#0867db", color: "white" }}>
                <th style={{ padding: "1rem", textAlign: "left" }}>S/N</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Customer's Name</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Account No.</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Amount</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Date of Transaction</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: "1rem", textAlign: "center" }}>
                    Loading balances...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "1rem", textAlign: "center" }}>
                    No backend balance transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction, index) => (
                  <tr
                    key={transaction.id || transaction.referenceNo || index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "white" : "#f2f9ff",
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    <td style={{ padding: "1rem", fontWeight: "bold" }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "bold" }}>
                      {transaction.customerName || transaction.accountName || "-"}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "bold" }}>
                      {transaction.accountNumber || transaction.accountNo || "-"}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "bold", textAlign: "right" }}>
                      {formatCurrency(
                        transaction.amount ||
                          transaction.amountPaid ||
                          transaction.depositAmount ||
                          transaction.creditAmount ||
                          transaction.totalAmount
                      )}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "bold" }}>
                      {transaction.transactionDate || transaction.date || transaction.createdAt || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MainBalance;
