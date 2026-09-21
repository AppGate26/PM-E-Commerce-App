// presentation/verification/payment_cards_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_card_repository.dart';

final paymentCardRepositoryProvider = Provider<PaymentCardRepository>((ref) {
  return PaymentCardRepository();
});

class PaymentCardsScreen extends ConsumerStatefulWidget {
  const PaymentCardsScreen({super.key});

  @override
  ConsumerState<PaymentCardsScreen> createState() => _PaymentCardsScreenState();
}

class _PaymentCardsScreenState extends ConsumerState<PaymentCardsScreen> {
  // Controllers
  final _cardNumberController = TextEditingController();
  final _cardHolderController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();

  // State
  String? _selectedCardType;
  bool _isLoading = false;
  bool _isLoadingData = true;
  bool _isFormMode = false; // false = list, true = add/edit form
  int? _editingCardId; // null = adding new card

  List<Map<String, dynamic>> _cards = [];

  final List<String> _cardTypes = [
    'Visa',
    'Mastercard',
    'Verve',
    'American Express',
    'Discover',
  ];

  @override
  void initState() {
    super.initState();
    print('🟣 [PaymentCards] ===== SCREEN INITIALIZED =====');
    _loadCards();
  }

  @override
  void dispose() {
    _cardNumberController.dispose();
    _cardHolderController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  // ============================================================
  // LOAD CARDS
  // ============================================================
  Future<void> _loadCards() async {
    print('🟣 [PaymentCards] ===== LOADING CARDS =====');
    setState(() => _isLoadingData = true);

    try {
      final repo = ref.read(paymentCardRepositoryProvider);
      final cards = await repo.getPaymentCards();

      print('✅ [PaymentCards] Loaded ${cards.length} cards');

      if (mounted) {
        setState(() {
          _cards = cards;
          _isLoadingData = false;
        });
      }
    } catch (e) {
      print('🔴 [PaymentCards] Error loading cards: $e');
      if (mounted) {
        setState(() => _isLoadingData = false);
        _showError('Failed to load cards');
      }
    }
  }

  // ============================================================
  // OPEN ADD FORM
  // ============================================================
  void _openAddForm() {
    print('🟣 [PaymentCards] Opening ADD form');
    _clearForm();
    setState(() {
      _isFormMode = true;
      _editingCardId = null;
    });
  }

  // ============================================================
  // OPEN EDIT FORM
  // ============================================================
  void _openEditForm(Map<String, dynamic> card) {
    print('🟣 [PaymentCards] Opening EDIT form for card: ${card['id']}');
    print('🟣 [PaymentCards] Card data: $card');

    // Card number – we only have last4 from backend
    final last4 = card['last4']?.toString() ?? '';
    _cardNumberController.text = last4.isNotEmpty ? '************$last4' : '';

    // Card holder name
    _cardHolderController.text = card['cardName']?.toString() ?? '';

    // Expiry
    final expMonth = card['expMonth']?.toString() ?? '';
    final expYear = card['expYear']?.toString() ?? '';
    if (expMonth.isNotEmpty && expYear.isNotEmpty) {
      _expiryController.text = '$expMonth/$expYear';
    } else {
      _expiryController.text = '';
    }

    // CVV is never returned by backend for security
    _cvvController.text = '';

    // Brand / Card type
    _selectedCardType = card['brand']?.toString();

    setState(() {
      _isFormMode = true;
      _editingCardId = card['id'] is int
          ? card['id']
          : int.tryParse(card['id']?.toString() ?? '');
    });
  }

  void _clearForm() {
    _cardNumberController.clear();
    _cardHolderController.clear();
    _expiryController.clear();
    _cvvController.clear();
    _selectedCardType = null;
  }

  // ============================================================
  // SAVE (ADD or UPDATE)
  // ============================================================
  Future<void> _saveCard() async {
    print('🟣 [PaymentCards] ===== SAVING CARD =====');

    final cardNumber = _cardNumberController.text.trim().replaceAll(' ', '');
    final holder = _cardHolderController.text.trim();
    final expiry = _expiryController.text.trim();
    final cvv = _cvvController.text.trim();

    // Validation
    if (cardNumber.isEmpty ||
        cardNumber.length < 15 ||
        cardNumber.length > 16) {
      _showError('Enter a valid 15-16 digit card number');
      return;
    }
    if (holder.isEmpty) {
      _showError('Enter card holder name');
      return;
    }
    if (!RegExp(r'^\d{2}/\d{2}$').hasMatch(expiry)) {
      _showError('Expiry must be in MM/YY format');
      return;
    }
    if (cvv.length < 3 || cvv.length > 4) {
      _showError('Enter a valid 3-4 digit CVV');
      return;
    }
    if (_selectedCardType == null) {
      _showError('Select card type');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(paymentCardRepositoryProvider);

      if (_editingCardId != null) {
        // UPDATE
        print('🟣 [PaymentCards] Updating card ID: $_editingCardId');
        final authState = ref.read(authProvider);
        final user = authState.hasValue ? authState.value : null;
        final userEmail = user?.email ?? 'user@example.com';

        await repo.updatePaymentCard(
          cardId: _editingCardId!,
          cardNumber: cardNumber,
          cardHolderName: holder,
          expiryDate: expiry,
          cvv: cvv,
          cardType: _selectedCardType,
          email: userEmail,
          bankName: 'Access Bank',
        );
        _showSuccess('Card updated successfully');
      } else {
        // ADD
        print('🟣 [PaymentCards] Adding new card');
        final authState = ref.read(authProvider);
        final user = authState.hasValue ? authState.value : null;
        final userEmail = user?.email ?? 'user@example.com';
        await repo.addPaymentCard(
          cardNumber: cardNumber,
          cardHolderName: holder,
          expiryDate: expiry,
          cvv: cvv,
          email: userEmail,
          cardType: _selectedCardType,
          bankName: 'Access Bank',
        );
        _showSuccess('Card added successfully');
      }

      // Refresh list
      await _loadCards();

      if (mounted) {
        setState(() {
          _isFormMode = false;
          _isLoading = false;
          _editingCardId = null;
        });
        _clearForm();
      }
    } catch (e) {
      print('🔴 [PaymentCards] Save error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        _showError(e.toString());
      }
    }
  }

  // ============================================================
  // DELETE CARD
  // ============================================================
  Future<void> _deleteCard(int cardId) async {
    print('🟣 [PaymentCards] ===== DELETE CARD $cardId =====');

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Delete Card?',
          style:
              TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w700),
        ),
        content: const Text(
          'Are you sure you want to delete this payment card? This action cannot be undone.',
          style: TextStyle(fontFamily: 'Montserrat'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(paymentCardRepositoryProvider);
      final success = await repo.deletePaymentCard(cardId);

      if (success) {
        _showSuccess('Card deleted successfully');
        await _loadCards();
      } else {
        _showError('Failed to delete card');
      }
    } catch (e) {
      print('🔴 [PaymentCards] Delete error: $e');
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================
  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:
            Text(message, style: const TextStyle(fontFamily: 'Montserrat')),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Text(message, style: const TextStyle(fontFamily: 'Montserrat')),
          ],
        ),
        backgroundColor: Colors.green.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  String _maskCard(String? number) {
    if (number == null || number.isEmpty) return '**** **** **** ****';
    final clean = number.replaceAll(' ', '');
    if (clean.length < 4) return '**** **** **** ****';
    return '**** **** **** ${clean.substring(clean.length - 4)}';
  }

