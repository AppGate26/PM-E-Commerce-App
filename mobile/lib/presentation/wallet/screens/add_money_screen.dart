// import 'package:flutter/material.dart';
// import 'package:flutter/services.dart';
// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:go_router/go_router.dart';
// import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
// import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
// import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
// import 'package:pm_e_commerce_app/data/repositories/payment_repository.dart';

// class AddMoneyScreen extends ConsumerStatefulWidget {
//   const AddMoneyScreen({super.key});

//   @override
//   ConsumerState<AddMoneyScreen> createState() => _AddMoneyScreenState();
// }

// class _AddMoneyScreenState extends ConsumerState<AddMoneyScreen> {
//   final PaymentRepository _paymentRepository = PaymentRepository();
//   final TextEditingController _amountController = TextEditingController();
//   String? _selectedPaymentMethod;
//   bool _isLoading = false;

//   final List<Map<String, dynamic>> _paymentMethods = [
//     // {'name': 'Bank Transfer', 'icon': Icons.account_balance},
//     {'name': 'Card Payment', 'icon': Icons.credit_card},
//     // {'name': 'USSD', 'icon': Icons.phone},
//   ];

//   final List<double> _quickAmounts = [5000, 10000, 20000, 50000, 100000];

//   @override
//   void dispose() {
//     _amountController.dispose();
//     super.dispose();
//   }

//   String _formatCurrency(double amount) {
//     final intValue = amount.toInt();
//     if (intValue < 1000) {
//       return intValue.toString();
//     }

//     String result = '';
//     String str = intValue.toString();
//     int count = 0;

//     for (int i = str.length - 1; i >= 0; i--) {
//       if (count == 3) {
//         result = ',$result';
//         count = 0;
//       }
//       result = str[i] + result;
//       count++;
//     }

//     return result;
//   }

//   void _setQuickAmount(double amount) {
//     setState(() {
//       _amountController.text = amount.toStringAsFixed(0);
//     });
//   }

//   bool _isFormValid() {
//     final amountText = _amountController.text.trim();
//     if (amountText.isEmpty) return false;
//     final amount = double.tryParse(amountText);
//     if (amount == null || amount <= 0) return false;
//     return _selectedPaymentMethod != null;
//   }

//   Future<void> _handleProceed() async {
//     if (!_isFormValid()) return;

//     setState(() {
//       _isLoading = true;
//     });

//     try {
//       // Get user from auth provider
//       final authState = ref.read(authProvider);
//       final user = authState.hasValue ? authState.value : null;

//       if (user == null) {
//         if (mounted) {
//           setState(() {
//             _isLoading = false;
//           });
//           ScaffoldMessenger.of(context).showSnackBar(
//             const SnackBar(
//               content: Text('Please login to continue'),
//               backgroundColor: Colors.red,
//             ),
//           );
//         }
//         return;
//       }

//       final amountText = _amountController.text.trim();
//       final amount = double.tryParse(amountText);

//       if (amount == null || amount <= 0) {
//         if (mounted) {
//           setState(() {
//             _isLoading = false;
//           });
//           ScaffoldMessenger.of(context).showSnackBar(
//             const SnackBar(
//               content: Text('Please enter a valid amount'),
//               backgroundColor: Colors.red,
//             ),
//           );
//         }
//         return;
//       }

//       // Handle different payment methods
//       if (_selectedPaymentMethod == 'Card Payment') {
//         // Initialize card payment
//         await _initializeCardPayment(user.id, user.email, amount);
//       } else if (_selectedPaymentMethod == 'Bank Transfer') {
//         // Navigate to bank payment screen
//         if (mounted) {
//           setState(() {
//             _isLoading = false;
//           });
//           context.push(AppRoutes.bankPayment);
//         }
//       } else {
//         // Show success message or navigate for other methods
//         if (mounted) {
//           setState(() {
//             _isLoading = false;
//           });
//           ScaffoldMessenger.of(context).showSnackBar(
//             const SnackBar(
//               content: Text('Payment method selected'),
//               backgroundColor: AppColors.blueBackground,
//             ),
//           );
//         }
//       }
//     } catch (e) {
//       if (mounted) {
//         setState(() {
//           _isLoading = false;
//         });
//         ScaffoldMessenger.of(context).showSnackBar(
//           SnackBar(
//             content: Text('Error: ${e.toString()}'),
//             backgroundColor: Colors.red,
//           ),
//         );
//       }
//     }
//   }

