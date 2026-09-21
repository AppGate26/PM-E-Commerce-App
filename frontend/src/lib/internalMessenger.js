// Internal messaging now persists through the backend MessengerController.
// See messengerApi.js for conversations, messages, send and unread-count.
//
// The user "directory" is sourced live from the security users API, so these
// helpers are retained only as no-op shims to keep existing callers working.

export const upsertMessengerUser = () => [];

export const upsertMessengerUsers = () => [];

export const getMessengerUserDirectory = () => [];
