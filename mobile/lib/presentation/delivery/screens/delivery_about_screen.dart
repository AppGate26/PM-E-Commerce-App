// lib/presentation/delivery/screens/delivery_about_screen.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/delivery_agent_model.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_agent_provider.dart';

class DeliveryAboutScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> data;

  const DeliveryAboutScreen({super.key, required this.data});

  @override
  ConsumerState<DeliveryAboutScreen> createState() => _DeliveryAboutScreenState();
}

class _DeliveryAboutScreenState extends ConsumerState<DeliveryAboutScreen> {
  DeliveryDetail? _deliveryDetail;
  bool _isLoading = true;
  String? _errorMessage;
  String? _agentName;
  bool _isStarting = false;

  @override
  void initState() {
    super.initState();
    _loadAgentName();
    _loadDeliveryDetail();
  }

  Future<void> _loadAgentName() async {
    try {
      print('🚚 [DeliveryAbout] Loading agent name...');
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        final name = userJson['name'] as String?;
        if (name != null && name.isNotEmpty) {
          setState(() {
            _agentName = name;
          });
          print('✅ [DeliveryAbout] Agent name loaded: $_agentName');
        }
      }
    } catch (e) {
      print('❌ [DeliveryAbout] Error loading agent name: $e');
    }
  }

  Future<void> _loadDeliveryDetail() async {
    final riderBoxId = widget.data['riderBoxId'] as int?;
    if (riderBoxId == null) {
      print('⚠️ [DeliveryAbout] No riderBoxId provided, using fallback data');
      setState(() {
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('🔄 [DeliveryAbout] Fetching delivery detail for riderBoxId: $riderBoxId');
      final detail = await ref.read(deliveryAgentProvider.notifier).getDeliveryDetail(riderBoxId);
      print('✅ [DeliveryAbout] Loaded delivery detail');
      
      if (mounted) {
        setState(() {
          _deliveryDetail = detail;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ [DeliveryAbout] Error loading delivery detail: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  /// "Start delivery" moves the delivery to IN_TRANSIT on the backend (the web Transit page
  /// and the customer's order both show it on the way), then opens the confirmation form.
  /// A delivery that is already in transit goes straight to the form.
  Future<void> _startAndProceed() async {
    final riderBoxId = _deliveryDetail?.riderBoxId ?? widget.data['riderBoxId'] as int?;
    if (riderBoxId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Delivery information missing'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final alreadyInTransit = _deliveryDetail?.isInTransit ?? widget.data['status'] == 'IN_TRANSIT';
    if (!alreadyInTransit) {
      setState(() => _isStarting = true);
      try {
        await ref.read(deliveryAgentRepositoryProvider).startDelivery(riderBoxId);
      } catch (e) {
        if (!mounted) return;
        setState(() => _isStarting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not start delivery: $e'), backgroundColor: Colors.red),
        );
        return;
      }
      if (!mounted) return;
      setState(() => _isStarting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Delivery started - marked as in transit'), backgroundColor: Colors.green),
      );
    }

    final detail = _deliveryDetail;
    final productName = detail?.productName ?? widget.data['productName']?.toString() ?? '';
    context.push(
      AppRoutes.newDelivery,
      extra: {
        'riderBoxId': riderBoxId,
        'address': detail?.deliveryAddress ?? widget.data['address'] ?? '',
        'item': detail?.itemOfDelivery ?? productName,
        'productId': detail?.productId ?? widget.data['productId'],
        'productName': productName,
        'customerName': detail?.customerName ?? widget.data['customerName'] ?? '',
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final detail = _deliveryDetail;
    final fallbackData = widget.data;

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        title: const Text(
          'About Product',
          style: TextStyle(
            fontWeight: FontWeight.w500,
            color: AppColors.textLight,
            fontSize: 20,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (detail != null)
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white),
              onPressed: _loadDeliveryDetail,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadDeliveryDetail,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 20),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.whiteBackground,
                        borderRadius: BorderRadius.circular(15),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 10),
                          _buildTextField(
                            'Name of Delivery man',
                            detail?.riderName ?? _agentName ?? '-',
                            enabled: false,
                          ),
                          const SizedBox(height: 20),
                          _buildTextField(
                            'Customer',
                            [
                              detail?.customerName ?? fallbackData['customerName']?.toString() ?? '',
                              detail?.customerPhone ?? '',
                            ].where((s) => s.isNotEmpty).join(' - '),
                            enabled: false,
                          ),
                          const SizedBox(height: 20),
                          _buildTextField(
                            'Address of Delivery',
                            detail?.deliveryAddress ?? fallbackData['address'] ?? 'Enter address here',
                            enabled: false,
                          ),
                          const SizedBox(height: 20),
                          _buildTextField(
                            'Product ID',
                            detail != null ? detail.productId.toString() : (fallbackData['productId']?.toString() ?? 'Enter Product ID'),
                            enabled: false,
                          ),
                          const SizedBox(height: 20),
                          _buildTextField(
                            'Sales Ref',
                            detail?.salesReference ?? '-',
                            enabled: false,
                          ),
                          const SizedBox(height: 20),
                          _buildTextField(
                            'Product Name',
                            detail?.productName ?? fallbackData['productName'] ?? fallbackData['title'] ?? 'Automatically Displays',
                            enabled: false,
                          ),
                          const SizedBox(height: 20),
                          _buildTextField(
                            'Product Category',
                            detail?.productCategory ?? '-',
                            enabled: false,
                          ),
                          const SizedBox(height: 30),

                          // Proceed Button
                          if (detail != null || fallbackData['riderBoxId'] != null)
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _isStarting ? null : _startAndProceed,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.blueBackground,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: _isStarting
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : Text(
                                        (detail?.isInTransit ?? fallbackData['status'] == 'IN_TRANSIT')
                                            ? 'CONTINUE TO CONFIRMATION'
                                            : 'START DELIVERY',
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
    );
  }

  Widget _buildTextField(String label, String value, {bool enabled = true, bool isDropdown = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF444444),
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: TextEditingController(text: value),
          enabled: enabled,
          readOnly: !enabled,
          decoration: InputDecoration(
            hintText: value.isEmpty ? 'Enter $label' : null,
            hintStyle: TextStyle(
              color: enabled ? const Color(0xFFAAAAAA) : const Color(0xFF666666),
              fontSize: 14,
            ),
            filled: true,
            fillColor: enabled ? Colors.white : const Color(0xFFF8F8FF),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
            suffixIcon: isDropdown
                ? const Icon(Icons.keyboard_arrow_down, color: Color(0xFF666666))
                : null,
          ),
        ),
      ],
    );
  }
}
