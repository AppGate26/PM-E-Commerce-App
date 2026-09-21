// lib/presentation/payment/screens/card_list_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class CardModel {
  final String last4;
  final String brand;
  final Color color;

  CardModel({required this.last4, required this.brand, required this.color});

  Map<String, dynamic> toJson() => {
        'last4': last4,
        'brand': brand,
        'color': color.value,
      };

  factory CardModel.fromJson(Map<String, dynamic> json) => CardModel(
        last4: json['last4'],
        brand: json['brand'],
        color: Color(json['color']),
      );
}

class CardListScreen extends ConsumerStatefulWidget {
  final double amount;

  const CardListScreen({super.key, this.amount = 0});

  @override
  ConsumerState<CardListScreen> createState() => _CardListScreenState();
}

class _CardListScreenState extends ConsumerState<CardListScreen> {
  final PaymentRepository _paymentRepository = PaymentRepository();
  List<CardModel> savedCards = [];
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _loadCards();
  }

  Future<void> _loadCards() async {
    final prefs = await SharedPreferences.getInstance();
    final cardsJson = prefs.getString('saved_cards') ?? '[]';
    final List<dynamic> cardsList = jsonDecode(cardsJson);
    setState(() {
      savedCards = cardsList.map((e) => CardModel.fromJson(e)).toList();
    });
  }

  Future<void> _saveCards() async {
    final prefs = await SharedPreferences.getInstance();
    final cardsJson = jsonEncode(savedCards.map((e) => e.toJson()).toList());
    prefs.setString('saved_cards', cardsJson);
  }

  @override
  Widget build(BuildContext context) {
    final hasCards = savedCards.isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'CARDS',
          style: TextStyle(
              color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text(
              'BACK',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Stack(
        children: [
          hasCards ? _buildCardList() : _buildNoCardsScreen(),
          if (_isProcessing)
            Container(
              color: Colors.black26,
              child: const Center(
                child: CircularProgressIndicator(
                  valueColor:
                      AlwaysStoppedAnimation<Color>(AppColors.blueBackground),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _payWithCard() async {
    if (_isProcessing) return;

    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please login to continue'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      const callbackUrl = 'https://pm-app.com/payment/callback';

      final response = await _paymentRepository.initializeCardPayment(
        userId: user.id,
        amount: widget.amount,
        email: user.email,
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

      if (!mounted) return;
      setState(() => _isProcessing = false);

      final result = await context.push<Map<String, dynamic>?>(
        AppRoutes.paymentWebView,
        extra: {
          'paymentUrl': authorizationUrl,
          'paymentReference': paymentReference,
          'verificationType': 'cardPurchase',
        },
      );

      if (!mounted) return;

      if (result != null && result['success'] == true) {
        context.push(AppRoutes.paymentSuccess);
      } else if (result != null && result['success'] == false) {
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
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Widget _buildCardList() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        children: [
          const SizedBox(height: 24),
          ...savedCards.map((card) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _buildSavedCard(card),
              )),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () =>
                  context.push(AppRoutes.cardPayment).then((_) => _loadCards()),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blueBackground,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 3,
              ),
              child: const Text('ADD NEW',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSavedCard(CardModel card) {
    return GestureDetector(
      onTap: _isProcessing ? null : _payWithCard,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
                offset: const Offset(0, 2)),
          ],
        ),
        child: Row(
          children: [
            Container(
                width: 36,
                height: 36,
                decoration:
                    BoxDecoration(color: card.color, shape: BoxShape.circle)),
            const SizedBox(width: 12),
            Text('•••• •••• •••• ${card.last4}',
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87)),
            const Spacer(),
            Text(card.brand,
                style: const TextStyle(
                    fontSize: 14,
                    color: Colors.black54,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _buildNoCardsScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            'assets/images/no_cards.png',
            width: 200,
            height: 200,
          ),
          const SizedBox(height: 24),
          const Text(
            'YOU HAVEN\'T REGISTERED A CARD',
            style: TextStyle(
                fontSize: 16,
                color: Colors.black54,
                fontWeight: FontWeight.w500),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: 200,
            child: ElevatedButton(
              onPressed: () =>
                  context.push(AppRoutes.cardPayment).then((_) => _loadCards()),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blueBackground,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('ADD NEW',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }
}
