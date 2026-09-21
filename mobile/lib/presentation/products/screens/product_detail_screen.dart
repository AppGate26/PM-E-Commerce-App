// import 'package:flutter/material.dart';
// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:go_router/go_router.dart';
// import 'package:provider/provider.dart' as provider_package;
// import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
// import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
// import 'package:pm_e_commerce_app/core/services/cart_service.dart';
// import 'package:pm_e_commerce_app/core/utils/signup_helper.dart';
// import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
// import 'package:pm_e_commerce_app/data/providers/wishlist_provider.dart';
// import 'package:cached_network_image/cached_network_image.dart';
// import 'package:pm_e_commerce_app/data/providers/cart_provider.dart';
// import 'package:pm_e_commerce_app/data/providers/product_provider.dart';
// import 'package:pm_e_commerce_app/presentation/products/widgets/auth_cached_image.dart';

// class ProductDetailScreen extends ConsumerStatefulWidget {
//   final Map<String, dynamic> product;

//   const ProductDetailScreen({super.key, required this.product});

//   @override
//   ConsumerState<ProductDetailScreen> createState() =>
//       _ProductDetailScreenState();
// }

// class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
//   bool _isInWishlist = false;
//   bool _isCheckingWishlist = false;

//   @override
//   void initState() {
//     super.initState();
//     _checkPendingSignup();
//     _checkWishlistStatus();
//   }

//   void _checkWishlistStatus() async {
//     final authState = ref.read(authProvider);
//     final user = authState.hasValue ? authState.value : null;

//     if (user == null) return;

//     setState(() {
//       _isCheckingWishlist = true;
//     });

//     final productId = int.tryParse(widget.product['id']?.toString() ?? '');
//     if (productId == null) {
//       setState(() {
//         _isCheckingWishlist = false;
//       });
//       return;
//     }

//     try {
//       // Fetch wishlist items first
//       await ref.read(wishlistProvider.notifier).fetchWishlistItems();

//       // Check if product is in wishlist
//       final wishlistState = ref.read(wishlistProvider);
//       if (wishlistState.hasValue) {
//         final wishlistItems = wishlistState.value ?? [];
//         setState(() {
//           _isInWishlist =
//               wishlistItems.any((item) => item.productId == productId);
//           _isCheckingWishlist = false;
//         });
//       }
//     } catch (e) {
//       setState(() {
//         _isCheckingWishlist = false;
//       });
//     }
//   }

//   void _checkPendingSignup() async {
//     final pendingAction = await SignupHelper.getPendingSignupAction();
//     if (pendingAction != null && mounted) {
//       await SignupHelper.clearPendingSignupAction();
//       // Show pickup/delivery modal after signup
//       WidgetsBinding.instance.addPostFrameCallback((_) {
//         _showPickupDeliveryModal();
//       });
//     }
//   }

//   void _showPickupDeliveryModal() {
//     showDialog(
//       context: context,
//       barrierColor: Colors.black54,
//       builder: (_) => Dialog(
//         backgroundColor: Colors.transparent,
//         insetPadding: const EdgeInsets.all(24),
//         child: Container(
//           padding: const EdgeInsets.all(24),
//           decoration: BoxDecoration(
//             color: Colors.white,
//             borderRadius: BorderRadius.circular(20),
//           ),
//           child: Column(
//             mainAxisSize: MainAxisSize.min,
//             children: [
//               Text(
//                 'DO YOU WANT TO PICK UP OR DELIVERY?',
//                 style: TextStyle(
//                   fontSize: 16,
//                   fontWeight: FontWeight.bold,
//                   color: AppColors.blueBackground,
//                 ),
//                 textAlign: TextAlign.center,
//               ),
//               const SizedBox(height: 24),
//               Row(
//                 children: [
//                   Expanded(
//                     child: ElevatedButton(
//                       onPressed: () {
//                         ref
//                             .read(paymentFlowProductProvider.notifier)
//                             .setProduct(widget.product);
//                         Navigator.pop(context);
//                         context.push(AppRoutes.pickupScreen,
//                             extra: widget.product);
//                       },
//                       style: ElevatedButton.styleFrom(
//                         backgroundColor: AppColors.blueBackground,
//                         foregroundColor: Colors.white,
//                         padding: const EdgeInsets.symmetric(vertical: 16),
//                         shape: const RoundedRectangleBorder(
//                           borderRadius: BorderRadius.only(
//                             topLeft: Radius.circular(12),
//                             bottomLeft: Radius.circular(12),
//                           ),
//                         ),
//                       ),
//                       child: const Text('Pick up'),
//                     ),
//                   ),
//                   const SizedBox(width: 5),
//                   Expanded(
//                     child: ElevatedButton(
//                       onPressed: () {
//                         ref
//                             .read(paymentFlowProductProvider.notifier)
//                             .setProduct(widget.product);
//                         Navigator.pop(context);
//                         context.push(AppRoutes.deliveryScreen,
//                             extra: widget.product);
//                       },
//                       style: ElevatedButton.styleFrom(
//                         backgroundColor: AppColors.blueBackground,
//                         foregroundColor: Colors.white,
//                         padding: const EdgeInsets.symmetric(vertical: 16),
//                         shape: const RoundedRectangleBorder(
//                           borderRadius: BorderRadius.only(
//                             topRight: Radius.circular(12),
//                             bottomRight: Radius.circular(12),
//                           ),
//                         ),
//                       ),
//                       child: const Text('Delivery'),
//                     ),
//                   ),
//                 ],
//               ),
//               const SizedBox(height: 16),
//             ],
//           ),
//         ),
//       ),
//     );
//   }