//   Future<void> _initializeCardPayment(
//       int userId, String email, double amount) async {
//     try {
//       // TODO: Update this callback URL to match your app's deep link or backend callback
//       // This should be a URL that your backend can use to notify your app of payment status
//       const callbackUrl = 'https://pm-app.com/payment/callback';

//       final response = await _paymentRepository.initializeCardPayment(
//         userId: userId,
//         amount: amount,
//         email: email,
//         callbackUrl: callbackUrl,
//       );

//       // Extract the authorization URL and payment reference from the response
//       // The response structure: {status: 200, message: ..., data: {authorizationUrl: ..., paymentReference: ...}}
//       String? authorizationUrl;
//       String? paymentReference;

//       // Try to get from nested data object first (based on the API response structure)
//       if (response['data'] is Map<String, dynamic>) {
//         final data = response['data'] as Map<String, dynamic>;
//         authorizationUrl = data['authorizationUrl']?.toString() ??
//             data['authorization_url']?.toString() ??
//             data['url']?.toString();
//         paymentReference = data['paymentReference']?.toString() ??
//             data['payment_reference']?.toString();
//       }

//       // If not found, try from top level
//       authorizationUrl ??= response['authorizationUrl']?.toString() ??
//           response['authorization_url']?.toString() ??
//           response['url']?.toString();
//       paymentReference ??= response['paymentReference']?.toString() ??
//           response['payment_reference']?.toString();

//       if (authorizationUrl == null || authorizationUrl.isEmpty) {
//         throw 'No payment URL received from server. Response: $response';
//       }

//       if (paymentReference == null || paymentReference.isEmpty) {
//         throw 'No payment reference received from server. Response: $response';
//       }

//       if (mounted) {
//         setState(() {
//           _isLoading = false;
//         });

//         // Navigate to WebView screen with the payment URL and payment reference
//         final result = await context.push<Map<String, dynamic>?>(
//           AppRoutes.paymentWebView,
//           extra: {
//             'paymentUrl': authorizationUrl,
//             'paymentReference': paymentReference,
//           },
//         );

//         // Handle payment result if needed
//         if (mounted && result != null && result['success'] == true) {
//           // Payment was successful, verification is handled in WebView
//           ScaffoldMessenger.of(context).showSnackBar(
//             const SnackBar(
//               content: Text('Payment successful!'),
//               backgroundColor: Colors.green,
//             ),
//           );
//           // Navigate back to wallet screen
//           context.pop(true);
//         } else if (mounted && result != null && result['success'] == false) {
//           // Payment was cancelled or failed
//           // Show error message if provided
//           final errorMessage = result['error'];
//           if (errorMessage != null) {
//             ScaffoldMessenger.of(context).showSnackBar(
//               SnackBar(
//                 content: Text(errorMessage),
//                 backgroundColor: Colors.red,
//               ),
//             );
//           }
//         }
//       }
//     } catch (e) {
//       if (mounted) {
//         setState(() {
//           _isLoading = false;
//         });
//         rethrow;
//       }
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: AppColors.lightBackground,
//       appBar: AppBar(
//         backgroundColor: AppColors.textBlue,
//         centerTitle: true,
//         title: const Padding(
//           padding: EdgeInsets.symmetric(horizontal: 16),
//           child: Text(
//             'ADD MONEY',
//             style: TextStyle(
//               color: AppColors.textLight,
//               fontSize: 18,
//               fontWeight: FontWeight.bold,
//             ),
//           ),
//         ),
//         leading: Padding(
//           padding: const EdgeInsets.only(left: 12),
//           child: Image.asset(
//             'assets/images/logo.png',
//             height: 24,
//             width: 24,
//           ),
//         ),
//       ),
//       body: SafeArea(
//         child: Column(
//           children: [
//             // Secondary App Bar
//             Container(
//               height: 60,
//               width: double.infinity,
//               color: Colors.grey[200],
//               padding: const EdgeInsets.symmetric(horizontal: 16),
//               child: Row(
//                 children: [
//                   IconButton(
//                     icon: const Icon(
//                       Icons.arrow_back,
//                       color: AppColors.blueBackground,
//                     ),
//                     onPressed: () => context.pop(),
//                   ),
//                   const Spacer(),
//                 ],
//               ),
//             ),

