package com.appGate.account.service;

import com.appGate.account.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Helper service for sending care module notifications.
 * This provides convenient methods for other services to send notifications
 * for incoming calls, queue updates, chat messages, etc.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CareNotificationHelper {

    private final RealTimeNotificationService realTimeNotificationService;

    /**
     * Notify user of incoming call
     * @param userId The user receiving the call
     * @param callerName Name of the caller
     * @param callerPhone Phone number of the caller
     * @param callId ID of the incoming call
     */
    public void notifyIncomingCall(Long userId, String callerName, String callerPhone, Long callId) {
        realTimeNotificationService.sendIncomingCallNotification(userId, callerName, callerPhone, callId);
    }

    /**
     * Notify user of queue position update
     * @param userId The user in queue
     * @param queuePosition Current position in queue
     * @param totalInQueue Total calls waiting in queue
     */
    public void notifyQueueUpdate(Long userId, int queuePosition, int totalInQueue) {
        realTimeNotificationService.sendQueueUpdateNotification(userId, queuePosition, totalInQueue);
    }

    /**
     * Notify user that their call was accepted by an agent
     * @param userId The user whose call was accepted
     * @param agentName Name of the agent accepting the call
     * @param callId ID of the call
     */
    public void notifyCallAccepted(Long userId, String agentName, Long callId) {
        realTimeNotificationService.sendCareNotification(
                userId,
                "Call Accepted",
                "Agent " + agentName + " has accepted your call",
                NotificationType.CALL_ACCEPTED,
                callId
        );
    }

    /**
     * Notify user that their call was declined
     * @param userId The user whose call was declined
     * @param callId ID of the call
     */
    public void notifyCallDeclined(Long userId, Long callId) {
        realTimeNotificationService.sendCareNotification(
                userId,
                "Call Declined",
                "Your call has been declined. Please try again.",
                NotificationType.CALL_DECLINED,
                callId
        );
    }

    /**
     * Notify user that their call has ended
     * @param userId The user whose call ended
     * @param duration Duration of the call in seconds
     * @param callId ID of the call
     */
    public void notifyCallEnded(Long userId, long duration, Long callId) {
        String durationStr = formatDuration(duration);
        realTimeNotificationService.sendCareNotification(
                userId,
                "Call Ended",
                "Your call has ended. Duration: " + durationStr,
                NotificationType.CALL_ENDED,
                callId
        );
    }

    /**
     * Notify user of new chat message
     * @param userId The user receiving the message
     * @param senderName Name of the sender
     * @param messagePreview Preview of the message
     * @param chatId ID of the chat conversation
     */
    public void notifyChatMessage(Long userId, String senderName, String messagePreview, Long chatId) {
        realTimeNotificationService.sendChatNotification(userId, senderName, messagePreview, chatId);
    }

    /**
     * Notify user that a new chat conversation has started
     * @param userId The user the chat is for
     * @param senderName Name of the person starting the chat
     * @param chatId ID of the chat conversation
     */
    public void notifyChatStarted(Long userId, String senderName, Long chatId) {
        realTimeNotificationService.sendCareNotification(
                userId,
                "New Chat",
                senderName + " has started a chat conversation",
                NotificationType.CHAT_STARTED,
                chatId
        );
    }

    /**
     * Notify user that their issue has been escalated
     * @param userId The user whose issue was escalated
     * @param department Department the issue was escalated to
     * @param ticketId ID of the support ticket
     */
    public void notifyEscalation(Long userId, String department, Long ticketId) {
        realTimeNotificationService.sendCareNotification(
                userId,
                "Issue Escalated",
                "Your issue has been escalated to " + department + " department",
                NotificationType.ESCALATION,
                ticketId
        );
    }

    /**
     * Notify user that their support issue has been resolved
     * @param userId The user whose issue was resolved
     * @param ticketId ID of the support ticket
     */
    public void notifySupportResolved(Long userId, Long ticketId) {
        realTimeNotificationService.sendCareNotification(
                userId,
                "Issue Resolved",
                "Your support issue has been resolved. Thank you for your patience!",
                NotificationType.SUPPORT_RESOLVED,
                ticketId
        );
    }

    /**
     * Helper method to format duration in seconds to readable string
     */
    private String formatDuration(long seconds) {
        if (seconds < 60) {
            return seconds + " seconds";
        }
        long minutes = seconds / 60;
        long secs = seconds % 60;
        if (minutes < 60) {
            return minutes + " min " + secs + " sec";
        }
        long hours = minutes / 60;
        minutes = minutes % 60;
        return hours + " hr " + minutes + " min";
    }
}
