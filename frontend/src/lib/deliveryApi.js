import { apiRequest, apiRequestMultipart } from "./config";

const asArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.response)) return response.response;
  if (Array.isArray(response?.response?.data)) return response.response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.riders)) return response.riders;
  return [];
};

const asObject = (response) => {
  if (!response || typeof response !== "object") return null;
  return response?.data || response?.response?.data || response?.response || response;
};

export const deliveryApi = {
  // Rider operations
  createRider: (formData) =>
    apiRequestMultipart("/admin/createRiderInfo", "POST", formData, true),

  updateRider: (riderId, formData) =>
    apiRequestMultipart(`/admin/updateRiderInfo/${riderId}`, "PUT", formData, true),

  getRiders: async () => {
    const response = await apiRequest("/admin/riders", "GET");
    return asArray(response);
  },

  getRiderById: async (riderId) => {
    const response = await apiRequest(`/users/rider/${riderId}`, "GET");
    return asObject(response);
  },

  deleteRider: (riderId) => apiRequest(`/admin/riders/${riderId}`, "DELETE"),

  suspendRider: (riderId, reasonForSuspension) =>
    apiRequest(`/admin/suspendRider/${riderId}`, "PUT", {
      reasonForSuspension,
    }),

  getSuspendedRiders: async () => {
    const response = await apiRequest("/admin/getAllSuspendRider", "GET");
    return asArray(response);
  },

  unblockRider: (riderId, reasonForUnblocking) =>
    apiRequest(`/admin/unblockRider/${riderId}`, "PUT", {
      reasonForUnblocking,
    }),

  // Delivery management
  getTransitDeliveries: async () => {
    const response = await apiRequest("/admin/transit-deliveries?size=500", "GET");
    return asArray(response);
  },

  // Transit rows started by a rider carry riderBoxId (closes the rider's trip too); rows
  // only put in transit by an admin SHIPPED update have just an orderId.
  markTransitDelivered: (delivery) =>
    delivery?.riderBoxId
      ? apiRequest(`/admin/deliver/${delivery.riderBoxId}`, "PUT")
      : apiRequest(`/admin/mark-delivered/${delivery.orderId}`, "PUT"),

  getDeliveryNotifications: async () => {
    const response = await apiRequest("/admin/delivery-notifications", "GET");
    return asArray(response);
  },

  getDeliveryNotificationById: async (notificationId) => {
    const response = await apiRequest(
      `/admin/delivery-notifications/${notificationId}`,
      "GET"
    );
    return asObject(response);
  },

  getRiderFeedback: async () => {
    const response = await apiRequest("/admin/rider-feedback", "GET");
    return asArray(response);
  },

  // Feedback riders submit from the delivery app, joined to product/customer details.
  getDeliveryFeedback: async () => {
    const response = await apiRequest("/admin/delivery-feedback", "GET");
    return asArray(response);
  },

  // Rider box operations
  getRiderBoxesByStatus: async (status) => {
    const response = await apiRequest(`/admin/rider-boxes?status=${status}`, "GET");
    return asArray(response);
  },

  // Admin-approved online orders available to hand to a rider (Rider Box Management's
  // "Order Reference" dropdown). Comes back as a Spring Page, so the array sits at
  // response.response.content rather than anywhere asArray() looks.
  getOrdersReadyForRider: async () => {
    const response = await apiRequest("/sales/orders/ready-for-rider?size=500", "GET");
    if (Array.isArray(response?.response?.content)) return response.response.content;
    return asArray(response);
  },

  getRiderBoxReport: async (riderId) => {
    const response = await apiRequest(`/admin/reports/rider-box/${riderId}`, "GET");
    return asArray(response);
  },

  getDeliveryReport: async () => {
    const response = await apiRequest("/admin/reports/deliveries", "GET");
    return asArray(response);
  },

  getTransitReport: async () => {
    const response = await apiRequest("/admin/reports/transit", "GET");
    return asArray(response);
  },

  getRiderInfoReport: async () => {
    return apiRequest("/admin/reports/rider-info", "GET");
  },

  getRiderBoxDisplayReport: async (riderId, queryString = "") => {
    const suffix = queryString ? `?${queryString}` : "";
    const response = await apiRequest(`/admin/reports/rider-box-display/${riderId}${suffix}`, "GET");
    return asArray(response);
  },

  assignProductToRider: (payload) =>
    apiRequest("/admin/assign-product", "POST", payload),

  acceptRiderBox: (riderBoxId) => apiRequest(`/admin/accept/${riderBoxId}`, "PUT"),
  rejectRiderBox: (riderBoxId) => apiRequest(`/admin/reject/${riderBoxId}`, "PUT"),
  deliverRiderBox: (riderBoxId) => apiRequest(`/admin/deliver/${riderBoxId}`, "PUT"),
};
