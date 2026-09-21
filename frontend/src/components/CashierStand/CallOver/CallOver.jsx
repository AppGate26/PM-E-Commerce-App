import React, { useState } from "react";
import BranchBadge from "../../shared/BranchBadge";
import "../../../Styles/CashierStand/CallOver/CallOver.css";
import { Link } from "react-router-dom";
import { cashierApi } from "../../../lib/cashierApi";
import CashierBackButton from "../CashierBackButton";

const CallOver = ({ toggleCOModal }) => {
  const [filters, setFilters] = useState({
    cashier: "",
    startDate: "",
    endDate: "",
  });
  const [reportData, setReportData] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const closeModal = () => {
    toggleCOModal();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchCallOver = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError("Please select start date and end date");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const reportsList = await cashierApi.getCallOver({
        startDate: filters.startDate,
        endDate: filters.endDate,
        cashier: filters.cashier,
      });

      setReportData(reportsList);

      const total = reportsList.reduce((sum, item) => {
        const amount = parseFloat(item.amount) || parseFloat(item.totalAmount) || 0;
        return sum + amount;
      }, 0);

      setTotalBalance(total);
    } catch (err) {
      setError(err.message || "Failed to fetch call over data");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchCallOver();
  };

  return (
    <div className='co-shell'>
      <div className='CO-container'>
        <header className='co-header'>
          <div className='co-topbar'>
            <CashierBackButton onClick={closeModal} />
            <Link to='/adminDashboard' className='co-dashboard-link'>
              Dashboard
            </Link>
            <button
              type='button'
              className='adjust-cancel-btn call-over-cancel'
              onClick={closeModal}
            >
              X
            </button>
          </div>

          <div className='co-title-wrap'>
            <h1 className='call-over-h1'>Call Over Report</h1>
            <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
              <BranchBadge />
            </div>
            <p className='co-subtitle'>Filter and review cashier transaction activity</p>
            <div className='co-total-chip'>
              Total: ?
              {totalBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </header>

        {error && (
          <div className='alert alert-danger co-alert' role='alert'>
            {error}
          </div>
        )}

        <section className='product-box'>
          <form onSubmit={handleSubmit}>
            <div className='product-box_grid'>
              <div>
                <label>cashier</label>
                <select
                  name='cashier'
                  value={filters.cashier}
                  onChange={handleFilterChange}
                  className='product-box-select'
                >
                  <option value=''>all cashier</option>
                  <option value='cash'>cash</option>
                  <option value='bank'>bank</option>
                </select>
              </div>

              <div>
                <label>start date</label>
                <input
                  type='date'
                  name='startDate'
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className='product-box-inputs'
                  required
                />
              </div>

              <div>
                <label>end date</label>
                <input
                  type='date'
                  name='endDate'
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className='product-box-inputs'
                  required
                />
              </div>
            </div>

            <div className='co-actions'>
              <button type='submit' className='co-fetch-btn' disabled={loading}>
                {loading ? "Loading..." : "Fetch Data"}
              </button>
            </div>
          </form>
        </section>

        <section className='callOver-table'>
          <div className='table-scroll-bar'>
            <table>
              <thead>
                <tr>
                  <th>s/n</th>
                  <th>customer name</th>
                  <th>transaction id</th>
                  <th>description</th>
                  <th>amount</th>
                  <th>transaction type</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan='7' className='co-empty-cell'>
                      Loading...
                    </td>
                  </tr>
                ) : error && reportData.length === 0 ? (
                  <tr>
                    <td colSpan='7' className='co-empty-cell co-error-cell'>
                      {error}
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan='7' className='co-empty-cell'>
                      No data available. Please select dates and fetch data.
                    </td>
                  </tr>
                ) : (
                  reportData.map((item, index) => {
                    const customerName = item.customerName || item.customer || "-";
                    const transactionId =
                      item.transactionId || item.id || item.referenceNumber || "-";
                    const description = item.description || "-";
                    const amount = parseFloat(item.amount) || parseFloat(item.totalAmount) || 0;
                    const transactionType =
                      item.transactionType || item.paymentMethod || "-";

                    return (
                      <tr key={`${transactionId}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{customerName}</td>
                        <td>{transactionId}</td>
                        <td>{description}</td>
                        <td>
                          ?
                          {amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>{transactionType}</td>
                        <td>
                          <input type='checkbox' aria-label='Select transaction row' />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CallOver;
