import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/installment_models.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/installment_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/verification_repository.dart';
import 'package:cached_network_image/cached_network_image.dart';

class PaymentFrequencyFirstScreen extends ConsumerStatefulWidget {
  const PaymentFrequencyFirstScreen({super.key});

  @override
  ConsumerState<PaymentFrequencyFirstScreen> createState() =>
      _PaymentFrequencyFirstScreenState();
}

class _PaymentFrequencyFirstScreenState
    extends ConsumerState<PaymentFrequencyFirstScreen> {
  Map<String, dynamic>? _product;
  String _selectedFrequency = 'Daily';
  bool _isCalculating = false;

  final VerificationRepository _verificationRepository =
      VerificationRepository();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    // Only ever process the incoming nav data once.
    if (_product != null) return;

    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;

    if (extra == null) {
      print(
          '💳 [PAYMENT FREQ] ⚠️ No product data received in navigation extra');
      return;
    }

    // Normalize the incoming map so `_calculateAndProceed` (unchanged below)
    // still finds `id` even though the cart sends `productId`.
    final normalized = Map<String, dynamic>.from(extra);
    normalized['id'] = extra['id'] ?? extra['productId'] ?? 0;

    setState(() {
      _product = normalized;
    });

    print('💳 [PAYMENT FREQ] Product data loaded: $_product');
  }

  // ============================================================
  // DYNAMIC DATA GETTERS — everything here is read from _product.
  // No hardcoded product name, price, description, or specs.
  // ============================================================

  List<dynamic> get _cartItems {
    final items = _product?['items'];
    if (items is List) return items;
    return const [];
  }

  bool get _isMultiItemOrder => _cartItems.length > 1;

  String get _displayName {
    final name = _product?['productName'] ?? _product?['name'];
    if (name != null && name.toString().trim().isNotEmpty) {
      return name.toString();
    }
    return 'Your Order';
  }

  String? get _displayImage {
    final image = _product?['image'];
    if (image != null && image.toString().trim().isNotEmpty) {
      return image.toString();
    }
    return null;
  }

  String? get _displayDescription {
    final description =
        _product?['description'] ?? _product?['productDescription'];
    if (description != null && description.toString().trim().isNotEmpty) {
      return description.toString();
    }
    return null;
  }

  int? get _displayQuantity {
    final quantity = _product?['quantity'];
    if (quantity is num) return quantity.toInt();
    return null;
  }

  double get _displayPrice {
    final value = _product?['sellingPrice'] ??
        _product?['price'] ??
        _product?['totalAmount'] ??
        0.0;
    return (value as num).toDouble();
  }

  String _formatMoney(num value) {
    final asInt = value.round();
    final str = asInt.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      final posFromRight = str.length - i;
      buffer.write(str[i]);
      if (posFromRight > 1 && posFromRight % 3 == 1) {
        buffer.write(',');
      }
    }
    return '₦${buffer.toString()}';
  }

  void _selectFrequency(String frequency) {
    print('💳 [PAYMENT FREQ] Frequency selected: $frequency');
    setState(() {
      _selectedFrequency = frequency;
    });

    // Show popup only when Monthly is selected
    if (frequency == 'Monthly') {
      print('💳 [PAYMENT FREQ] Monthly selected - showing months popup');
      _showMonthlyPopup(context);
    } else {
      // For Daily and Weekly, proceed directly to calculate and show pickup/delivery selection
      print(
          '💳 [PAYMENT FREQ] $frequency selected - calculating installment plan directly (no months popup)');
      _calculateAndProceed(frequency, null);
    }
  }

  Future<void> _calculateAndProceed(String frequency, int? months) async {
    if (_product == null) {
      print('💳 [PAYMENT FREQ] No product data available');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Product information is missing'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;

    if (user == null) {
      print('💳 [PAYMENT FREQ] User not authenticated');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please login to continue'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // ✅ Real verification check — same one used in cart
    setState(() {
      _isCalculating = true;
    });

    Map<String, bool> status;
    try {
      status = await _verificationRepository.checkFullVerificationStatus();
    } catch (e) {
      print('⚠️ [PAYMENT FREQ] Error checking verification: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not verify your account: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() {
          _isCalculating = false;
        });
      }
      return;
    }

    final missing =
        status.entries.where((e) => !e.value).map((e) => e.key).toList();
    final bool isVerified = missing.isEmpty;

    if (!isVerified) {
      print('💳 [PAYMENT FREQ] User not verified - missing: $missing');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please complete your verification first'),
            backgroundColor: Colors.orange,
          ),
        );
        context.push(AppRoutes.verificationCentre);
        setState(() {
          _isCalculating = false;
        });
      }
      return; // ✅ actually stop — no more silent bypass
    }

    try {
      final productId = int.tryParse(_product!['id']?.toString() ?? '0') ?? 0;

      double productPrice = 0.0;

      if (_product!['sellingPrice'] != null) {
        productPrice = (_product!['sellingPrice'] as num).toDouble();
      } else if (_product!['price'] != null) {
        productPrice = (_product!['price'] as num).toDouble();
      } else if (_product!['productPrice'] != null) {
        productPrice = (_product!['productPrice'] as num).toDouble();
      } else if (_product!['totalAmount'] != null) {
        productPrice = (_product!['totalAmount'] as num).toDouble();
      }

      if (productPrice <= 0) {
        print('💳 [PAYMENT FREQ] ⚠️ Product price is 0, using default');
        productPrice = 150000.0;
        print('💳 [PAYMENT FREQ] Using fallback price: ₦$productPrice');
      }

      String apiFrequency = 'DAILY';
      if (frequency == 'Weekly') {
        apiFrequency = 'WEEKLY';
      } else if (frequency == 'Monthly') {
        apiFrequency = 'MONTHLY';
      }

      final durationInMonths = months ?? 1;

      print('💳 [PAYMENT FREQ] Calculating installment:');
      print('💳 [PAYMENT FREQ] userId=${user.id}');
      print('💳 [PAYMENT FREQ] productId=$productId');
      print('💳 [PAYMENT FREQ] productPrice=$productPrice');
      print('💳 [PAYMENT FREQ] frequency=$apiFrequency');
      print('💳 [PAYMENT FREQ] months=$durationInMonths');

      final request = InstallmentCalculateRequest(
        orderId: 0,
        userId: user.id,
        productId: productId,
        productPrice: productPrice,
        frequency: apiFrequency,
        durationInMonths: durationInMonths,
      );

      final requestJson = request.toJson();
      print('💳 [PAYMENT FREQ] Request JSON: $requestJson');

      await ref.read(installmentCalculateProvider.notifier).calculate(request);

      final calculateState = ref.read(installmentCalculateProvider);

      if (!mounted) return;

      calculateState.when(
        data: (plan) {
          if (plan == null) {
            print('💳 [PAYMENT FREQ] ❌ Plan is null after calculation');
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Failed to calculate installment plan'),
                backgroundColor: Colors.red,
              ),
            );
            return;
          }

          print('💳 [PAYMENT FREQ] ✅ Plan calculated successfully!');
          print('💳 [PAYMENT FREQ] Plan ID: ${plan.planId}');
          print('💳 [PAYMENT FREQ] Total Amount: ${plan.totalAmount}');
          print('💳 [PAYMENT FREQ] Schedule items: ${plan.schedule.length}');

          final productName =
              _product?['productName'] ?? _product?['name'] ?? plan.productName;
          print('💳 [PAYMENT FREQ] Product Name: $productName');

          final updatedPlan = InstallmentPlan(
            planId: plan.planId,
            orderId: plan.orderId,
            userId: plan.userId,
            productId: plan.productId,
            productName: productName,
            productPrice: plan.productPrice,
            insurance: plan.insurance,
            deliveryFee: plan.deliveryFee,
            totalAmount: plan.totalAmount,
            frequency: plan.frequency,
            durationInMonths: plan.durationInMonths,
            schedule: plan.schedule,
            createdAt: plan.createdAt,
          );

          print('💳 [PAYMENT FREQ] Showing pickup/delivery modal...');
          _showPickupDeliveryModal(updatedPlan);
        },
        loading: () {
          print('💳 [PAYMENT FREQ] ⏳ Still loading...');
        },
        error: (e, st) {
          print('💳 [PAYMENT FREQ] ❌ Error in calculateState: $e');
          print('💳 [PAYMENT FREQ] Stack trace: $st');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        },
      );
    } catch (e) {
      print('💳 [PAYMENT FREQ] Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error calculating installment: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCalculating = false;
        });
      }
    }
  }

  void _showMonthlyPopup(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 20),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.blueBackground,
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How many month would you need to complete your payment ?',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textLight,
                      fontFamily: 'Montserrat'),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildNumberItem('1', context, 1),
                    _buildNumberItem('2', context, 2),
                    _buildNumberItem('3', context, 3),
                    _buildNumberItem('4', context, 4),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildNumberItem('5', context, 5),
                    _buildNumberItem('6', context, 6),
                    _buildNumberItem('7', context, 7),
                    _buildNumberItem('8', context, 8),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildNumberItem('9', context, 9),
                    _buildNumberItem('10', context, 10),
                    _buildNumberItem('11', context, 11),
                    _buildNumberItem('12', context, 12),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showPickupDeliveryModal(InstallmentPlan plan) {
    showDialog(
      context: context,
      barrierColor: Colors.black54,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'DO YOU WANT TO PICK UP OR DELIVERY?',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.blueBackground,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          context.push(
                            AppRoutes.paymentFreqPickup,
                            extra: {
                              'plan': plan,
                              'isDelivery': false,
                            },
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blueBackground,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.only(
                              topLeft: Radius.circular(12),
                              bottomLeft: Radius.circular(12),
                              topRight: Radius.circular(0),
                              bottomRight: Radius.circular(0),
                            ),
                          ),
                        ),
                        child: const Text('Pick up'),
                      ),
                    ),
                    const SizedBox(width: 5),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          context.push(
                            AppRoutes.paymentFreqDelivery,
                            extra: {
                              'plan': plan,
                              'isDelivery': true,
                            },
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blueBackground,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.only(
                              topLeft: Radius.circular(0),
                              bottomLeft: Radius.circular(0),
                              topRight: Radius.circular(12),
                              bottomRight: Radius.circular(12),
                            ),
                          ),
                        ),
                        child: const Text('Delivery'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_product == null) {
      return Scaffold(
        backgroundColor: AppColors.lightBackground,
        appBar: AppBar(
          backgroundColor: AppColors.lightBackground,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline,
                    size: 48, color: AppColors.blueBackground),
                const SizedBox(height: 16),
                Text(
                  'No order information was found. Please go back and try again.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textBlue,
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () => context.pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blueBackground,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text('Go Back',
                      style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.lightBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(15),
                        topRight: Radius.circular(15),
                        bottomLeft: Radius.circular(20),
                        bottomRight: Radius.circular(20),
                      ),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          child: _isMultiItemOrder
                              ? _buildMultiItemPreview()
                              : _buildSingleItemImage(),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            color: AppColors.blueBackground,
                            borderRadius: const BorderRadius.only(
                              bottomLeft: Radius.circular(20),
                              bottomRight: Radius.circular(20),
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        _displayName,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      _formatMoney(_displayPrice),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              const Row(
                                children: [
                                  Icon(Icons.shopping_cart,
                                      color: Colors.white, size: 18),
                                  SizedBox(width: 8),
                                  Icon(Icons.favorite_border,
                                      color: Colors.white, size: 18),
                                  SizedBox(width: 8),
                                  Icon(Icons.share_outlined,
                                      color: Colors.white, size: 18),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          'Select Payment Frequency',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppColors.textBlue,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _isCalculating
                            ? const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(20.0),
                                  child: CircularProgressIndicator(),
                                ),
                              )
                            : Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildFrequencyButton('Daily'),
                                  _buildFrequencyButton('Weekly'),
                                  _buildFrequencyButton('Monthly'),
                                ],
                              ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Order Details',
                          style: TextStyle(
                            color: AppColors.textBlue,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (_isMultiItemOrder) ...[
                          ..._cartItems.map(_buildOrderItemRow),
                          const Divider(height: 24),
                          _buildSummaryRow('Total', _displayPrice),
                        ] else ...[
                          Text(
                            _displayDescription ??
                                'No description available for this item.',
                            style: TextStyle(
                              color: _displayDescription != null
                                  ? Colors.black87
                                  : Colors.grey,
                              fontStyle: _displayDescription != null
                                  ? FontStyle.normal
                                  : FontStyle.italic,
                              fontSize: 12,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 14),
                          if (_displayQuantity != null)
                            _buildSummaryRow('Quantity', _displayQuantity!,
                                isCount: true),
                          _buildSummaryRow('Amount', _displayPrice),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSingleItemImage() {
    final image = _displayImage;

    if (image != null && image.startsWith('http')) {
      return CachedNetworkImage(
        imageUrl: image,
        height: 180,
        fit: BoxFit.contain,
        placeholder: (context, url) => Container(
          height: 180,
          color: Colors.grey[200],
          child: const Center(child: CircularProgressIndicator()),
        ),
        errorWidget: (context, url, error) => _buildImageFallback(),
      );
    }

    if (image != null && image.isNotEmpty) {
      return Image.asset(
        image,
        height: 180,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => _buildImageFallback(),
      );
    }

    return _buildImageFallback();
  }

  Widget _buildImageFallback() {
    return Container(
      height: 180,
      alignment: Alignment.center,
      child: Container(
        height: 90,
        width: 90,
        decoration: BoxDecoration(
          color: AppColors.blueBackground.withOpacity(0.08),
          shape: BoxShape.circle,
        ),
        child: Icon(
          Icons.image_not_supported_outlined,
          size: 36,
          color: AppColors.blueBackground,
        ),
      ),
    );
  }

  Widget _buildMultiItemPreview() {
    return Container(
      height: 180,
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 90,
            width: 90,
            decoration: BoxDecoration(
              color: AppColors.blueBackground.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.shopping_bag_rounded,
              size: 40,
              color: AppColors.blueBackground,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '${_cartItems.length} Items Selected',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textBlue,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderItemRow(dynamic rawItem) {
    final item = rawItem is Map
        ? Map<String, dynamic>.from(rawItem)
        : <String, dynamic>{};

    final name = (item['productName'] ?? item['name'] ?? 'Item').toString();
    final quantity =
        (item['quantity'] is num) ? (item['quantity'] as num).toInt() : 1;
    final lineTotal =
        ((item['totalPrice'] ?? item['price'] ?? 0.0) as num).toDouble();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              '$name  ×$quantity',
              style: const TextStyle(
                color: Colors.black87,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(
            _formatMoney(lineTotal),
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, num value, {bool isCount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          Text(
            isCount ? value.toString() : _formatMoney(value),
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFrequencyButton(String frequency) {
    bool isSelected = _selectedFrequency == frequency;
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: ElevatedButton(
          onPressed: () => _selectFrequency(frequency),
          style: ElevatedButton.styleFrom(
            backgroundColor: isSelected
                ? AppColors.lightBlueBackground
                : AppColors.lightBlueBackground,
            foregroundColor: isSelected ? Colors.black45 : Colors.black45,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(25),
            ),
            padding: const EdgeInsets.symmetric(vertical: 10),
            elevation: 0,
          ),
          child: Text(
            frequency,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNumberItem(String number, BuildContext context, int months) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          Navigator.pop(context);
          _calculateAndProceed('Monthly', months);
        },
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.whiteBackground,
            borderRadius: BorderRadius.circular(5),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Text(
            number,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
        ),
      ),
    );
  }
}
