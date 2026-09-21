// lib/presentation/delivery/screens/delivery_history_screen.dart
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

class DeliveryHistoryScreen extends ConsumerStatefulWidget {
  const DeliveryHistoryScreen({super.key});

  @override
  ConsumerState<DeliveryHistoryScreen> createState() => _DeliveryHistoryScreenState();
}

class _DeliveryHistoryScreenState extends ConsumerState<DeliveryHistoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  String _searchQuery = '';
  int _currentIndex = 3;
  int? _riderId;
  bool _isLoading = true;
  List<DeliveryHistory> _allDeliveries = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() => setState(() => _searchQuery = _searchController.text));
    _loadRiderId();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadRiderId() async {
    try {
      print('🚚 [DeliveryHistory] Loading rider ID from storage...');
      final userData = await StorageService.getUserData();
      print('🔍 [DeliveryHistory] User data from storage: ${userData != null ? "Found" : "Not found"}');
      
      if (userData != null) {
        final userJson = jsonDecode(userData);
        print('🔍 [DeliveryHistory] User JSON keys: ${userJson.keys.toList()}');
        
        // Try multiple possible keys for rider ID
        final riderId = userJson['id'] as int? ?? 
                       userJson['riderId'] as int? ?? 
                       (userJson['id'] != null ? int.tryParse(userJson['id'].toString()) : null);
        
        print('✅ [DeliveryHistory] Rider ID extracted: $riderId (from keys: id=${userJson['id']}, riderId=${userJson['riderId']})');
        
        if (riderId != null && riderId > 0) {
          setState(() {
            _riderId = riderId;
          });
          _loadDeliveryHistory(riderId);
        } else {
          print('❌ [DeliveryHistory] Invalid rider ID: $riderId');
          setState(() {
            _isLoading = false;
            _errorMessage = ErrorHandler.getUserFriendlyError('Rider ID not found. Please login again.');
          });
        }
      } else {
        print('❌ [DeliveryHistory] No user data found in storage');
        setState(() {
          _isLoading = false;
          _errorMessage = ErrorHandler.getUserFriendlyError('Please login to view history');
        });
      }
    } catch (e) {
      ErrorHandler.logError('DeliveryHistory LoadRiderId', e);
      print('❌ [DeliveryHistory] Error loading rider ID: $e');
      setState(() {
        _isLoading = false;
        _errorMessage = ErrorHandler.getUserFriendlyError(e);
      });
    }
  }

  Future<void> _loadDeliveryHistory(int riderId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('🔄 [DeliveryHistory] Fetching delivery history for riderId: $riderId');
      final history = await ref.read(deliveryAgentProvider.notifier).getDeliveryHistory(riderId);
      print('✅ [DeliveryHistory] Loaded ${history.length} history records');
      
      if (mounted) {
        setState(() {
          _allDeliveries = history;
          _isLoading = false;
        });
      }
    } catch (e) {
      ErrorHandler.logError('DeliveryHistory', e);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = ErrorHandler.getUserFriendlyError(e);
        });
      }
    }
  }

  Future<void> _refreshHistory() async {
    // If riderId is null, try to reload it first
    if (_riderId == null) {
      await _loadRiderId();
    } else {
      await _loadDeliveryHistory(_riderId!);
    }
  }

  List<DeliveryHistory> get _filteredDeliveries {
    return _allDeliveries.where((item) {
      final matchesSearch = _searchQuery.isEmpty ||
          item.customerName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.productName.toLowerCase().contains(_searchQuery.toLowerCase());

      final matchesDate = (_startDate == null || _endDate == null) ||
          (item.deliveryDate != null &&
              item.deliveryDate!.isAfter(_startDate!.subtract(const Duration(days: 1))) &&
              item.deliveryDate!.isBefore(_endDate!.add(const Duration(days: 1))));

      return matchesSearch && matchesDate;
    }).toList();
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    final day = date.day;
    final month = _getMonthName(date.month);
    return '$day${_getDaySuffix(day)} $month';
  }

  String _getDaySuffix(int day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }

  String _getMonthName(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return months[month - 1];
  }

  Future<void> _showDateFilterDialog() async {
    final result = await showDialog<Map<String, DateTime?>>(
      context: context,
      builder: (context) {
        DateTime? tempStart = _startDate;
        DateTime? tempEnd = _endDate;

        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: const Text('Filter by Date', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDateField('START DATE', tempStart, (date) => tempStart = date),
              const SizedBox(height: 16),
              _buildDateField('END DATE', tempEnd, (date) => tempEnd = date),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, {'start': tempStart, 'end': tempEnd}),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blueBackground,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('SUBMIT', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                ),
              ),
            ],
          ),
        );
      },
    );

    if (result != null) {
      setState(() {
        _startDate = result['start'];
        _endDate = result['end'];
      });
    }
  }

  Widget _buildDateField(String label, DateTime? date, Function(DateTime?) onChanged) {
    return GestureDetector(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: date ?? DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime.now(),
          builder: (context, child) => Theme(
            data: ThemeData.light().copyWith(colorScheme: const ColorScheme.light(primary: AppColors.blueBackground)),
            child: child!,
          ),
        );
        onChanged(picked);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE0E0E0)), borderRadius: BorderRadius.circular(8)),
        child: Row(
          children: [
            const Icon(Icons.calendar_today, size: 18, color: Color(0xFF666666)),
            const SizedBox(width: 8),
            Text(
              date != null ? '${date.day}/${date.month}/${date.year}' : 'Select date',
              style: TextStyle(fontSize: 14, color: date != null ? Colors.black : const Color(0xFFAAAAAA)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        title: const Text('Delivery History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: AppColors.textLight)),
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios, color: Colors.white), onPressed: () => context.go(AppRoutes.deliveryHome)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _refreshHistory,
          ),
        ],
        elevation: 0,
      ),
      body: Column(
        children: [
          // Search + Filter
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'SEARCH',
                      hintStyle: const TextStyle(color: Color(0xFFAAAAAA), fontSize: 14),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF666666)),
                      filled: true,
                      fillColor: const Color(0xFFF8F8FF),
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: _showDateFilterDialog,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFFF8F8FF), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFE0E0E0))),
                    child: const Icon(Icons.calendar_today, color: AppColors.blueBackground, size: 20),
                  ),
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: _isLoading
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
                              onPressed: _refreshHistory,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _filteredDeliveries.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.history, size: 64, color: Colors.grey[300]),
                                const SizedBox(height: 16),
                                Text(
                                  _allDeliveries.isEmpty
                                      ? 'No delivery history found'
                                      : 'No deliveries match your search',
                                  style: const TextStyle(fontSize: 16, color: Colors.grey),
                                ),
                                if (_allDeliveries.isNotEmpty && (_searchQuery.isNotEmpty || _startDate != null || _endDate != null)) ...[
                                  const SizedBox(height: 8),
                                  TextButton(
                                    onPressed: () {
                                      setState(() {
                                        _searchController.clear();
                                        _startDate = null;
                                        _endDate = null;
                                      });
                                    },
                                    child: const Text('Clear filters'),
                                  ),
                                ],
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _refreshHistory,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              itemCount: _filteredDeliveries.length,
                              itemBuilder: (context, index) {
                                final item = _filteredDeliveries[index];
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))],
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      // Date
                                      SizedBox(
                                        width: 60,
                                        child: Text(
                                          _formatDate(item.deliveryDate),
                                          style: const TextStyle(fontSize: 12, color: Color(0xFF666666), fontWeight: FontWeight.w500),
                                          textAlign: TextAlign.left,
                                        ),
                                      ),
                                      const SizedBox(width: 5),

                                      // Name + Product (centered, flexible)
                                      Expanded(
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Flexible(
                                              child: Text(
                                                item.customerName,
                                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF222222)),
                                                overflow: TextOverflow.ellipsis,
                                                maxLines: 1,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Flexible(
                                              child: Text(
                                                item.productName,
                                                style: const TextStyle(fontSize: 12, color: Color(0xFF666666)),
                                                overflow: TextOverflow.ellipsis,
                                                maxLines: 1,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Status Icon
                                      Padding(
                                        padding: const EdgeInsets.only(left: 12),
                                        child: _getStatusIcon(item.status),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
      bottomNavigationBar: DeliveryBottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }

  Widget _getStatusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return const Icon(Icons.check_circle, color: Colors.green, size: 20);
      case 'FAILED':
        return const Icon(Icons.cancel, color: Colors.red, size: 20);
      case 'PENDING':
      default:
        return const Icon(Icons.access_time, color: Colors.orange, size: 20);
    }
  }
}
