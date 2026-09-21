import { useEffect } from 'react';
import { notificationSocket } from '../lib/notificationSocket';

/**
 * Custom hook for managing real-time notifications
 * Usage:
 *   const { isConnected } = useNotifications(userId);
 *   // Or with handlers:
 *   useNotifications(userId, {
 *     onIncomingCall: (call) => console.log('Call:', call),
 *     onQueueUpdate: (queue) => console.log('Queue:', queue)
 *   })
 */
export function useNotifications(userId, handlers = {}) {
  useEffect(() => {
    if (!userId) return;

    // Connect to notification socket
    notificationSocket.connect(userId);

    // Register event handlers
    if (handlers.onConnected) {
      notificationSocket.on('connected', handlers.onConnected);
    }

    if (handlers.onIncomingCall) {
      notificationSocket.on('incoming-call', handlers.onIncomingCall);
    }

    if (handlers.onQueueUpdate) {
      notificationSocket.on('queue-update', handlers.onQueueUpdate);
    }

    if (handlers.onCallAccepted) {
      notificationSocket.on('call-accepted', handlers.onCallAccepted);
    }

    if (handlers.onCallDeclined) {
      notificationSocket.on('call-declined', handlers.onCallDeclined);
    }

    if (handlers.onCallEnded) {
      notificationSocket.on('call-ended', handlers.onCallEnded);
    }

    if (handlers.onChatMessage) {
      notificationSocket.on('chat-message', handlers.onChatMessage);
    }

    if (handlers.onChatStarted) {
      notificationSocket.on('chat-started', handlers.onChatStarted);
    }

    if (handlers.onEscalation) {
      notificationSocket.on('escalation', handlers.onEscalation);
    }

    if (handlers.onSupportResolved) {
      notificationSocket.on('support-resolved', handlers.onSupportResolved);
    }

    if (handlers.onError) {
      notificationSocket.on('error', handlers.onError);
    }

    if (handlers.onReconnectFailed) {
      notificationSocket.on('reconnect-failed', handlers.onReconnectFailed);
    }

    // Cleanup on unmount
    return () => {
      if (handlers.onConnected) {
        notificationSocket.off('connected', handlers.onConnected);
      }
      if (handlers.onIncomingCall) {
        notificationSocket.off('incoming-call', handlers.onIncomingCall);
      }
      if (handlers.onQueueUpdate) {
        notificationSocket.off('queue-update', handlers.onQueueUpdate);
      }
      if (handlers.onCallAccepted) {
        notificationSocket.off('call-accepted', handlers.onCallAccepted);
      }
      if (handlers.onCallDeclined) {
        notificationSocket.off('call-declined', handlers.onCallDeclined);
      }
      if (handlers.onCallEnded) {
        notificationSocket.off('call-ended', handlers.onCallEnded);
      }
      if (handlers.onChatMessage) {
        notificationSocket.off('chat-message', handlers.onChatMessage);
      }
      if (handlers.onChatStarted) {
        notificationSocket.off('chat-started', handlers.onChatStarted);
      }
      if (handlers.onEscalation) {
        notificationSocket.off('escalation', handlers.onEscalation);
      }
      if (handlers.onSupportResolved) {
        notificationSocket.off('support-resolved', handlers.onSupportResolved);
      }
      if (handlers.onError) {
        notificationSocket.off('error', handlers.onError);
      }
      if (handlers.onReconnectFailed) {
        notificationSocket.off('reconnect-failed', handlers.onReconnectFailed);
      }
    };
  }, [userId, handlers]);

  return {
    isConnected: notificationSocket.isConnected(),
    socket: notificationSocket,
  };
}
