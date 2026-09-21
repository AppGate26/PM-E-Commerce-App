import React, { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaExclamationCircle, FaFileExcel, FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import * as XLSX from "xlsx";
import { careApi } from "../../../../lib/careApi";
import "./UnansweredCallsModal.css";

const PAGE_SIZE = 8;

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("en-GB");
};

const formatTime = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const UnansweredCallModal = ({ isOpen, onClose }) => {
  const [reportData, setReportData] = useState({
    companyName: "PM MARKET HUB",
    address: "64 OGUI ROAD, ENUGU-STATE",
    tel: "080XXXXX",
    reportTitle: "ALL UNANSWERED CALLS REPORT",
    calls: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  const fetchUnansweredCallsReport = async () => {
    if (!isOpen) return;

    try {
      setLoading(true);
      setError("");

      const response = await careApi.getUnansweredCallsReport();

      let nextData = {
        companyName: "PM MARKET HUB",
        address: "64 OGUI ROAD, ENUGU-STATE",
        tel: "080XXXXX",
        reportTitle: "ALL UNANSWERED CALLS REPORT",
        calls: [],
      };

      if (response?.status === 200 && response?.response) {
        nextData = {
          companyName: response.response.companyName || nextData.companyName,
          address: response.response.address || nextData.address,
          tel: response.response.tel || nextData.tel,
          reportTitle: response.response.reportTitle || nextData.reportTitle,
          calls: Array.isArray(response.response.calls) ? response.response.calls : [],
        };
      }

      setReportData(nextData);
      setCurrentPage(0);
    } catch (err) {
      console.error("Error fetching unanswered calls report:", err);
      setError(`Failed to load unanswered calls report: ${err?.message || "Unknown error"}`);
      setReportData((prev) => ({ ...prev, calls: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUnansweredCallsReport();
    }
  }, [isOpen]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const preparedCalls = useMemo(
    () =>
      reportData.calls.map((call, index) => ({
        id: call.callId || call.id || `unanswered-${index}`,
        customerName: call.customerName || call.name || "N/A",
        date: call.date || call.callDate || call.createdAt || "",
        time: call.time || call.callTime || call.createdAt || "",
        duration: call.duration || call.durationMinutes || "N/A",
        phone: call.phone || call.phoneNumber || call.customerPhone || "N/A",
        complaint: call.complain || call.issue || call.reason || "N/A",
        comment: call.comment || call.status || call.resolution || "N/A",
      })),
    [reportData.calls]
  );

  const filteredCalls = useMemo(() => {
    if (!searchTerm.trim()) return preparedCalls;

    const searchLower = searchTerm.toLowerCase();
    return preparedCalls.filter((call) => {
      return (
        String(call.id).toLowerCase().includes(searchLower) ||
        call.customerName.toLowerCase().includes(searchLower) ||
        String(call.phone).toLowerCase().includes(searchLower) ||
        String(call.complaint).toLowerCase().includes(searchLower) ||
        String(call.comment).toLowerCase().includes(searchLower)
      );
    });
  }, [preparedCalls, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / PAGE_SIZE));
  const pageStart = currentPage * PAGE_SIZE;
  const pagedCalls = filteredCalls.slice(pageStart, pageStart + PAGE_SIZE);

  const summary = useMemo(() => {
    const totalCalls = preparedCalls.length;
    const totalMinutes = preparedCalls.reduce((sum, call) => {
      const minutes = Number(call.duration);
      return sum + (Number.isFinite(minutes) ? minutes : 0);
    }, 0);

    return {
      totalCalls,
      displayedCalls: filteredCalls.length,
      totalMinutes,
      withComments: preparedCalls.filter((call) => call.comment && call.comment !== "N/A").length,
    };
  }, [filteredCalls.length, preparedCalls]);

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const handleExportExcel = () => {
    try {
      if (!filteredCalls.length) {
        setError("No unanswered calls available to export.");
        return;
      }

      setExporting(true);
      setError("");

      const rows = filteredCalls.map((call, index) => ({
        sn: index + 1,
        callId: call.id,
        customerName: call.customerName,
        date: formatDate(call.date),
        time: formatTime(call.time),
        durationMinutes: call.duration,
        phoneNumber: call.phone,
        complaint: call.complaint,
        comment: call.comment,
      }));

      const worksheet = XLSX.utils.aoa_to_sheet([
        [reportData.reportTitle || "ALL UNANSWERED CALLS REPORT"],
        ["Generated At", new Date().toLocaleString()],
        ["Company", reportData.companyName],
        ["Address", reportData.address],
        ["Telephone", reportData.tel],
        [],
      ]);

      XLSX.utils.sheet_add_json(worksheet, rows, { origin: "A7", skipHeader: false });
      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 14 },
        { wch: 24 },
        { wch: 14 },
        { wch: 12 },
        { wch: 16 },
        { wch: 18 },
        { wch: 28 },
        { wch: 28 },
      ];
      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Unanswered Calls");
      XLSX.writeFile(
        workbook,
        `unanswered-calls-report-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      console.error("Error exporting unanswered calls report:", err);
      setError(`Failed to export unanswered calls report: ${err?.message || "Unknown error"}`);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="unanswered-report-overlay">
      <div className="unanswered-report-modal">
        <div className="unanswered-report-standard">
          <div className="unanswered-report-heading">
            <div></div>
            <div className="unanswered-report-company">
              <h1>{reportData.companyName}</h1>
              <p>{reportData.address}</p>
              <p>TEL: {reportData.tel}</p>
            </div>
            <div className="unanswered-report-heading-icons">
              <IoGridOutline className="unanswered-report-grid-icon" />
              <FaTimes className="unanswered-report-close-icon" onClick={onClose} />
            </div>
          </div>

          <div className="unanswered-report-toolbar">
            <div className="unanswered-report-search">
              <input
                type="text"
                placeholder="Search by call ID, customer, phone, complaint, or comment"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="unanswered-report-export"
              onClick={handleExportExcel}
              disabled={loading || exporting || filteredCalls.length === 0}
            >
              <FaFileExcel />
              {exporting ? "Exporting..." : "Export to Excel"}
            </button>
          </div>

          <div className="unanswered-report-summary">
            <div className="unanswered-report-card">
              <span>Total Unanswered Calls</span>
              <strong>{summary.totalCalls}</strong>
            </div>
            <div className="unanswered-report-card">
              <span>Displayed Results</span>
              <strong>{summary.displayedCalls}</strong>
            </div>
            <div className="unanswered-report-card">
              <span>Total Minutes</span>
              <strong>{summary.totalMinutes}</strong>
            </div>
            <div className="unanswered-report-card">
              <span>Calls With Comments</span>
              <strong>{summary.withComments}</strong>
            </div>
          </div>

          {error && <div className="unanswered-report-error">{error}</div>}

          <div className="unanswered-report-table-shell">
            <p className="unanswered-report-title">
              {reportData.reportTitle || "ALL UNANSWERED CALLS REPORT"}
            </p>

            <div className="unanswered-report-table-header">
              <div>CALL ID</div>
              <div>CUSTOMER NAME</div>
              <div>DATE</div>
              <div>TIME</div>
              <div>DURATION</div>
              <div>PHONE NO</div>
              <div>COMPLAINT</div>
              <div>COMMENT</div>
            </div>

            <div className="unanswered-report-table-body">
              {loading ? (
                <div className="unanswered-report-state">Loading unanswered calls report...</div>
              ) : pagedCalls.length === 0 ? (
                <div className="unanswered-report-state">
                  No unanswered calls match the current search.
                </div>
              ) : (
                pagedCalls.map((call) => (
                  <div className="unanswered-report-row" key={call.id}>
                    <div>{call.id}</div>
                    <div className="unanswered-report-customer">
                      <span className="unanswered-report-customer-dot">
                        <FaExclamationCircle />
                      </span>
                      <span>{call.customerName}</span>
                    </div>
                    <div>{formatDate(call.date)}</div>
                    <div>{formatTime(call.time)}</div>
                    <div>{call.duration}</div>
                    <div>{call.phone}</div>
                    <div>{call.complaint}</div>
                    <div>{call.comment}</div>
                  </div>
                ))
              )}
            </div>

            <div className="unanswered-report-footer">
              <span>
                {loading
                  ? "Loading..."
                  : `Showing ${filteredCalls.length === 0 ? 0 : pageStart + 1} to ${Math.min(
                      pageStart + PAGE_SIZE,
                      filteredCalls.length
                    )} of ${filteredCalls.length} calls`}
              </span>

              <div className="unanswered-report-pagination">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <FaChevronLeft />
                  Previous
                </button>
                <span>
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnansweredCallModal;
