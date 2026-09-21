// lib/presentation/payment/screens/card_payment_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
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

class CardPaymentScreen extends StatefulWidget {
  const CardPaymentScreen({super.key});

  @override
  State<CardPaymentScreen> createState() => _CardPaymentScreenState();
}

class _CardPaymentScreenState extends State<CardPaymentScreen> {
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();
  final _nameController = TextEditingController();

  bool _rememberCard = false;

  @override
  void dispose() {
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  String _detectBrand(String number) {
    final clean = number.trim();
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('5')) return 'Mastercard';
    if (clean.startsWith('3')) return 'DISCOVER';
    return 'Card';
  }

  Color _getBrandColor(String brand) {
    switch (brand) {
      case 'VISA':
        return const Color(0xFF3B82F6);
      case 'Mastercard':
        return const Color(0xFFEF4444);
      case 'DISCOVER':
        return const Color(0xFFFB923C);
      default:
        return Colors.grey;
    }
  }

  bool _isFormValid() {
    final cardNumber = _cardNumberController.text.replaceAll(' ', '');
    final expiry = _expiryController.text;
    final cvv = _cvvController.text;
    final name = _nameController.text.trim();

    return cardNumber.length == 16 &&
        expiry.length == 5 &&
        cvv.length == 3 &&
        name.isNotEmpty;
  }

  @override
  Widget build(BuildContext context) {
    final isValid = _isFormValid();

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
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 24),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Image.asset(
                  'assets/images/logo-blue.png',
                  height: 50,
                  width: 50,
                  fit: BoxFit.contain,
                ),
                Column(
                  children: [
                    const Text(
                      'ayoadede@gmail.com',
                      style: TextStyle(fontSize: 14, color: Colors.black87),
                    ),
                    Text(
                      '₦150,000.00',
                      style: TextStyle(
                        fontSize: 23,
                        fontWeight: FontWeight.bold,
                        color: AppColors.blueBackground,
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 12),
            const Text(
              'Enter your card details to pay',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.black54, fontSize: 14),
            ),

            const SizedBox(height: 32),

            // Card Number
            _buildInputField(
              label: 'Card Number',
              controller: _cardNumberController,
              hintText: '7990 8974 3743 1902 38',
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                _CardNumberFormatter(),
              ],
            ),

            const SizedBox(height: 16),

            SizedBox(
              height: 20,
              child: Image.asset(
                'assets/images/visa.png',
                fit: BoxFit.contain,
                filterQuality: FilterQuality.high,
              ),
            ),

            const SizedBox(height: 24),

            // Expiry & CVV
            Row(
              children: [
                Expanded(
                  child: _buildInputField(
                    label: 'Expiry date',
                    controller: _expiryController,
                    hintText: '03/26',
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(4),
                      _ExpiryDateFormatter(),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildInputField(
                    label: 'CVV',
                    controller: _cvvController,
                    hintText: '123',
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(3),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Name on Card
            _buildInputField(
              label: 'Name on card',
              controller: _nameController,
              hintText: 'James Cameroon',
            ),

            const SizedBox(height: 32),

            // Continue Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isValid
                    ? () async {
                        final cardNumber =
                            _cardNumberController.text.replaceAll(' ', '');
                        final last4 =
                            cardNumber.substring(cardNumber.length - 4);
                        final brand = _detectBrand(cardNumber);
                        final color = _getBrandColor(brand);

                        if (_rememberCard) {
                          final newCard = CardModel(
                              last4: last4, brand: brand, color: color);
                          final prefs = await SharedPreferences.getInstance();
                          final cardsJson =
                              prefs.getString('saved_cards') ?? '[]';
                          final List<dynamic> cardsList = jsonDecode(cardsJson);
                          cardsList.add(newCard.toJson());
                          await prefs.setString(
                              'saved_cards', jsonEncode(cardsList));
                        }

                        if (mounted) context.pop();
                      }
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      isValid ? AppColors.blueBackground : Colors.grey.shade400,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 3,
                ),
                child: const Text(
                  'Continue',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Remember Card
            Row(
              children: [
                Checkbox(
                  value: _rememberCard,
                  onChanged: (v) => setState(() => _rememberCard = v ?? false),
                  activeColor: AppColors.blueBackground,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4)),
                ),
                const Text('Remember this card',
                    style: TextStyle(fontSize: 14)),
              ],
            ),

            const SizedBox(height: 32),

            // Bottom Links
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () => context.push(AppRoutes.paymentOption),
                  child: Text(
                    'Change payment method',
                    style: TextStyle(
                      color: AppColors.blueBackground,
                      fontSize: 14,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Cancel',
                      style: TextStyle(color: Colors.black54, fontSize: 14)),
                ),
              ],
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required String hintText,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(color: Colors.black38, fontSize: 14),
            filled: true,
            fillColor: Colors.white,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: AppColors.blueBackground, width: 2),
            ),
          ),
        ),
      ],
    );
  }
}

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue old, TextEditingValue newValue) {
    var text = newValue.text.replaceAll(' ', '');
    if (text.length > 16) text = text.substring(0, 16);
    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      if ((i + 1) % 4 == 0 && i != text.length - 1) buffer.write(' ');
    }
    final String formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class _ExpiryDateFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue old, TextEditingValue newValue) {
    var text = newValue.text.replaceAll('/', '');
    if (text.length > 4) text = text.substring(0, 4);
    if (text.length > 2) text = '${text.substring(0, 2)}/${text.substring(2)}';
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
