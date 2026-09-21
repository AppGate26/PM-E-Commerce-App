// presentation/home/widgets/animated_product_carousel.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/popular_card.dart';

class AnimatedProductCarousel extends StatefulWidget {
  final List<Map<String, dynamic>> products;

  const AnimatedProductCarousel({
    super.key,
    required this.products,
  });

  @override
  State<AnimatedProductCarousel> createState() => _AnimatedProductCarouselState();
}

class _AnimatedProductCarouselState extends State<AnimatedProductCarousel> {
  final ScrollController _scrollController = ScrollController();
  Timer? _autoScrollTimer;
  Timer? _resumeTimer;
  double _scrollSpeed = 0.0;
  bool _isInitialized = false;
  bool _isUserDragging = false;

  void _initializeScroll() {
    if (!mounted || !_scrollController.hasClients) return;

    try {
      final position = _scrollController.position;
      if (position.maxScrollExtent > 0) {
        _calculateScrollSpeed();
        _startAutoScroll();
      } else {
        Future.delayed(const Duration(milliseconds: 100), () {
          if (mounted) _initializeScroll();
        });
      }
    } catch (_) {
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) _initializeScroll();
      });
    }
  }

  void _calculateScrollSpeed() {
    if (!mounted || !_scrollController.hasClients) return;
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = (screenWidth - 32 - (12 * 2)) / 3;
    _scrollSpeed = (cardWidth + 12) / (10000 / 16);
  }

  void _pauseAutoScroll() {
    _autoScrollTimer?.cancel();
    _isUserDragging = true;
    _resumeTimer?.cancel();
  }

  void _resumeAutoScroll() {
    _resumeTimer?.cancel();
    _resumeTimer = Timer(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() => _isUserDragging = false);
        _startAutoScroll();
      }
    });
  }

  void _startAutoScroll() {
    if (_scrollSpeed == 0.0 || !_scrollController.hasClients || _isUserDragging) {
      return;
    }

    _autoScrollTimer?.cancel();
    _autoScrollTimer = Timer.periodic(const Duration(milliseconds: 16), (timer) {
      if (!mounted || _isUserDragging || !_scrollController.hasClients) return;

      try {
        final position = _scrollController.position;
        final maxScroll = position.maxScrollExtent;
        final currentScroll = position.pixels;

        if (maxScroll <= 0) return;

        double nextScroll = currentScroll + _scrollSpeed;
        if (nextScroll >= maxScroll) {
          _scrollController.jumpTo(0);
        } else {
          _scrollController.jumpTo(nextScroll);
        }
      } catch (_) {
        timer.cancel();
        Future.delayed(const Duration(milliseconds: 100), () {
          if (mounted && !_isUserDragging) _startAutoScroll();
        });
      }
    });
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _resumeTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.products.isEmpty) return const SizedBox(height: 140);

    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = (screenWidth - 32 - (12 * 2)) / 3;
    final duplicatedProducts = [...widget.products, ...widget.products];

    if (!_isInitialized) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !_isInitialized) {
          _isInitialized = true;
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted) _initializeScroll();
          });
        }
      });
    }

    return SizedBox(
      height: 140,
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollStartNotification) {
            _pauseAutoScroll();
          } else if (notification is ScrollEndNotification) {
            _resumeAutoScroll();
          }
          return false;
        },
        child: ListView.separated(
          controller: _scrollController,
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          physics: const BouncingScrollPhysics(),
          itemCount: duplicatedProducts.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (context, index) {
            final item = duplicatedProducts[index % widget.products.length];
            return SizedBox(
              width: cardWidth,
              child: GestureDetector(
                onTap: () => context.push(
                  AppRoutes.productDetailScreen,
                  extra: item['product'],
                ),
                child: PopularCard(
                  title: item['title'] as String,
                  image: item['image'] as String,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}