  // ============================================================
  // BUILD
  // ============================================================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.whiteBackground,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: _isLoadingData
                  ? _buildLoading()
                  : _isFormMode
                      ? _buildForm()
                      : _buildCardList(),
            ),
          ],
        ),
      ),
    );
  }

  // ============================================================
  // HEADER
  // ============================================================
  Widget _buildHeader() {
    return Container(
      height: 60,
      width: double.infinity,
      color: AppColors.blueBackground,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.textLight),
            onPressed: () {
              if (_isFormMode) {
                setState(() {
                  _isFormMode = false;
                  _editingCardId = null;
                });
                _clearForm();
              } else {
                context.pop();
              }
            },
          ),
          Expanded(
            child: Center(
              child: Text(
                _isFormMode
                    ? (_editingCardId != null ? 'EDIT CARD' : 'ADD CARD')
                    : 'PAYMENT CARDS',
                style: const TextStyle(
                  color: AppColors.textLight,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Montserrat',
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          if (!_isFormMode)
            IconButton(
              icon: const Icon(Icons.add_circle_outline,
                  color: AppColors.textLight),
              onPressed: _openAddForm,
            )
          else
            const SizedBox(width: 48),
        ],
      ),
    );
  }

  // ============================================================
  // LOADING
  // ============================================================
  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.blueBackground),
          SizedBox(height: 16),
          Text(
            'Loading payment cards...',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF666666),
              fontFamily: 'Montserrat',
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // CARD LIST
  // ============================================================
  Widget _buildCardList() {
    if (_cards.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.credit_card_off, size: 72, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            const Text(
              'No payment cards yet',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                fontFamily: 'Montserrat',
                color: Color(0xFF333333),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Add a card to make payments faster',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
                fontFamily: 'Montserrat',
              ),
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: _openAddForm,
              icon: const Icon(Icons.add),
              label: const Text('Add Payment Card'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blueBackground,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadCards,
      color: AppColors.blueBackground,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _cards.length + 1,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          if (index == _cards.length) {
            return Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 24),
              child: OutlinedButton.icon(
                onPressed: _openAddForm,
                icon: const Icon(Icons.add),
                label: const Text('Add Another Card'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.blueBackground,
                  side: const BorderSide(color: AppColors.blueBackground),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            );
          }

          final card = _cards[index];
          return _buildCardTile(card);
        },
      ),
    );
  }

  Widget _buildCardTile(Map<String, dynamic> card) {
    final id = card['id'] is int
        ? card['id'] as int
        : int.tryParse(card['id']?.toString() ?? '') ?? 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.blueBackground.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  card['brand']?.toString() ?? 'Card',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.blueBackground,
                    fontFamily: 'Montserrat',
                  ),
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.edit_outlined, size: 20),
                color: AppColors.blueBackground,
                onPressed: () => _openEditForm(card),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 20),
                color: Colors.red.shade400,
                onPressed: () => _deleteCard(id),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _maskCard(card['last4']?.toString()),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.5,
              fontFamily: 'Montserrat',
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                card['cardName']?.toString().toUpperCase() ?? 'N/A',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade600,
                  fontFamily: 'Montserrat',
                ),
              ),
              Text(
                '${card['expMonth']}/${card['expYear']}' ?? 'N/A',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade600,
                  fontFamily: 'Montserrat',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ============================================================
  // FORM (ADD / EDIT)
  // ============================================================
  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Live Preview
          _buildCardPreview(),
          const SizedBox(height: 28),

          // Card Type
          _buildLabel('CARD TYPE'),
          const SizedBox(height: 6),
          _buildDropdown(),
          const SizedBox(height: 20),

          // Card Number
          _buildLabel('CARD NUMBER'),
          const SizedBox(height: 6),
          _buildTextField(
            controller: _cardNumberController,
            hint: '1234 5678 9012 3456',
            keyboardType: TextInputType.number,
            maxLength: 19,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(16),
            ],
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 20),

          // Card Holder
          _buildLabel('CARD HOLDER NAME'),
          const SizedBox(height: 6),
          _buildTextField(
            controller: _cardHolderController,
            hint: 'John Doe',
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 20),

          // Expiry + CVV
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel('EXPIRY (MM/YY)'),
                    const SizedBox(height: 6),
                    _buildTextField(
                      controller: _expiryController,
                      hint: 'MM/YY',
                      keyboardType: TextInputType.number,
                      maxLength: 5,
                      onChanged: (v) {
                        if (v.length == 2 && !v.contains('/')) {
                          _expiryController.text = '$v/';
                          _expiryController.selection =
                              TextSelection.fromPosition(
                            TextPosition(offset: _expiryController.text.length),
                          );
                        }
                        setState(() {});
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel('CVV'),
                    const SizedBox(height: 6),
                    _buildTextField(
                      controller: _cvvController,
                      hint: '***',
                      keyboardType: TextInputType.number,
                      maxLength: 4,
                      obscureText: true,
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 36),

          // Save Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _saveCard,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blueBackground,
                foregroundColor: Colors.white,
                disabledBackgroundColor: Colors.grey.shade300,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation(Colors.white),
                      ),
                    )
                  : Text(
                      _editingCardId != null ? 'UPDATE CARD' : 'SAVE CARD',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Montserrat',
                        letterSpacing: 0.5,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // CARD PREVIEW
  // ============================================================
  Widget _buildCardPreview() {
    final number = _cardNumberController.text.replaceAll(' ', '');
    final masked = number.length >= 4
        ? '**** **** **** ${number.substring(number.length - 4)}'
        : '**** **** **** ****';
    final holder = _cardHolderController.text.isEmpty
        ? 'CARD HOLDER'
        : _cardHolderController.text.toUpperCase();
    final expiry =
        _expiryController.text.isEmpty ? 'MM/YY' : _expiryController.text;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.blueBackground,
            AppColors.blueBackground.withOpacity(0.85),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppColors.blueBackground.withOpacity(0.35),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _selectedCardType ?? 'CARD',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Montserrat',
                ),
              ),
              const Icon(Icons.credit_card, color: Colors.white, size: 28),
            ],
          ),
          const SizedBox(height: 28),
          Text(
            masked,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w600,
              letterSpacing: 2.5,
              fontFamily: 'Montserrat',
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CARD HOLDER',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.65),
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Montserrat',
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    holder,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Montserrat',
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'EXPIRES',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.65),
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Montserrat',
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    expiry,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Montserrat',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ============================================================
  // FORM HELPERS
  // ============================================================
  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: Color(0xFF333333),
        fontFamily: 'Montserrat',
        letterSpacing: 0.4,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    String? hint,
    TextInputType? keyboardType,
    int? maxLength,
    bool obscureText = false,
    List<TextInputFormatter>? inputFormatters,
    ValueChanged<String>? onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        maxLength: maxLength,
        obscureText: obscureText,
        inputFormatters: inputFormatters,
        onChanged: onChanged,
        style: const TextStyle(
          fontSize: 16,
          fontFamily: 'Montserrat',
          color: Colors.black87,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            color: Colors.grey.shade400,
            fontFamily: 'Montserrat',
            fontSize: 15,
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: InputBorder.none,
          counterText: '',
        ),
      ),
    );
  }

  Widget _buildDropdown() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: DropdownButtonFormField<String>(
        value: _selectedCardType,
        decoration: const InputDecoration(
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: InputBorder.none,
        ),
        hint: Text(
          'Select Card Type',
          style: TextStyle(
            color: Colors.grey.shade400,
            fontFamily: 'Montserrat',
          ),
        ),
        items: _cardTypes
            .map((t) => DropdownMenuItem(
                  value: t,
                  child:
                      Text(t, style: const TextStyle(fontFamily: 'Montserrat')),
                ))
            .toList(),
        onChanged: (v) => setState(() => _selectedCardType = v),
      ),
    );
  }
}
