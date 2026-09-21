import { toast } from 'react-toastify';

class NotificationSocket {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  /**
   * Connect to WebSocket server for real-time notifications
   */
  connect(userId) {
    if (this.connected || !userId) return;

    this.userId = userId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}/ws/notifications`;

    try {
      this.socket = new WebSocket(socketUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected for notifications');
        this.connected = true;
        this.reconnectAttempts = 0;

        // Subscribe to personal notifications
        this.subscribe(`/user/${userId}/queue/notifications`);
        this.subscribe(`/user/${userId}/queue/care-notifications`);
        this.subscribe('/topic/notifications');

        this.emit('connected');
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleNotification(message);
        } catch (e) {
          console.error('Error parsing notification:', e);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.connected = false;
        this.reconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.reconnect();
    }
  }

  /**
   * Subscribe to a notification channel
   */
  subscribe(channel) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot subscribe to', channel);
      return;
    }

    const subscriptionMessage = {
      command: 'SUBSCRIBE',
      id: channel,
      destination: channel,
    };

    this.socket.send(JSON.stringify(subscriptionMessage));
  }

  /**
   * Handle incoming notification
   */
  handleNotification(notification) {
    const { type, title, message, priority } = notification;

    // Show toast based on notification type
    switch (type) {
      case 'INCOMING_CALL':
        toast.error(`☎️ ${title}: ${message}`, { autoClose: false });
        this.emit('incoming-call', notification);
        break;

      case 'QUEUE_UPDATE':
        toast.info(`📋 ${title}: ${message}`, { autoClose: 5000 });
        this.emit('queue-update', notification);
        break;

      case 'CALL_ACCEPTED':
        toast.success(`✅ ${title}`, { autoClose: 3000 });
        this.emit('call-accepted', notification);
        break;

      case 'CALL_DECLINED':
        toast.warning(`⚠️ ${title}`, { autoClose: 3000 });
        this.emit('call-declined', notification);
        break;

      case 'CALL_ENDED':
        toast.info(`📞 ${title}`, { autoClose: 3000 });
        this.emit('call-ended', notification);
        break;

      case 'CHAT_MESSAGE':
        toast.info(`💬 ${title}: ${message}`, { autoClose: 5000 });
        this.emit('chat-message', notification);
        break;

      case 'CHAT_STARTED':
        toast.success(`💬 ${title}`, { autoClose: 3000 });
        this.emit('chat-started', notification);
        break;

      case 'ESCALATION':
        toast.warning(`⬆️ ${title}: ${message}`, { autoClose: 4000 });
        this.emit('escalation', notification);
        break;

      case 'SUPPORT_RESOLVED':
        toast.success(`✨ ${title}: ${message}`, { autoClose: 3000 });
        this.emit('support-resolved', notification);
        break;

      default:
        if (priority === 'HIGH') {
          toast.info(`🔔 ${title}: ${message}`, { autoClose: 5000 });
        } else {
          toast.info(`${title}: ${message}`, { autoClose: 3000 });
        }
        this.emit('notification', notification);
    }
  }

  /**
   * Send notification to server
   */
  sendNotification(notification) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send notification');
      return false;
    }

    const message = {
      command: 'SEND',
      destination: '/app/notifications/send',
      body: JSON.stringify(notification),
    };

    this.socket.send(JSON.stringify(message));
    return true;
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  /**
   * Emit events
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(data));
  }

  /**
   * Attempt to reconnect
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect-failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(this.userId);
    }, this.reconnectDelay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.listeners = {};
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const notificationSocket = new NotificationSocket();
