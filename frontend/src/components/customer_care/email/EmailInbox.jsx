import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import './emails.css';
import { careApi } from '../../../lib/careApi';
import {
  FaArchive,
  FaClock,
  FaEnvelope,
  FaEnvelopeOpen,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInbox,
  FaPaperclip,
  FaPaperPlane,
  FaPlus,
  FaRegStar,
  FaReply,
  FaSearch,
  FaSpinner,
  FaStar,
  FaSync,
  FaTrash,
  FaUser
} from 'react-icons/fa';
import { MdArrowBack } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const EMAIL_PAGE_SIZE = 20;

const normalizeEmail = (email, index = 0) => ({
  id: email.ticketId || email.id || email.ticketid || `email-${Date.now()}-${index}`,
  subject: email.subject || email.title || email.Subject || 'No Subject',
  from: email.from || email.sender || email.customerEmail || email.From || 'Unknown Sender',
  fromName: email.fromName || email.senderName || email.customerName || 'Customer',
  to: email.to || email.recipient || email.To || 'Support Team',
  message: email.message || email.body || email.content || email.Message || '',
  date: email.date || email.createdAt || email.timestamp || email.Date || new Date().toISOString(),
  status: email.status || (email.read ? 'read' : 'unread'),
  priority: email.priority || email.urgency || 'normal',
  hasAttachments: email.hasAttachments || (Array.isArray(email.attachments) && email.attachments.length > 0),
  attachments: email.attachments || [],
  category: email.category || email.type || 'support',
  starred: Boolean(email.starred || email.important),
  previousReplies: email.replies || email.thread || email.history || []
});

const pickEmailList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.emails)) return payload.emails;
  if (payload.data && Array.isArray(payload.data)) return payload.data;
  const firstArrayKey = Object.keys(payload).find((key) => Array.isArray(payload[key]));
  if (firstArrayKey) return payload[firstArrayKey];
  if (typeof payload === 'object') return [payload];
  return [];
};

const formatEmailDate = (dateString) => {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'No date';

  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return format(date, 'HH:mm');
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return format(date, 'EEE');
  return format(date, 'dd/MM/yy');
};