//   void _handleBuyOnce() async {
//     // Check if user is authenticated
//     final authState = ref.read(authProvider);
//     final user = authState.hasValue ? authState.value : null;

//     if (user == null) {
//       // User not logged in - save pending action and redirect to signup
//       await SignupHelper.setPendingSignupAction(
//         productId: widget.product['id']?.toString() ?? '',
//         actionType: 'buy_once',
//       );
//       if (mounted) {
//         context.push(AppRoutes.register);
//       }
//     } else {
//       // User is logged in - show pickup/delivery modal directly
//       _showPickupDeliveryModal();
//     }
//   }

//   void _handlePaymentFrequency() async {
//     // Check if user is authenticated
//     final authState = ref.read(authProvider);
//     final user = authState.hasValue ? authState.value : null;

//     if (user == null) {
//       // User not logged in - save pending action and redirect to signup
//       await SignupHelper.setPendingSignupAction(
//         productId: widget.product['id']?.toString() ?? '',
//         actionType: 'payment_frequency',
//       );
//       if (mounted) {
//         context.push(AppRoutes.register);
//       }
//     } else {
//       // User is logged in - proceed to payment frequency with product data
//       if (mounted) {
//         context.push(
//           AppRoutes.paymentFreq,
//           extra: widget.product,
//         );
//       }
//     }
//   }

//   void _handleWishlistAction() async {
//     // Check if user is authenticated
//     final authState = ref.read(authProvider);
//     final user = authState.hasValue ? authState.value : null;

//     if (user == null) {
//       if (mounted) {
//         ScaffoldMessenger.of(context).showSnackBar(
//           const SnackBar(
//             content: Text('Please login to manage wishlist'),
//             backgroundColor: AppColors.blueBackground,
//             duration: Duration(seconds: 2),
//           ),
//         );
//       }
//       return;
//     }

//     final productId = int.tryParse(widget.product['id']?.toString() ?? '');
//     if (productId == null) return;

//     try {
//       if (_isInWishlist) {
//         // Remove from wishlist
//         final success = await ref
//             .read(wishlistProvider.notifier)
//             .removeFromWishlist(productId);
//         if (success && mounted) {
//           setState(() {
//             _isInWishlist = false;
//           });
//           ScaffoldMessenger.of(context).showSnackBar(
//             const SnackBar(
//               content: Text('Removed from wishlist'),
//               backgroundColor: Colors.green,
//               duration: Duration(seconds: 2),
//             ),
//           );
//         }
//       } else {
//         // Add to wishlist
//         final success = await ref.read(wishlistProvider.notifier).addToWishlist(
//               productId: productId,
//             );
//         if (success && mounted) {
//           setState(() {
//             _isInWishlist = true;
//           });
//           ScaffoldMessenger.of(context).showSnackBar(
//             const SnackBar(
//               content: Text('Added to wishlist'),
//               backgroundColor: Colors.green,
//               duration: Duration(seconds: 2),
//             ),
//           );
//         }
//       }
//     } catch (e) {
//       if (mounted) {
//         ScaffoldMessenger.of(context).showSnackBar(
//           SnackBar(
//             content: Text('Failed to update wishlist: $e'),
//             backgroundColor: Colors.red,
//             duration: const Duration(seconds: 2),
//           ),
//         );
//       }
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     final cartService =
//         provider_package.Provider.of<CartService>(context, listen: false);
//     final productImage =
//         widget.product['image'] ?? 'assets/images/product1.png';

