// core/constants/api_constants.dart

class ApiConstants {
  static const String baseUrl = 'https://3.143.17.59:8443/api';
  static const String imageBaseUrl = 'https://3.143.17.59:8443';

  // ============================================================
  // 🔐 AUTH ENDPOINTS
  // ============================================================
  static const String login = '$baseUrl/users/sign-in';
  static const String register = '$baseUrl/users/sign-up';
  static const String userProfile = '$baseUrl/users/profile';
  static const String updateUserProfile = '$baseUrl/users/update-profile';
  static const String forgotPassword = '$baseUrl/users/forget-password';
  static const String resetPassword = '$baseUrl/users/reset-password';

  // ============================================================
  // 📍 LOCATION ENDPOINTS
  // ============================================================
  static const String states = '$baseUrl/states';
  static String lgasByState(int stateId) => '$states/$stateId/lgas';
  static String wardsByLga(int lgaId) => '$baseUrl/lgas/$lgaId/wards';

  // ============================================================
  // 🚚 DELIVERY AGENT ENDPOINTS
  // ============================================================
  static const String deliveryAgentBase = '$baseUrl/delivery-agent';
  static const String deliveryAgentLogin = '$deliveryAgentBase/auth/login';
  static const String deliveryAgentForgotPassword =
      '$deliveryAgentBase/auth/forgot-password';
  static const String deliveryAgentResetPassword =
      '$deliveryAgentBase/auth/reset-password';
  static String deliveryAgentChangePassword(int riderId) =>
      '$deliveryAgentBase/auth/change-password/$riderId';
  static String deliveryAgentPendingDeliveries(int riderId) =>
      '$deliveryAgentBase/pending-deliveries/$riderId';
  static String deliveryAgentHistory(int riderId) =>
      '$deliveryAgentBase/history/$riderId';
  static String deliveryAgentDetail(int riderBoxId) =>
      '$deliveryAgentBase/delivery/$riderBoxId';
  static const String deliveryAgentConfirmDelivery =
      '$deliveryAgentBase/confirm-delivery';
  static const String deliveryAgentSubmitFeedback =
      '$deliveryAgentBase/submit-feedback';

  // core/constants/api_constants.dart

// ============================================================
// ✅ VERIFICATION CENTER ENDPOINTS
// ============================================================

// ────────────────────────────────────────────────────────────
// 📝 PERSONAL INFORMATION (UPDATED)
// ────────────────────────────────────────────────────────────
// POST /api/users/personal-information                    - Save personal info
// GET  /api/users/verification/personal-information/me    - Get current user's personal info ✅ UPDATED
// GET  /api/users/verification/personal-information/{userId} - Get user's personal info (admin)
// GET  /api/users/verification/me                         - Get all verification data for current user
// GET  /api/users/verification/{userId}                  - Get verification data for user
// PUT  /api/users/verification/{userId}/personal         - Update personal info

