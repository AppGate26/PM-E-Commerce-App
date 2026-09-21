import React, { useEffect, useMemo, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { careApi } from "../../../../lib/careApi";
import "./SupportChannelReportModal.css";

const extractArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const root = payload.response ?? payload.data ?? payload.content ?? payload.items;
  if (Array.isArray(root)) return root;

  if (root && typeof root === "object") {
    const nested = root.content || root.items || root.data || root.records || root.chats || root.emails;
    if (Array.isArray(nested)) return nested;
  }

  const firstArray = Object.values(payload).find((value) => Array.isArray(value));
  return Array.isArray(firstArray) ? firstArray : [];
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const normalizeEmailRow = (email, index) => ({
  id: email.id || email.ticketId || email.emailId || `email-${index}`,
  customer: email.customerName || email.fromName || email.senderName || email.name || "Unknown",
  contact: email.customerEmail || email.from || email.sender || email.email || "-",
  subject: email.subject || email.title || "No subject",
  status: email.status || email.state || "Open",
  date: email.createdAt || email.date || email.sentAt || email.updatedAt,
});

const normalizeChatRow = (chat, index) => ({
  id: chat.id || chat.chatId || chat.sessionId || `chat-${index}`,
  customer: chat.customerName || chat.name || chat.userName || chat.senderName || "Unknown",
  contact: chat.email || chat.phone || chat.phoneNumber || chat.customerEmail || "-",
  subject: chat.lastMessage || chat.message || chat.topic || chat.subject || "Live chat session",
  status: chat.status || chat.state || (chat.active ? "Active" : "Open"),
  date: chat.createdAt || chat.startedAt || chat.lastMessageAt || chat.updatedAt,
});

const CONFIG = {
  email: {
    title: "EMAIL SUPPORT REPORT",
    empty: "No email support records found.",
    loader: () => careApi.getEmails(0, 100),
    normalize: normalizeEmailRow,
  },
  chat: {
    title: "LIVE CHAT REPORT",
    empty: "No live chat records found.",
    loader: () => careApi.getChats(),
    normalize: normalizeChatRow,
  },
};

const SupportChannelReportModal = ({ isOpen, onClose, type }) => {
  const config = CONFIG[type] || CONFIG.email;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await config.loader();
        setRows(extractArray(response).map(config.normalize));
      } catch (err) {
        setRows([]);
        setError(`Failed to load ${config.title.toLowerCase()}: ${err?.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [config, isOpen]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.customer, row.contact, row.subject, row.status, row.date].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [rows, search]);

  if (!isOpen) return null;

  return (
    <div className="support-report-overlay">
      <div className="support-report-modal">
        <div className="support-report-heading">
          <div>
            <h1>{config.title}</h1>
            <p>Customer Care Support Channel Report</p>
          </div>
          <div className="support-report-icons">
            <IoGridOutline />
            <FaTimes onClick={onClose} />
          </div>
        </div>

        <div className="support-report-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, contact, subject, or status"
          />
          <span>{filteredRows.length} record(s)</span>
        </div>

        {error ? <div className="support-report-error">{error}</div> : null}

        <div className="support-report-table">
          <div className="support-report-table-head">
            <span>Customer</span>
            <span>Contact</span>
            <span>Subject / Message</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          <div className="support-report-table-body">
            {loading ? (
              <div className="support-report-state">Loading report...</div>
            ) : filteredRows.length === 0 ? (
              <div className="support-report-state">{config.empty}</div>
            ) : (
              filteredRows.map((row) => (
                <div className="support-report-row" key={row.id}>
                  <span>{row.customer}</span>
                  <span>{row.contact}</span>
                  <span>{row.subject}</span>
                  <span>{row.status}</span>
                  <span>{formatDate(row.date)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportChannelReportModal;