//             // Content
//             Expanded(
//               child: SingleChildScrollView(
//                 padding: const EdgeInsets.all(16),
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     // Amount Input Card
//                     Container(
//                       width: double.infinity,
//                       padding: const EdgeInsets.all(20),
//                       decoration: BoxDecoration(
//                         color: AppColors.whiteBackground,
//                         borderRadius: BorderRadius.circular(12),
//                         boxShadow: [
//                           BoxShadow(
//                             color: Colors.black.withOpacity(0.05),
//                             blurRadius: 4,
//                             offset: const Offset(0, 2),
//                           ),
//                         ],
//                       ),
//                       child: Column(
//                         crossAxisAlignment: CrossAxisAlignment.start,
//                         children: [
//                           const Text(
//                             'ENTER AMOUNT',
//                             style: TextStyle(
//                               fontSize: 12,
//                               color: Color(0xFF666666),
//                               fontWeight: FontWeight.w500,
//                             ),
//                           ),
//                           const SizedBox(height: 12),
//                           TextField(
//                             controller: _amountController,
//                             keyboardType: TextInputType.number,
//                             inputFormatters: [
//                               FilteringTextInputFormatter.digitsOnly,
//                             ],
//                             style: const TextStyle(
//                               fontSize: 32,
//                               fontWeight: FontWeight.bold,
//                               color: AppColors.blueBackground,
//                             ),
//                             decoration: InputDecoration(
//                               prefixText: 'N',
//                               prefixStyle: const TextStyle(
//                                 fontSize: 32,
//                                 fontWeight: FontWeight.bold,
//                                 color: AppColors.blueBackground,
//                               ),
//                               hintText: '0',
//                               hintStyle: TextStyle(
//                                 fontSize: 32,
//                                 fontWeight: FontWeight.bold,
//                                 color: Colors.grey[300],
//                               ),
//                               border: InputBorder.none,
//                               enabledBorder: InputBorder.none,
//                               focusedBorder: InputBorder.none,
//                             ),
//                             onChanged: (_) => setState(() {}),
//                           ),
//                           const SizedBox(height: 20),
//                           const Text(
//                             'QUICK AMOUNTS',
//                             style: TextStyle(
//                               fontSize: 12,
//                               color: Color(0xFF666666),
//                               fontWeight: FontWeight.w500,
//                             ),
//                           ),
//                           const SizedBox(height: 12),
//                           Wrap(
//                             spacing: 8,
//                             runSpacing: 8,
//                             children: _quickAmounts.map((amount) {
//                               return GestureDetector(
//                                 onTap: () => _setQuickAmount(amount),
//                                 child: Container(
//                                   padding: const EdgeInsets.symmetric(
//                                     horizontal: 16,
//                                     vertical: 10,
//                                   ),
//                                   decoration: BoxDecoration(
//                                     color: AppColors.lightBlueBackground,
//                                     borderRadius: BorderRadius.circular(8),
//                                     border: Border.all(
//                                       color: AppColors.blueBackground,
//                                       width: 1,
//                                     ),
//                                   ),
//                                   child: Text(
//                                     'N${_formatCurrency(amount)}',
//                                     style: const TextStyle(
//                                       fontSize: 14,
//                                       fontWeight: FontWeight.w600,
//                                       color: AppColors.blueBackground,
//                                     ),
//                                   ),
//                                 ),
//                               );
//                             }).toList(),
//                           ),
//                         ],
//                       ),
//                     ),