const EmailInbox = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailDetailCache, setEmailDetailCache] = useState({});

  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: '', subject: '', message: '' });
  const [composeAttachment, setComposeAttachment] = useState(null);
  const [composing, setComposing] = useState(false);

  const [activeTab, setActiveTab] = useState('inbox');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateEmailInState = (ticketId, updater) => {
    setEmails((prev) => prev.map((email) => (email.id === ticketId ? updater(email) : email)));
    setSelectedEmail((prev) => (prev?.id === ticketId ? updater(prev) : prev));
    setEmailDetailCache((prev) => {
      if (!prev[ticketId]) return prev;
      return { ...prev, [ticketId]: updater(prev[ticketId]) };
    });
  };

  const removeEmailFromState = (ticketId) => {
    setEmails((prev) => prev.filter((email) => email.id !== ticketId));
    setSelectedEmail((prev) => (prev?.id === ticketId ? null : prev));
    setEmailDetailCache((prev) => {
      if (!prev[ticketId]) return prev;
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
  };

  const fetchEmails = async (page = 0, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      setError('');

      const response = await careApi.getEmails(page, EMAIL_PAGE_SIZE);
      const payload = response?.data || response?.response || response;
      const list = pickEmailList(payload);
      const normalized = list.map((email, index) => normalizeEmail(email, index));

      setEmails(normalized);
      const totalItems = response?.totalItems || response?.total || normalized.length;
      setTotalPages(Math.max(1, Math.ceil(totalItems / EMAIL_PAGE_SIZE)));
    } catch (err) {
      setError(`Failed to load emails: ${err?.message || 'Unknown error'}`);
      setEmails([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEmailDetails = async (ticketId) => {
    if (!ticketId) return;
    if (emailDetailCache[ticketId]) {
      setSelectedEmail(emailDetailCache[ticketId]);
      updateEmailInState(ticketId, (email) => ({ ...email, status: 'read' }));
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await careApi.getEmailDetails(ticketId);
      const payload = response?.data || response?.response || response;
      const detail = normalizeEmail(payload);

      setSelectedEmail(detail);
      setEmailDetailCache((prev) => ({ ...prev, [ticketId]: detail }));
      updateEmailInState(ticketId, (email) => ({ ...email, status: 'read' }));
    } catch (err) {
      setError(`Failed to load email: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail) return setError('No email selected');
    if (!replyMessage.trim()) return setError('Please enter a reply message');

    try {
      setSendingReply(true);
      setError('');

      if (replyAttachment) {
        const formData = new FormData();
        formData.append('message', replyMessage);
        formData.append('attachment', replyAttachment);
        await careApi.replyToEmailMultipart(selectedEmail.id, formData);
      } else {
        await careApi.replyToEmail(selectedEmail.id, { message: replyMessage, attachment: [] });
      }

      setSuccess('Reply sent successfully');
      setReplyMessage('');
      setReplyAttachment(null);

      // Refresh detail and keep cache fresh.
      setEmailDetailCache((prev) => {
        const next = { ...prev };
        delete next[selectedEmail.id];
        return next;
      });
      fetchEmailDetails(selectedEmail.id);
    } catch (err) {
      setError(`Failed to send reply: ${err?.message || 'Unknown error'}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleComposeSend = async () => {
    if (!composeForm.to.trim() || !composeForm.subject.trim() || !composeForm.message.trim()) {
      return setError('Please complete recipient, subject and message');
    }

    try {
      setComposing(true);
      setError('');

      if (composeAttachment) {
        const formData = new FormData();
        formData.append('to', composeForm.to.trim());
        formData.append('subject', composeForm.subject.trim());
        formData.append('message', composeForm.message.trim());
        formData.append('attachment', composeAttachment);
        await careApi.composeEmailMultipart(formData);
      } else {
        await careApi.composeEmail({
          to: composeForm.to.trim(),
          recipientEmail: composeForm.to.trim(),
          subject: composeForm.subject.trim(),
          message: composeForm.message.trim()
        });
      }

      setSuccess('Email sent successfully');
      setComposeOpen(false);
      setComposeForm({ to: '', subject: '', message: '' });
      setComposeAttachment(null);
      fetchEmails(currentPage, true);
    } catch (err) {
      setError(`Failed to send compose email: ${err?.message || 'Unknown error'}`);
    } finally {
      setComposing(false);
    }
  };

  const toggleStar = async (ticketId, nextStarValue) => {
    updateEmailInState(ticketId, (email) => ({ ...email, starred: nextStarValue }));
    try {
      await careApi.toggleEmailStar(ticketId, nextStarValue);
      setSuccess(nextStarValue ? 'Email starred' : 'Email unstarred');
    } catch (err) {
      updateEmailInState(ticketId, (email) => ({ ...email, starred: !nextStarValue }));
      setError(`Failed to update star: ${err?.message || 'Unknown error'}`);
    }
  };

  const markRead = async (ticketId, readValue) => {
    const nextStatus = readValue ? 'read' : 'unread';
    const previousStatus = readValue ? 'unread' : 'read';
    updateEmailInState(ticketId, (email) => ({ ...email, status: nextStatus }));
    try {
      await careApi.markEmailRead(ticketId, readValue);
      setSuccess(readValue ? 'Marked as read' : 'Marked as unread');
    } catch (err) {
      updateEmailInState(ticketId, (email) => ({ ...email, status: previousStatus }));
      setError(`Failed to update read status: ${err?.message || 'Unknown error'}`);
    }
  };

  const archiveEmail = async (ticketId) => {
    const snapshot = emails.find((email) => email.id === ticketId);
    removeEmailFromState(ticketId);
    try {
      await careApi.archiveEmail(ticketId);
      setSuccess('Email archived');
    } catch (err) {
      if (snapshot) setEmails((prev) => [snapshot, ...prev]);
      setError(`Failed to archive email: ${err?.message || 'Unknown error'}`);
    }
  };

  const deleteEmail = async (ticketId) => {
    const snapshot = emails.find((email) => email.id === ticketId);
    removeEmailFromState(ticketId);
    try {
      await careApi.deleteEmail(ticketId);
      setSuccess('Email deleted');
    } catch (err) {
      if (snapshot) setEmails((prev) => [snapshot, ...prev]);
      setError(`Failed to delete email: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleReplyAttachment = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setError('File size too large. Maximum 10MB.');
    setReplyAttachment(file);
  };

  const handleComposeAttachment = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setError('File size too large. Maximum 10MB.');
    setComposeAttachment(file);
  };

  const unreadCount = useMemo(() => emails.filter((email) => email.status === 'unread').length, [emails]);
  const starredCount = useMemo(() => emails.filter((email) => email.starred).length, [emails]);
  const attachmentCount = useMemo(() => emails.filter((email) => email.hasAttachments).length, [emails]);

  const filteredEmails = useMemo(() => {
    const text = deferredSearchTerm.trim().toLowerCase();
    return emails.filter((email) => {
      const matchesSearch =
        text.length === 0 ||
        email.subject.toLowerCase().includes(text) ||
        email.from.toLowerCase().includes(text) ||
        email.message.toLowerCase().includes(text);

      const matchesTab =
        activeTab === 'inbox' ||
        (activeTab === 'unread' && email.status === 'unread') ||
        (activeTab === 'starred' && email.starred);

      const matchesCategory =
        categoryFilter === 'all' || (email.category || '').toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesTab && matchesCategory;
    });
  }, [emails, deferredSearchTerm, activeTab, categoryFilter]);

  useEffect(() => {
    fetchEmails(currentPage);
    const interval = setInterval(() => fetchEmails(currentPage, true), 30000);
    return () => clearInterval(interval);
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 180);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!error && !success) return undefined;
    const timer = setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, success]);

  return (
    <div className="email-support-page">
      {(error || success) && (
        <div className={`email-toast ${error ? 'toast-error' : 'toast-success'}`}>
          <div className="toast-content">
            {error ? <FaExclamationCircle /> : <FaEnvelope />}
            <span>{error || success}</span>
          </div>
          <button type="button" onClick={() => { setError(''); setSuccess(''); }} aria-label="Dismiss">x</button>
        </div>
      )}

      <div className="email-shell">
        <header className="email-shell-header">
          <div className="email-shell-title">
            <Link to="/care" className="back-chip">
              <MdArrowBack /> Back
            </Link>
            <h2>Email Support</h2>
          </div>
          <button type="button" className="refresh-btn" onClick={() => fetchEmails(currentPage)} disabled={refreshing}>
            {refreshing ? <FaSpinner className="spinner" /> : <FaSync />}
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </header>

        <div className="email-layout">
          <aside className="email-sidebar">
            <button type="button" className="compose-btn" onClick={() => setComposeOpen(true)}>
              <FaPlus /> Compose
            </button>

            <div className="sidebar-tabs">
              <button type="button" className={`sidebar-tab ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')}>
                <FaInbox /> Inbox <span className="tab-count">{emails.length}</span>
              </button>
              <button type="button" className={`sidebar-tab ${activeTab === 'unread' ? 'active' : ''}`} onClick={() => setActiveTab('unread')}>
                <FaEnvelope /> Unread <span className="tab-count">{unreadCount}</span>
              </button>
              <button type="button" className={`sidebar-tab ${activeTab === 'starred' ? 'active' : ''}`} onClick={() => setActiveTab('starred')}>
                <FaStar /> Starred <span className="tab-count">{starredCount}</span>
              </button>
            </div>

            <div className="sidebar-stats">
              <h5>Mailbox Summary</h5>
              <div className="stat-item"><span>Total</span><strong>{emails.length}</strong></div>
              <div className="stat-item"><span>Unread</span><strong>{unreadCount}</strong></div>
              <div className="stat-item"><span>Starred</span><strong>{starredCount}</strong></div>
              <div className="stat-item"><span>Attachments</span><strong>{attachmentCount}</strong></div>
            </div>
          </aside>

          <main className="email-main">
            <div className="email-toolbar">
              <div className="search-box">
                <FaSearch />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by subject, sender, or message"
                />
              </div>

              <div className="toolbar-actions">
                <select className="filter-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="all">All Categories</option>
                  <option value="support">Support</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                  <option value="urgent">Urgent</option>
                </select>

                <div className="pagination-controls">
                  <button type="button" onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))} disabled={currentPage === 0 || loading}>
                    Previous
                  </button>
                  <span>Page {currentPage + 1} of {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1 || loading}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <section className="email-list">
              {loading && emails.length === 0 ? (
                <div className="loading-state">
                  <FaSpinner className="spinner" />
                  <p>Loading emails...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="empty-state">
                  <FaEnvelope />
                  <h4>No emails found</h4>
                  <p>Try another filter or refresh inbox.</p>
                </div>
              ) : (
                <>
                  <div className="list-header">
                    <span>Showing {filteredEmails.length} of {emails.length} emails</span>
                  </div>
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`email-item ${email.status === 'unread' ? 'unread' : ''} ${selectedEmail?.id === email.id ? 'selected' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => fetchEmailDetails(email.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') fetchEmailDetails(email.id);
                      }}
                    >
                      <button
                        type="button"
                        className="icon-btn icon-star"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleStar(email.id, !email.starred);
                        }}
                        title={email.starred ? 'Unstar email' : 'Star email'}
                      >
                        {email.starred ? <FaStar /> : <FaRegStar />}
                      </button>

                      <span className="sender-avatar"><FaUser /></span>

                      <span className="email-summary">
                        <strong>{email.from}</strong>
                        <span className="email-subject">
                          {email.subject}
                          {email.priority === 'high' && <FaExclamationTriangle className="priority-icon" />}
                        </span>
                      </span>

                      <span className="email-attachment">{email.hasAttachments ? <FaPaperclip /> : null}</span>
                      <span className="email-time">{formatEmailDate(email.date)}</span>
                    </div>
                  ))}
                </>
              )}
            </section>
          </main>

          {selectedEmail && (
            <section className="email-details">
              <div className="details-header">
                <div>
                  <h3>{selectedEmail.subject}</h3>
                  <p>{selectedEmail.category}</p>
                </div>
                <button type="button" className="close-details" onClick={() => setSelectedEmail(null)}>x</button>
              </div>

              <div className="details-body">
                <div className="details-actions">
                  <button type="button" className="small-action-btn" onClick={() => markRead(selectedEmail.id, selectedEmail.status !== 'read')}>
                    {selectedEmail.status === 'read' ? <FaEnvelope /> : <FaEnvelopeOpen />}
                    {selectedEmail.status === 'read' ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <button type="button" className="small-action-btn" onClick={() => toggleStar(selectedEmail.id, !selectedEmail.starred)}>
                    {selectedEmail.starred ? <FaStar /> : <FaRegStar />}
                    {selectedEmail.starred ? 'Unstar' : 'Star'}
                  </button>
                  <button type="button" className="small-action-btn danger" onClick={() => archiveEmail(selectedEmail.id)}>
                    <FaArchive /> Archive
                  </button>
                  <button type="button" className="small-action-btn danger" onClick={() => deleteEmail(selectedEmail.id)}>
                    <FaTrash /> Delete
                  </button>
                </div>

                <div className="sender-info-large">
                  <span className="sender-avatar-large"><FaUser /></span>
                  <div>
                    <h4>{selectedEmail.fromName}</h4>
                    <p>{selectedEmail.from}</p>
                    <small className="email-date"><FaClock /> {format(new Date(selectedEmail.date), 'PPP p')}</small>
                  </div>
                </div>

                <div className="email-message">{selectedEmail.message || 'No message content'}</div>

                {Array.isArray(selectedEmail.attachments) && selectedEmail.attachments.length > 0 && (
                  <div className="email-attachments">
                    <h5><FaPaperclip /> Attachments ({selectedEmail.attachments.length})</h5>
                    <div className="attachment-list">
                      {selectedEmail.attachments.map((attachment, index) => (
                        <div key={`${attachment.name || 'attachment'}-${index}`} className="attachment-item">
                          <FaPaperclip />
                          <span>{attachment.name || `Attachment ${index + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="reply-section">
                  <h5><FaReply /> Reply</h5>
                  <textarea
                    className="reply-textarea"
                    placeholder="Type your reply message..."
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    rows={6}
                    disabled={sendingReply}
                  />

                  <div className="reply-actions">
                    <div className="attachment-upload">
                      <label htmlFor="email-attachment-upload" className="upload-label">
                        <FaPaperclip /> Attach File
                      </label>
                      <input id="email-attachment-upload" type="file" onChange={handleReplyAttachment} hidden disabled={sendingReply} />
                      {replyAttachment && <span className="attachment-name">{replyAttachment.name}</span>}
                    </div>

                    <div className="reply-buttons">
                      <button
                        type="button"
                        className="cancel-btn"
                        disabled={sendingReply}
                        onClick={() => {
                          setReplyMessage('');
                          setReplyAttachment(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button type="button" className="send-btn" disabled={sendingReply || !replyMessage.trim()} onClick={handleSendReply}>
                        {sendingReply ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
                        {sendingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {composeOpen && (
        <div className="compose-modal-overlay" onClick={() => !composing && setComposeOpen(false)}>
          <div className="compose-modal" onClick={(event) => event.stopPropagation()}>
            <div className="compose-modal-header">
              <h3>Compose Email</h3>
              <button type="button" className="close-details" onClick={() => !composing && setComposeOpen(false)}>x</button>
            </div>
            <div className="compose-modal-body">
              <label htmlFor="compose-to">To</label>
              <input
                id="compose-to"
                type="email"
                value={composeForm.to}
                onChange={(event) => setComposeForm((prev) => ({ ...prev, to: event.target.value }))}
                placeholder="customer@email.com"
                className="compose-input"
              />

              <label htmlFor="compose-subject">Subject</label>
              <input
                id="compose-subject"
                type="text"
                value={composeForm.subject}
                onChange={(event) => setComposeForm((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Email subject"
                className="compose-input"
              />

              <label htmlFor="compose-message">Message</label>
              <textarea
                id="compose-message"
                value={composeForm.message}
                onChange={(event) => setComposeForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Type your email message..."
                className="compose-textarea"
                rows={8}
              />

              <div className="compose-attachment">
                <label htmlFor="compose-attachment-input" className="upload-label">
                  <FaPaperclip /> Attach File
                </label>
                <input id="compose-attachment-input" type="file" onChange={handleComposeAttachment} hidden />
                {composeAttachment && <span className="attachment-name">{composeAttachment.name}</span>}
              </div>

              <div className="compose-actions">
                <button type="button" className="cancel-btn" disabled={composing} onClick={() => setComposeOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="send-btn" disabled={composing} onClick={handleComposeSend}>
                  {composing ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
                  {composing ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailInbox;