//     return Scaffold(
//       backgroundColor: AppColors.lightBackground,
//       appBar: AppBar(
//         backgroundColor: AppColors.lightBackground,
//         elevation: 0,
//         surfaceTintColor: Colors.transparent,
//         leading: IconButton(
//           icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
//           onPressed: () => context.pop(),
//         ),
//       ),
//       body: Column(
//         children: [
//           Expanded(
//             child: SingleChildScrollView(
//               padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 8),
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   // Product card (image + blue bar)
//                   Container(
//                     width: double.infinity,
//                     decoration: BoxDecoration(
//                       color: AppColors.whiteBackground,
//                       borderRadius: const BorderRadius.only(
//                         topLeft: Radius.circular(12),
//                         topRight: Radius.circular(12),
//                         bottomLeft: Radius.circular(20),
//                         bottomRight: Radius.circular(20),
//                       ),
//                     ),
//                     child: Column(
//                       children: [
//                         // Image
//                         Container(
//                           padding: const EdgeInsets.all(16),
//                           child: _buildProductImage(productImage),
//                         ),

//                         // Blue bar with name, price, actions
//                         Container(
//                           decoration: BoxDecoration(
//                             color: AppColors.blueBackground,
//                             borderRadius: const BorderRadius.only(
//                               bottomLeft: Radius.circular(20),
//                               bottomRight: Radius.circular(20),
//                             ),
//                           ),
//                           padding: const EdgeInsets.symmetric(
//                               horizontal: 12, vertical: 12),
//                           child: Row(
//                             mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                             children: [
//                               // Name + price + buy-once
//                               Expanded(
//                                 child: Row(
//                                   children: [
//                                     Expanded(
//                                       child: Text(
//                                         widget.product['name'] as String? ?? '',
//                                         style: const TextStyle(
//                                           color: Colors.white,
//                                           fontWeight: FontWeight.w600,
//                                           fontSize: 14,
//                                         ),
//                                         overflow: TextOverflow.ellipsis,
//                                       ),
//                                     ),
//                                     const SizedBox(width: 6),
//                                     Text(
//                                       '₦${(widget.product['price'] as num?)?.toStringAsFixed(0) ?? '0'}',
//                                       style: const TextStyle(
//                                         color: Colors.white,
//                                         fontWeight: FontWeight.w600,
//                                         fontSize: 14,
//                                       ),
//                                     ),
//                                     const SizedBox(width: 6),
//                                     Container(
//                                       padding: const EdgeInsets.symmetric(
//                                           horizontal: 8, vertical: 4),
//                                       decoration: BoxDecoration(
//                                         color: Colors.white,
//                                         borderRadius: BorderRadius.circular(6),
//                                       ),
//                                       child: GestureDetector(
//                                         onTap: _handleBuyOnce,
//                                         child: Text(
//                                           "Buy once!",
//                                           style: TextStyle(
//                                             color: AppColors.blueBackground,
//                                             fontSize: 10,
//                                             fontWeight: FontWeight.bold,
//                                           ),
//                                         ),
//                                       ),
//                                     ),
//                                   ],
//                                 ),
//                               ),
//                               const SizedBox(width: 10),

//                               // Icons (cart, favorite, share)
//                               Row(
//                                 children: [
//                                   GestureDetector(
//                                     onTap: () async {
//                                       // Check if user is logged in
//                                       final authState = ref.read(authProvider);
//                                       final user = authState.hasValue
//                                           ? authState.value
//                                           : null;

//                                       if (user == null) {
//                                         if (mounted) {
//                                           ScaffoldMessenger.of(context)
//                                               .showSnackBar(
//                                             const SnackBar(
//                                               content: Text(
//                                                   'Please login to add items to cart'),
//                                               backgroundColor:
//                                                   AppColors.blueBackground,
//                                               duration: Duration(seconds: 2),
//                                             ),
//                                           );
//                                         }
//                                         return;
//                                       }

//                                       final productId = int.tryParse(
//                                           widget.product['id']?.toString() ??
//                                               '');
//                                       if (productId == null) return;

//                                       final success = await ref
//                                           .read(cartProvider.notifier)
//                                           .addToCart(
//                                             productId: productId,
//                                             quantity: 1,
//                                           );

