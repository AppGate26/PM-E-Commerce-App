// import 'dart:async';
// import 'package:flutter/material.dart';
// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:go_router/go_router.dart';
// import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
// import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
// import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
// import 'package:pm_e_commerce_app/data/providers/product_provider.dart';
// import 'package:pm_e_commerce_app/presentation/widgets/custom_bottom_navbar.dart';
// import 'package:pm_e_commerce_app/presentation/widgets/sidebar.dart';
// import 'package:pm_e_commerce_app/presentation/products/widgets/auth_cached_image.dart';

// class HomeScreen extends ConsumerStatefulWidget {
//   const HomeScreen({super.key});

//   @override
//   ConsumerState<HomeScreen> createState() => _HomeScreenState();
// }

// class _HomeScreenState extends ConsumerState<HomeScreen>
//     with SingleTickerProviderStateMixin {
//   int _currentIndex = 0;
//   bool _isSidebarOpen = false;
//   late AnimationController _sidebarController;
//   late Animation<Offset> _slideAnimation;
//   late Animation<double> _fadeAnimation;

//   double? _minPrice;
//   double? _maxPrice;

//   @override
//   void initState() {
//     super.initState();
//     _sidebarController = AnimationController(
//       duration: const Duration(milliseconds: 300),
//       vsync: this,
//     );

//     _slideAnimation = Tween<Offset>(
//       begin: const Offset(-1.0, 0.0),
//       end: Offset.zero,
//     ).animate(CurvedAnimation(
//       parent: _sidebarController,
//       curve: Curves.easeInOut,
//     ));

//     _fadeAnimation = Tween<double>(
//       begin: 0.0,
//       end: 1.0,
//     ).animate(CurvedAnimation(
//       parent: _sidebarController,
//       curve: Curves.easeInOut,
//     ));

//     _sidebarController.value = 0.0;

//     // Fetch products when screen loads
//     WidgetsBinding.instance.addPostFrameCallback((_) {
//       ref.read(productsProvider.notifier).fetchProducts();
//     });
//   }

//   @override
//   void dispose() {
//     _sidebarController.dispose();
//     super.dispose();
//   }

//   void _toggleSidebar() {
//     setState(() {
//       _isSidebarOpen = !_isSidebarOpen;
//       if (_isSidebarOpen) {
//         _sidebarController.forward();
//       } else {
//         _sidebarController.reverse();
//       }
//     });
//   }

//   void _closeSidebar() {
//     setState(() {
//       _isSidebarOpen = false;
//       _sidebarController.reverse();
//     });
//   }

//   void _onItemTapped(int index) {
//     setState(() {
//       _currentIndex = index;
//     });

//     switch (index) {
//       case 0:
//         break;
//       case 1:
//         context.go(AppRoutes.cart);
//         break;
//       case 2:
//         context.push(AppRoutes.account);
//         break;
//       case 3:
//         context.go(AppRoutes.history);
//         break;
//     }
//   }

//   void _showPriceFilterDialog() {
//     final minController =
//         TextEditingController(text: _minPrice?.toString() ?? '');
//     final maxController =
//         TextEditingController(text: _maxPrice?.toString() ?? '');

//     showDialog(
//       context: context,
//       builder: (context) => AlertDialog(
//         title: const Text('Filter by Price'),
//         content: Column(
//           mainAxisSize: MainAxisSize.min,
//           children: [
//             TextField(
//               controller: minController,
//               decoration: const InputDecoration(
//                 labelText: 'Min Price (₦)',
//                 hintText: 'Enter minimum price',
//                 border: OutlineInputBorder(),
//               ),
//               keyboardType: TextInputType.number,
//             ),
//             const SizedBox(height: 16),
//             TextField(
//               controller: maxController,
//               decoration: const InputDecoration(
//                 labelText: 'Max Price (₦)',
//                 hintText: 'Enter maximum price',
//                 border: OutlineInputBorder(),
//               ),
//               keyboardType: TextInputType.number,
//             ),
//           ],
//         ),
//         actions: [
//           TextButton(
//             onPressed: () {
//               Navigator.pop(context);
//             },
//             child: const Text('Cancel'),
//           ),
//           TextButton(
//             onPressed: () {
//               setState(() {
//                 _minPrice = null;
//                 _maxPrice = null;
//               });
//               ref.read(productsProvider.notifier).fetchProducts();
//               Navigator.pop(context);
//             },
//             child: const Text('Clear'),
//           ),
//           ElevatedButton(
//             onPressed: () {
//               final min = minController.text.isEmpty
//                   ? null
//                   : double.tryParse(minController.text);
//               final max = maxController.text.isEmpty
//                   ? null
//                   : double.tryParse(maxController.text);

//               setState(() {
//                 _minPrice = min;
//                 _maxPrice = max;
//               });

//               ref.read(productsProvider.notifier).filterByPrice(
//                     minPrice: min,
//                     maxPrice: max,
//                   );

//               Navigator.pop(context);
//             },
//             style: ElevatedButton.styleFrom(
//               backgroundColor: AppColors.blueBackground,
//             ),
//             child: const Text('Apply', style: TextStyle(color: Colors.white)),
//           ),
//         ],
//       ),
//     );
//   }

//   String _getUserInitials(String? name) {
//     if (name == null || name.isEmpty) return '';
//     final parts = name.trim().split(' ');
//     if (parts.isEmpty) return '';
//     if (parts.length == 1) {
//       if (parts[0].isEmpty) return '';
//       return parts[0][0].toUpperCase();
//     }
//     final first = parts[0].isNotEmpty ? parts[0][0] : '';
//     final last =
//         parts[parts.length - 1].isNotEmpty ? parts[parts.length - 1][0] : '';
//     if (first.isEmpty && last.isEmpty) return '';
//     return '$first$last'.toUpperCase();
//   }

