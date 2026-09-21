// lib/presentation/delivery/screens/new_delivery_screen.dart
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_agent_provider.dart';
import 'package:pm_e_commerce_app/presentation/delivery/widgets/bottom_navbar.dart';

class NewDeliveryScreen extends ConsumerStatefulWidget {
  const NewDeliveryScreen({super.key});

  @override
  ConsumerState<NewDeliveryScreen> createState() => _NewDeliveryScreenState();
}

class _NewDeliveryScreenState extends ConsumerState<NewDeliveryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _agentController = TextEditingController();
  final _addressController = TextEditingController();
  final _itemController = TextEditingController();
  final _timeController = TextEditingController();
  File? _proofImage;
  final ImagePicker _picker = ImagePicker();
  int _currentIndex = 2;
  int? _riderBoxId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadAgentName();
  }

  Future<void> _loadAgentName() async {
    try {
      print('🚚 [NewDelivery] Loading agent name...');
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        final name = userJson['name'] as String?;
        if (name != null && name.isNotEmpty) {
          _agentController.text = name;
          print('✅ [NewDelivery] Agent name loaded: $name');
        }
      }
    } catch (e) {
      print('❌ [NewDelivery] Error loading agent name: $e');
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
    if (extra != null) {
      _riderBoxId = extra['riderBoxId'] as int?;
      _addressController.text = extra['address'] ?? '';
      _itemController.text = extra['item'] ?? '';
      print('🚚 [NewDelivery] Loaded data - riderBoxId: $_riderBoxId');
    }
  }

  @override
  void dispose() {
    _agentController.dispose();
    _addressController.dispose();
    _itemController.dispose();
    _timeController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      print('🚚 [NewDelivery] Picking image...');
      final XFile? image = await _picker.pickImage(source: ImageSource.camera);
      if (image != null) {
        setState(() {
          _proofImage = File(image.path);
        });
        print('✅ [NewDelivery] Image picked: ${image.path}');
      }
    } catch (e) {
      print('❌ [NewDelivery] Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error picking image: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _saveAndProceed() async {
    if (!_formKey.currentState!.validate()) return;

    if (_riderBoxId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Delivery information missing. Please select a delivery first.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final deliveryAddress = _addressController.text.trim();
      final itemOfDelivery = _itemController.text.trim();
      final timeOfDelivery = _timeController.text.trim();
      final deliveryAgentName = _agentController.text.trim();

      print('🚚 [NewDelivery] Confirming delivery...');
      print('🚚 [NewDelivery] riderBoxId: $_riderBoxId');
      print('🚚 [NewDelivery] address: $deliveryAddress, item: $itemOfDelivery');

      DateTime? deliveryTime;
      if (timeOfDelivery.isNotEmpty) {
        deliveryTime = DateTime.tryParse(timeOfDelivery);
        deliveryTime ??= DateTime.now();
      } else {
        deliveryTime = DateTime.now();
      }

      String? imagePath;
      if (_proofImage != null) {
        imagePath = _proofImage!.path;
        print('🚚 [NewDelivery] Proof image: $imagePath');
      }

      await ref.read(deliveryAgentProvider.notifier).confirmDelivery(
        riderBoxId: _riderBoxId!,
        deliveryAgentName: deliveryAgentName,
        deliveryAddress: deliveryAddress,
        itemOfDelivery: itemOfDelivery,
        proofOfDeliveryImagePath: imagePath,
        timeOfDelivery: deliveryTime,
      );

      print('✅ [NewDelivery] Delivery confirmed successfully');

      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Delivery confirmed successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate to feedback confirmation
        context.push(
          AppRoutes.deliveryConfirmation,
          extra: {
            'riderBoxId': _riderBoxId,
            'address': deliveryAddress,
            'item': itemOfDelivery,
            'customerName': '', // Will be filled in confirmation screen
          },
        );
      }
    } catch (e) {
      ErrorHandler.logError('NewDelivery', e);
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
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        title: const Text(
          'Delivery Confirmation',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: AppColors.textLight),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.go(AppRoutes.deliveryHome),
        ),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        child: Center(
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2)),
              ],
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Delivery Agent
                  const Text('Delivery Agent', style: TextStyle(fontSize: 14, color: Color(0xFF666666))),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _agentController,
                    readOnly: true,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: const Color(0xFFF8F8FF),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Address
                  const Text('Address of Delivery', style: TextStyle(fontSize: 14, color: Color(0xFF666666))),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _addressController,
                    decoration: InputDecoration(
                      hintText: 'Enter address here',
                      filled: true,
                      fillColor: const Color(0xFFF8F8FF),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    ),
                    validator: (v) => v?.isEmpty == true ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),

                  // Item
                  const Text('Item of Delivery', style: TextStyle(fontSize: 14, color: Color(0xFF666666))),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _itemController,
                    decoration: InputDecoration(
                      hintText: 'Enter item here',
                      filled: true,
                      fillColor: const Color(0xFFF8F8FF),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    ),
                    validator: (v) => v?.isEmpty == true ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),

                  // Proof of Delivery
                  const Text('Prove of Delivery', style: TextStyle(fontSize: 14, color: Color(0xFF666666))),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F8FF),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE0E0E0)),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _proofImage != null ? Icons.check_circle : Icons.camera_alt,
                            color: _proofImage != null ? Colors.green : const Color(0xFF666666),
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _proofImage != null ? 'Image selected' : 'Upload picture of customer with goods',
                              style: TextStyle(
                                color: _proofImage != null ? Colors.green : const Color(0xFF666666),
                                fontSize: 14,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Time
                  const Text('Time of Delivery', style: TextStyle(fontSize: 14, color: Color(0xFF666666))),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _timeController,
                    decoration: InputDecoration(
                      hintText: 'Enter time (optional)',
                      filled: true,
                      fillColor: const Color(0xFFF8F8FF),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // SAVE Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _saveAndProceed,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.blueBackground,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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
                          : const Text('SAVE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                    ),
                  ),
                ],
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