//                                       if (mounted) {
//                                         if (success) {
//                                           ScaffoldMessenger.of(context)
//                                               .showSnackBar(
//                                             const SnackBar(
//                                               content: Text(
//                                                   'Added to cart successfully'),
//                                               backgroundColor:
//                                                   AppColors.blueBackground,
//                                               duration: Duration(seconds: 2),
//                                             ),
//                                           );
//                                         } else {
//                                           // Check if it's a duplicate
//                                           final cartState = ref.read(cartProvider);
//                                           final cartItems = cartState.value ?? [];
//                                           final exists = cartItems.any((item) => item.productId == productId);

//                                           if (exists) {
//                                             showDialog(
//                                               context: context,
//                                               builder: (context) => AlertDialog(
//                                                 title: const Text('Item Already in Cart'),
//                                                 content: Text('${widget.product['name'] ?? widget.product['productName'] ?? 'This item'} is already in your cart.'),
//                                                 actions: [
//                                                   TextButton(
//                                                     onPressed: () => Navigator.pop(context),
//                                                     child: const Text('OK'),
//                                                   ),
//                                                 ],
//                                               ),
//                                             );
//                                           } else {
//                                             ScaffoldMessenger.of(context)
//                                                 .showSnackBar(
//                                               const SnackBar(
//                                                 content: Text(
//                                                     'Failed to add to cart. Please try again.'),
//                                                 backgroundColor: Colors.red,
//                                                 duration: Duration(seconds: 2),
//                                               ),
//                                             );
//                                           }
//                                         }
//                                       }
//                                     },
//                                     child: const Icon(Icons.shopping_cart,
//                                         color: Colors.white, size: 18),
//                                   ),
//                                   const SizedBox(width: 8),
//                                   GestureDetector(
//                                     onTap: _handleWishlistAction,
//                                     child: _isCheckingWishlist
//                                         ? const SizedBox(
//                                             width: 18,
//                                             height: 18,
//                                             child: CircularProgressIndicator(
//                                               strokeWidth: 2,
//                                               valueColor:
//                                                   AlwaysStoppedAnimation<Color>(
//                                                       Colors.white),
//                                             ),
//                                           )
//                                         : Icon(
//                                             _isInWishlist
//                                                 ? Icons.favorite
//                                                 : Icons.favorite_border,
//                                             color: _isInWishlist
//                                                 ? Colors.red
//                                                 : Colors.white,
//                                             size: 18,
//                                           ),
//                                   ),
//                                   const SizedBox(width: 8),
//                                   const Icon(Icons.share_outlined,
//                                       color: Colors.white, size: 18),
//                                 ],
//                               ),
//                             ],
//                           ),
//                         ),
//                       ],
//                     ),
//                   ),
//                   const SizedBox(height: 24),

//                   // Select payment frequency
//                   SizedBox(
//                     width: double.infinity,
//                     height: 48,
//                     child: ElevatedButton(
//                       onPressed: _handlePaymentFrequency,
//                       style: ElevatedButton.styleFrom(
//                         backgroundColor: AppColors.blueBackground,
//                         shape: RoundedRectangleBorder(
//                           borderRadius: BorderRadius.circular(12),
//                         ),
//                       ),
//                       child: const Text(
//                         "Select payment frequency",
//                         style: TextStyle(
//                             fontWeight: FontWeight.w500,
//                             color: Colors.white,
//                             fontSize: 16),
//                       ),
//                     ),
//                   ),
//                   const SizedBox(height: 24),

//                   // Description
//                   const Text(
//                     "More Product Description",
//                     style: TextStyle(
//                       fontSize: 16,
//                       fontWeight: FontWeight.w600,
//                     ),
//                   ),
//                   const SizedBox(height: 8),
//                   Text(
//                     widget.product['description'] as String? ??
//                         "Experience premium quality with this amazing product. Built with the latest technology and designed for excellence.",
//                     style: const TextStyle(
//                       color: Colors.black87,
//                       height: 1.5,
//                       fontSize: 13.5,
//                     ),
//                   ),
//                   const SizedBox(height: 16),

//                   // Bullet points
//                   _buildBulletPoint("• High-quality materials"),
//                   _buildBulletPoint("• Premium design and finish"),
//                   _buildBulletPoint("• Excellent value for money"),
//                   _buildBulletPoint("• Fast and reliable performance"),
//                   _buildBulletPoint("• 1 year warranty included"),

//                   const SizedBox(height: 16),

