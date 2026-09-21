import 'dart:async';
import 'package:flutter/material.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class AnimatedAdvertBanner extends StatefulWidget {
  const AnimatedAdvertBanner({super.key});

  @override
  State<AnimatedAdvertBanner> createState() => _AnimatedAdvertBannerState();
}

class _AnimatedAdvertBannerState extends State<AnimatedAdvertBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  int _currentAd = 0;
  Timer? _timer;

  final List<Map<String, dynamic>> _adverts = [
    {
      'title': '🎉 Flash Sale!',
      'subtitle': 'Up to 50% OFF Electronics',
      'bgColor': AppColors.blueBackground,
    },
    {
      'title': '🚚 Free Delivery',
      'subtitle': 'On orders over \$50',
      'bgColor': Color(0xFF4CAF50), // Green
    },
    {
      'title': '🛍️ New Arrivals',
      'subtitle': 'Fresh styles every week',
      'bgColor': Color(0xFF9C27B0), // Purple
    },
  ];

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 1.0), // Slide up from bottom
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));

    // Start animation
    _controller.forward();

    // Auto switch ads every 3 seconds
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (mounted) {
        _switchAd();
      }
    });
  }

  void _switchAd() {
    // Slide out current ad
    _controller.reverse().then((_) {
      if (mounted) {
        setState(() {
          _currentAd = (_currentAd + 1) % _adverts.length;
        });
        // Slide in next ad
        _controller.forward();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ad = _adverts[_currentAd];

    return Container(
      height: 100,
      width: double.infinity,
      decoration: BoxDecoration(
        color: ad['bgColor'],
        borderRadius: BorderRadius.circular(12),
      ),
      child: SlideTransition(
        position: _slideAnimation,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Text Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      ad['title'],
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      ad['subtitle'],
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            // Handle button tap
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(
                                horizontal: 16, vertical: 6),
                            child: Text(
                              'Shop Now',
                              style: TextStyle(
                                color: AppColors.blueBackground,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Shopping Icon/Image
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.shopping_bag_rounded,
                  color: Colors.white,
                  size: 30,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
