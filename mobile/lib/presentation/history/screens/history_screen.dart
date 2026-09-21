import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/order_model.dart';
import 'package:pm_e_commerce_app/data/providers/order_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<String> _tabTitles = [
    'Ongoing Orders',
    'Completed Purchase',
    'Cancelled Orders'
  ];
  String _selectedSort = 'Date';
  final List<String> _sortOptions = ['Date', 'Amount', 'Name'];
  String _searchQuery = '';
  bool _showDebugInfo = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() => setState(() {}));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      print('🚀 [HistoryScreen] Initializing - Fetching orders...');
      ref.read(ordersProvider.notifier).fetchUserOrders();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<OrderModel> _getFilteredOrders(List<OrderModel> orders, int tabIndex) {
    print(
        '📊 [HistoryScreen] Filtering ${orders.length} orders for tab $tabIndex');

    List<OrderModel> filtered = [];

    for (var order in orders) {
      print(
          '   📋 Order ${order.id}: status=${order.status}, paymentType=${order.paymentType}');

      switch (tabIndex) {
        case 0: // Ongoing / In Progress
          // ✅ Payment confirmed but NOT delivered → Still Ongoing
          if (order.status == 'IN_PROGRESS' ||
              order.status == 'PENDING' ||
              order.status == 'PROCESSING' ||
              order.status == 'PAYMENT_CONFIRMED' || // ✅ Add this
              order.status == 'PAID' || // ✅ Add this
              order.status == 'SHIPPED' ||
              order.status == 'NOT_SHIPPED') {
            filtered.add(order);
          }
          break;

        case 1: // Completed
          // ✅ ONLY when delivered or completed
          if (order.status == 'COMPLETED' || order.status == 'DELIVERED') {
            filtered.add(order);
          }
          break;

        case 2: // Cancelled
          if (order.status == 'CANCELLED') {
            filtered.add(order);
          }
          break;
      }
    }

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((order) {
        final firstItem = order.items.isNotEmpty ? order.items.first : null;
        final title = firstItem?.productName ?? '';
        return title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            order.orderNumber
                .toLowerCase()
                .contains(_searchQuery.toLowerCase());
      }).toList();
    }

    print('📊 [HistoryScreen] Filtered to ${filtered.length} orders');
    return filtered;
  }

  List<OrderModel> _sortOrders(List<OrderModel> orders, String criteria) {
    final sorted = List<OrderModel>.from(orders);

    switch (criteria) {
      case 'Amount':
        sorted.sort((a, b) => b.grandTotal.compareTo(a.grandTotal));
        break;
      case 'Name':
        sorted.sort((a, b) {
          final aName = a.items.isNotEmpty ? a.items.first.productName : '';
          final bName = b.items.isNotEmpty ? b.items.first.productName : '';
          return aName.compareTo(bName);
        });
        break;
      case 'Date':
      default:
        sorted.sort((a, b) => b.id.compareTo(a.id));
        break;
    }
    return sorted;
  }

  @override
  Widget build(BuildContext context) {
    final ordersState = ref.watch(ordersProvider);
    final authState = ref.watch(authProvider);
    final user = authState.hasValue ? authState.value : null;

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        title: Text(_tabTitles[_tabController.index],
            style: const TextStyle(color: AppColors.textLight, fontSize: 16)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios,
              color: AppColors.textLight, size: 18),
          onPressed: () => context.go(AppRoutes.home),
        ),
        actions: [
          IconButton(
            icon: Icon(_showDebugInfo ? Icons.bug_report : Icons.info_outline,
                color: AppColors.textLight),
            onPressed: () => setState(() => _showDebugInfo = !_showDebugInfo),
            tooltip: 'Toggle Debug Info',
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: AppColors.lightBackground,
            child: TabBar(
              controller: _tabController,
              labelColor: AppColors.blueBackground,
              unselectedLabelColor: AppColors.blueBackground.withOpacity(0.6),
              indicator: const UnderlineTabIndicator(
                borderSide:
                    BorderSide(color: AppColors.blueBackground, width: 3),
                insets: EdgeInsets.symmetric(horizontal: 16),
              ),
              labelStyle: const TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                  fontFamily: 'Montserrat'),
              unselectedLabelStyle:
                  const TextStyle(fontFamily: 'Montserrat', fontSize: 14),
              tabs: const [
                Tab(text: 'In Progress'),
                Tab(text: 'Completed'),
                Tab(text: 'Cancelled'),
              ],
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          if (_showDebugInfo)
            Container(
              padding: const EdgeInsets.all(12),
              color: Colors.blue.shade50,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('🐛 Debug Info',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text('User ID: ${user?.id ?? "Not logged in"}',
                      style: const TextStyle(fontSize: 11)),
                  Text('User Name: ${user?.name ?? "N/A"}',
                      style: const TextStyle(fontSize: 11)),
                  const SizedBox(height: 4),
                  ordersState.when(
                    data: (orders) {
                      final fullPayment =
                          orders.where((o) => !o.isInstallment).length;
                      final installment =
                          orders.where((o) => o.isInstallment).length;
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Total Orders: ${orders.length}',
                              style: const TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('  Full Payment: $fullPayment',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.green[700])), // ✅ Fixed
                          Text('  Installment: $installment',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.orange[700])), // ✅ Fixed
                        ],
                      );
                    },
                    loading: () => const Text('Orders: Loading...',
                        style: TextStyle(fontSize: 11)),
                    error: (e, _) => Text('Orders Error: $e',
                        style:
                            const TextStyle(fontSize: 11, color: Colors.red)),
                  ),
                  const SizedBox(height: 4),
                  ElevatedButton.icon(
                    onPressed: () {
                      print('🔄 [HistoryScreen] Manual refresh triggered');
                      ref.read(ordersProvider.notifier).fetchUserOrders();
                    },
                    icon: const Icon(Icons.refresh, size: 16),
                    label:
                        const Text('Refresh', style: TextStyle(fontSize: 11)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      minimumSize: const Size(0, 28),
                    ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: ordersState.when(
              data: (orders) {
                print('📊 [HistoryScreen] Rendering ${orders.length} orders');
                for (var o in orders) {
                  final orderData = {
                    'id': o.id,
                    'orderNumber': o.orderNumber,
                    'userId': o.userId,
                    'status': o.status,
                    'paymentStatus': o.paymentStatus,
                    'paymentType': o.paymentType,
                    'totalAmount': o.totalAmount,
                    'paidAmount': o.paidAmount,
                    'deliveryFee': o.deliveryFee,
                    'grandTotal': o.grandTotal,
                    'deliveryAddress': o.deliveryAddress,
                    'deliveryType': o.deliveryType,
                    'createdAt': o.createdAt,
                    'updatedAt': o.updatedAt,
                    'lastActivity': o.lastActivity,
                    'riderId': o.riderId,
                    'installmentPlanId': o.installmentPlanId,
                    'isPaid': o.isPaid,
                    'paymentReference': o.paymentReference,
                    'isInstallment': o.isInstallment,
                    'totalAmountRemaining': o.totalAmountRemaining,
                    'paymentProgress': o.paymentProgress,
                    'installmentsCount': o.installments.length,
                    'items': o.items
                        .map((i) => {
                              'id': i.id,
                              'productId': i.productId,
                              'productName': i.productName,
                              'productImage': i.productImage,
                              'price': i.price,
                              'quantity': i.quantity,
                              'totalPrice': i.totalPrice,
                            })
                        .toList(),
                  };
                  debugPrint('📦 [HistoryScreen] Order ${o.id} full data: $orderData');
                }

                for (var order in orders) {
                  print(
                      '   📋 Order ${order.id}: ${order.orderNumber} - paymentType=${order.paymentType}, isInstallment=${order.isInstallment}');
                }

                final filteredOrders =
                    _getFilteredOrders(orders, _tabController.index);
                final sortedOrders = _sortOrders(filteredOrders, _selectedSort);

                return TabBarView(
                  controller: _tabController,
                  children: [
                    _tabContent(orders: sortedOrders, tabIndex: 0),
                    _tabContent(orders: sortedOrders, tabIndex: 1),
                    _tabContent(orders: sortedOrders, tabIndex: 2),
                  ],
                );
              },
              loading: () {
                print('⏳ [HistoryScreen] Loading state');
                return const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text('Loading orders...'),
                    ],
                  ),
                );
              },
              error: (error, stack) {
                print('❌ [HistoryScreen] Error state: $error');
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline,
                          size: 64, color: Colors.red.shade300),
                      const SizedBox(height: 16),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          'Error: $error',
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          print('🔄 [HistoryScreen] Retry button pressed');
                          ref.read(ordersProvider.notifier).fetchUserOrders();
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _tabContent({
    required List<OrderModel> orders,
    required int tabIndex,
  }) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              TextField(
                decoration: InputDecoration(
                  hintText: 'Search orders...',
                  hintStyle: TextStyle(color: Colors.grey[400]),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none),
                  contentPadding:
                      const EdgeInsets.symmetric(vertical: 12, horizontal: 15),
                  prefixIcon:
                      const Icon(Icons.search, size: 20, color: Colors.grey),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () => setState(() => _searchQuery = ''),
                        )
                      : null,
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.topLeft,
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedSort,
                    icon: Icon(Icons.keyboard_arrow_down,
                        color: Colors.grey[600], size: 20),
                    style: TextStyle(
                        color: Colors.grey[700],
                        fontSize: 13,
                        fontWeight: FontWeight.w500),
                    dropdownColor: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    elevation: 2,
                    items: _sortOptions
                        .map((o) => DropdownMenuItem(
                              value: o,
                              child: Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 12),
                                child: Text('Sort by $o'),
                              ),
                            ))
                        .toList(),
                    onChanged: (v) => setState(() => _selectedSort = v!),
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: orders.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_bag_outlined,
                          size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        _searchQuery.isNotEmpty
                            ? 'No orders match your search'
                            : 'No ${_tabTitles[_tabController.index].toLowerCase()}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 16),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _searchQuery.isNotEmpty
                            ? 'Try adjusting your search'
                            : 'Orders will appear here',
                        style: TextStyle(color: Colors.grey[400], fontSize: 13),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: orders.length,
                  itemBuilder: (_, i) => _orderCard(orders[i]),
                ),
        ),
      ],
    );
  }

  Widget _orderCard(OrderModel order) {
    final firstItem = order.items.isNotEmpty ? order.items.first : null;
    final isInstallment = order.isInstallment;

    print(
        '📇 [HistoryScreen] Building card for order ${order.id}: paymentType=${order.paymentType}, isInstallment=$isInstallment');

    return GestureDetector(
      onTap: () {
        print('👆 [HistoryScreen] Tapped on order ${order.id}');
        context.push(
          AppRoutes.itemPurchase,
          extra: {
            'order': order,
          },
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 2))
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _buildProductImage(firstItem?.productImage),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          firstItem?.productName ??
                              'Order #${order.orderNumber}',
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 14),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // ✅ Payment type badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isInstallment
                              ? Colors.orange.shade100
                              : Colors.green.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          isInstallment ? 'Installment' : 'Full Payment',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: isInstallment
                                ? Colors.orange.shade800
                                : Colors.green.shade800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '₦${order.grandTotal.toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.blueBackground,
                            fontSize: 14),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: order.statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: order.statusColor.withOpacity(0.3)),
                        ),
                        child: Text(
                          order.statusDisplay,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: order.statusColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  // ✅ ONLY show installment progress if it IS an installment order
                  if (isInstallment) ...[
                    const SizedBox(height: 4),
                    LinearProgressIndicator(
                      value: order.paymentProgress,
                      backgroundColor: Colors.grey[200],
                      valueColor: const AlwaysStoppedAnimation(
                          AppColors.blueBackground),
                      minHeight: 6,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${(order.paymentProgress * 100).toInt()}% paid',
                      style: TextStyle(color: Colors.grey[600], fontSize: 10),
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    order.createdAt != null
                        ? 'Ordered: ${_formatDate(order.createdAt!)}'
                        : '',
                    style: TextStyle(color: Colors.grey[500], fontSize: 10),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  Widget _buildProductImage(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) {
      return _placeholderImage();
    }

    if (imagePath.startsWith('http')) {
      return CachedNetworkImage(
        imageUrl: imagePath,
        width: 80,
        height: 80,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => _placeholderImage(),
        placeholder: (_, __) => Container(
          width: 80,
          height: 80,
          color: Colors.grey[200],
          child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        ),
      );
    } else if (imagePath.startsWith('assets/')) {
      return Image.asset(
        imagePath,
        width: 80,
        height: 80,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _placeholderImage(),
      );
    } else {
      final imageUrl = ApiConstants.productImages(imagePath);
      return CachedNetworkImage(
        imageUrl: imageUrl,
        width: 80,
        height: 80,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => _placeholderImage(),
        placeholder: (_, __) => Container(
          width: 80,
          height: 80,
          color: Colors.grey[200],
          child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        ),
      );
    }
  }

  Widget _placeholderImage() => Container(
        width: 80,
        height: 80,
        color: Colors.grey[200],
        child: const Icon(Icons.image, color: Colors.grey),
      );
}
