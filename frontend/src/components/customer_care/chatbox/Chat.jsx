import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import "./Chat.css";
import { CgAttachment } from "react-icons/cg";
import { IoIosArrowBack } from "react-icons/io";
import { FaPaperPlane, FaSyncAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { careApi } from "../../../lib/careApi";

const extractArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const root = payload.response ?? payload.data ?? payload.content ?? payload.items;
  if (Array.isArray(root)) return root;
  if (root && typeof root === "object") {
    const nested = root.content || root.items || root.data || root.chats || root.messages;
    if (Array.isArray(nested)) return nested;
  }
  const firstArray = Object.values(payload).find((value) => Array.isArray(value));
  return Array.isArray(firstArray) ? firstArray : [];
};

const extractCounts = (payload) => payload?.response || payload?.data || payload || {};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString();
};

const normalizeChat = (chat) => {
  const chatId = chat.id || chat.chatId || chat.chatID || chat.ticketId || chat.conversationId;
  const chatName =
    chat.name ||
    chat.userName ||
    chat.user ||
    chat.customerName ||
    chat.senderName ||
    chat.mobileUserName ||
    `Chat ${chatId}`;
  return {
    ...chat,
    id: chatId,
    name: chatName,
    lastMessage: chat.lastMessage || chat.message || chat.lastChat || chat.preview || "",
    lastTime: chat.lastMessageTime || chat.timestamp || chat.updatedAt || chat.createdAt,
    unreadCount: chat.unreadCount || chat.unreadMessages || 0,
  };
};