//                     const SizedBox(height: 24),

//                     // Payment Method Selection
//                     const Padding(
//                       padding: EdgeInsets.symmetric(horizontal: 4),
//                       child: Text(
//                         'SELECT PAYMENT METHOD',
//                         style: TextStyle(
//                           fontSize: 14,
//                           fontWeight: FontWeight.w600,
//                           color: Color(0xFF666666),
//                         ),
//                       ),
//                     ),

//                     const SizedBox(height: 12),

//                     // Payment Method Options
//                     ..._paymentMethods.map((method) {
//                       final isSelected =
//                           _selectedPaymentMethod == method['name'];
//                       return Container(
//                         margin: const EdgeInsets.only(bottom: 8),
//                         child: GestureDetector(
//                           onTap: () {
//                             setState(() {
//                               _selectedPaymentMethod = method['name'];
//                             });
//                           },
//                           child: Container(
//                             padding: const EdgeInsets.all(16),
//                             decoration: BoxDecoration(
//                               color: isSelected
//                                   ? AppColors.lightBlueBackground
//                                   : AppColors.whiteBackground,
//                               borderRadius: BorderRadius.circular(8),
//                               border: Border.all(
//                                 color: isSelected
//                                     ? AppColors.blueBackground
//                                     : Colors.grey[300]!,
//                                 width: isSelected ? 2 : 1,
//                               ),
//                             ),
//                             child: Row(
//                               children: [
//                                 Icon(
//                                   method['icon'] as IconData,
//                                   color: isSelected
//                                       ? AppColors.blueBackground
//                                       : Colors.grey[600],
//                                   size: 24,
//                                 ),
//                                 const SizedBox(width: 16),
//                                 Expanded(
//                                   child: Text(
//                                     method['name'] as String,
//                                     style: TextStyle(
//                                       fontSize: 16,
//                                       fontWeight: FontWeight.w600,
//                                       color: isSelected
//                                           ? AppColors.blueBackground
//                                           : Colors.black87,
//                                     ),
//                                   ),
//                                 ),
//                                 if (isSelected)
//                                   const Icon(
//                                     Icons.check_circle,
//                                     color: AppColors.blueBackground,
//                                     size: 24,
//                                   ),
//                               ],
//                             ),
//                           ),
//                         ),
//                       );
//                     }),

//                     const SizedBox(height: 32),

//                     // Proceed Button
//                     SizedBox(
//                       width: double.infinity,
//                       child: ElevatedButton(
//                         onPressed: _isFormValid() && !_isLoading
//                             ? _handleProceed
//                             : null,
//                         style: ElevatedButton.styleFrom(
//                           backgroundColor: AppColors.blueBackground,
//                           foregroundColor: AppColors.textLight,
//                           disabledBackgroundColor: Colors.grey[400],
//                           padding: const EdgeInsets.symmetric(vertical: 16),
//                           shape: RoundedRectangleBorder(
//                             borderRadius: BorderRadius.circular(8),
//                           ),
//                         ),
//                         child: _isLoading
//                             ? const SizedBox(
//                                 height: 20,
//                                 width: 20,
//                                 child: CircularProgressIndicator(
//                                   strokeWidth: 2,
//                                   valueColor: AlwaysStoppedAnimation<Color>(
//                                     AppColors.textLight,
//                                   ),
//                                 ),
//                               )
//                             : const Text(
//                                 'PROCEED',
//                                 style: TextStyle(
//                                   fontSize: 16,
//                                   fontWeight: FontWeight.w600,
//                                 ),
//                               ),
//                       ),
//                     ),

//                     const SizedBox(height: 16),
//                   ],
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_repository.dart';
import 'package:pm_e_commerce_app/data/providers/wallet_provider.dart';

