// lib/presentation/delivery/screens/pending_deliveries_screen.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/data/models/delivery_agent_model.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_agent_provider.dart';
import 'package:pm_e_commerce_app/presentation/delivery/widgets/bottom_navbar.dart';

class PendingDeliveriesScreen extends ConsumerStatefulWidget {
  const PendingDeliveriesScreen({super.key});

  @override
  ConsumerState<PendingDeliveriesScreen> createState() => _PendingDeliveriesScreenState();
}

class _PendingDeliveriesScreenState extends ConsumerState<PendingDeliveriesScreen> {
  int _currentIndex = 0;
  int? _riderId;
  bool _isLoading = true;
  List<PendingDelivery> _deliveries = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadRiderId();
  }

  Future<void> _loadRiderId() async {
    try {
      print('🚚 [PendingDeliveries] Loading rider ID from storage...');
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        final riderId = userJson['id'] as int?;
        print('✅ [PendingDeliveries] Rider ID loaded: $riderId');
        setState(() {
          _riderId = riderId;
        });
        if (riderId != null) {
          _loadPendingDeliveries(riderId);
        } else {
          setState(() {
            _isLoading = false;
            _errorMessage = 'Rider ID not found. Please login again.';
          });
        }
      } else {
        print('❌ [PendingDeliveries] No user data found');
        setState(() {
          _isLoading = false;
          _errorMessage = 'Please login to view deliveries';
        });
      }
    } catch (e) {
      print('❌ [PendingDeliveries] Error loading rider ID: $e');
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error loading rider information';
      });
    }
  }

  Future<void> _loadPendingDeliveries(int riderId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('🔄 [PendingDeliveries] Fetching pending deliveries for riderId: $riderId');
      final deliveries = await ref.read(deliveryAgentProvider.notifier).getPendingDeliveries(riderId);
      print('✅ [PendingDeliveries] Loaded ${deliveries.length} deliveries');
      
      if (mounted) {
        setState(() {
          _deliveries = deliveries;
          _isLoading = false;
        });
      }
    } catch (e) {
      ErrorHandler.logError('PendingDeliveries', e);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = ErrorHandler.getUserFriendlyError(e);
        });
      }
    }
  }

  Future<void> _refreshDeliveries() async {
    if (_riderId != null) {
      await _loadPendingDeliveries(_riderId!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        title: const Text(
          'Pending Delivery',
          style: TextStyle(
            fontWeight: FontWeight.w500,
            color: AppColors.textLight,
            fontSize: 18,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.go(AppRoutes.deliveryHome),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _refreshDeliveries,
          ),
        ],
        elevation: 0,
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
                        onPressed: _refreshDeliveries,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _deliveries.isEmpty
                  ? const Center(
                      child: Text(
                        'No pending deliveries',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _refreshDeliveries,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _deliveries.length,
                        itemBuilder: (context, index) {
                          final delivery = _deliveries[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _DeliveryCard(
                              delivery: delivery,
                              onConfirm: () {
                                print('🚚 [PendingDeliveries] Navigating to about screen for riderBoxId: ${delivery.riderBoxId}');
                                context.push(
                                  AppRoutes.deliveryAbout,
                                  extra: {
                                    'riderBoxId': delivery.riderBoxId,
                                    'productId': delivery.productId,
                                    'productName': delivery.productName,
                                    'address': delivery.deliveryAddress,
                                    'customerName': delivery.customerName,
                                  },
                                );
                              },
                            ),
                          );
                        },
                      ),
                    ),
      bottomNavigationBar: DeliveryBottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}

class _DeliveryCard extends StatelessWidget {
  final PendingDelivery delivery;
  final VoidCallback onConfirm;

  const _DeliveryCard({
    required this.delivery,
    required this.onConfirm,
  });

  String _formatTime(DateTime? date) {
    if (date == null) return 'N/A';
    final now = DateTime.now();
    final difference = date.difference(now);
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}MINS';
    } else {
      return '${difference.inHours}HRS';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product Image
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: AppColors.lightBlueBackground,
              borderRadius: BorderRadius.circular(8),
            ),
            child: delivery.productImage != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      delivery.productImage!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(Icons.image, size: 40);
                      },
                    ),
                  )
                : const Icon(Icons.image, size: 40),
          ),
          const SizedBox(width: 12),

          // Details Column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  delivery.productName,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF222222),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),

                // Address
                Text(
                  delivery.deliveryAddress,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF666666),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),

                // Action Row
                Row(
                  children: [
                    // Confirm Button
                    SizedBox(
                      height: 28,
                      child: ElevatedButton(
                        onPressed: onConfirm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blueBackground,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                          elevation: 0,
                          textStyle: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        child: const Text('CONFIRM DELIVERY'),
                      ),
                    ),
                    const Spacer(),

                    // Time
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.access_time,
                          size: 14,
                          color: Color(0xFF666666),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          delivery.estimatedTime ?? _formatTime(delivery.createdAt),
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF666666),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
