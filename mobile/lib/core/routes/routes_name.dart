class AppRoutes {
  // Auth Routes
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';

  // Main App Routes
  static const String home = '/home';
  static const String cart = '/cart';
  static const String history = '/history';
  static const String itemPurchase = '/item-purchase';
  static const String installmentPayment = '/installment-payment';
  static const String account = '/account';
  static const String profile = '/profile';
  static const String defaultRatings = '/default-ratings';
  static const String verificationCentre = '/verification-centre';
  static const String personalInformation = '/personal-information';
  static const String guarantorInformation = '/guarantor-information';
  static const String employmentInformation = '/employment-information';
  static const String bvnNinVerification = '/bvn-nin-verification';
  static const String bankAccount = '/bank-account';
  static const String termsConditions = '/terms-conditions';
  static const String instalmentAgreement = '/instalment-agreement';
  static const String socials = '/socials';
  static const String notifications = '/notifications';
  static const String pmWallet = '/pm-wallet';
  static const String addMoney = '/add-money';
  static const String paymentWebView = '/payment-webview';

  // products routes
  static const String productScreen = '/products';
  static const String productDetailScreen = '/product-detail';
  static const String quickPickProducts = '/quick-pick-products';
  

  // payment routes
  static const String pickupScreen = '/pickup';
  static const String deliveryScreen = '/delivery';
  static const String PaymentBreakdownDelivery = '/payment-breakdown-delivery';
  static const String paymentBreakdownPickup = '/payment-breakdown-pickup';

  // payment frequency routes
  static const String paymentFreq = '/payment-freq';
  static const String paymentFreqPickup = '/freq-pickup';
  static const String installmentBreakdown = '/installment-breakdown';
  static const String installmentBreakdownDelivery =
      '/installment-breakdown-delivery';
  static const String paymentFreqBreakdownPickup = '/installment-pickup';
  static const String paymentFreqBreakdownDelivery = '/installment-delivery';
  static const String paymentFreqDelivery = '/freq-delivery';

  // Payment options
  static const String paymentOption = '/payment-option';
  static const String cardPayment = '/payment-card';
  static const String bankPayment = '/payment-bank';
  static const String bankAuth = '/bank-auth';

// pm wallet already defined up
  static const String bankTransferConfirm = '/bank-transfer-confirm';

// payment with card screen
  static const String paymentSuccess = '/payment-success';
  static const String cardList = '/card-list';




// payment with bank transfer

  static const String bankTransferSuccess = '/bank-transfer-success';
  static const String bankTransferError = '/bank-transfer-error';

// payment with pm wallet
  static const String pmBankTransfer = '/pm-bank-transfer';
  static const String bankReview = '/bank-review';
  static const String verifyingScreen = '/verifying';

  // payment with bank


// delivery
  static const String deliverySplash = '/delivery-splash';
  static const String deliveryHome = '/delivery-home';
  static const String pendingDeliveries = '/pending';
  static const String newDelivery = '/new-delivery';
  static const String deliveryConfirmation = '/delivery-confirmation';
  static const String deliveryHistory = '/delivery-history';
  static const String deliveryAbout = '/delivery-about';
  static const String deliveryForgotPassword = '/delivery-forgot-password';
  static const String deliveryChangePassword = '/delivery-change-password';

// recovery screen
  static const String recoverySplash = '/recovery-splash';
  static const String recoveryHome = '/recovery-home';
  static const String goodsToBeRecovered = '/goods-to-be-recovered';
  static const String recoveryReport = '/recovery-report';
  static const String recoveryLogin = '/recovery-login';
  static const String recoveryDetails = '/recovery-details';
  static const String customerDetail = '/customer-details';
  static const String recoveredDetails = '/recovered-details';

  static const String recoveryUpload = '/recovery-upload';
  static const String recoveryPreview = '/recovery-preview';
  static const String recoveryChangePassword = '/recovery-change-password';

  // contact screen
  static const String customerCare = '/customer-care';
  static const String liveChat = '/live-chat';
  static const String emailSupport = '/email-support';
  static const String phoneSupport = '/phone-support';

  // buy once
  // Add these to routes_name.dart
  static const String checkoutScreen = '/checkout';
   static const String pmTerms = '/pm-terms';
    static const String paymentCards = '/payment-cards';
}