  // static const String personalInfo = '$baseUrl/users/personal-information';
  static const String personalInfoMe =
      '$baseUrl/users/verification/personal-information/me';
  static String personalInfoByUserId(int userId) =>
      '$baseUrl/users/verification/personal-information/$userId';
  static String getUserVerificationMe = '$baseUrl/users/verification/me';

// ────────────────────────────────────────────────────────────
// 💼 EMPLOYMENT INFORMATION (UPDATED)
// ────────────────────────────────────────────────────────────
// POST /api/users/verifications/employment-information    - Save employment info
// PUT  /api/users/verification/{userId}/employment        - Update employment info
// GET  /api/users/verification/employment/me              - Get current user's employment info ✅ NEW
// GET  /api/users/verification/employment/{userId}        - Get user's employment info (admin)
  static const String employmentInformation =
      '$baseUrl/users/verifications/employment-information';
  static String updateEmploymentInfo(int userId) =>
      '$baseUrl/users/verification/$userId/employment';
  static const String employmentInfoMe =
      '$baseUrl/users/verification/employment/me';
  static String employmentInfoByUserId(int userId) =>
      '$baseUrl/users/verification/employment/$userId';

// ────────────────────────────────────────────────────────────
// 🏦 BANK ACCOUNT INFORMATION (UPDATED)
// ────────────────────────────────────────────────────────────
// POST /api/users/bank-details/save-and-update            - Save bank details
// GET  /api/users/bank-details/{userId}                   - Get bank details
// PUT  /api/users/verification/{userId}/bank-account      - Update bank account
// GET  /api/users/verification/bank-account/me            - Get current user's bank account ✅ NEW
// GET  /api/users/verification/bank-account/{userId}      - Get user's bank account (admin)
  static const String bankDetails =
      '$baseUrl/users/bank-details/save-and-update';
  static String getBankDetails(int userId) =>
      '$baseUrl/users/bank-details/$userId';
  static String updateBankAccount(int userId) =>
      '$baseUrl/users/verification/$userId/bank-account';
  static const String bankAccountMe =
      '$baseUrl/users/verification/bank-account/me';
  static String bankAccountByUserId(int userId) =>
      '$baseUrl/users/verification/bank-account/$userId';

// ────────────────────────────────────────────────────────────
// ✅ VERIFICATION STATUS & ACTIONS
// ────────────────────────────────────────────────────────────
// POST /api/verification/bvn                           - Verify BVN
// POST /api/verification/nin                           - Verify NIN
// GET  /api/verification/bvn/{bvn}                    - Get BVN details
// GET  /api/verification/nin/{nin}                    - Get NIN details
// GET  /api/verification/user/{userId}/is-verified    - Check if user is verified
// GET  /api/verification/user/{userId}                - Get user verification data
// GET  /api/verification/user/{userId}/type/{type}    - Get verification by type
// PUT  /api/users/verification/{userId}/bvn           - Update BVN
// PUT  /api/users/verification/{userId}/nin           - Update NIN
// PUT  /api/users/verification/{userId}/personal      - Update personal info
// PUT  /api/users/verification/{userId}/payment-card  - Update payment card
// POST /api/users/verification/{userId}/accept-terms  - Accept terms
// GET  /api/users/verification/{userId}               - Get user verification status
  static const String verifyBvn = '$baseUrl/verification/bvn';
  static const String verifyNin = '$baseUrl/verification/nin';
  static String getBvnDetails(String bvn) => '$baseUrl/verification/bvn/$bvn';
  static String getNinDetails(String nin) => '$baseUrl/verification/nin/$nin';
  static String isVerified(int userId) =>
      '$baseUrl/verification/user/$userId/is-verified';
  static String getUserVerificationByType(int userId, String type) =>
      '$baseUrl/verification/user/$userId/type/$type';
  static String getUserVerification(int userId) =>
      '$baseUrl/users/verification/$userId';
  static String updateBvn(int userId) =>
      '$baseUrl/users/verification/$userId/bvn';
  static String updateNin(int userId) =>
      '$baseUrl/users/verification/$userId/nin';
  static String updatePersonalInfo(int userId) =>
      '$baseUrl/users/verification/$userId/personal';
  static String updatePaymentCard(int userId) =>
      '$baseUrl/users/verification/$userId/payment-card';
  static const String paymentCards = '$baseUrl/payments/cards';
  static String paymentCardById(int cardId) => '$paymentCards/$cardId';

  static String acceptTerms(int userId) =>
      '$baseUrl/users/verification/$userId/accept-terms';
  static String paymentTermsByUserId(int userId) =>
      '$baseUrl/users/verification/$userId/payment-terms';

  static const String paymentTermsMe =
      '$baseUrl/users/verification/payment-terms/me';

  static String verifyBankAccount(int userId) =>
      '$baseUrl/users/verification/$userId/verify-bank-account';

  static const String verifyBankAccountMe =
      '$baseUrl/users/verification/bank-account/verify/me';
  // ────────────────────────────────────────────────────────────
  // 📋 LEGACY USER VERIFICATION ENDPOINTS (From Swagger)
  // ────────────────────────────────────────────────────────────
  static const String personalInformation =
      '$baseUrl/users/verifications/personal-information';

  // ============================================================
  // ❤️ WISHLIST ENDPOINTS
  // ============================================================
  static const String wishlists = '$baseUrl/users/wish-lists';
  static String wishlistByUserId(int userId) => '$wishlists/$userId';
  static String wishlistItem(int userId, int productId) =>
      '$wishlists/$userId/products/$productId';

  // ============================================================
  // 🔔 NOTIFICATION ENDPOINTS
  // ============================================================
  static const String notifications = '$baseUrl/notifications';
  static String notificationById(int notificationId) =>
      '$notifications/$notificationId';
  static String markNotificationRead(int notificationId) =>
      '$notifications/$notificationId/read';
  static String archiveNotification(int notificationId) =>
      '$notifications/$notificationId/archive';
  static String userNotifications(int userId) => '$notifications/user/$userId';
  static String userUnreadNotifications(int userId) =>
      '$notifications/user/$userId/unread';
  static String userNotificationsByType(int userId, String type) =>
      '$notifications/user/$userId/type/$type';
  static String userNotificationStats(int userId) =>
      '$notifications/user/$userId/stats';
  static String markAllNotificationsRead(int userId) =>
      '$notifications/user/$userId/read-all';

