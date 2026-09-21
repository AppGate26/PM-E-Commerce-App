// lib/presentation/delivery/screens/feedback_confirmation_screen.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_agent_provider.dart';
import 'package:pm_e_commerce_app/presentation/delivery/widgets/bottom_navbar.dart';

class DeliveryConfirmationScreen extends ConsumerStatefulWidget {
  const DeliveryConfirmationScreen({super.key});

  @override
  ConsumerState<DeliveryConfirmationScreen> createState() =>
      _DeliveryConfirmationScreenState();
}

class _DeliveryConfirmationScreenState
    extends ConsumerState<DeliveryConfirmationScreen> {
  String? _status;
  final _productIdController = TextEditingController();
  final _customerNameController = TextEditingController();
  final Map<String, dynamic> _data = {};
  int _currentIndex = 2;
  int? _riderBoxId;
  int? _productId;
  String? _deliveryAgentName;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadAgentName();
  }

  Future<void> _loadAgentName() async {
    try {
      print('🚚 [DeliveryConfirmation] Loading agent name...');
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        final name = userJson['name'] as String?;
        if (name != null && name.isNotEmpty) {
          setState(() {
            _deliveryAgentName = name;
          });
          print(
              '✅ [DeliveryConfirmation] Agent name loaded: $_deliveryAgentName');
        }
      }
    } catch (e) {
      print('❌ [DeliveryConfirmation] Error loading agent name: $e');
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
    if (extra != null) {
      _data.addAll(extra);
      _riderBoxId = extra['riderBoxId'] as int?;
      final productIdStr = extra['productId'] as String?;
      if (productIdStr != null) {
        _productId = int.tryParse(productIdStr);
      }
      _customerNameController.text = extra['customerName'] ?? '';
      _productIdController.text = productIdStr ?? '';
      print(
          '🚚 [DeliveryConfirmation] Loaded data - riderBoxId: $_riderBoxId, productId: $_productId');
    }
  }

  @override
  void dispose() {
    _productIdController.dispose();
    _customerNameController.dispose();
    super.dispose();
  }

  void _showSuccessPopup() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Row(
              children: [
                Image.asset('assets/images/logo-blue.png',
                    height: 48, width: 48),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('DATA SAVED',
                          style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600)),
                      Text('SUCCESSFULLY',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: AppColors.blueBackground)),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                      color: AppColors.blueBackground, shape: BoxShape.circle),
                  child: const Icon(Icons.check, color: Colors.white, size: 28),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  context.go(AppRoutes.deliveryHome);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueBackground,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('OK', style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _saveConfirmation() async {
    if (_status == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select delivery status'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_productIdController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter product ID'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_customerNameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter customer name'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_riderBoxId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Delivery information missing. Please go back and try again.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final productId =
        _productId ?? int.tryParse(_productIdController.text.trim());
    if (productId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid product ID'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      print('🚚 [DeliveryConfirmation] Submitting feedback...');
      print(
          '🚚 [DeliveryConfirmation] riderBoxId: $_riderBoxId, productId: $productId');
      print(
          '🚚 [DeliveryConfirmation] customerName: ${_customerNameController.text}, status: $_status');

      await ref.read(deliveryAgentProvider.notifier).submitFeedback(
            riderBoxId: _riderBoxId!,
            deliveryAgentName: _deliveryAgentName ?? 'Unknown',
            productId: productId,
            customerName: _customerNameController.text.trim(),
            status: _status!,
          );

      print('✅ [DeliveryConfirmation] Feedback submitted successfully');

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        _showSuccessPopup();
      }
    } catch (e) {
      ErrorHandler.logError('DeliveryConfirmation', e);
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        final errorMessage = ErrorHandler.getUserFriendlyError(e);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
    final navbarHeight = 80.0;
    final extraBottomPadding =
        keyboardHeight > 0 ? keyboardHeight + navbarHeight : navbarHeight + 20;

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        title: const Text(
          'Feedback Confirmation',
          style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: AppColors.textLight),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.only(bottom: extraBottomPadding),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Material(
              elevation: 4,
              borderRadius: BorderRadius.circular(15),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Delivery Agent
                    const Text('Delivery Agent',
                        style:
                            TextStyle(fontSize: 14, color: Color(0xFF666666))),
                    const SizedBox(height: 8),
                    TextFormField(
                      initialValue:
                          _deliveryAgentName ?? _data['agent'] ?? 'Gabriel',
                      readOnly: true,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              const BorderSide(color: Color(0xFFE0E0E0)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              const BorderSide(color: Color(0xFFE0E0E0)),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 14),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Product Id
                    const Text('Product Id',
                        style:
                            TextStyle(fontSize: 14, color: Color(0xFF666666))),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _productIdController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              const BorderSide(color: Color(0xFFE0E0E0)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              const BorderSide(color: Color(0xFFE0E0E0)),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 14),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Customer's name
                    const Text('Customer\'s name',
                        style:
                            TextStyle(fontSize: 14, color: Color(0xFF666666))),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _customerNameController,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              const BorderSide(color: Color(0xFFE0E0E0)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              const BorderSide(color: Color(0xFFE0E0E0)),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 14),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Status of delivery
                    const Text('Status of delivery',
                        style:
                            TextStyle(fontSize: 14, color: Color(0xFF666666))),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _status,
                      hint: const Text('Select status'),
                      items: [
                        'DELIVERED',
                        'Wrong Product',
                        'Owner not available',
                        'Wrong Address',
                      ]
                          .map(
                              (s) => DropdownMenuItem(value: s, child: Text(s)))
                          .toList(),
                      onChanged: (v) => setState(() => _status = v),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              const BorderSide(color: Color(0xFFE0E0E0)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              const BorderSide(color: Color(0xFFE0E0E0)),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 14),
                      ),
                    ),
                    const SizedBox(height: 24),

                    Align(
                      alignment: Alignment.centerRight,
                      child: SizedBox(
                        width: 120,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _saveConfirmation,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.blueBackground,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('SAVE',
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: DeliveryBottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}
