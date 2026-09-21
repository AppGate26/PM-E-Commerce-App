import React, { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaFileExcel, FaPhoneAlt, FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import * as XLSX from "xlsx";
import { careApi } from "../../../lib/careApi";
import "./CallLog.css";

const FILTERS = ["ALL", "RECEIVED", "REJECTED", "MISSED"];
const PAGE_SIZE = 10;

const formatCallTime = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
};

const CallLog = ({ isOpen, onClose }) => {
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [callData, setCallData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const fetchCallLogs = async () => {
    if (!isOpen) return;

    try {
      setLoading(true);
      setError("");

      const response = await careApi.getCallLog(selectedFilter);

      let callsList = [];
      if (response?.status === 200 && Array.isArray(response?.response?.content)) {
        callsList = response.response.content;
      }

      const transformedCalls = callsList.map((call, index) => ({
        id: call.id || call.callId || `call-${index}`,
        name: call.name || call.callerName || call.userName || `Call ${index + 1}`,
        phone: call.phone || call.phoneNumber || call.callerNumber || "N/A",
        status: call.status?.toUpperCase() || "UNKNOWN",
        type: call.status?.toUpperCase() || "UNKNOWN",
        image: call.image || call.profileImage || null,
        timestamp: call.timestamp || call.createdAt || call.time || call.date || "",
      }));

      setCallData(transformedCalls);
      setCurrentPage(0);
    } catch (err) {
      console.error("Error fetching call logs:", err);
      setError(`Failed to load call logs: ${err?.message || "Unknown error"}`);
      setCallData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCallLogs();
    }
  }, [isOpen, selectedFilter]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const filteredCalls = useMemo(() => {
    const source =
      selectedFilter === "ALL"
        ? callData
        : callData.filter((call) => call.type === selectedFilter);

    if (!searchTerm.trim()) return source;

    const searchLower = searchTerm.toLowerCase();
    return source.filter((call) => {
      const name = call.name?.toLowerCase() || "";
      const phone = call.phone?.toLowerCase() || "";
      const status = call.status?.toLowerCase() || "";
      const time = formatCallTime(call.timestamp).toLowerCase();
      return (
        name.includes(searchLower) ||
        phone.includes(searchLower) ||
        status.includes(searchLower) ||
        time.includes(searchLower)
      );
    });
  }, [callData, searchTerm, selectedFilter]);

  const summary = useMemo(() => {
    const counts = { ALL: callData.length, RECEIVED: 0, REJECTED: 0, MISSED: 0 };
    callData.forEach((call) => {
      if (counts[call.type] !== undefined) counts[call.type] += 1;
    });
    return counts;
  }, [callData]);

  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / PAGE_SIZE));
  const pageStart = currentPage * PAGE_SIZE;
  const pagedCalls = filteredCalls.slice(pageStart, pageStart + PAGE_SIZE);

  const getStatusClass = (status) => {
    if (status === "RECEIVED") return "received";
    if (status === "REJECTED") return "rejected";
    if (status === "MISSED") return "missed";
    return "unknown";
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const handleExportReport = () => {
    try {
      if (!filteredCalls.length) {
        setError("No call logs available to export.");
        return;
      }

      setExporting(true);
      setError("");

      const rows = filteredCalls.map((call, index) => ({
        sn: index + 1,
        name: call.name || "N/A",
        phone: call.phone || "N/A",
        status: call.status || "N/A",
        timestamp: formatCallTime(call.timestamp),
      }));

      const worksheet = XLSX.utils.aoa_to_sheet([
        ["Call Log Report"],
        ["Filter", selectedFilter],
        ["Generated At", new Date().toLocaleString()],
        [],
      ]);

      XLSX.utils.sheet_add_json(worksheet, rows, { origin: "A5", skipHeader: false });
      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 24 },
        { wch: 20 },
        { wch: 14 },
        { wch: 24 },
      ];
      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Call Log");
      XLSX.writeFile(
        workbook,
        `call-log-${selectedFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      console.error("Error exporting call log report:", err);
      setError(`Failed to export report: ${err?.message || "Unknown error"}`);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="call-log-overlay">
      <div className="call-log-modal">
        <div className="call-log-standard">
          <div className="call-log-heading">
            <div></div>
            <div className="call-log-company">
              <h1>PM MARKET HUB</h1>
              <p>64 OGUI ROAD, ENUGU-STATE</p>
              <p>CALL LOG REPORT</p>
            </div>
            <div className="call-log-heading-icons">
              <IoGridOutline className="call-log-grid-icon" />
              <FaTimes className="call-log-close-icon" onClick={onClose} />
            </div>
          </div>

          <div className="call-log-toolbar">
            <div className="call-log-filters">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={selectedFilter === filter ? "active" : ""}
                  onClick={() => setSelectedFilter(filter)}
                  disabled={loading}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="call-log-export"
              onClick={handleExportReport}
              disabled={loading || exporting || filteredCalls.length === 0}
            >
              <FaFileExcel />
              {exporting ? "Exporting..." : "Export to Excel"}
            </button>
          </div>

          <div className="call-log-summary">
            <div className="call-log-card">
              <span>Total Calls</span>
              <strong>{summary.ALL}</strong>
            </div>
            <div className="call-log-card">
              <span>Received</span>
              <strong>{summary.RECEIVED}</strong>
            </div>
            <div className="call-log-card">
              <span>Rejected</span>
              <strong>{summary.REJECTED}</strong>
            </div>
            <div className="call-log-card">
              <span>Missed</span>
              <strong>{summary.MISSED}</strong>
            </div>
          </div>

          <div className="call-log-search-row">
            <input
              type="text"
              placeholder="Search by name, phone, status, or time"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {error && <div className="call-log-error">{error}</div>}

          <div className="call-log-table-shell">
            <p className="call-log-table-title">CUSTOMER CARE CALL LOG</p>

            <div className="call-log-table-header">
              <div>S/N</div>
              <div>CUSTOMER</div>
              <div>PHONE NUMBER</div>
              <div>STATUS</div>
              <div>DATE / TIME</div>
            </div>

            <div className="call-log-table-body">
              {loading ? (
                <div className="call-log-state">Loading call logs...</div>
              ) : pagedCalls.length === 0 ? (
                <div className="call-log-state">No call logs match the current filter.</div>
              ) : (
                pagedCalls.map((call, index) => (
                  <div className="call-log-row" key={call.id}>
                    <div>{pageStart + index + 1}</div>
                    <div className="call-log-customer">
                      <div className="call-log-avatar">
                        {call.image ? (
                          <img src={call.image} alt={call.name} />
                        ) : (
                          (call.name || "C").charAt(0).toUpperCase()
                        )}
                      </div>
                      <span>{call.name}</span>
                    </div>
                    <div className="call-log-phone">
                      <FaPhoneAlt />
                      <span>{call.phone}</span>
                    </div>
                    <div>
                      <span className={`call-log-badge ${getStatusClass(call.status)}`}>
                        <FaCheckCircle />
                        {call.status}
                      </span>
                    </div>
                    <div>{formatCallTime(call.timestamp)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="call-log-footer">
              <span>
                {loading
                  ? "Loading..."
                  : `Showing ${filteredCalls.length === 0 ? 0 : pageStart + 1} to ${Math.min(
                      pageStart + PAGE_SIZE,
                      filteredCalls.length
                    )} of ${filteredCalls.length} calls`}
              </span>

              <div className="call-log-pagination">
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

export default CallLog;
