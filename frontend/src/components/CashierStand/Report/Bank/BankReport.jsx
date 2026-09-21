import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { cashierApi } from "../../../../lib/cashierApi";
import CashierBackButton from "../../CashierBackButton";
import "../../../../Styles/CashierStand/Report/CashierReport.css";

const formatDateForQuery = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    startDate: formatDateForQuery(monthStart),
    endDate: formatDateForQuery(today),
  };
};

const toAmount = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = value.toString().replace(/[^0-9.-]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAmountFromRow = (item) =>
  toAmount(
    item?.amount ??
      item?.totalAmount ??
      item?.depositAmount ??
      item?.paidAmount ??
      item?.value ??
      0,
  );

const formatCurrency = (amount) =>
  `?${(Number(amount) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getRowDate = (item) => {
  const value = item?.date || item?.transactionDate || item?.createdAt || null;
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-GB");
};

const BankReport = ({ toggleBrModal }) => {
  const defaultRange = getDefaultDateRange();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  useEffect(() => {
    fetchBankDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBankDeposits = async () => {
    setLoading(true);
    setError("");

    try {
      if (!startDate || !endDate) {
        throw new Error("Please provide both start and end dates");
      }

      if (startDate > endDate) {
        throw new Error("Start date cannot be after end date");
      }

      const reportsList = await cashierApi.getBankDepositsReport({
        startDate,
        endDate,
      });

      setReportData(reportsList);

      const totalAmount = reportsList.reduce((sum, item) => {
        const amount = getAmountFromRow(item);
        return sum + amount;
      }, 0);
      setTotal(totalAmount);
    } catch (err) {
      setError(err.message || "Failed to fetch bank deposits report");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    toggleBrModal();
  };

  const exportRows = reportData.map((item, index) => {
    const amount = getAmountFromRow(item);
    return {
      "S/N": index + 1,
      Date: getRowDate(item),
      "Customer Name": item.customerName || item.customer || "-",
      "Transaction ID": item.transactionId || item.id || item.referenceNumber || "-",
      Description: item.description || "-",
      Amount: amount,
    };
  });

  const handleExportExcel = () => {
    if (exportRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bank Deposit Report");
    XLSX.writeFile(
      workbook,
      `bank-deposit-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const handleExportPdf = () => {
    if (exportRows.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = exportRows
      .map(
        (row) => `
          <tr>
            <td>${row["S/N"]}</td>
            <td>${row.Date}</td>
            <td>${row["Customer Name"]}</td>
            <td>${row["Transaction ID"]}</td>
            <td>${row.Description}</td>
            <td>?${Number(row.Amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Bank Deposit Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
            h1, h3, p { margin: 0; text-align: center; }
            h1 { margin-bottom: 8px; }
            p { margin-top: 4px; margin-bottom: 2px; }
            .meta { margin: 16px 0; display: flex; justify-content: space-between; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #e2e8f0; text-transform: uppercase; }
            .total { margin-top: 14px; text-align: right; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Bank Deposit Report</h1>
          <h3>PM MARKET HUB</h3>
          <p>64 Ogui Road, Enugu State</p>
          <p>Tel: 080XXXXX</p>
          <div class="meta">
            <span>Period: ${startDate} to ${endDate}</span>
            <span>Records: ${exportRows.length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Transaction ID</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="total">Total Bank Deposits: ${formatCurrency(total)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className='dr-modern-shell'>
      <div className='Dr-container dr-modern-container'>
        <header className='dr-modern-header'>
          <div className='dr-modern-topbar'>
            <CashierBackButton onClick={closeModal} />
            <button
              type='button'
              className='adjust-cancel-btn report-cahier-cancel dr-modern-close'
              onClick={closeModal}
            >
              X
            </button>
          </div>

          <div className='dr-modern-title'>
            <h1>Bank Deposit Report</h1>
            <h3>PM MARKET HUB</h3>
            <h5>64 Ogui Road, Enugu State</h5>
            <h5>Tel: 080XXXXX</h5>
          </div>
        </header>

        <section className='dr-modern-filter'>
          <div>
            <label htmlFor='bank-start-date'>Start Date</label>
            <input
              id='bank-start-date'
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='bank-end-date'>End Date</label>
            <input
              id='bank-end-date'
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            type='button'
            className='dr-modern-apply-btn'
            onClick={fetchBankDeposits}
            disabled={loading}
          >
            {loading ? "Loading..." : "Apply Filter"}
          </button>
        </section>

        <section className='dr-modern-summary'>
          <div className='dr-summary-chip'>
            <span>Period</span>
            <strong>
              {startDate || "-"} to {endDate || "-"}
            </strong>
          </div>
          <div className='dr-summary-chip'>
            <span>Total Records</span>
            <strong>{reportData.length}</strong>
          </div>
          <div className='dr-summary-chip'>
            <span>Total Bank Deposits</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </section>

        <section className='dr-modern-actions'>
          <button
            type='button'
            className='dr-export-btn'
            onClick={handleExportExcel}
            disabled={loading || reportData.length === 0}
          >
            Export Excel
          </button>
          <button
            type='button'
            className='dr-export-btn dr-export-pdf-btn'
            onClick={handleExportPdf}
            disabled={loading || reportData.length === 0}
          >
            Export PDF
          </button>
        </section>

        <div className='table-label dr-modern-table-label'>
          <h2>Bank Deposit Report</h2>
        </div>

        <div className='report-table dr-modern-table'>
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Transaction ID</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan='6' className='dr-table-state'>
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan='6' className='dr-table-state dr-table-error'>
                    {error}
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan='6' className='dr-table-state'>
                    No data available for selected range
                  </td>
                </tr>
              ) : (
                reportData.map((item, index) => {
                  const date = getRowDate(item);
                  const customerName = item.customerName || item.customer || "-";
                  const transactionId =
                    item.transactionId || item.id || item.referenceNumber || "-";
                  const description = item.description || "-";
                  const amount = getAmountFromRow(item);

                  return (
                    <tr key={item.id || item.transactionId || index}>
                      <td>{index + 1}</td>
                      <td>{date}</td>
                      <td>{customerName}</td>
                      <td>{transactionId}</td>
                      <td>{description}</td>
                      <td>{formatCurrency(amount)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className='total-box dr-modern-total'>
            <h2>
              Total: <span>{formatCurrency(total)}</span>
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReport;