  // ============================================================
  // 📦 PRODUCT ENDPOINTS
  // ============================================================
  static const String products = '$baseUrl/products';
  static String productById(int productId) => '$products/$productId';
  static String productsByCategory(int categoryId) =>
      '$products/category/$categoryId';
  static const String categories = '$baseUrl/admin/categories';
  static String filterProductsByPrice = '$products/filter/price';
  static String productImages(String imagePath) =>
      '$products/images/$imagePath';
  static const String quickPick = '$baseUrl/users/quick-pick';
  static const String popularProductsToday =
      '$baseUrl/users/popular-products-today';

  // ============================================================
  // 🛒 CART ENDPOINTS
  // ============================================================
  static const String cart = '$baseUrl/cart';
  static String cartByUserId(int userId) => '$cart/$userId';
  static String cartSummary(int userId) => '$cart/$userId/summary';
  static String cartItem(int userId, int productId) =>
      '$cart/$userId/items/$productId';
  static const String addToCart = '$cart/add';
  static String clearCart(int userId) => '$cart/$userId/clear';

  // ============================================================
  // 📦 ORDER ENDPOINTS
  // ============================================================
  static const String orders = '$baseUrl/orders';
  static String orderById(int orderId) => '$orders/$orderId';
  static String orderByNumber(String orderNumber) =>
      '$orders/number/$orderNumber';
  static String userOrders(int userId) => '$orders/user/$userId';
  static String userOrdersNew(int userId) => '$orders/user/$userId/new';
  static String userOrdersByStatus(int userId, String status) =>
      '$orders/user/$userId/status/$status';
  static String userOrderStatistics(int userId) =>
      '$orders/user/$userId/statistics';
  static String riderOrders(int riderId) => '$orders/rider/$riderId';
  // static String updateOrderStatus(int orderId) => '$orders/$orderId/status';

  static String updateOrderStatus(int orderId, String status) =>
      '$baseUrl/orders/$orderId/status?status=$status';
  static String updateOrderPayment(int orderId) => '$orders/$orderId/payment';
  static String cancelOrder(int orderId) => '$orders/$orderId/cancel';
  static String assignRider(int orderId, int riderId) =>
      '$orders/$orderId/assign-rider/$riderId';
  static const String checkout = '$orders/checkout';
  static const String calculateDeliveryFee =
      '$baseUrl/checkout/calculate-delivery-fee';

  // ============================================================
  // 💰 WALLET ENDPOINTS
  // ============================================================
  static const String wallet = '$baseUrl/wallet';
  static String createWallet(int userId) => '$wallet/create/$userId';
  static const String addMoney = '$wallet/add-money';
  static const String transferFunds = '$wallet/transfer';
  static String walletTransactions(int userId, {int page = 0, int size = 20}) =>
      '$wallet/$userId/transactions?page=$page&size=$size';
  static String walletBalance(int userId) => '$wallet/$userId/balance';
  static String verifyFunding(String paymentReference) =>
      '$wallet/verify-funding/$paymentReference';
  static const String initializeBankTransfer =
      '$baseUrl/cashier/wallet/initialize-transfer';
  static String verifyBankTransferFunding(String reference) =>
      '$baseUrl/cashier/wallet/verify-funding/$reference';

  static String payOrderWithWallet(int orderId) =>
      '$baseUrl/orders/$orderId/pay/wallet';

  // Order-first purchase payment — order must already exist (POST
  // /api/orders/checkout) before either of these is called.
  static String payOrderByCard(int orderId) => '$orders/$orderId/pay/card';

  // ============================================================
  // 💳 PAYMENT ENDPOINTS
  // ============================================================
  // Order-less initialize — kept for wallet top-ups only, never for a
  // purchase (a purchase must go through payOrderByCard/payOrderWithWallet).
  static const String initializeCardPayment =
      '$baseUrl/payments/card/initialize';

  static const String initializeBankTransferPayment =
      '$baseUrl/payments/bank-transfer/initialize';

  // Bank (direct debit / USSD) channel. Like the two above it doubles as an
  // order-first purchase endpoint when `orderId` is included in the body.
  static const String initializeBankPayment =
      '$baseUrl/payments/bank/initialize';
  static String verifyPayment(String reference) =>
      '$baseUrl/payments/verify/$reference';
  static String verifyCardPayment(String reference) =>
      '$baseUrl/payments/verify/$reference';

