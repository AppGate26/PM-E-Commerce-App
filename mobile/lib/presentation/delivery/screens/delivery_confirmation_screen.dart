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
  // Value sent to the backend (FeedbackStatus enum) -> label shown to the rider. The labels
  // used to be sent as-is, which the backend rejected for everything except DELIVERED.
  static const Map<String, String> _statusOptions = {
    'DELIVERED': 'Delivered',
    'WRONG_PRODUCT': 'Wrong Product',
    'OWNER_NOT_AVAILABLE': 'Owner not available',
    'WRONG_ADDRESS': 'Wrong Address',
  };
  final _agentController = TextEditingController();
  final _productIdController = TextEditingController();
  final _customerNameController = TextEditingController();
  bool _loadingDetails = false;
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
        if (name != null && name.isNotEmpty && mounted) {
          setState(() {
            _deliveryAgentName = name;
            if (_agentController.text.isEmpty) _agentController.text = name;
          });
          print(
              '✅ [DeliveryConfirmation] Agent name loaded: $_deliveryAgentName');
        }
      }
    } catch (e) {
      print('❌ [DeliveryConfirmation] Error loading agent name: $e');
    }
  }

  bool _extrasLoaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_extrasLoaded) return;
    _extrasLoaded = true;
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
    if (extra != null) {
      _data.addAll(extra);
      _riderBoxId = extra['riderBoxId'] as int?;
      // May arrive as an int or a string depending on the screen that pushed us.
      final rawProductId = extra['productId'];
      _productId = rawProductId is int ? rawProductId : int.tryParse('${rawProductId ?? ''}');
      if (_productId == 0) _productId = null;
      _customerNameController.text = extra['customerName']?.toString() ?? '';
      _productIdController.text = _productId?.toString() ?? '';
    }
    if (_riderBoxId != null && (_productId == null || _customerNameController.text.isEmpty)) {
      _fillFromDelivery(_riderBoxId!);
    }
  }

  /// Pulls product id, customer and rider name from the delivery itself, so the rider
  /// doesn't have to type them.
  Future<void> _fillFromDelivery(int riderBoxId) async {
    // Called from didChangeDependencies, before the first build - no setState needed here.
    _loadingDetails = true;
    try {
      final detail = await ref.read(deliveryAgentProvider.notifier).getDeliveryDetail(riderBoxId);
      if (!mounted) return;
      setState(() {
        if (_productId == null && detail.productId != 0) {
          _productId = detail.productId;
          _productIdController.text = detail.productId.toString();
        }
        if (_customerNameController.text.isEmpty) {
          _customerNameController.text = detail.customerName;
        }
        if (detail.riderName != null && detail.riderName!.isNotEmpty) {
          _deliveryAgentName = detail.riderName;
          _agentController.text = detail.riderName!;
        }
      });
    } catch (e) {
      print('⚠️ [DeliveryConfirmation] Could not load delivery details: $e');
    } finally {
      if (mounted) setState(() => _loadingDetails = false);
    }
  }

  @override
  void dispose() {
    _agentController.dispose();
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

    final productId = _productId ?? int.tryParse(_productIdController.text.trim()) ?? 0;

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
            deliveryAgentName: _agentController.text.trim().isNotEmpty
                ? _agentController.text.trim()
                : (_deliveryAgentName ?? ''),
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
                      controller: _agentController,
                      readOnly: true,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFFF8F8FF),
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
                      readOnly: true,
                      decoration: InputDecoration(
                        hintText: _loadingDetails ? 'Loading...' : 'Filled in automatically',
                        filled: true,
                        fillColor: const Color(0xFFF8F8FF),
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
                      items: _statusOptions.entries
                          .map((e) => DropdownMenuItem(
                              value: e.key, child: Text(e.value)))
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