class AddMoneyScreen extends ConsumerStatefulWidget {
  const AddMoneyScreen({super.key});

  @override
  ConsumerState<AddMoneyScreen> createState() => _AddMoneyScreenState();
}

class _AddMoneyScreenState extends ConsumerState<AddMoneyScreen> {
  final PaymentRepository _paymentRepository = PaymentRepository();
  final TextEditingController _amountController = TextEditingController();
  String? _selectedPaymentMethod;
  bool _isLoading = false;

  final List<Map<String, dynamic>> _paymentMethods = [
    {'name': 'Card Payment', 'icon': Icons.credit_card, 'type': 'card'},
    {'name': 'Bank Transfer', 'icon': Icons.account_balance, 'type': 'bank'},
    {'name': 'USSD', 'icon': Icons.phone, 'type': 'ussd', 'disabled': true},
  ];

  final List<double> _quickAmounts = [5000, 10000, 20000, 50000, 100000];

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  String _formatCurrency(double amount) {
    final intValue = amount.toInt();
    if (intValue < 1000) {
      return intValue.toString();
    }

    String result = '';
    String str = intValue.toString();
    int count = 0;

    for (int i = str.length - 1; i >= 0; i--) {
      if (count == 3) {
        result = ',$result';
        count = 0;
      }
      result = str[i] + result;
      count++;
    }

    return result;
  }

  void _setQuickAmount(double amount) {
    setState(() {
      _amountController.text = amount.toStringAsFixed(0);
    });
  }

  bool _isFormValid() {
    final amountText = _amountController.text.trim();
    if (amountText.isEmpty) return false;
    final amount = double.tryParse(amountText);
    if (amount == null || amount <= 0) return false;
    if (_selectedPaymentMethod == null) return false;

    // Check if selected method is disabled
    final selectedMethod = _paymentMethods.firstWhere(
      (m) => m['name'] == _selectedPaymentMethod,
      orElse: () => {},
    );
    if (selectedMethod['disabled'] == true) return false;

    return true;
  }

  String? _getPaymentType() {
    final selectedMethod = _paymentMethods.firstWhere(
      (m) => m['name'] == _selectedPaymentMethod,
      orElse: () => {},
    );
    return selectedMethod['type'] as String?;
  }