  // ============================================================
  // 📊 INSTALLMENT ENDPOINTS
  // ============================================================
  static const String installments = '$baseUrl/installments';
  static const String calculateInstallment = '$installments/calculate';
  // Pays one specific installment row (NOT a plan id) from the wallet. The older
  // '/pay' variant is gone: it debited the wallet despite claiming otherwise, and a
  // plan id passed here by mistake paid an unrelated installment.
  static String payInstallment(int installmentId) =>
      '$installments/$installmentId/pay/wallet';
  // Ongoing payment for an already-started plan (orders/history page) —
  // targets the plan; backend resolves whichever installment is next due.
  // The first installment (down payment) is now collected order-first via
  // payOrderByCard/payOrderWithWallet, same as a one-off purchase.
  static String payNextInstallmentByWallet(int planId) =>
      '$installments/$planId/pay-next/wallet';
  // Pay off the entire remaining balance of an ongoing plan in one go —
  // same "resolve from planId, no body" shape as pay-next.
  static String payFullPlanByWallet(int planId) =>
      '$installments/$planId/pay-full/wallet';
  static String getInstallmentPlan(int planId) => '$installments/$planId';
  static String getInstallmentSchedule(int planId) =>
      '$installments/$planId/schedule';
  static String getUserInstallments(int userId) => '$installments/user/$userId';
  static String getUserUpcomingInstallments(int userId) =>
      '$installments/user/$userId/upcoming';

  // ============================================================
  // 📦 GOODS RECOVERY ENDPOINTS
  // ============================================================
  static const String goodsRecoveryBase = '$baseUrl/goods-recovery';
  static const String goodsRecoveryLogin = '$goodsRecoveryBase/auth/login';
  static const String goodsRecoveryForgotPassword =
      '$goodsRecoveryBase/auth/forgot-password';
  static const String goodsRecoveryResetPassword =
      '$goodsRecoveryBase/auth/reset-password';
  static String goodsRecoveryChangePassword(int riderId) =>
      '$goodsRecoveryBase/auth/change-password/$riderId';
  static const String goodsRecoveryMarkRecovered =
      '$goodsRecoveryBase/mark-recovered';
  static const String goodsRecoveryReports = '$goodsRecoveryBase/reports';
  static String goodsRecoveryReportById(int recoveryId) =>
      '$goodsRecoveryReports/$recoveryId';
  static const String goodsRecoveryPending = '$goodsRecoveryBase/pending';
  static String goodsRecoveryCustomer(int customerId) =>
      '$goodsRecoveryBase/customer/$customerId';

  // ============================================================
  // 🛠️ CUSTOMER CARE / SUPPORT ENDPOINTS
  // ============================================================
  // ────────────────────────────────────────────────────────────
  // SOCIAL MEDIA SUPPORT
  // ────────────────────────────────────────────────────────────
  static const String socialMedia = '$baseUrl/support/social-media';

  // ────────────────────────────────────────────────────────────
  // ESCALATIONS
  // ────────────────────────────────────────────────────────────
  static const String escalations = '$baseUrl/support/escalations';

  // ────────────────────────────────────────────────────────────
  // EMAIL SUPPORT
  // ────────────────────────────────────────────────────────────
  static const String supportEmails = '$baseUrl/support/emails';
  static String supportEmailById(String ticketId) => '$supportEmails/$ticketId';
  static String supportEmailReply(String ticketId) =>
      '$supportEmails/$ticketId/reply';

  // ────────────────────────────────────────────────────────────
  // LIVE CHAT SUPPORT
  // ────────────────────────────────────────────────────────────
  static const String chats = '$baseUrl/support/chats';
  static const String chatsCount = '$chats/count';
  static String chatMessages(String chatId) => '$chats/$chatId/messages';
  // Customer-facing "my conversation" endpoints — single conversation per
  // customer, created on first access, no chatId needed.
  static const String myChat = '$chats/mine';
  static const String myChatMessages = '$chats/mine/messages';

  // ────────────────────────────────────────────────────────────
  // PHONE CALL SUPPORT
  // ────────────────────────────────────────────────────────────
  static const String calls = '$baseUrl/support/calls';
  static const String callsQueue = '$calls/queue';
  static const String callsIncoming = '$calls/incoming';
  static const String callsIgnored = '$calls/ignored';
  static String callAccept(String callId) => '$calls/$callId/accept';
  static String callDecline(String callId) => '$calls/$callId/decline';
  static String callEnd(String callId) => '$calls/$callId/end';

  // ────────────────────────────────────────────────────────────
  // CALL LOGS
  // ────────────────────────────────────────────────────────────
  static const String callLog = '$baseUrl/support/call-log';
  static const String callLogRejected = '$callLog/rejected';
  static const String callLogReceived = '$callLog/received';
  static const String callLogMissed = '$callLog/missed';

  // ────────────────────────────────────────────────────────────
  // SUPPORT REPORTS
  // ────────────────────────────────────────────────────────────
  static const String reports = '$baseUrl/support/reports';
  static const String reportsUnansweredCalls = '$reports/unanswered-calls';
  static const String reportsReceivedCalls = '$reports/received-calls';

  // ============================================================
  // 🛠️ HELPER METHODS
  // ============================================================
  static String normalizeUrl(String url) {
    return url.replaceAll(RegExp(r'/+'), '/').replaceAll(':/', '://');
  }
}