const normalizeMessage = (message, index = 0) => ({
  id: message.id || message.messageId || `msg-${Date.now()}-${index}`,
  message: message.message || message.content || "",
  sender: message.sender || message.senderType || message.from || "",
  timestamp: message.timestamp || message.createdAt || message.sentAt || new Date().toISOString(),
});

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchUnreadCounts = async () => {
    try {
      const response = await careApi.getChatsCount();
      setUnreadCounts(extractCounts(response));
    } catch {
      // silent fallback
    }
  };

  const fetchChats = async (silent = false) => {
    try {
      if (!silent) setLoadingChats(true);
      setRefreshing(true);

      const countsResponse = await careApi.getChatsCount();
      const counts = extractCounts(countsResponse);
      setUnreadCounts(counts);

      const activeCount = Number(counts?.activeChats ?? 0);
      if (activeCount <= 0) {
        setChats([]);
        return;
      }

      const response = await careApi.getChats();
      const list = extractArray(response).map(normalizeChat).filter((chat) => chat.id);
      setChats(list);

      if (activeChat?.id) {
        const synced = list.find((chat) => chat.id === activeChat.id);
        if (synced) setActiveChat(synced);
      }
    } catch (err) {
      toast.error(`Failed to load chats: ${err?.message || "Unknown error"}`);
      setChats([]);
    } finally {
      setLoadingChats(false);
      setRefreshing(false);
    }
  };

  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    try {
      setLoadingMessages(true);
      const response = await careApi.getChatMessages(chatId);
      const list = extractArray(response).map((msg, index) => normalizeMessage(msg, index));
      setMessages(list);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (err) {
      toast.error(`Failed to load messages: ${err?.message || "Unknown error"}`);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleUserClick = (chat) => {
    setActiveChat(chat);
    fetchMessages(chat.id);
  };

  const startNewChat = async () => {
    const name = window.prompt("Start a new chat with (customer/user name):", "");
    if (name === null) return;
    try {
      const response = await careApi.createChat({ userName: name?.trim() || "Guest" });
      const created = normalizeChat(response?.response ?? response?.data ?? response ?? {});
      await fetchChats(true);
      if (created?.id) {
        setActiveChat(created);
        setMessages([]);
        toast.success("Chat started successfully");
      }
    } catch (err) {
      toast.error(`Failed to start chat: ${err?.message || "Unknown error"}`);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sendingMessage) return;
    try {
      setSendingMessage(true);
      const payload = { message: newMessage.trim(), attachment: null };
      const response = await careApi.sendChatMessage(activeChat.id, payload);

      setMessages((prev) => [
        ...prev,
        normalizeMessage(
          response?.response || {
            message: newMessage.trim(),
            sender: "support",
            timestamp: new Date().toISOString(),
          }
        ),
      ]);
      setNewMessage("");
      fetchUnreadCounts();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (err) {
      toast.error(`Failed to send message: ${err?.message || "Unknown error"}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const resolvedUnreadCount = (chat) => unreadCounts?.[chat.id] ?? chat.unreadCount ?? 0;

  const totalActiveChats = useMemo(
    () => Number(unreadCounts?.activeChats ?? chats.length ?? 0),
    [unreadCounts, chats.length]
  );

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats(true);
      if (activeChat?.id) fetchMessages(activeChat.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeChat?.id]);

  return (
    <div className="chat-page">

      <div className="chat-shell">
        <aside className={`chat-sidebar ${activeChat ? "mobile-hide" : ""}`}>
          <div className="chat-sidebar-header">
            <h3>
              <Link to="/care" className="chat-back-link">
                <IoIosArrowBack />
              </Link>
              Live Chat
            </h3>
            <div className="chat-header-actions">
              <button type="button" className="chat-new" onClick={startNewChat} title="Start a new chat">
                + New
              </button>
              <button type="button" className="chat-refresh" onClick={() => fetchChats()} disabled={refreshing}>
                <FaSyncAlt className={refreshing ? "spin" : ""} />
              </button>
            </div>
          </div>
          <p className="chat-sidebar-meta">{totalActiveChats} active conversation(s)</p>

          {loadingChats ? (
            <div className="chat-empty">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="chat-empty">No chats available</div>
          ) : (
            <ul className="chat-list">
              {chats.map((chat) => {
                const unread = resolvedUnreadCount(chat);
                return (
                  <li
                    key={chat.id}
                    className={`chat-list-item ${activeChat?.id === chat.id ? "active" : ""}`}
                    onClick={() => handleUserClick(chat)}
                  >
                    <div className="avatar">{chat.name.charAt(0).toUpperCase()}</div>
                    <div className="item-main">
                      <strong>{chat.name}</strong>
                      <p>{chat.lastMessage || "No message yet"}</p>
                    </div>
                    <div className="item-meta">
                      {chat.lastTime && <small>{formatTime(chat.lastTime)}</small>}
                      {unread > 0 && <span className="unread">{unread}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main className={`chat-main ${!activeChat ? "mobile-hide" : ""}`}>
          {activeChat ? (
            <>
              <header className="chat-main-header">
                <button type="button" className="mobile-back" onClick={() => setActiveChat(null)}>
                  <IoIosArrowBack />
                </button>
                <div className="avatar">{activeChat.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h4>{activeChat.name}</h4>
                  <p>Conversation ID: {activeChat.id}</p>
                </div>
              </header>

              <section className="chat-messages">
                {loadingMessages ? (
                  <div className="chat-empty">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty">No messages yet</div>
                ) : (
                  messages.map((message, index) => {
                    const sender = String(message.sender).toLowerCase();
                    const isSupport =
                      sender === "user" ||
                      sender.includes("agent") ||
                      sender.includes("admin") ||
                      sender.includes("support");
                    const showDate =
                      index === 0 || formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);

                    return (
                      <React.Fragment key={message.id}>
                        {showDate && <div className="date-divider">{formatDate(message.timestamp)}</div>}
                        <div className={`bubble ${isSupport ? "support" : "customer"}`}>
                          <span>{message.message}</span>
                          <small>{formatTime(message.timestamp)}</small>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </section>

              <footer className="chat-composer">
                <textarea
                  className="composer-input"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={sendingMessage}
                />
                <button type="button" className="attach-btn" title="Attachment">
                  <CgAttachment />
                </button>
                <button
                  type="button"
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                >
                  <FaPaperPlane />
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </footer>
            </>
          ) : (
            <div className="chat-empty center">
              <h4>Select a chat</h4>
              <p>Pick a conversation from the left panel to start replying.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;