  Future<void> _handleProceed() async {
    if (!_isFormValid()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // Get user from auth provider
      final authState = ref.read(authProvider);
      final user = authState.hasValue ? authState.value : null;

      if (user == null) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please login to continue'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      final amountText = _amountController.text.trim();
      final amount = double.tryParse(amountText);

      if (amount == null || amount <= 0) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please enter a valid amount'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      final paymentType = _getPaymentType();

      if (paymentType == 'card') {
        // ✅ Card Payment Flow
        await _initializeCardPayment(user.id, user.email, amount);
      } else if (paymentType == 'bank') {
        // ✅ Bank Transfer Flow (NEW)
        await _initializeBankTransfer(user.id, user.email, amount);
      } else {
        // Handle other payment methods
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$_selectedPaymentMethod coming soon!'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _initializeCardPayment(
      int userId, String email, double amount) async {
    try {
      const callbackUrl = 'https://pm-app.com/payment/callback';

      final response = await _paymentRepository.initializeCardPayment(
        userId: userId,
        amount: amount,
        email: email,
        callbackUrl: callbackUrl,
      );

      String? authorizationUrl;
      String? paymentReference;

      if (response['data'] is Map<String, dynamic>) {
        final data = response['data'] as Map<String, dynamic>;
        authorizationUrl = data['authorizationUrl']?.toString() ??
            data['authorization_url']?.toString() ??
            data['url']?.toString();
        paymentReference = data['paymentReference']?.toString() ??
            data['payment_reference']?.toString();
      }

      authorizationUrl ??= response['authorizationUrl']?.toString() ??
          response['authorization_url']?.toString() ??
          response['url']?.toString();
      paymentReference ??= response['paymentReference']?.toString() ??
          response['payment_reference']?.toString();

      if (authorizationUrl == null || authorizationUrl.isEmpty) {
        throw 'No payment URL received from server. Response: $response';
      }

      if (paymentReference == null || paymentReference.isEmpty) {
        throw 'No payment reference received from server. Response: $response';
      }

      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        final result = await context.push<Map<String, dynamic>?>(
          AppRoutes.paymentWebView,
          extra: {
            'paymentUrl': authorizationUrl,
            'paymentReference': paymentReference,
            'verificationType': 'walletFunding',
          },
        );

        if (mounted && result != null && result['success'] == true) {
          await ref.read(walletStateProvider.notifier).loadBalance();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Wallet funded successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          context.pop(true);
        } else if (mounted && result != null && result['success'] == false) {
          final errorMessage = result['error'];
          if (errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(errorMessage),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        rethrow;
      }
    }
  }

  // ✅ NEW: Initialize Bank Transfer
  Future<void> _initializeBankTransfer(
      int userId, String email, double amount) async {
    try {
      print('🏦 [AddMoneyScreen] Initializing bank transfer...');

      const callbackUrl = 'https://pm-app.com/payment/callback';

      final response = await _paymentRepository.initializeBankTransfer(
        userId: userId,
        amount: amount,
        email: email,
        callbackUrl: callbackUrl,
      );

      print('🏦 [AddMoneyScreen] Response: $response');

      // Extract authorization URL and payment reference
      String? authorizationUrl;
      String? paymentReference;

      if (response['data'] is Map<String, dynamic>) {
        final data = response['data'] as Map<String, dynamic>;
        authorizationUrl = data['authorizationUrl']?.toString() ??
            data['authorization_url']?.toString() ??
            data['url']?.toString();
        paymentReference = data['paymentReference']?.toString() ??
            data['payment_reference']?.toString();
      }

      authorizationUrl ??= response['authorizationUrl']?.toString() ??
          response['authorization_url']?.toString() ??
          response['url']?.toString();
      paymentReference ??= response['paymentReference']?.toString() ??
          response['payment_reference']?.toString();

      if (authorizationUrl == null || authorizationUrl.isEmpty) {
        // If no URL, it might be a direct bank transfer with account details
        // Show account details to user
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          _showBankTransferDetails(response);
        }
        return;
      }

      if (paymentReference == null || paymentReference.isEmpty) {
        throw 'No payment reference received from server. Response: $response';
      }

      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        // Navigate to WebView for bank transfer
        final result = await context.push<Map<String, dynamic>?>(
          AppRoutes.paymentWebView,
          extra: {
            'paymentUrl': authorizationUrl,
            'paymentReference': paymentReference,
            'verificationType': 'walletFunding',
          },
        );

        if (mounted && result != null && result['success'] == true) {
          await ref.read(walletStateProvider.notifier).loadBalance();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Wallet funded successfully via Bank Transfer!'),
              backgroundColor: Colors.green,
            ),
          );
          context.pop(true);
        } else if (mounted && result != null && result['success'] == false) {
          final errorMessage = result['error'];
          if (errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(errorMessage),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        rethrow;
      }
    }
  }

  // ✅ NEW: Show Bank Transfer Details
  void _showBankTransferDetails(Map<String, dynamic> response) {
    print('🏦 [AddMoneyScreen] Showing bank transfer details');

    String accountNumber = '';
    String bankName = '';
    String accountName = '';
    String amount = '';
    String reference = '';

    // Extract data from response
    if (response['data'] is Map<String, dynamic>) {
      final data = response['data'] as Map<String, dynamic>;
      accountNumber = data['accountNumber']?.toString() ??
          data['account_number']?.toString() ??
          'Not provided';
      bankName = data['bankName']?.toString() ??
          data['bank_name']?.toString() ??
          'Not provided';
      accountName = data['accountName']?.toString() ??
          data['account_name']?.toString() ??
          'Not provided';
      amount = data['amount']?.toString() ?? _amountController.text;
      reference = data['reference']?.toString() ??
          data['paymentReference']?.toString() ??
          'Not provided';
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Column(
          children: [
            Icon(Icons.account_balance,
                color: AppColors.blueBackground, size: 48),
            SizedBox(height: 12),
            Text(
              'Bank Transfer Details',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('Bank Name', bankName),
            _buildDetailRow('Account Name', accountName),
            _buildDetailRow('Account Number', accountNumber),
            _buildDetailRow(
                'Amount', '₦${_formatCurrency(double.tryParse(amount) ?? 0)}'),
            _buildDetailRow('Reference', reference),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.orange, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Transfer the exact amount to the account above. Your wallet will be credited automatically.',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.pop(true);
            },
            child: const Text('Done'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              // Copy account number to clipboard
              Navigator.pop(context);
              context.pop(true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.copy, size: 16),
            label: const Text('Copy Account'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.textBlue,
        centerTitle: true,
        title: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'ADD MONEY',
            style: TextStyle(
              color: AppColors.textLight,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        leading: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Image.asset(
            'assets/images/logo.png',
            height: 24,
            width: 24,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Secondary App Bar
            Container(
              height: 60,
              width: double.infinity,
              color: Colors.grey[200],
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back,
                      color: AppColors.blueBackground,
                    ),
                    onPressed: () => context.pop(),
                  ),
                  const Spacer(),
                ],
              ),
            ),

            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Amount Input Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.whiteBackground,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ENTER AMOUNT',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF666666),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _amountController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: AppColors.blueBackground,
                            ),
                            decoration: InputDecoration(
                              prefixText: 'N',
                              prefixStyle: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: AppColors.blueBackground,
                              ),
                              hintText: '0',
                              hintStyle: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey[300],
                              ),
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'QUICK AMOUNTS',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF666666),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _quickAmounts.map((amount) {
                              return GestureDetector(
                                onTap: () => _setQuickAmount(amount),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.lightBlueBackground,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: AppColors.blueBackground,
                                      width: 1,
                                    ),
                                  ),
                                  child: Text(
                                    'N${_formatCurrency(amount)}',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.blueBackground,
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Payment Method Selection
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4),
                      child: Text(
                        'SELECT PAYMENT METHOD',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF666666),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Payment Method Options
                    ..._paymentMethods.map((method) {
                      final isSelected =
                          _selectedPaymentMethod == method['name'];
                      final isDisabled = method['disabled'] == true;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: GestureDetector(
                          onTap: isDisabled
                              ? null
                              : () {
                                  setState(() {
                                    _selectedPaymentMethod = method['name'];
                                  });
                                },
                          child: Opacity(
                            opacity: isDisabled ? 0.5 : 1.0,
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.lightBlueBackground
                                    : AppColors.whiteBackground,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.blueBackground
                                      : isDisabled
                                          ? Colors.grey[300]!
                                          : Colors.grey[300]!,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    method['icon'] as IconData,
                                    color: isSelected
                                        ? AppColors.blueBackground
                                        : isDisabled
                                            ? Colors.grey[400]
                                            : Colors.grey[600],
                                    size: 24,
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Text(
                                      method['name'] as String,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: isSelected
                                            ? AppColors.blueBackground
                                            : isDisabled
                                                ? Colors.grey[400]
                                                : Colors.black87,
                                      ),
                                    ),
                                  ),
                                  if (isDisabled)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.grey[300],
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        'Coming Soon',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Colors.grey,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  if (isSelected)
                                    const Icon(
                                      Icons.check_circle,
                                      color: AppColors.blueBackground,
                                      size: 24,
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }),

                    const SizedBox(height: 32),

                    // Proceed Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isFormValid() && !_isLoading
                            ? _handleProceed
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blueBackground,
                          foregroundColor: AppColors.textLight,
                          disabledBackgroundColor: Colors.grey[400],
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    AppColors.textLight,
                                  ),
                                ),
                              )
                            : const Text(
                                'PROCEED',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