//                   // After-sales link
//                   GestureDetector(
//                     onTap: () {},
//                     child: Text(
//                       "Click here for after sales service and supports",
//                       style: TextStyle(
//                         color: AppColors.blueBackground,
//                         fontSize: 13,
//                         decoration: TextDecoration.underline,
//                       ),
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildProductImage(String imageUrl) {
//     if (imageUrl.startsWith('http')) {
//       return AuthCachedImage(
//     imageUrl: imageUrl,
//     height: 180,
//     fit: BoxFit.contain,
//     placeholder: Container(
//       height: 180,
//       color: Colors.grey[200],
//       child: const Center(
//         child: CircularProgressIndicator(strokeWidth: 2),
//       ),
//     ),
//     errorWidget: Container(
//       height: 180,
//       color: Colors.grey[200],
//       child: const Icon(Icons.image, size: 40),
//     ),
//   );
//     } else {
//       return Image.asset(
//         imageUrl,
//         height: 180,
//         fit: BoxFit.contain,
//         errorBuilder: (_, __, ___) => Container(
//           height: 180,
//           color: Colors.grey[200],
//           child: const Icon(Icons.image, size: 40),
//         ),
//       );
//     }
//   }

//   Widget _buildBulletPoint(String text) {
//     return Padding(
//       padding: const EdgeInsets.only(bottom: 4),
//       child: Text(
//         text,
//         style: const TextStyle(fontSize: 13.5, color: Colors.black87),
//       ),
//     );
//   }
// }

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/utils/signup_helper.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/wishlist_provider.dart';
import 'package:pm_e_commerce_app/data/providers/cart_provider.dart';
import 'package:pm_e_commerce_app/presentation/products/widgets/auth_cached_image.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  bool _isInWishlist = false;
  bool _isCheckingWishlist = false;

  @override
  void initState() {
    super.initState();
    _checkPendingSignup();
    _checkWishlistStatus();
  }

  void _checkWishlistStatus() async {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;

    if (user == null) return;

    setState(() {
      _isCheckingWishlist = true;
    });

    final productId = int.tryParse(widget.product['id']?.toString() ?? '');
    if (productId == null) {
      setState(() {
        _isCheckingWishlist = false;
      });
      return;
    }

    try {
      await ref.read(wishlistProvider.notifier).fetchWishlistItems();
      final wishlistState = ref.read(wishlistProvider);
      if (wishlistState.hasValue) {
        final wishlistItems = wishlistState.value ?? [];
        setState(() {
          _isInWishlist =
              wishlistItems.any((item) => item.productId == productId);
          _isCheckingWishlist = false;
        });
      }
    } catch (e) {
      setState(() {
        _isCheckingWishlist = false;
      });
    }
  }

  void _checkPendingSignup() async {
    final pendingAction = await SignupHelper.getPendingSignupAction();
    if (pendingAction != null && mounted) {
      await SignupHelper.clearPendingSignupAction();
    }
  }

  void _handleBuyOnce() async {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;

    if (user == null) {
      await SignupHelper.setPendingSignupAction(
        productId: widget.product['id']?.toString() ?? '',
        actionType: 'buy_once',
      );
      if (mounted) {
        context.push(AppRoutes.register);
      }
    } else {
      // ✅ Add to cart directly
      final productId = int.tryParse(widget.product['id']?.toString() ?? '');
      if (productId != null) {
        final success = await ref.read(cartProvider.notifier).addToCart(
              productId: productId,
              quantity: 1,
            );
        if (mounted) {
          if (success) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Added to cart! Proceed to checkout.'),
                backgroundColor: AppColors.blueBackground,
                duration: Duration(seconds: 2),
              ),
            );
            // Navigate to cart screen
            context.push(AppRoutes.cart);
          } else {
            final cartState = ref.read(cartProvider);
            final cartItems = cartState.value ?? [];
            final exists = cartItems.any((item) => item.productId == productId);
            if (exists) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Item already in cart!'),
                  backgroundColor: Colors.orange,
                ),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Failed to add to cart. Please try again.'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          }
        }
      }
    }
  }

  void _handlePaymentFrequency() async {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;

    if (user == null) {
      await SignupHelper.setPendingSignupAction(
        productId: widget.product['id']?.toString() ?? '',
        actionType: 'payment_frequency',
      );
      if (mounted) {
        context.push(AppRoutes.register);
      }
    } else {
      // ✅ Add to cart first
      final productId = int.tryParse(widget.product['id']?.toString() ?? '');
      if (productId != null) {
        final success = await ref.read(cartProvider.notifier).addToCart(
              productId: productId,
              quantity: 1,
            );
        if (mounted) {
          if (success) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Added to cart! Select payment frequency.'),
                backgroundColor: AppColors.blueBackground,
                duration: Duration(seconds: 2),
              ),
            );
            // Navigate to cart screen with payment frequency selected
            context.push(AppRoutes.cart);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Failed to add to cart. Please try again.'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      }
    }
  }

  void _handleWishlistAction() async {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;

    if (user == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please login to manage wishlist'),
            backgroundColor: AppColors.blueBackground,
            duration: Duration(seconds: 2),
          ),
        );
      }
      return;
    }

    final productId = int.tryParse(widget.product['id']?.toString() ?? '');
    if (productId == null) return;

    try {
      if (_isInWishlist) {
        final success = await ref
            .read(wishlistProvider.notifier)
            .removeFromWishlist(productId);
        if (success && mounted) {
          setState(() {
            _isInWishlist = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Removed from wishlist'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        final success = await ref.read(wishlistProvider.notifier).addToWishlist(
              productId: productId,
            );
        if (success && mounted) {
          setState(() {
            _isInWishlist = true;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Added to wishlist'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update wishlist: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final productImage =
        widget.product['image'] ?? 'assets/images/product1.png';

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
              padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product card
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        topRight: Radius.circular(12),
                        bottomLeft: Radius.circular(20),
                        bottomRight: Radius.circular(20),
                      ),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          child: _buildProductImage(productImage),
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
                                        widget.product['name'] as String? ?? '',
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
                                      '₦${(widget.product['price'] as num?)?.toStringAsFixed(0) ?? '0'}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: GestureDetector(
                                        onTap: _handleBuyOnce,
                                        child: Text(
                                          "Buy once!",
                                          style: TextStyle(
                                            color: AppColors.blueBackground,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Row(
                                children: [
                                  GestureDetector(
                                    onTap: _handleBuyOnce,
                                    child: const Icon(Icons.shopping_cart,
                                        color: Colors.white, size: 18),
                                  ),
                                  const SizedBox(width: 8),
                                  GestureDetector(
                                    onTap: _handleWishlistAction,
                                    child: _isCheckingWishlist
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              valueColor:
                                                  AlwaysStoppedAnimation<Color>(
                                                      Colors.white),
                                            ),
                                          )
                                        : Icon(
                                            _isInWishlist
                                                ? Icons.favorite
                                                : Icons.favorite_border,
                                            color: _isInWishlist
                                                ? Colors.red
                                                : Colors.white,
                                            size: 18,
                                          ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.share_outlined,
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

                  // Select payment frequency
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _handlePaymentFrequency,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.blueBackground,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        "Select payment frequency",
                        style: TextStyle(
                            fontWeight: FontWeight.w500,
                            color: Colors.white,
                            fontSize: 16),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Description
                  const Text(
                    "More Product Description",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.product['description'] as String? ??
                        "Experience premium quality with this amazing product.",
                    style: const TextStyle(
                      color: Colors.black87,
                      height: 1.5,
                      fontSize: 13.5,
                    ),
                  ),
                  const SizedBox(height: 16),

                  _buildBulletPoint("• High-quality materials"),
                  _buildBulletPoint("• Premium design and finish"),
                  _buildBulletPoint("• Excellent value for money"),
                  _buildBulletPoint("• Fast and reliable performance"),
                  _buildBulletPoint("• 1 year warranty included"),

                  const SizedBox(height: 16),

                  GestureDetector(
                    onTap: () {},
                    child: Text(
                      "Click here for after sales service and supports",
                      style: TextStyle(
                        color: AppColors.blueBackground,
                        fontSize: 13,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductImage(String imageUrl) {
    if (imageUrl.startsWith('http')) {
      return AuthCachedImage(
        imageUrl: imageUrl,
        height: 180,
        fit: BoxFit.contain,
        placeholder: Container(
          height: 180,
          color: Colors.grey[200],
          child: const Center(
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
        errorWidget: Container(
          height: 180,
          color: Colors.grey[200],
          child: const Icon(Icons.image, size: 40),
        ),
      );
    } else {
      return Image.asset(
        imageUrl,
        height: 180,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => Container(
          height: 180,
          color: Colors.grey[200],
          child: const Icon(Icons.image, size: 40),
        ),
      );
    }
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text,
        style: const TextStyle(fontSize: 13.5, color: Colors.black87),
      ),
    );
  }
}
