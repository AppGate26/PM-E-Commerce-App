import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/cart_model.dart';
import 'package:pm_e_commerce_app/data/models/wishlist_model.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/cart_provider.dart';
import 'package:pm_e_commerce_app/data/providers/wishlist_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/verification_repository.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:pm_e_commerce_app/presentation/payment/screens/buy%20once/checkout_screen.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  bool _showCart = true;
  String? _selectedPaymentOption;
  bool _isCheckingVerification = false;

  // Tracks per-item quantity updates in-flight so a user can't double-tap
  // and desync the UI from the server while a request is pending.
  final Set<int> _updatingItemIds = {};

  final VerificationRepository _verificationRepository =
      VerificationRepository();

  final NumberFormat _currencyFormat = NumberFormat('#,##0', 'en_US');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAll();
    });
  }

  Future<void> _loadAll() async {
    await Future.wait([
      ref.read(cartProvider.notifier).fetchCartItems(),
      ref.read(cartSummaryProvider.notifier).fetchCartSummary(),
      ref.read(wishlistProvider.notifier).fetchWishlistItems(),
    ]);
  }

  String _money(num value) => '₦${_currencyFormat.format(value)}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: AppColors.blueBackground,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios,
              color: AppColors.textLight, size: 18),
          onPressed: () => context.go(AppRoutes.home),
        ),
        title: const Text(
          'Cart & Wishlist',
          style: TextStyle(
            color: AppColors.textLight,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.blueBackground,
        onRefresh: _loadAll,
        child: Column(
          children: [
            _buildToggleRow(),
            if (_showCart) _buildSummaryCard(),
            Expanded(
              child: _showCart ? _buildCartView() : _buildWishlistView(),
            ),
          ],
        ),
      ),
    );
  }

  // ============================================================
  // TOGGLE (CART / WISHLIST)
  // ============================================================
  Widget _buildToggleRow() {
    return Container(
      color: AppColors.whiteBackground,
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          _buildToggleButton('Cart', true),
          _buildToggleButton('Wishlist', false),
        ],
      ),
    );
  }

  Widget _buildToggleButton(String title, bool isCart) {
    final bool selected = _showCart == isCart;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _showCart = isCart),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color:
                    selected ? AppColors.blueBackground : Colors.grey.shade300,
                width: selected ? 3 : 1,
              ),
            ),
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? AppColors.blueBackground : AppColors.textBlue,
              fontSize: 15,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
            ),
          ),
        ),
      ),
    );
  }

  // ============================================================
  // SUMMARY CARD (premium styling + load-gated checkout button)
  // ============================================================
  Widget _buildSummaryCard() {
    final summaryState = ref.watch(cartSummaryProvider);
    final cartState = ref.watch(cartProvider);

    // The cart is only considered "ready" once BOTH the summary and the
    // item list have finished loading (no spinner state) and neither is
    // sitting on a stale error. This is what gates the checkout button so
    // a user can never proceed on a half-loaded / stale cart.
    final bool isLoading = summaryState.isLoading || cartState.isLoading;
    final bool hasError = summaryState.hasError || cartState.hasError;
    final bool isReady =
        !isLoading && !hasError && summaryState.hasValue && cartState.hasValue;

    if (isLoading && !summaryState.hasValue && !cartState.hasValue) {
      return _buildSummarySkeleton();
    }

    if (hasError) {
      return _buildSummaryErrorCard();
    }

    final cartItems = cartState.value ?? [];
    final summary = summaryState.value;

    final totalItems = summary?.totalItems ??
        cartItems.fold<int>(0, (sum, item) => sum + item.quantity);
    final totalValue = cartItems.fold<double>(0,
        (sum, item) => sum + (item.totalPrice ?? (item.price * item.quantity)));

    if (totalItems == 0) return const SizedBox.shrink();

    final bool canProceed = isReady &&
        _selectedPaymentOption != null &&
        !_isCheckingVerification &&
        _updatingItemIds.isEmpty;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: AppColors.blueBackground.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.blueBackground.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$totalItems Item(s)',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.blueBackground,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _money(totalValue),
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: AppColors.textBlue,
            ),
          ),
          const Text(
            'total value',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.lightBackground,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Choose Payment Option',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.blueBackground,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _paymentOptionTile(
                        label: 'Buy Once',
                        icon: Icons.check_circle,
                        value: 'buy_once',
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _paymentOptionTile(
                        label: 'Payment Freq',
                        icon: Icons.calendar_month,
                        value: 'payment_frequency',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: canProceed
                  ? () async {
                      if (_selectedPaymentOption == 'buy_once') {
                        _showCheckoutPopup(totalValue);
                      } else {
                        await _checkVerificationAndNavigate(totalValue);
                      }
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: canProceed
                    ? AppColors.blueBackground
                    : Colors.grey.shade400,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: canProceed ? 2 : 0,
              ),
              child: _isCheckingVerification
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.textLight,
                        ),
                      ),
                    )
                  : Text(
                      !isReady
                          ? 'Loading cart...'
                          : _updatingItemIds.isNotEmpty
                              ? 'Updating cart...'
                              : 'Proceed to Checkout',
                      style: const TextStyle(
                        color: AppColors.textLight,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'A discount of 50% will be applied to your delivery fee',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _paymentOptionTile({
    required String label,
    required IconData icon,
    required String value,
  }) {
    final bool selected = _selectedPaymentOption == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedPaymentOption = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color:
              selected ? AppColors.blueBackground : AppColors.whiteBackground,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? AppColors.blueBackground : Colors.grey.shade300,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: selected ? Colors.white : Colors.grey.shade400,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummarySkeleton() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        children: [
          const SizedBox(
            height: 22,
            width: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor:
                  AlwaysStoppedAnimation<Color>(AppColors.blueBackground),
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Loading your cart...',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryErrorCard() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.red.shade100),
      ),
      child: Column(
        children: [
          Icon(Icons.error_outline, color: Colors.red.shade400, size: 26),
          const SizedBox(height: 8),
          const Text(
            'Could not load your cart summary',
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: _loadAll,
            child: const Text(
              'Retry',
              style: TextStyle(
                color: AppColors.blueBackground,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _checkVerificationAndNavigate(double totalValue) async {
    setState(() {
      _isCheckingVerification = true;
    });

    try {
      final authState = ref.read(authProvider);
      final user = authState.hasValue ? authState.value : null;

      if (user == null) {
        if (mounted) {
          _showSnack('Please login to continue', isError: true);
        }
        setState(() {
          _isCheckingVerification = false;
        });
        return;
      }

      final status =
          await _verificationRepository.checkFullVerificationStatus();

      final missingTypes = <String>[];
      status.forEach((key, verified) {
        if (!verified) missingTypes.add(key);
      });

      final bool isFullyVerified = missingTypes.isEmpty;

      if (!mounted) {
        return;
      }

      if (!isFullyVerified) {
        print('⚠️ [Cart] Missing verification: $missingTypes');
        _showVerificationRequiredDialog();
        setState(() {
          _isCheckingVerification = false;
        });
        return;
      }

      setState(() {
        _isCheckingVerification = false;
      });

      // ✅ Build a full, real, dynamic payload from the cart — no placeholders.
      final cartItems = ref.read(cartProvider).value ?? [];

      final List<Map<String, dynamic>> itemsBreakdown = cartItems.map((item) {
        return {
          'productId': item.productId,
          'productName': item.productName,
          'productDescription': item.productDescription,
          'image': item.productImage,
          'price': item.price,
          'quantity': item.quantity,
          'totalPrice': item.totalPrice ?? (item.price * item.quantity),
        };
      }).toList();

      final Map<String, dynamic> navExtra = {
        'totalAmount': totalValue,
        'sellingPrice': totalValue,
        'price': totalValue,
        'itemCount': cartItems.length,
        'items': itemsBreakdown,
      };

      if (cartItems.length == 1) {
        final item = cartItems.first;
        navExtra['productId'] = item.productId;
        navExtra['productName'] = item.productName;
        navExtra['name'] = item.productName;
        navExtra['image'] = item.productImage;
        navExtra['description'] = item.productDescription;
        navExtra['quantity'] = item.quantity;
      } else if (cartItems.length > 1) {
        navExtra['productName'] = '${cartItems.length} Items in Cart';
        navExtra['name'] = '${cartItems.length} Items in Cart';
      }

      context.push(
        AppRoutes.paymentFreq,
        extra: navExtra,
      );
    } catch (e) {
      if (mounted) {
        _showSnack('Error checking verification: ${e.toString()}',
            isError: true);
      }
      if (mounted) {
        setState(() {
          _isCheckingVerification = false;
        });
      }
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        backgroundColor: isError ? Colors.red : Colors.green,
        content: Text(message),
      ),
    );
  }

  // ============================================================
  // ✅ VERIFICATION REQUIRED DIALOG
  // ============================================================
  void _showVerificationRequiredDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Icon(
              Icons.verified_outlined,
              color: Colors.orange[700],
              size: 28,
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Verification Required',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'To use the installment payment feature, you must be fully verified.',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: Colors.orange[700],
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Please complete all verification steps in the Verification Centre to access this feature.',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.push(AppRoutes.verificationCentre);
            },
            style: TextButton.styleFrom(
              foregroundColor: AppColors.blueBackground,
            ),
            child: const Text(
              'Go to Verification Centre',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Later',
              style: TextStyle(color: Colors.grey),
            ),
          ),
        ],
      ),
    );
  }

  void _showCheckoutPopup(double totalAmount) {
    showDialog(
      context: context,
      barrierColor: Colors.black54,
      useSafeArea: false,
      builder: (_) => CheckoutPopup(
        totalAmount: totalAmount,
        product: null,
      ),
    );
  }

  // ============================================================
  // CART VIEW
  // ============================================================
  Widget _buildCartView() {
    final cartState = ref.watch(cartProvider);

    return cartState.when(
      data: (items) {
        if (items.isEmpty) {
          return _buildEmptyState(isCart: true);
        }

        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          physics: const AlwaysScrollableScrollPhysics(),
          itemCount: items.length,
          itemBuilder: (_, i) => _buildCartItem(items[i]),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _buildErrorState(
        message: 'Could not load your cart',
        onRetry: () => ref.read(cartProvider.notifier).fetchCartItems(),
      ),
    );
  }

  // ============================================================
  // WISHLIST VIEW
  // ============================================================
  Widget _buildWishlistView() {
    final wishlistState = ref.watch(wishlistProvider);

    return wishlistState.when(
      data: (items) {
        if (items.isEmpty) {
          return _buildEmptyState(isCart: false);
        }

        return GridView.builder(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          physics: const AlwaysScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
            childAspectRatio: 0.62,
          ),
          itemCount: items.length,
          itemBuilder: (_, index) => _buildWishlistGridItem(items[index]),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _buildErrorState(
        message: 'Could not load your wishlist',
        onRetry: () => ref.read(wishlistProvider.notifier).fetchWishlistItems(),
      ),
    );
  }

  Widget _buildEmptyState({required bool isCart}) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset('assets/images/logo2.png',
              width: 110, height: 110, fit: BoxFit.cover),
          const SizedBox(height: 16),
          Text(
            isCart ? 'Your cart is empty' : 'Your wishlist is empty',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textBlue,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isCart
                ? 'Items you add to your cart will appear here'
                : 'Items you save for later will appear here',
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState({
    required String message,
    required VoidCallback onRetry,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.wifi_off_rounded, color: Colors.grey.shade400, size: 48),
          const SizedBox(height: 12),
          Text(
            message,
            style: const TextStyle(fontSize: 14, color: Colors.grey),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: onRetry,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              'Retry',
              style: TextStyle(color: AppColors.textLight),
            ),
          ),
        ],
      ),
    );
  }

  String _resolveImage(String? productImage) {
    final imageUrl = productImage ?? 'assets/images/product1.png';
    return imageUrl.startsWith('http')
        ? imageUrl
        : 'http://18.188.177.144:8080/api/products/images/$imageUrl';
  }

  Widget _buildCartItem(CartItemModel item) {
    final imageUrl = item.productImage ?? 'assets/images/product1.png';
    final displayImage = _resolveImage(item.productImage);
    final bool isUpdating = _updatingItemIds.contains(item.productId);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 80,
                height: 80,
                color: AppColors.lightBackground,
                child: imageUrl.startsWith('http')
                    ? CachedNetworkImage(
                        imageUrl: displayImage,
                        fit: BoxFit.contain,
                        placeholder: (context, url) => const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        errorWidget: (context, url, error) => Image.asset(
                          'assets/images/product1.png',
                          fit: BoxFit.contain,
                        ),
                      )
                    : Image.asset(
                        imageUrl,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => Image.asset(
                          'assets/images/product1.png',
                          fit: BoxFit.contain,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.productName,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (item.productDescription != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      item.productDescription!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    _money(item.totalPrice ?? (item.price * item.quantity)),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.blueBackground,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _quantityButton(
                        icon: Icons.remove,
                        onTap: isUpdating
                            ? null
                            : () => _handleQuantityChange(item, -1),
                      ),
                      Container(
                        constraints: const BoxConstraints(minWidth: 34),
                        alignment: Alignment.center,
                        child: isUpdating
                            ? const SizedBox(
                                height: 14,
                                width: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    AppColors.blueBackground,
                                  ),
                                ),
                              )
                            : Text(
                                '${item.quantity}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                      _quantityButton(
                        icon: Icons.add,
                        onTap: isUpdating
                            ? null
                            : () => _handleQuantityChange(item, 1),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: Icon(Icons.delete_outline,
                            color: Colors.grey.shade600),
                        onPressed:
                            isUpdating ? null : () => _showDeleteDialog(item),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _quantityButton(
      {required IconData icon, required VoidCallback? onTap}) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color:
              AppColors.blueBackground.withOpacity(onTap == null ? 0.05 : 0.1),
        ),
        child: Icon(
          icon,
          size: 16,
          color:
              onTap == null ? Colors.grey.shade400 : AppColors.blueBackground,
        ),
      ),
    );
  }

  Future<void> _handleQuantityChange(CartItemModel item, int delta) async {
    if (delta < 0 && item.quantity <= 1) {
      _showDeleteDialog(item);
      return;
    }

    setState(() {
      _updatingItemIds.add(item.productId);
    });

    final success = await ref.read(cartProvider.notifier).updateQuantity(
          productId: item.productId,
          quantity: item.quantity + delta,
        );

    if (!mounted) return;

    if (!success) {
      _showSnack('Failed to update quantity', isError: true);
    }

    setState(() {
      _updatingItemIds.remove(item.productId);
    });
  }

  Widget _buildWishlistGridItem(WishlistItemModel item) {
    final imageUrl = item.productImage ?? 'assets/images/product1.png';
    final displayImage = _resolveImage(item.productImage);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(18)),
              color: AppColors.lightBlueBackground,
            ),
            padding: const EdgeInsets.all(14),
            child: imageUrl.startsWith('http')
                ? CachedNetworkImage(
                    imageUrl: displayImage,
                    fit: BoxFit.contain,
                    placeholder: (context, url) => const Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    errorWidget: (context, url, error) => Image.asset(
                      'assets/images/product1.png',
                      fit: BoxFit.contain,
                    ),
                  )
                : Image.asset(
                    imageUrl,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => Image.asset(
                      'assets/images/product1.png',
                      fit: BoxFit.contain,
                    ),
                  ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    item.productName,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _money(item.price),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.blueBackground,
                    ),
                  ),
                  if (item.dateAdded != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('MMM d, y').format(item.dateAdded!),
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ],
                  const Spacer(),
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 32,
                          child: ElevatedButton(
                            onPressed: () => _moveToCart(item),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.blueBackground,
                              foregroundColor: Colors.white,
                              padding: EdgeInsets.zero,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: const Text(
                              'Add to Cart',
                              style: TextStyle(fontSize: 11),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () => ref
                            .read(wishlistProvider.notifier)
                            .removeFromWishlist(item.productId),
                        child: Container(
                          height: 32,
                          width: 32,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(Icons.delete_outline,
                              size: 18, color: Colors.grey.shade700),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(CartItemModel item) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Remove Item'),
        content: Text(
            'Are you sure you want to remove ${item.productName} from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await ref
                  .read(cartProvider.notifier)
                  .removeFromCart(item.productId);
              if (mounted) {
                if (success) {
                  _showSnack('${item.productName} removed from cart');
                } else {
                  _showSnack('Failed to remove item', isError: true);
                }
              }
            },
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _moveToWishlist(item);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Save to Wishlist',
                style: TextStyle(color: AppColors.textLight)),
          ),
        ],
      ),
    );
  }

  Future<void> _moveToWishlist(CartItemModel item) async {
    final success = await ref.read(wishlistProvider.notifier).addToWishlist(
          productId: item.productId,
        );

    if (success && mounted) {
      await ref.read(cartProvider.notifier).removeFromCart(item.productId);
      _showSnack('${item.productName} moved to wishlist');
    } else if (mounted) {
      _showSnack('Failed to move ${item.productName} to wishlist',
          isError: true);
    }
  }

  Future<void> _moveToCart(WishlistItemModel item) async {
    final success = await ref.read(cartProvider.notifier).addToCart(
          productId: item.productId,
          quantity: 1,
        );

    if (!mounted) return;

    if (success) {
      await ref
          .read(wishlistProvider.notifier)
          .removeFromWishlist(item.productId);
      _showSnack('${item.productName} added to cart');
      return;
    }

    final cartState = ref.read(cartProvider);
    final cartItems = cartState.value ?? [];
    final exists =
        cartItems.any((cartItem) => cartItem.productId == item.productId);

    if (exists) {
      _showSnack('${item.productName} is already in your cart', isError: false);
    } else {
      _showSnack('Failed to add ${item.productName} to cart', isError: true);
    }
  }
}
