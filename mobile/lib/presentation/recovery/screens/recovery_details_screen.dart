import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/data/models/recovery_model.dart';
import 'package:pm_e_commerce_app/data/providers/goods_recovery_provider.dart';

class RecoveryDetailsScreen extends ConsumerStatefulWidget {
  const RecoveryDetailsScreen({super.key});

  @override
  ConsumerState<RecoveryDetailsScreen> createState() => _RecoveryDetailsScreenState();
}

class _RecoveryDetailsScreenState extends ConsumerState<RecoveryDetailsScreen> {
  CustomerDetail? _customerDetail;
  bool _isLoading = true;
  String? _error;
  int? _customerId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
    if (extra != null) {
      _customerId = extra['customerId'] as int?;
      if (_customerId != null && _customerDetail == null) {
        _loadCustomerDetails();
      }
    }
  }

  Future<void> _loadCustomerDetails() async {
    if (_customerId == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      print('🔄 [RecoveryDetailsScreen] Loading customer details for customerId: $_customerId');
      final customer = await ref.read(goodsRecoveryProvider.notifier).getCustomerDetails(_customerId!);
      print('✅ [RecoveryDetailsScreen] Loaded customer details');
      
      setState(() {
        _customerDetail = customer;
        _isLoading = false;
      });
    } catch (e) {
      ErrorHandler.logError('RecoveryDetailsScreen', e);
      setState(() {
        _error = ErrorHandler.getUserFriendlyError(e);
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        title: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 0),
          child: Row(
            children: [
                GestureDetector(
                onTap: () {
                  context.go(AppRoutes.recoveryHome);
                },
                child: Image.asset('assets/images/logo.png', width: 30),
              ),

              const Spacer(),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: AppColors.textLight,
                      borderRadius: BorderRadius.circular(25),
                    ),
                    child: const Icon(
                      Icons.person,
                      color: AppColors.textBlue,
                      size: 16,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _customerDetail?.email ?? 'Loading...',
                    style: const TextStyle(fontSize: 14, color: AppColors.textLight),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.keyboard_arrow_down,
                      color: AppColors.textLight, size: 18),
                ],
              ),
            ],
          ),
        ),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(), // Force scrolling
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight,
              ),
              child: IntrinsicHeight(
                child: Column(
                  children: [
                    // Main content
                    Expanded(
                      child: _isLoading
                          ? const Center(child: CircularProgressIndicator())
                          : _error != null
                              ? Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        'Error: $_error',
                                        style: const TextStyle(color: Colors.red),
                                      ),
                                      const SizedBox(height: 16),
                                      ElevatedButton(
                                        onPressed: _loadCustomerDetails,
                                        child: const Text('Retry'),
                                      ),
                                    ],
                                  ),
                                )
                              : _customerDetail == null
                                  ? const Center(child: Text('No customer details found'))
                                  : Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                                      child: _customerDetail!.products.isEmpty
                                          ? const Center(child: Text('No products found'))
                                          : ListView.builder(
                                              itemCount: _customerDetail!.products.length,
                                              itemBuilder: (context, index) {
                                                final product = _customerDetail!.products[index];
                                                final isRecovered = product.status.toLowerCase().contains('recovered');
                                                return Padding(
                                                  padding: const EdgeInsets.only(bottom: 20),
                                                  child: _buildItemCard(
                                                    imagePath: product.imageUrl ?? 'assets/images/phones/phone1.png',
                                                    title: product.productName,
                                                    numberOfItems: product.numberOfItems,
                                                    description: product.description,
                                                    status: product.status,
                                                    statusColor: isRecovered ? Colors.green : AppColors.red,
                                                  ),
                                                );
                                              },
                                            ),
                                    ),
                    ),
                    
                   
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      child: Center(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.blueBackground,
                            padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onPressed: _customerDetail != null
                              ? () {
                                  context.go(
                                    AppRoutes.customerDetail,
                                    extra: {'customerDetail': _customerDetail},
                                  );
                                }
                              : null,
                          child: const Text(
                            'View customers detail',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildItemCard({
    required String imagePath,
    required String title,
    required int numberOfItems,
    required String description,
    required String status,
    required Color statusColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(6),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 3,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          imagePath.startsWith('http')
              ? Image.network(
                  imagePath,
                  width: 100,
                  height: 120,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Image.asset(
                      'assets/images/phones/phone1.png',
                      width: 100,
                      height: 120,
                      fit: BoxFit.cover,
                    );
                  },
                )
              : Image.asset(
                  imagePath,
                  width: 100,
                  height: 120,
                  fit: BoxFit.cover,
                ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      status,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Number of item: $numberOfItems',
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Description',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.black87,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}