// lib/presentation/recovery/screens/recovery_report_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/data/models/recovery_model.dart';
import 'package:pm_e_commerce_app/data/providers/goods_recovery_provider.dart';
import 'package:pm_e_commerce_app/presentation/recovery/widgets/recovery_bottom_nav_bar.dart';

class RecoveryReportScreen extends ConsumerStatefulWidget {
  const RecoveryReportScreen({super.key});

  @override
  ConsumerState<RecoveryReportScreen> createState() => _RecoveryReportScreenState();
}

class _RecoveryReportScreenState extends ConsumerState<RecoveryReportScreen> {
  int _currentIndex = 2;
  int _currentPage = 0;
  List<RecoveryReport> _reports = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      print('🔄 [RecoveryReportScreen] Loading recovery reports...');
      final reports = await ref.read(goodsRecoveryProvider.notifier).getRecoveryReports();
      print('✅ [RecoveryReportScreen] Loaded ${reports.length} reports');
      
      setState(() {
        _reports = reports;
        _isLoading = false;
      });
    } catch (e) {
      ErrorHandler.logError('RecoveryReportScreen', e);
      setState(() {
        _error = ErrorHandler.getUserFriendlyError(e);
        _isLoading = false;
      });
    }
  }

  void _onNavTap(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              color: AppColors.blueBackground,
              child: Row(
                children: [
                  Image.asset('assets/images/logo.png',
                      height: 36, fit: BoxFit.contain),
                  const SizedBox(width: 12),
                  const Text(
                    'Recovery Reports',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // List
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
                                onPressed: _loadReports,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        )
                      : _reports.isEmpty
                          ? const Center(
                              child: Text('No recovery reports found'),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _reports.length,
                              itemBuilder: (context, index) {
                                final report = _reports[index];
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 16),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: const [
                                      BoxShadow(
                                          color: Color(0x0A000000),
                                          blurRadius: 8,
                                          offset: Offset(0, 2)),
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      // Avatar (Square + Light Blue Border)
                                      Container(
                                        width: 70,
                                        height: 100,
                                        decoration: BoxDecoration(
                                          color: Colors.grey[200],
                                          border: Border.all(
                                            color: AppColors.blueBackground.withOpacity(0.3),
                                            width: 1,
                                          ),
                                          borderRadius: BorderRadius.zero,
                                        ),
                                        child: report.profileImage != null
                                            ? Image.network(
                                                report.profileImage!,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stackTrace) {
                                                  return Image.asset(
                                                    'assets/images/re.png',
                                                    fit: BoxFit.cover,
                                                  );
                                                },
                                              )
                                            : Image.asset(
                                                'assets/images/re.png',
                                                fit: BoxFit.cover,
                                              ),
                                      ),
                                      const SizedBox(width: 12),

                                      // Info
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              report.customerName,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                  fontSize: 15, fontWeight: FontWeight.w600),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              report.status,
                                              style: TextStyle(
                                                fontSize: 13,
                                                color: report.status.toLowerCase().contains('recovered')
                                                    ? Colors.green
                                                    : AppColors.red,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            ElevatedButton(
                                              onPressed: () {
                                                context.go(
                                                  AppRoutes.recoveredDetails,
                                                  extra: {'recoveryId': report.recoveryId},
                                                );
                                              },
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: AppColors.blueBackground,
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 16, vertical: 8),
                                                shape: RoundedRectangleBorder(
                                                    borderRadius: BorderRadius.circular(8)),
                                                elevation: 0,
                                              ),
                                              child: const Text(
                                                'View details',
                                                style: TextStyle(
                                                    fontSize: 12, color: Colors.white),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Right Side: Items Count
                                      Column(
                                        children: [
                                          Text(
                                            'Number of items: ${report.numberOfItems}',
                                            style: const TextStyle(
                                                fontSize: 13, color: Color(0xFF666666)),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
            ),

            // PREV / NEXT Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  // PREV
                  Expanded(
                    child: TextButton(
                      onPressed: _currentPage > 0
                          ? () {
                              setState(() {
                                _currentPage--;
                              });
                            }
                          : null,
                      child: const Text(
                        'PREV',
                        style: TextStyle(
                          color: AppColors.blueBackground,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // NEXT
                  Expanded(
                    child: TextButton(
                      onPressed: (_currentPage + 1) * 10 < _reports.length
                          ? () {
                              setState(() {
                                _currentPage++;
                              });
                            }
                          : null,
                      child: const Text(
                        'NEXT',
                        style: TextStyle(
                          color: AppColors.textBlue,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),
          ],
        ),
      ),
      bottomNavigationBar: RecoveryBottomNavBar(
        currentIndex: _currentIndex,
        onTap: _onNavTap,
      ),
    );
  }
}