//   void _handleBuyTodayPaySmallSmall() {
//     final authState = ref.read(authProvider);
//     final isLoggedIn = authState.hasValue && authState.value != null;

//     if (isLoggedIn) {
//       context.push(AppRoutes.installmentBreakdown);
//     } else {
//       showDialog(
//         context: context,
//         barrierDismissible: true,
//         builder: (BuildContext context) {
//           return AlertDialog(
//             shape: RoundedRectangleBorder(
//               borderRadius: BorderRadius.circular(20),
//             ),
//             title: const Text(
//               'Login Required',
//               style: TextStyle(
//                 fontWeight: FontWeight.bold,
//                 fontSize: 20,
//               ),
//             ),
//             content: const Text(
//               'Please login or create an account to access our "Buy Today, Pay Small Small" installment payment option.',
//               style: TextStyle(fontSize: 14),
//             ),
//             actions: [
//               TextButton(
//                 onPressed: () {
//                   Navigator.pop(context);
//                 },
//                 style: TextButton.styleFrom(
//                   foregroundColor: Colors.grey[600],
//                 ),
//                 child: const Text('Cancel'),
//               ),
//               ElevatedButton(
//                 onPressed: () {
//                   Navigator.pop(context);
//                   context.push(AppRoutes.login);
//                 },
//                 style: ElevatedButton.styleFrom(
//                   backgroundColor: AppColors.blueBackground,
//                   shape: RoundedRectangleBorder(
//                     borderRadius: BorderRadius.circular(8),
//                   ),
//                 ),
//                 child: const Text(
//                   'Login',
//                   style: TextStyle(color: Colors.white),
//                 ),
//               ),
//             ],
//           );
//         },
//       );
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     final authState = ref.watch(authProvider);
//     final user = authState.hasValue ? authState.value : null;
//     final userInitials =
//         user != null && user.name.isNotEmpty ? _getUserInitials(user.name) : '';

//     final categories = [
//       {
//         'title': 'Gadgets',
//         'image': 'assets/images/product2.png',
//         'id': 'gadgets'
//       },
//       {
//         'title': 'Phones',
//         'image': 'assets/images/product1.png',
//         'id': 'phones'
//       },
//       {'title': 'Shoes', 'image': 'assets/images/product3.png', 'id': 'shoes'},
//       {'title': 'Bags', 'image': 'assets/images/product4.png', 'id': 'bags'},
//       {
//         'title': 'Laptops',
//         'image': 'assets/images/product5.png',
//         'id': 'laptops'
//       },
//       {
//         'title': 'Watches',
//         'image': 'assets/images/product4.png',
//         'id': 'watches'
//       },
//       {
//         'title': 'Accessories',
//         'image': 'assets/images/product1.png',
//         'id': 'accessories'
//       },
//       {
//         'title': 'Speakers',
//         'image': 'assets/images/product1.png',
//         'id': 'speakers'
//       },
//     ];

