import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IoCloseCircle } from "react-icons/io5";
import logo from "../../../assets/images/adminLogo.png";
import "../../Accounting/Account.css";
import { cashierApi } from "../../../lib/cashierApi";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const CustomerBalances = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const rows = await cashierApi.getCustomerDirectory();
        setCustomers(rows);
      } catch (error) {
        console.error("CustomerBalances: failed to load backend customers:", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const totals = useMemo(
    () =>
      customers.reduce(
        (sum, customer) => ({
          loan:
            sum.loan +
            Number(customer.principalLoanBalance || 0) +
            Number(customer.loanAccruedInterest || 0),
          wallet: sum.wallet + Number(customer.walletBalance || customer.balance || 0),
        }),
        { loan: 0, wallet: 0 }
      ),
    [customers]
  );

  return (
    <div className="bg-white vh-100 d-flex flex-column">
      <div className="px-5 py-3 d-flex justify-content-between align-items-center mb-4">
        <Link to="/payment">
          <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>
        <h2 className="text-primary fw-bold text-uppercase m-0">CUSTOMER BALANCES</h2>
        <Link to="/payment">
          <IoCloseCircle size={40} className="text-primary" />
        </Link>
      </div>

      <div className="container-fluid px-5">
        <div className="row g-0 mb-4 text-white">
          <div className="col-md-6 bg-primary p-5 text-center border-end border-white">
            <h4 className="fw-normal mb-2">Total Customer Loan Balance:</h4>
            <h1 className="fw-bold display-4">{formatCurrency(totals.loan)}</h1>
          </div>
          <div className="col-md-6 bg-primary p-5 text-center">
            <h4 className="fw-normal mb-2">Total Customer Wallet Balance:</h4>
            <h1 className="fw-bold display-4">{formatCurrency(totals.wallet)}</h1>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-borderless align-middle">
            <thead className="bg-primary text-white">
              <tr className="bg-primary">
                <th className="py-3 bg-primary text-white ps-4">S/N</th>
                <th className="py-3 bg-primary text-white">Customer's Name</th>
                <th className="py-3 bg-primary text-white">Customer ID</th>
                <th className="py-3 bg-primary text-white">Virtual Account No.</th>
                <th className="py-3 bg-primary text-white">Bank</th>
                <th className="py-3 bg-primary text-white">Last Repayment Date</th>
                <th className="py-3 bg-primary text-white text-end">Wallet Balance</th>
                <th className="py-3 bg-primary text-white text-end pe-4">Loan Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center fw-semibold py-4">
                    Loading customer balances...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center fw-semibold py-4">
                    No backend customer balances found.
                  </td>
                </tr>
              ) : (
                customers.map((customer, index) => {
                  const loanBalance =
                    Number(customer.principalLoanBalance || 0) +
                    Number(customer.loanAccruedInterest || 0);
                  return (
                    <tr
                      key={customer.id || customer.accountNumber || index}
                      className={index % 2 !== 0 ? "bg-primary-subtle" : ""}
                    >
                      <td className="ps-4 fw-bold text-secondary py-3">{index + 1}</td>
                      <td className="fw-bold text-secondary py-3">
                        {customer.customerName || "-"}
                      </td>
                      <td className="fw-bold text-secondary py-3">
                        {customer.id || "-"}
                      </td>
                      <td className="fw-bold text-secondary py-3">
                        {customer.accountNumber || "-"}
                      </td>
                      <td className="fw-bold text-secondary py-3">
                        {customer.bankName || "-"}
                      </td>
                      <td className="fw-bold text-secondary py-3">
                        {customer.dueDate || "-"}
                      </td>
                      <td className="fw-bold text-secondary text-end py-3">
                        {formatCurrency(customer.walletBalance || customer.balance)}
                      </td>
                      <td className="fw-bold text-secondary text-end pe-4 py-3">
                        {formatCurrency(loanBalance)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerBalances;
