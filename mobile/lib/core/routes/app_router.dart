  import 'dart:typed_data';

  import 'package:flutter/material.dart';
  import 'package:go_router/go_router.dart';
  import 'package:pm_e_commerce_app/core/networks/api_client.dart';
  import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
  import 'package:pm_e_commerce_app/data/models/installment_models.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/login_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/register_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/forgot-password_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/reset-password_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/account_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/profile_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/default_ratings_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/terms_conditions_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/instalment_agreement_screen.dart';
  import 'package:pm_e_commerce_app/presentation/customer%20care/screens/customer_care_screen.dart';
  import 'package:pm_e_commerce_app/presentation/customer%20care/screens/email_support_screen.dart';
  import 'package:pm_e_commerce_app/presentation/customer%20care/screens/live_chat_screen.dart';
  import 'package:pm_e_commerce_app/presentation/customer%20care/screens/phone_support_screen.dart';
  import 'package:pm_e_commerce_app/presentation/delivery/screens/delivery_about_screen.dart';
  import 'package:pm_e_commerce_app/presentation/delivery/screens/delivery_change_password_screen.dart';
  import 'package:pm_e_commerce_app/presentation/delivery/screens/delivery_confirmation_screen.dart';
  import 'package:pm_e_commerce_app/presentation/delivery/screens/delivery_forgot_password_screen.dart';
  import 'package:pm_e_commerce_app/presentation/delivery/screens/delivery_history_screen.dart';
  import 'package:pm_e_commerce_app/presentation/delivery/screens/delivery_home_screen.dart';
  import 'package:pm_e_commerce_app/presentation/delivery/screens/delivery_splash_screen.dart';
  import 'package:pm_e_commerce_app/presentation/delivery/screens/new_delivery_screen.dart';
  import 'package:pm_e_commerce_app/presentation/delivery/screens/pending_deliveries_screen.dart';
  import 'package:pm_e_commerce_app/presentation/history/screens/item_purchase_screen.dart';
  import 'package:pm_e_commerce_app/presentation/history/screens/installment_payment_screen.dart';
  import 'package:pm_e_commerce_app/presentation/home/screens/quick_pick_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/buy%20once/checkout_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/bank_payment/bank_auth_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/bank_payment/bank_payment_screen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/customer_detail_screen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/goods_to_be_recovered_screen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/preview_image_screen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/recovered_details_screen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/recovery_details_screen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/recovery_home_screen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/recovery_report_screen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/recovery_splash_sceen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/recovery_change_password_screen.dart';
  import 'package:pm_e_commerce_app/presentation/recovery/screens/upload_image_screen.dart';
  import 'package:pm_e_commerce_app/presentation/verification/screens/payment_cards_screen.dart';
  import 'package:pm_e_commerce_app/presentation/verification/screens/pm_terms_screen.dart';
  import 'package:pm_e_commerce_app/presentation/verification/screens/verification_centre_screen.dart';
  import 'package:pm_e_commerce_app/presentation/verification/screens/personal_information_screen.dart';
  import 'package:pm_e_commerce_app/presentation/verification/screens/guarantor_information_screen.dart';
  import 'package:pm_e_commerce_app/presentation/verification/screens/employment_information_screen.dart';
  import 'package:pm_e_commerce_app/presentation/verification/screens/bvn_nin_verification_screen.dart';
  import 'package:pm_e_commerce_app/presentation/verification/screens/bank_account_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/socials_screen.dart';
  import 'package:pm_e_commerce_app/presentation/auth/screens/notifications_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/bank_transfer/bank_transfer_confirmation_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/bank_transfer/bank_transfer_error_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/bank_transfer/bank_transfer_success_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/wallet_payment/bank_review_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/wallet_payment/pm_bank_transfer_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/payment_card/card_list.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/payment_card/card_payment_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/payment_card/card_sucessful_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/payment_options_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment_options/screens/wallet_payment/verifying_screen.dart';
  import 'package:pm_e_commerce_app/presentation/wallet/screens/pm_wallet_screen.dart';
  import 'package:pm_e_commerce_app/presentation/wallet/screens/add_money_screen.dart';
  import 'package:pm_e_commerce_app/presentation/wallet/screens/payment_webview_screen.dart';
  import 'package:pm_e_commerce_app/presentation/cart/screens/cart_screen.dart';
  import 'package:pm_e_commerce_app/presentation/history/screens/history_screen.dart';
  import 'package:pm_e_commerce_app/presentation/home/screens/home_screen.dart';
  import 'package:pm_e_commerce_app/presentation/onboarding/screens/onboarding_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/buy%20once/delivery_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/buy%20once/payment_break_down_delivery_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/buy%20once/payment_break_down_pick_up_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/installment_break_down_delivery_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/installment_break_down_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/payment_break_down_freq_delivery_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/payment_break_down_freq_pickup_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/payment_freq_delivery_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/payment_freq_pickup_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/payment_frequency_first_screen.dart';
  import 'package:pm_e_commerce_app/presentation/payment/screens/buy%20once/pickup_screen.dart';
  import 'package:pm_e_commerce_app/presentation/products/screens/product_detail_screen.dart';
  import 'package:pm_e_commerce_app/presentation/products/screens/products_screen.dart';
  import 'package:pm_e_commerce_app/presentation/splash/screens/splash_screen.dart';

  class AppRouter {
    static final GoRouter router = GoRouter(
      navigatorKey: ApiClient.navigatorKey,
      initialLocation: AppRoutes.splash,
      routes: [
        // ============Splash and Onboarding screen =================
        GoRoute(
          path: AppRoutes.splash,
          name: AppRoutes.splash,
          builder: (context, state) => SplashScreen(),
        ),
        GoRoute(
          path: AppRoutes.onboarding,
          name: AppRoutes.onboarding,
          builder: (context, state) => const OnboardingScreen(),
        ),

        // ============Splash and Onboarding screen =================

        //============== Auth flows and screens ====================

        GoRoute(
          path: AppRoutes.register,
          name: AppRoutes.register,
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: AppRoutes.login,
          name: AppRoutes.login,
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: AppRoutes.forgotPassword,
          name: AppRoutes.forgotPassword,
          builder: (context, state) => const ForgotPasswordScreen(),
        ),
        GoRoute(
          path: AppRoutes.resetPassword,
          name: AppRoutes.resetPassword,
          builder: (context, state) => const ResetPasswordScreen(),
        ),

        //============== Auth flows and screens ====================

        // ============= Home Screen , products and products details screen ===========
        GoRoute(
          path: AppRoutes.home,
          name: AppRoutes.home,
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: AppRoutes.cart,
          name: AppRoutes.cart,
          builder: (context, state) => const CartScreen(),
        ),
        GoRoute(
          path: AppRoutes.history,
          name: AppRoutes.history,
          builder: (context, state) => const HistoryScreen(),
        ),
        // Add to your routes in AppRouter
        GoRoute(
          path: AppRoutes.itemPurchase,
          name: AppRoutes.itemPurchase,
          builder: (context, state) {
            final data = state.extra as Map<String, dynamic>;
            return ItemPurchaseScreen(extraData: data);
          },
        ),
        GoRoute(
          path: AppRoutes.installmentPayment,
          name: AppRoutes.installmentPayment,
          builder: (context, state) {
            final data = state.extra as Map<String, dynamic>;
            return InstallmentPaymentScreen(
              order: data['order'],
              mode: data['mode'],
            );
          },
        ),
        GoRoute(
          path: AppRoutes.account,
          name: AppRoutes.account,
          builder: (context, state) => const AccountScreen(),
        ),
        GoRoute(
          path: AppRoutes.profile,
          name: AppRoutes.profile,
          builder: (context, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: AppRoutes.defaultRatings,
          name: AppRoutes.defaultRatings,
          builder: (context, state) => const DefaultRatingsScreen(),
        ),
        GoRoute(
          path: AppRoutes.verificationCentre,
          name: AppRoutes.verificationCentre,
          builder: (context, state) => const VerificationCentreScreen(),
        ),
        GoRoute(
          path: AppRoutes.personalInformation,
          name: AppRoutes.personalInformation,
          builder: (context, state) => const PersonalInformationScreen(),
        ),
        GoRoute(
          path: AppRoutes.guarantorInformation,
          name: AppRoutes.guarantorInformation,
          builder: (context, state) => const GuarantorInformationScreen(),
        ),
        GoRoute(
          path: AppRoutes.employmentInformation,
          name: AppRoutes.employmentInformation,
          builder: (context, state) => const EmploymentInformationScreen(),
        ),
        GoRoute(
          path: AppRoutes.bvnNinVerification,
          name: AppRoutes.bvnNinVerification,
          builder: (context, state) => const BvnNinVerificationScreen(),
        ),
        GoRoute(
          path: AppRoutes.bankAccount,
          name: AppRoutes.bankAccount,
          builder: (context, state) => const BankAccountScreen(),
        ),
        GoRoute(
          path: AppRoutes.termsConditions,
          name: AppRoutes.termsConditions,
          builder: (context, state) => const TermsConditionsScreen(),
        ),
        GoRoute(
          path: AppRoutes.instalmentAgreement,
          name: AppRoutes.instalmentAgreement,
          builder: (context, state) => const InstalmentAgreementScreen(),
        ),
        GoRoute(
          path: AppRoutes.socials,
          name: AppRoutes.socials,
          builder: (context, state) => const SocialsScreen(),
        ),
        GoRoute(
          path: AppRoutes.notifications,
          name: AppRoutes.notifications,
          builder: (context, state) => const NotificationsScreen(),
        ),
        GoRoute(
          path: AppRoutes.pmWallet,
          name: AppRoutes.pmWallet,
          builder: (context, state) => const PMWalletScreen(),
        ),
        GoRoute(
          path: AppRoutes.addMoney,
          name: AppRoutes.addMoney,
          builder: (context, state) => const AddMoneyScreen(),
        ),
        GoRoute(
          path: AppRoutes.customerCare,
          name: 'customerCare',
          builder: (context, state) => const CustomerCareScreen(),
        ),
        GoRoute(
          path: AppRoutes.liveChat,
          name: 'liveChat',
          builder: (context, state) => const LiveChatScreen(),
        ),
        GoRoute(
          path: AppRoutes.emailSupport,
          name: 'emailSupport',
          builder: (context, state) {
            final ticketId = state.extra as String?;
            return EmailSupportScreen(ticketId: ticketId);
          },
        ),

  // new routes

        GoRoute(
          path: AppRoutes.checkoutScreen,
          name: AppRoutes.checkoutScreen,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return CheckoutPopup(
              totalAmount: extra?['totalAmount'] ?? 0.0,
            );
          },
        ),

        GoRoute(
          path: AppRoutes.phoneSupport,
          name: 'phoneSupport',
          builder: (context, state) => const PhoneSupportScreen(),
        ),
        // GoRoute(
        //   path: AppRoutes.paymentWebView,
        //   name: AppRoutes.paymentWebView,
        //   builder: (context, state) {
        //     final extra = state.extra as Map<String, dynamic>?;
        //     if (extra == null) {
        //       // Navigate back if no data provided
        //       WidgetsBinding.instance.addPostFrameCallback((_) {
        //         if (context.mounted) {
        //           context.pop();
        //         }
        //       });
        //       return const Scaffold(
        //           body: Center(child: CircularProgressIndicator()));
        //     }

        //     final paymentUrl = extra['paymentUrl'] as String?;
        //     final paymentReference = extra['paymentReference'] as String?;

        //     if (paymentUrl == null ||
        //         paymentUrl.isEmpty ||
        //         paymentReference == null ||
        //         paymentReference.isEmpty) {
        //       // Navigate back if required data is missing
        //       WidgetsBinding.instance.addPostFrameCallback((_) {
        //         if (context.mounted) {
        //           context.pop();
        //         }
        //       });
        //       return const Scaffold(
        //           body: Center(child: CircularProgressIndicator()));
        //     }

        //     final verificationType =
        //         extra['verificationType'] == 'cardPurchase'
        //             ? PaymentVerificationType.cardPurchase
        //             : PaymentVerificationType.walletFunding;

        //     return PaymentWebViewScreen(
        //       paymentUrl: paymentUrl,
        //       paymentReference: paymentReference,
        //       verificationType: verificationType,
        //     );
        //   },
        // ),

        GoRoute(
          path: AppRoutes.paymentWebView,
          name: AppRoutes.paymentWebView,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            if (extra == null) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (context.mounted) context.pop();
              });
              return const Scaffold(
                  body: Center(child: CircularProgressIndicator()));
            }

            final paymentUrl = extra['paymentUrl'] as String?;
            final paymentReference = extra['paymentReference'] as String?;

            if (paymentUrl == null ||
                paymentUrl.isEmpty ||
                paymentReference == null ||
                paymentReference.isEmpty) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (context.mounted) context.pop();
              });
              return const Scaffold(
                  body: Center(child: CircularProgressIndicator()));
            }

            // ✅ Correct way to handle the enum
            PaymentVerificationType verificationType =
                PaymentVerificationType.walletFunding; // default

            final type = extra['verificationType'];

            if (type is PaymentVerificationType) {
              verificationType = type;
            } else if (type is String) {
              // fallback for old string values
              switch (type) {
                case 'cardPurchase':
                  verificationType = PaymentVerificationType.cardPurchase;
                  break;
                default:
                  verificationType = PaymentVerificationType.walletFunding;
              }
            }

            final orderId = extra['orderId'] as int?;

            return PaymentWebViewScreen(
              paymentUrl: paymentUrl,
              paymentReference: paymentReference,
              verificationType: verificationType,
              orderId: orderId,
            );
          },
        ),

        GoRoute(
          path: '/products/:category/:categoryId',
          name: AppRoutes.productScreen,
          builder: (context, state) {
            final category = state.pathParameters['category']!;
            final categoryId = state.pathParameters['categoryId']!;
            final initialQuery = state.uri.queryParameters['q'];
            return ProductsScreen(
              category: category,
              categoryId: categoryId,
              initialQuery: initialQuery,
            );
          },
        ),
        // Product Detail Screen
        GoRoute(
          path: AppRoutes.productDetailScreen,
          name: AppRoutes.productDetailScreen,
          builder: (context, state) {
            final product = state.extra as Map<String, dynamic>;
            return ProductDetailScreen(product: product);
          },
        ),

        GoRoute(
          path: AppRoutes.quickPickProducts,
          name: 'quickPickProducts',
          builder: (context, state) => const QuickPickScreen(),
        ),
        GoRoute(
          path: AppRoutes.pmTerms,
          name: AppRoutes.pmTerms,
          builder: (context, state) => const PmTermsScreen(),
        ),

        GoRoute(
          path: AppRoutes.paymentCards,
          name: 'paymentCards',
          builder: (context, state) => const PaymentCardsScreen(),
        ),

        GoRoute(
          path: AppRoutes.pickupScreen,
          name: AppRoutes.pickupScreen,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return PickupScreen(
              product: extra?['product'] as Map<String, dynamic>?,
              totalAmount: extra?['totalAmount'] ?? 0.0,
            );
          },
        ),
        GoRoute(
          path: AppRoutes.deliveryScreen,
          name: AppRoutes.deliveryScreen,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return DeliveryScreen(
              product: extra?['product'] as Map<String, dynamic>?,
              totalAmount: extra?['totalAmount'] ?? 0.0,
            );
          },
        ),
        GoRoute(
          path: AppRoutes.PaymentBreakdownDelivery,
          name: AppRoutes.PaymentBreakdownDelivery,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return PaymentBreakdownDeliveryScreen(
              product: extra?['product'] as Map<String, dynamic>?,
              totalAmount: extra?['totalAmount'] ?? 0.0,
            );
          },
        ),
        GoRoute(
          path: AppRoutes.paymentBreakdownPickup,
          name: AppRoutes.paymentBreakdownPickup,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return PaymentBreakdownPickupScreen(
              product: extra?['product'] as Map<String, dynamic>?,
              totalAmount: extra?['totalAmount'] ?? 0.0,
            );
          },
        ),
        // ============= Buy once flows and screen ===========

        // ======= second line payment freq flow and screens ==========

        GoRoute(
          path: AppRoutes.paymentFreq,
          name: AppRoutes.paymentFreq,
          // first screen for freq
          builder: (context, state) => const PaymentFrequencyFirstScreen(),
        ),
        GoRoute(
          path: AppRoutes.paymentFreqPickup,
          name: AppRoutes.paymentFreqPickup,
          // second  screen for freq
          builder: (context, state) => const PaymentFreqPickupScreen(),
        ),

        GoRoute(
          path: AppRoutes.installmentBreakdown,
          name: AppRoutes.installmentBreakdown,
          // third  screen for freq installment breakdown
          builder: (context, state) {
            // Can accept extra data but not required
            return const InstallmentBreakDownScreen();
          },
        ),

        GoRoute(
          path: AppRoutes.paymentFreqBreakdownPickup,
          name: AppRoutes.paymentFreqBreakdownPickup,
          // fouth  screen for freq installment breakdown
          builder: (context, state) {
            // Can accept extra data but not required
            return const PaymentBreakDownFreqPickupScreen();
          },
        ),

        GoRoute(
          path: AppRoutes.paymentFreqDelivery,
          name: AppRoutes.paymentFreqDelivery,
          // fifth  screen for freq
          builder: (context, state) => const PaymentFreqDeliveryScreen(),
        ),

        GoRoute(
          path: AppRoutes.installmentBreakdownDelivery,
          name: AppRoutes.installmentBreakdownDelivery,
          // sixth  screen for freq installment breakdown
          builder: (context, state) {
            // Can accept extra data but not required
            return const InstallmentBreakDownDeliveryScreen();
          },
        ),

        GoRoute(
          path: AppRoutes.paymentFreqBreakdownDelivery,
          name: AppRoutes.paymentFreqBreakdownDelivery,
          // seventh  screen for freq installment breakdown
          builder: (context, state) {
            // Can accept extra data but not required
            return const PaymentBreakDownFreqDeliveryScreen();
          },
        ),

        // Payment optinos screens
        GoRoute(
          path: AppRoutes.paymentOption,
          name: AppRoutes.paymentOption,
          builder: (context, state) {
            final extra = state.extra;
            double amount = 0;
            if (extra is double) {
              amount = extra;
            } else if (extra is Map<String, dynamic>) {
              final plan = extra['plan'] as InstallmentPlan?;
              if (plan != null && plan.schedule.isNotEmpty) {
                amount = plan.schedule.first.amountToPay;
              }
            }
            return PaymentOptionScreen(amount: amount);
          },
        ),
        GoRoute(
          path: AppRoutes.cardPayment,
          name: AppRoutes.cardPayment,
          builder: (context, state) => const CardPaymentScreen(),
        ),

        GoRoute(
          path: AppRoutes.paymentSuccess,
          name: AppRoutes.paymentSuccess,
          builder: (context, state) => const CardSucessfulScreen(),
        ),

        GoRoute(
          path: AppRoutes.cardList,
          name: AppRoutes.cardList,
          builder: (context, state) {
            final amount = state.extra as double?;
            return CardListScreen(amount: amount ?? 0);
          },
        ),
        // payment with bank
        GoRoute(
          path: AppRoutes.bankPayment,
          name: AppRoutes.bankPayment,
          builder: (context, state) => const BankPaymentScreen(),
        ),

        // In app_router.dart
        GoRoute(
          path: AppRoutes.bankAuth,
          name: AppRoutes.bankAuth,
          builder: (context, state) {
            // ✅ Get data from state.extra (NOT constructor)
            final bankData = state.extra as Map<String, dynamic>? ?? {};
            return BankAuthScreen(); // No parameters needed - it reads from state.extra
          },
        ),

        // payment with pm wallet
        GoRoute(
          path: AppRoutes.pmBankTransfer,
          name: AppRoutes.pmBankTransfer,
          builder: (context, state) => const PmBankTransferScreen(),
        ),

        GoRoute(
          path: AppRoutes.bankReview,
          name: AppRoutes.bankReview,
          builder: (context, state) => const BankReviewScreen(),
        ),

        GoRoute(
          path: AppRoutes.verifyingScreen,
          name: AppRoutes.verifyingScreen,
          builder: (context, state) => const VerifyingScreen(),
        ),

        // payment with bank transfer
        GoRoute(
          path: AppRoutes.bankTransferConfirm,
          name: AppRoutes.bankTransferConfirm,
          builder: (context, state) => const BankTransferConfirmationScreen(),
        ),
        GoRoute(
          path: AppRoutes.bankTransferSuccess,
          name: AppRoutes.bankTransferSuccess,
          builder: (context, state) => const BankTransferSuccessScreen(),
        ),
        GoRoute(
          path: AppRoutes.bankTransferError,
          name: AppRoutes.bankTransferError,
          builder: (context, state) => const BankTransferErrorScreen(),
        ),

        // delivery
        // Add to your routes in AppRouter
        GoRoute(
          path: AppRoutes.deliverySplash,
          name: AppRoutes.deliverySplash,
          builder: (context, state) => const DeliverySplashScreen(),
        ),
        GoRoute(
          path: AppRoutes.deliveryHome,
          name: AppRoutes.deliveryHome,
          builder: (context, state) => const DeliveryHomeScreen(),
        ),
        GoRoute(
          path: AppRoutes.pendingDeliveries,
          name: AppRoutes.pendingDeliveries,
          builder: (context, state) => const PendingDeliveriesScreen(),
        ),
        GoRoute(
          path: AppRoutes.deliveryHistory,
          name: AppRoutes.deliveryHistory,
          builder: (context, state) => const DeliveryHistoryScreen(),
        ),
        GoRoute(
          path: AppRoutes.newDelivery,
          name: AppRoutes.newDelivery,
          builder: (context, state) => const NewDeliveryScreen(),
        ),
        GoRoute(
          path: AppRoutes.deliveryConfirmation,
          name: AppRoutes.deliveryConfirmation,
          builder: (context, state) => const DeliveryConfirmationScreen(),
        ),
        GoRoute(
          path: AppRoutes.deliveryAbout,
          name: AppRoutes.deliveryAbout,
          builder: (context, state) {
            final data = state.extra as Map<String, dynamic>? ?? {};
            return DeliveryAboutScreen(data: data);
          },
        ),
        GoRoute(
          path: AppRoutes.deliveryForgotPassword,
          name: AppRoutes.deliveryForgotPassword,
          builder: (context, state) => const DeliveryForgotPasswordScreen(),
        ),
        GoRoute(
          path: AppRoutes.deliveryChangePassword,
          name: AppRoutes.deliveryChangePassword,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return DeliveryChangePasswordScreen(
              email: extra?['email'] as String?,
              resetCode: extra?['resetCode'] as String?,
            );
          },
        ),

        // Recovery screens routes
        GoRoute(
          path: AppRoutes.recoverySplash,
          name: AppRoutes.recoverySplash,
          builder: (context, state) => RecoverySplashScreen(),
        ),
        GoRoute(
          path: AppRoutes.recoveryHome,
          name: AppRoutes.recoveryHome,
          builder: (context, state) => RecoveryHomeScreen(),
        ),
        GoRoute(
          path: AppRoutes.recoveryReport,
          name: AppRoutes.recoveryReport,
          builder: (context, state) => RecoveryReportScreen(),
        ),
        GoRoute(
          path: AppRoutes.goodsToBeRecovered,
          name: AppRoutes.goodsToBeRecovered,
          builder: (context, state) => GoodsToBeRecoveredScreen(),
        ),
        GoRoute(
          path: AppRoutes.recoveryDetails,
          name: AppRoutes.recoveryDetails,
          builder: (context, state) => RecoveryDetailsScreen(),
        ),
        GoRoute(
          path: AppRoutes.customerDetail,
          name: AppRoutes.customerDetail,
          builder: (context, state) => CustomerDetailScreen(),
        ),
        GoRoute(
          path: AppRoutes.recoveryChangePassword,
          name: AppRoutes.recoveryChangePassword,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return RecoveryChangePasswordScreen(
              email: extra?['email'] as String?,
              resetCode: extra?['resetCode'] as String?,
            );
          },
        ),

        GoRoute(
          path: AppRoutes.recoveryUpload,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            final int itemIndex = extra?['itemIndex'] ?? 0;
            return UploadImageScreen(itemIndex: itemIndex);
          },
        ),
        GoRoute(
          path: AppRoutes.recoveryPreview,
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;

            final List<int>? rawBytes = extra?['imageBytes'] as List<int>?;
            final int itemIndex = extra?['itemIndex'] ?? 0;

            if (rawBytes == null) return const SizedBox();

            final Uint8List imageBytes = Uint8List.fromList(rawBytes);

            return PreviewImageScreen(
                imageBytes: imageBytes, itemIndex: itemIndex);
          },
        ),
        GoRoute(
          path: AppRoutes.recoveredDetails,
          name: AppRoutes.recoveredDetails,
          builder: (context, state) => const RecoveredDetailsScreen(),
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Text('Page not found: ${state.error}'),
        ),
      ),
    );
  }