//     return Scaffold(
//       backgroundColor: AppColors.lightBackground,
//       appBar: AppBar(
//         backgroundColor: AppColors.lightBackground,
//         elevation: 1,
//         surfaceTintColor: Colors.transparent,
//         title: Row(
//           mainAxisAlignment: MainAxisAlignment.spaceBetween,
//           children: [
//             Image.asset('assets/icons/logo1.png', height: 30),
//             Row(
//               children: [
//                 if (user != null && userInitials.isNotEmpty)
//                   GestureDetector(
//                     onTap: () => context.push(AppRoutes.profile),
//                     child: Container(
//                       width: 32,
//                       height: 32,
//                       decoration: BoxDecoration(
//                         color: AppColors.blueBackground,
//                         shape: BoxShape.circle,
//                         boxShadow: [
//                           BoxShadow(
//                             color: AppColors.blueBackground.withOpacity(0.3),
//                             blurRadius: 4,
//                             offset: const Offset(0, 2),
//                           ),
//                         ],
//                       ),
//                       child: Center(
//                         child: Text(
//                           userInitials,
//                           style: const TextStyle(
//                             color: AppColors.textLight,
//                             fontSize: 14,
//                             fontWeight: FontWeight.bold,
//                           ),
//                         ),
//                       ),
//                     ),
//                   ),
//                 if (user != null && userInitials.isNotEmpty)
//                   const SizedBox(width: 12),
//                 GestureDetector(
//                   onTap: _toggleSidebar,
//                   child: Image.asset('assets/icons/menu.png', height: 25),
//                 ),
//               ],
//             ),
//           ],
//         ),
//       ),
//       body: Stack(
//         children: [
//           RefreshIndicator(
//             onRefresh: () async {
//               await ref.read(productsProvider.notifier).fetchProducts();
//             },
//             child: SingleChildScrollView(
//               physics: const AlwaysScrollableScrollPhysics(),
//               child: Padding(
//                 padding:
//                     const EdgeInsets.symmetric(horizontal: 18, vertical: 5),
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     TextField(
//                       decoration: InputDecoration(
//                         hintText: 'Search...',
//                         filled: true,
//                         fillColor: AppColors.whiteBackground,
//                         contentPadding: const EdgeInsets.symmetric(
//                             vertical: 10, horizontal: 15),
//                         border: OutlineInputBorder(
//                           borderRadius: BorderRadius.circular(12),
//                           borderSide: BorderSide.none,
//                         ),
//                       ),
//                       style: const TextStyle(fontSize: 16),
//                       onSubmitted: (value) {
//                         if (value.isNotEmpty) {
//                           ref.read(productsProvider.notifier).fetchProducts(
//                                 search: value,
//                               );
//                         } else {
//                           ref.read(productsProvider.notifier).fetchProducts();
//                         }
//                       },
//                     ),

//                     const SizedBox(height: 10),

//                     // Animated Ads Slider
//                     const AnimatedAdsSlider(),

//                     const SizedBox(height: 10),

//                     // Quick Pick
//                     ElevatedButton(
//                       onPressed: () {},
//                       style: ElevatedButton.styleFrom(
//                         backgroundColor: AppColors.blueBackground,
//                         shape: RoundedRectangleBorder(
//                           borderRadius: BorderRadius.circular(15),
//                         ),
//                       ),
//                       child: Text(
//                         'Quick Pick',
//                         style: TextStyle(color: AppColors.textLight),
//                       ),
//                     ),

//                     const SizedBox(height: 10),

//                     // Categories
//                     SizedBox(
//                       height: 110,
//                       child: LayoutBuilder(
//                         builder: (context, constraints) {
//                           final cardWidth =
//                               (constraints.maxWidth - (12 * 4)) / 5;
//                           return ListView.separated(
//                             scrollDirection: Axis.horizontal,
//                             itemCount: categories.length,
//                             separatorBuilder: (_, __) =>
//                                 const SizedBox(width: 12),
//                             itemBuilder: (context, index) {
//                               final item = categories[index];
//                               return SizedBox(
//                                 width: cardWidth,
//                                 child: CategoryCard(
//                                   title: item['title']!,
//                                   image: item['image']!,
//                                   categoryId: item['id']!,
//                                 ),
//                               );
//                             },
//                           );
//                         },
//                       ),
//                     ),

//                     const SizedBox(height: 10),

//                     // Popular Section Header
//                     Row(
//                       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                       children: [
//                         ElevatedButton(
//                           onPressed: () {},
//                           style: ElevatedButton.styleFrom(
//                             backgroundColor: AppColors.blueBackground,
//                             shape: RoundedRectangleBorder(
//                               borderRadius: BorderRadius.circular(15),
//                             ),
//                           ),
//                           child: Row(
//                             children: [
//                               Text(
//                                 'Popular Today',
//                                 style: TextStyle(color: AppColors.textLight),
//                               ),
//                               const SizedBox(width: 5),
//                               Icon(Icons.arrow_downward,
//                                   color: AppColors.textLight, size: 18),
//                             ],
//                           ),
//                         ),
//                         GestureDetector(
//                           onTap: _showPriceFilterDialog,
//                           child: Container(
//                             padding: const EdgeInsets.all(8),
//                             decoration: BoxDecoration(
//                               color: AppColors.blueBackground,
//                               borderRadius: BorderRadius.circular(8),
//                             ),
//                             child: Icon(
//                               Icons.filter_list,
//                               color: AppColors.textLight,
//                               size: 20,
//                             ),
//                           ),
//                         ),
//                       ],
//                     ),

//                     const SizedBox(height: 15),

//                     // ✅ Popular Products from API - With Proper Loading
//                     Consumer(
//                       builder: (context, ref, child) {
//                         final productsState = ref.watch(productsProvider);

//                         return productsState.when(
//                           data: (products) {
//                             if (products.isEmpty) {
//                               return _buildEmptyState();
//                             }

//                             final popularProducts = products
//                                 .take(6)
//                                 .map((product) => {
//                                       'title': product.name,
//                                       'image': product.displayImage,
//                                       'product': product.toCartFormat(),
//                                     })
//                                 .toList();

//                             return AnimatedProductCarousel(
//                               products: popularProducts,
//                             );
//                           },
//                           loading: () => _buildLoadingSkeleton(),
//                           error: (error, stack) => _buildErrorState(
//                             error: error.toString(),
//                             onRetry: () {
//                               ref
//                                   .read(productsProvider.notifier)
//                                   .fetchProducts();
//                             },
//                           ),
//                         );
//                       },
//                     ),

//                     const SizedBox(height: 16),

//                     // Buy Today, Pay Small Small
//                     GestureDetector(
//                       onTap: _handleBuyTodayPaySmallSmall,
//                       child: Container(
//                         padding: const EdgeInsets.symmetric(
//                           horizontal: 16,
//                           vertical: 14,
//                         ),
//                         decoration: BoxDecoration(
//                           gradient: LinearGradient(
//                             colors: [
//                               AppColors.blueBackground,
//                               AppColors.blueBackground.withOpacity(0.9),
//                             ],
//                             begin: Alignment.topLeft,
//                             end: Alignment.bottomRight,
//                           ),
//                           borderRadius: BorderRadius.circular(16),
//                           boxShadow: [
//                             BoxShadow(
//                               color: AppColors.blueBackground.withOpacity(0.3),
//                               blurRadius: 12,
//                               offset: const Offset(0, 4),
//                             ),
//                           ],
//                         ),
//                         child: Row(
//                           children: [
//                             Expanded(
//                               child: Column(
//                                 crossAxisAlignment: CrossAxisAlignment.start,
//                                 mainAxisSize: MainAxisSize.min,
//                                 children: [
//                                   Text(
//                                     'Buy Today,',
//                                     style: TextStyle(
//                                       color: AppColors.textLight,
//                                       fontSize: 16,
//                                       fontWeight: FontWeight.w600,
//                                       letterSpacing: 0.5,
//                                     ),
//                                   ),
//                                   const SizedBox(height: 6),
//                                   Container(
//                                     padding: const EdgeInsets.symmetric(
//                                       horizontal: 12,
//                                       vertical: 6,
//                                     ),
//                                     decoration: BoxDecoration(
//                                       color: AppColors.textLight,
//                                       borderRadius: BorderRadius.circular(8),
//                                       boxShadow: [
//                                         BoxShadow(
//                                           color: Colors.black.withOpacity(0.1),
//                                           blurRadius: 4,
//                                           offset: const Offset(0, 2),
//                                         ),
//                                       ],
//                                     ),
//                                     child: Text(
//                                       'Pay Small Small',
//                                       style: TextStyle(
//                                         color: AppColors.blueBackground,
//                                         fontSize: 13,
//                                         fontWeight: FontWeight.w700,
//                                         letterSpacing: 0.3,
//                                       ),
//                                     ),
//                                   ),
//                                 ],
//                               ),
//                             ),
//                             const SizedBox(width: 12),
//                             Container(
//                               padding: const EdgeInsets.all(10),
//                               decoration: BoxDecoration(
//                                 color: AppColors.textLight.withOpacity(0.2),
//                                 shape: BoxShape.circle,
//                               ),
//                               child: Icon(
//                                 Icons.shopping_bag_outlined,
//                                 color: AppColors.textLight,
//                                 size: 24,
//                               ),
//                             ),
//                           ],
//                         ),
//                       ),
//                     ),

//                     const SizedBox(height: 20),
//                   ],
//                 ),
//               ),
//             ),
//           ),

//           // Sidebar Backdrop
//           IgnorePointer(
//             ignoring: !_isSidebarOpen,
//             child: FadeTransition(
//               opacity: _fadeAnimation,
//               child: GestureDetector(
//                 onTap: _closeSidebar,
//                 child: Container(
//                   color: Colors.black.withOpacity(0.5),
//                 ),
//               ),
//             ),
//           ),

//           // Sidebar
//           SlideTransition(
//             position: _slideAnimation,
//             child: Align(
//               alignment: Alignment.centerLeft,
//               child: IgnorePointer(
//                 ignoring: !_isSidebarOpen,
//                 child: Sidebar(onClose: _closeSidebar),
//               ),
//             ),
//           ),
//         ],
//       ),
//       bottomNavigationBar: CustomBottomNavBar(
//         currentIndex: _currentIndex,
//         onTap: _onItemTapped,
//       ),
//     );
//   }

//   Widget _buildLoadingSkeleton() {
//     return SizedBox(
//       height: 140,
//       child: ListView.separated(
//         scrollDirection: Axis.horizontal,
//         padding: const EdgeInsets.symmetric(horizontal: 16),
//         itemCount: 4,
//         separatorBuilder: (_, __) => const SizedBox(width: 12),
//         itemBuilder: (context, index) {
//           final screenWidth = MediaQuery.of(context).size.width;
//           final cardWidth = (screenWidth - 32 - (12 * 2)) / 3;
//           return SizedBox(
//             width: cardWidth,
//             child: Column(
//               mainAxisAlignment: MainAxisAlignment.center,
//               children: [
//                 Container(
//                   height: 80,
//                   width: double.infinity,
//                   decoration: BoxDecoration(
//                     color: Colors.grey[200],
//                     borderRadius: BorderRadius.circular(15),
//                   ),
//                   child: const Center(
//                     child: CircularProgressIndicator(
//                       strokeWidth: 2,
//                       color: AppColors.blueBackground,
//                     ),
//                   ),
//                 ),
//                 const SizedBox(height: 5),
//                 Container(
//                   height: 12,
//                   width: double.infinity,
//                   color: Colors.grey[200],
//                 ),
//               ],
//             ),
//           );
//         },
//       ),
//     );
//   }

//   Widget _buildErrorState(
//       {required String error, required VoidCallback onRetry}) {
//     return SizedBox(
//       height: 140,
//       child: Center(
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Icon(
//               Icons.error_outline,
//               size: 40,
//               color: Colors.grey[400],
//             ),
//             const SizedBox(height: 8),
//             Text(
//               'Failed to load products',
//               style: TextStyle(
//                 fontSize: 14,
//                 color: Colors.grey[600],
//               ),
//             ),
//             const SizedBox(height: 8),
//             TextButton(
//               onPressed: onRetry,
//               child: const Text('Retry'),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildEmptyState() {
//     return SizedBox(
//       height: 140,
//       child: Center(
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Icon(
//               Icons.inbox_outlined,
//               size: 40,
//               color: Colors.grey[400],
//             ),
//             const SizedBox(height: 8),
//             Text(
//               'No products available',
//               style: TextStyle(
//                 fontSize: 14,
//                 color: Colors.grey[600],
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

// // ===================== ANIMATED ADS SLIDER =====================
// class AnimatedAdsSlider extends StatefulWidget {
//   const AnimatedAdsSlider({super.key});

//   @override
//   State<AnimatedAdsSlider> createState() => _AnimatedAdsSliderState();
// }

// class _AnimatedAdsSliderState extends State<AnimatedAdsSlider> {
//   final List<String> adImages = [
//     'assets/images/ads1.png',
//     'assets/images/ads2.png',
//     'assets/images/ads3.png',
//     'assets/images/ads4.png',
//   ];

//   int _currentIndex = 0;
//   late Timer _timer;

//   @override
//   void initState() {
//     super.initState();
//     Future.delayed(const Duration(milliseconds: 200), () {
//       _startAutoSlide();
//     });
//   }

//   void _startAutoSlide() {
//     _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
//       if (mounted) {
//         setState(() {
//           _currentIndex = (_currentIndex + 1) % adImages.length;
//         });
//       }
//     });
//   }

//   @override
//   void dispose() {
//     _timer.cancel();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return SizedBox(
//       height: 100,
//       width: double.infinity,
//       child: ClipRRect(
//         borderRadius: BorderRadius.circular(12),
//         child: Stack(
//           children: [
//             Container(
//               decoration: BoxDecoration(
//                 color: AppColors.blueBackground,
//                 borderRadius: BorderRadius.circular(12),
//               ),
//             ),
//             AnimatedSwitcher(
//               duration: const Duration(milliseconds: 500),
//               switchInCurve: Curves.easeOut,
//               switchOutCurve: Curves.easeOut,
//               transitionBuilder: (Widget child, Animation<double> animation) {
//                 return SlideTransition(
//                   position: Tween<Offset>(
//                     begin: const Offset(0.0, 1.0),
//                     end: Offset.zero,
//                   ).animate(CurvedAnimation(
//                     parent: animation,
//                     curve: Curves.easeOut,
//                   )),
//                   child: child,
//                 );
//               },
//               child: Container(
//                 key: ValueKey(_currentIndex),
//                 height: 100,
//                 width: double.infinity,
//                 decoration: BoxDecoration(
//                   borderRadius: BorderRadius.circular(12),
//                   image: DecorationImage(
//                     image: AssetImage(adImages[_currentIndex]),
//                     fit: BoxFit.cover,
//                   ),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

// // ===================== CATEGORY CARD =====================
// class CategoryCard extends StatelessWidget {
//   final String title;
//   final String image;
//   final String categoryId;

//   const CategoryCard({
//     super.key,
//     required this.title,
//     required this.image,
//     required this.categoryId,
//   });

//   @override
//   Widget build(BuildContext context) {
//     return GestureDetector(
//       onTap: () {
//         context.push('/products/$title/$categoryId');
//       },
//       child: Container(
//         decoration: BoxDecoration(borderRadius: BorderRadius.circular(16)),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Expanded(
//               child: Container(
//                 padding: const EdgeInsets.all(8.0),
//                 decoration: BoxDecoration(
//                   color: AppColors.lightBlueBackground,
//                   borderRadius: BorderRadius.circular(15),
//                 ),
//                 child: Center(
//                   child: Image.asset(
//                     image,
//                     height: 100,
//                     fit: BoxFit.contain,
//                   ),
//                 ),
//               ),
//             ),
//             const SizedBox(height: 5),
//             Text(
//               title,
//               style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
//               overflow: TextOverflow.ellipsis,
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

// // ===================== POPULAR CARD =====================
// class PopularCard extends StatelessWidget {
//   final String title;
//   final String image;

//   const PopularCard({
//     super.key,
//     required this.title,
//     required this.image,
//   });

//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       decoration: BoxDecoration(borderRadius: BorderRadius.circular(16)),
//       child: Column(
//         mainAxisAlignment: MainAxisAlignment.center,
//         children: [
//           Expanded(
//             child: Container(
//               padding: const EdgeInsets.all(8.0),
//               decoration: BoxDecoration(
//                 color: AppColors.lightBlueBackground,
//                 borderRadius: BorderRadius.circular(15),
//               ),
//               child: Center(
//                 child: image.startsWith('http')
//                     ? AuthCachedImage(
//                         imageUrl: image,
//                         height: 100,
//                         fit: BoxFit.contain,
//                       )
//                     : Image.asset(
//                         image,
//                         height: 100,
//                         fit: BoxFit.contain,
//                         errorBuilder: (_, __, ___) => Container(
//                           height: 100,
//                           color: Colors.grey[200],
//                           child: const Icon(Icons.image, size: 30),
//                         ),
//                       ),
//               ),
//             ),
//           ),
//           const SizedBox(height: 5),
//           Text(
//             title,
//             style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
//             overflow: TextOverflow.ellipsis,
//             maxLines: 1,
//           ),
//         ],
//       ),
//     );
//   }
// }

// // ===================== ANIMATED PRODUCT CAROUSEL =====================
// class AnimatedProductCarousel extends StatefulWidget {
//   final List<Map<String, dynamic>> products;

//   const AnimatedProductCarousel({
//     super.key,
//     required this.products,
//   });

//   @override
//   State<AnimatedProductCarousel> createState() =>
//       _AnimatedProductCarouselState();
// }

// class _AnimatedProductCarouselState extends State<AnimatedProductCarousel> {
//   final ScrollController _scrollController = ScrollController();
//   Timer? _autoScrollTimer;
//   Timer? _resumeTimer;
//   double _scrollSpeed = 0.0;
//   bool _isInitialized = false;
//   bool _isUserDragging = false;

//   void _initializeScroll() {
//     if (!mounted || !_scrollController.hasClients) {
//       return;
//     }

//     try {
//       final position = _scrollController.position;
//       if (position.maxScrollExtent > 0) {
//         _calculateScrollSpeed();
//         _startAutoScroll();
//       } else {
//         Future.delayed(const Duration(milliseconds: 100), () {
//           if (mounted) _initializeScroll();
//         });
//       }
//     } catch (e) {
//       Future.delayed(const Duration(milliseconds: 100), () {
//         if (mounted) _initializeScroll();
//       });
//     }
//   }

//   void _calculateScrollSpeed() {
//     if (!mounted || !_scrollController.hasClients) return;

//     final screenWidth = MediaQuery.of(context).size.width;
//     final cardWidth = (screenWidth - 32 - (12 * 2)) / 3;
//     _scrollSpeed = (cardWidth + 12) / (10000 / 16);
//   }

//   void _pauseAutoScroll() {
//     _autoScrollTimer?.cancel();
//     _isUserDragging = true;
//     _resumeTimer?.cancel();
//   }

//   void _resumeAutoScroll() {
//     _resumeTimer?.cancel();
//     _resumeTimer = Timer(const Duration(milliseconds: 1500), () {
//       if (mounted) {
//         setState(() {
//           _isUserDragging = false;
//         });
//         _startAutoScroll();
//       }
//     });
//   }

//   void _startAutoScroll() {
//     if (_scrollSpeed == 0.0 ||
//         !_scrollController.hasClients ||
//         _isUserDragging) {
//       return;
//     }

//     _autoScrollTimer?.cancel();

//     _autoScrollTimer =
//         Timer.periodic(const Duration(milliseconds: 16), (timer) {
//       if (!mounted || _isUserDragging) {
//         return;
//       }

//       if (!_scrollController.hasClients) {
//         return;
//       }

//       try {
//         final position = _scrollController.position;
//         final maxScroll = position.maxScrollExtent;
//         final currentScroll = position.pixels;

//         if (maxScroll <= 0) {
//           return;
//         }

//         double nextScroll = currentScroll + _scrollSpeed;

//         if (nextScroll >= maxScroll) {
//           _scrollController.jumpTo(0);
//         } else {
//           _scrollController.jumpTo(nextScroll);
//         }
//       } catch (e) {
//         timer.cancel();
//         Future.delayed(const Duration(milliseconds: 100), () {
//           if (mounted && !_isUserDragging) {
//             _startAutoScroll();
//           }
//         });
//       }
//     });
//   }

//   @override
//   void dispose() {
//     _autoScrollTimer?.cancel();
//     _resumeTimer?.cancel();
//     _scrollController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     if (widget.products.isEmpty) {
//       return const SizedBox(height: 140);
//     }

//     final screenWidth = MediaQuery.of(context).size.width;
//     final cardWidth = (screenWidth - 32 - (12 * 2)) / 3;

//     final duplicatedProducts = [...widget.products, ...widget.products];

//     if (!_isInitialized) {
//       WidgetsBinding.instance.addPostFrameCallback((_) {
//         if (mounted && !_isInitialized) {
//           _isInitialized = true;
//           Future.delayed(const Duration(milliseconds: 500), () {
//             if (mounted) {
//               _initializeScroll();
//             }
//           });
//         }
//       });
//     }

//     return SizedBox(
//       height: 140,
//       child: NotificationListener<ScrollNotification>(
//         onNotification: (notification) {
//           if (notification is ScrollStartNotification) {
//             _pauseAutoScroll();
//           } else if (notification is ScrollEndNotification) {
//             _resumeAutoScroll();
//           }
//           return false;
//         },
//         child: ListView.separated(
//           controller: _scrollController,
//           scrollDirection: Axis.horizontal,
//           padding: const EdgeInsets.symmetric(horizontal: 16),
//           physics: const BouncingScrollPhysics(),
//           itemCount: duplicatedProducts.length,
//           separatorBuilder: (_, __) => const SizedBox(width: 12),
//           itemBuilder: (context, index) {
//             final item = duplicatedProducts[index % widget.products.length];
//             return SizedBox(
//               width: cardWidth,
//               child: GestureDetector(
//                 onTap: () {
//                   context.push(
//                     AppRoutes.productDetailScreen,
//                     extra: item['product'],
//                   );
//                 },
//                 child: PopularCard(
//                   title: item['title'] as String,
//                   image: item['image'] as String,
//                 ),
//               ),
//             );
//           },
//         ),
//       ),
//     );
//   }
// }


import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/data/models/product_model.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/product_provider.dart';
import 'package:pm_e_commerce_app/data/providers/home_provider.dart';
import 'package:pm_e_commerce_app/data/providers/category_provider.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/home_app_bar.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/animated_ads_slider.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/auto_scroll_categories_row.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/animated_product_carousel.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/buy_today_pay_small_card.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/price_filter_dialog.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/home_loading_state.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/home_error_state.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/home_empty_state.dart';
import 'package:pm_e_commerce_app/presentation/widgets/custom_bottom_navbar.dart';
import 'package:pm_e_commerce_app/presentation/widgets/sidebar.dart';
import 'package:pm_e_commerce_app/presentation/products/widgets/auth_cached_image.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  bool _isSidebarOpen = false;
  late AnimationController _sidebarController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  double? _minPrice;
  double? _maxPrice;
  String? _searchQuery;

  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _searchDebounce;
  bool _showSearchSuggestions = false;

  @override
  void initState() {
    super.initState();
    _initSidebarAnimation();
    _fetchInitialData();
  }

  void _initSidebarAnimation() {
    _sidebarController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(-1.0, 0.0),
      end: Offset.zero,
    ).animate(
        CurvedAnimation(parent: _sidebarController, curve: Curves.easeInOut));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(
        CurvedAnimation(parent: _sidebarController, curve: Curves.easeInOut));
  }

  void _fetchInitialData() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(productsProvider.notifier).fetchProducts();
      ref.read(quickPickProvider.notifier).fetchQuickPick();
      ref.read(popularProductsProvider.notifier).fetchPopularProducts();
      ref
          .read(categoriesProvider.notifier)
          .fetchCategories(); // ✅ Fetch categories
    });
  }

  @override
  void dispose() {
    _sidebarController.dispose();
    _searchDebounce?.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  void _toggleSidebar() {
    setState(() {
      _isSidebarOpen = !_isSidebarOpen;
      _isSidebarOpen
          ? _sidebarController.forward()
          : _sidebarController.reverse();
    });
  }

  void _closeSidebar() {
    setState(() {
      _isSidebarOpen = false;
      _sidebarController.reverse();
    });
  }

  void _onItemTapped(int index) {
    setState(() => _currentIndex = index);
    switch (index) {
      case 1:
        context.go(AppRoutes.cart);
        break;
      case 2:
        context.push(AppRoutes.account);
        break;
      case 3:
        context.go(AppRoutes.history);
        break;
    }
  }

  void _showPriceFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => PriceFilterDialog(
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        onApply: (min, max) {
          setState(() {
            _minPrice = min;
            _maxPrice = max;
          });
          ref
              .read(productsProvider.notifier)
              .filterByPrice(minPrice: min, maxPrice: max);
        },
        onClear: () {
          setState(() {
            _minPrice = null;
            _maxPrice = null;
          });
          ref.read(productsProvider.notifier).fetchProducts();
        },
      ),
    );
  }

  void _navigateToQuickPick() {
    // Navigate to Quick Pick products screen
    context.push(AppRoutes.quickPickProducts);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).value;
    final userInitials = _getUserInitials(user?.name);

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: HomeAppBar(
        userInitials: userInitials,
        isLoggedIn: user != null,
        onMenuTap: _toggleSidebar,
        onProfileTap: () => context.push(AppRoutes.profile),
      ),
      body: Stack(
        children: [
          _buildMainContent(),
          _buildSidebarOverlay(),
          _buildSidebar(),
        ],
      ),
      bottomNavigationBar: CustomBottomNavBar(
        currentIndex: _currentIndex,
        onTap: _onItemTapped,
      ),
    );
  }

  Widget _buildMainContent() {
    return RefreshIndicator(
      onRefresh: _refreshAllData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSearchBar(),
            _buildSearchSuggestions(),
            const SizedBox(height: 10),
            const AnimatedAdsSlider(),
            const SizedBox(height: 10),
            _buildQuickPickButton(),
            const SizedBox(height: 10),
            _buildCategoriesSection(), // ✅ Now from API + auto-scroll
            const SizedBox(height: 10),
            _buildPopularSectionHeader(),
            const SizedBox(height: 15),
            _buildPopularProductsSection(),
            const SizedBox(height: 16),
            const BuyTodayPaySmallCard(),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Future<void> _refreshAllData() async {
    await Future.wait([
      ref.read(productsProvider.notifier).fetchProducts(),
      ref.read(quickPickProvider.notifier).fetchQuickPick(),
      ref.read(popularProductsProvider.notifier).fetchPopularProducts(),
      ref
          .read(categoriesProvider.notifier)
          .fetchCategories(), // ✅ Refresh categories
    ]);
  }

  // ============================================================
  // SEARCH BAR
  // ============================================================
  Widget _buildSearchBar() {
    return TextField(
      controller: _searchController,
      focusNode: _searchFocusNode,
      decoration: InputDecoration(
        hintText: 'Search products...',
        prefixIcon: Icon(
          Icons.search,
          color: Colors.grey[400],
          size: 20,
        ),
        suffixIcon: _searchQuery != null && _searchQuery!.isNotEmpty
            ? IconButton(
                icon: Icon(Icons.close_rounded, color: Colors.grey[400]),
                onPressed: _clearSearch,
              )
            : null,
        filled: true,
        fillColor: AppColors.whiteBackground,
        contentPadding:
            const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.blueBackground, width: 1.5),
        ),
      ),
      style: const TextStyle(fontSize: 14),
      onChanged: _onSearchChanged,
      onSubmitted: _onSearchSubmitted,
    );
  }

  void _onSearchChanged(String value) {
    final query = value.trim();
    setState(() {
      _searchQuery = value.isEmpty ? null : value;
      _showSearchSuggestions = query.isNotEmpty;
    });

    _searchDebounce?.cancel();
    if (query.isEmpty) {
      ref.read(searchSuggestionsProvider.notifier).clear();
      return;
    }

    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      ref.read(searchSuggestionsProvider.notifier).search(query);
    });
  }

  void _clearSearch() {
    _searchDebounce?.cancel();
    _searchController.clear();
    ref.read(searchSuggestionsProvider.notifier).clear();
    setState(() {
      _searchQuery = null;
      _showSearchSuggestions = false;
    });
  }

  void _onSearchSubmitted(String value) {
    final query = value.trim();
    if (query.isEmpty) return;

    setState(() => _showSearchSuggestions = false);
    _searchFocusNode.unfocus();

    context.push(
      '/products/Search Results/all?q=${Uri.encodeComponent(query)}',
    );
  }

  void _onSuggestionTapped(ProductModel product) {
    setState(() => _showSearchSuggestions = false);
    _searchFocusNode.unfocus();
    context.push(
      AppRoutes.productDetailScreen,
      extra: product.toCartFormat(),
    );
  }

  // ============================================================
  // SEARCH SUGGESTIONS DROPDOWN
  // ============================================================
  Widget _buildSearchSuggestions() {
    if (!_showSearchSuggestions) return const SizedBox.shrink();

    return Consumer(
      builder: (context, ref, child) {
        final searchState = ref.watch(searchSuggestionsProvider);

        return Container(
          margin: const EdgeInsets.only(top: 6),
          decoration: BoxDecoration(
            color: AppColors.whiteBackground,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          constraints: const BoxConstraints(maxHeight: 320),
          child: searchState.when(
            data: (products) {
              if (products.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(
                      vertical: 20, horizontal: 16),
                  child: Text(
                    'No products found for "${_searchQuery ?? ''}"',
                    style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                  ),
                );
              }

              final visibleProducts = products.take(6).toList();

              return ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(vertical: 6),
                itemCount: visibleProducts.length,
                separatorBuilder: (_, __) => Divider(
                  height: 1,
                  color: Colors.grey[100],
                ),
                itemBuilder: (context, index) {
                  final product = visibleProducts[index];
                  return ListTile(
                    dense: true,
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: AuthCachedImage(
                        imageUrl: product.displayImage,
                        height: 40,
                        width: 40,
                        fit: BoxFit.contain,
                        placeholder: Container(
                          height: 40,
                          width: 40,
                          color: Colors.grey[200],
                        ),
                        errorWidget: Container(
                          height: 40,
                          width: 40,
                          color: Colors.grey[200],
                          child: Icon(Icons.image_outlined,
                              size: 18, color: Colors.grey[400]),
                        ),
                      ),
                    ),
                    title: Text(
                      product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    trailing: Text(
                      '₦${product.price.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.blueBackground,
                      ),
                    ),
                    onTap: () => _onSuggestionTapped(product),
                  );
                },
              );
            },
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.blueBackground,
                  ),
                ),
              ),
            ),
            error: (error, stackTrace) => Padding(
              padding:
                  const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
              child: Text(
                'Something went wrong. Try again.',
                style: TextStyle(fontSize: 13, color: Colors.grey[500]),
              ),
            ),
          ),
        );
      },
    );
  }

  // ============================================================
  // QUICK PICK BUTTON
  // ============================================================
  Widget _buildQuickPickButton() {
    return Consumer(
      builder: (context, ref, child) {
        final quickPickState = ref.watch(quickPickProvider);

        return quickPickState.when(
          data: (items) {
            if (items.isEmpty) return const SizedBox.shrink();

            return GestureDetector(
              onTap: _navigateToQuickPick,
              child: Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.blueBackground, Color(0xFF0088FF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.blueBackground.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.flash_on_rounded,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              '⚡ Quick Pick',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '${items.length} items available',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.7),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Text(
                            'View All',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            Icons.arrow_forward_ios_rounded,
                            color: Colors.white.withOpacity(0.7),
                            size: 12,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
          loading: () => _buildQuickPickLoading(),
          error: (_, __) => const SizedBox.shrink(),
        );
      },
    );
  }

  Widget _buildQuickPickLoading() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.flash_on_rounded,
              color: Colors.grey,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 80,
                height: 16,
                color: Colors.grey[300],
              ),
              const SizedBox(height: 4),
              Container(
                width: 60,
                height: 12,
                color: Colors.grey[300],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ============================================================
  // CATEGORIES SECTION - FROM API + AUTO-SCROLLING
  // ============================================================
  Widget _buildCategoriesSection() {
    return Consumer(
      builder: (context, ref, child) {
        final categoriesState = ref.watch(categoriesProvider);

        return categoriesState.when(
          data: (categories) {
            if (categories.isEmpty) {
              return const SizedBox.shrink();
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Section Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 4,
                            height: 18,
                            decoration: BoxDecoration(
                              color: AppColors.blueBackground,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            'Categories',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Colors.black87,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // ✅ Auto-scrolling categories row (same card design)
                AutoScrollCategoriesRow(
                  categories: categories,
                  height: 110,
                ),
              ],
            );
          },
          loading: () => _buildCategoriesLoadingSkeleton(),
          error: (_, __) => _buildCategoriesError(),
        );
      },
    );
  }

  Widget _buildCategoriesLoadingSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: AppColors.blueBackground,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Container(
                width: 80,
                height: 16,
                color: Colors.grey[200],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 110,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: 5,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              return Container(
                width: 70,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 40,
                      height: 8,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCategoriesError() {
    return Container(
      height: 110,
      alignment: Alignment.center,
      child: Text(
        'Failed to load categories',
        style: TextStyle(
          fontSize: 12,
          color: Colors.grey[500],
        ),
      ),
    );
  }

  // ============================================================
  // POPULAR SECTION HEADER
  // ============================================================
  Widget _buildPopularSectionHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        ElevatedButton(
          onPressed: () {},
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.blueBackground,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          ),
          child: Row(
            children: [
              Text('Popular Today',
                  style: TextStyle(color: AppColors.textLight)),
              const SizedBox(width: 5),
              Icon(Icons.arrow_downward, color: AppColors.textLight, size: 18),
            ],
          ),
        ),
        GestureDetector(
          onTap: _showPriceFilterDialog,
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.blueBackground,
              borderRadius: BorderRadius.circular(8),
            ),
            child:
                Icon(Icons.filter_list, color: AppColors.textLight, size: 20),
          ),
        ),
      ],
    );
  }

  // ============================================================
  // POPULAR PRODUCTS SECTION
  // ============================================================
  Widget _buildPopularProductsSection() {
    return Consumer(
      builder: (context, ref, child) {
        final popularState = ref.watch(popularProductsProvider);

        return popularState.when(
          data: (products) {
            if (products.isEmpty) return const HomeEmptyState();

            final displayProducts = products
                .take(6)
                .map((product) => {
                      'title': product.name,
                      'image': product.image ?? 'assets/images/product1.png',
                      'product': product.toCartFormat(),
                    })
                .toList();

            return AnimatedProductCarousel(products: displayProducts);
          },
          loading: () => const HomeLoadingState(),
          error: (error, _) => HomeErrorState(
            error: error.toString(),
            onRetry: () {
              ref.read(popularProductsProvider.notifier).fetchPopularProducts();
            },
          ),
        );
      },
    );
  }

  // ============================================================
  // SIDEBAR
  // ============================================================
  Widget _buildSidebarOverlay() {
    return IgnorePointer(
      ignoring: !_isSidebarOpen,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: GestureDetector(
          onTap: _closeSidebar,
          child: Container(color: Colors.black.withOpacity(0.5)),
        ),
      ),
    );
  }

  Widget _buildSidebar() {
    return SlideTransition(
      position: _slideAnimation,
      child: Align(
        alignment: Alignment.centerLeft,
        child: IgnorePointer(
          ignoring: !_isSidebarOpen,
          child: Sidebar(onClose: _closeSidebar),
        ),
      ),
    );
  }

  String _getUserInitials(String? name) {
    if (name == null || name.isEmpty) return '';
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return '';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    final first = parts[0].isNotEmpty ? parts[0][0] : '';
    final last =
        parts[parts.length - 1].isNotEmpty ? parts[parts.length - 1][0] : '';
    if (first.isEmpty && last.isEmpty) return '';
    return '$first$last'.toUpperCase();
  }
}
