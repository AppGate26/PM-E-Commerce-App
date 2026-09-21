// presentation/home/widgets/auto_scroll_categories_row.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:pm_e_commerce_app/core/constants/category_images.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/category_card.dart';

class AutoScrollCategoriesRow extends StatefulWidget {
  final List<dynamic> categories;
  final double height;

  const AutoScrollCategoriesRow({
    super.key,
    required this.categories,
    this.height = 110,
  });

  @override
  State<AutoScrollCategoriesRow> createState() =>
      _AutoScrollCategoriesRowState();
}

class _AutoScrollCategoriesRowState extends State<AutoScrollCategoriesRow> {
  final ScrollController _scrollController = ScrollController();
  Timer? _autoScrollTimer;
  Timer? _resumeTimer;
  int _direction = 1;
  bool _userInteracting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startAutoScroll();
    });
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _resumeTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    _autoScrollTimer?.cancel();

    if (!_scrollController.hasClients) return;

    _autoScrollTimer = Timer.periodic(const Duration(milliseconds: 30), (_) {
      if (!_scrollController.hasClients || _userInteracting) return;

      final maxExtent = _scrollController.position.maxScrollExtent;
      if (maxExtent <= 0) return;

      double next = _scrollController.offset + (1.1 * _direction);

      if (next >= maxExtent) {
        next = maxExtent;
        _direction = -1;
      } else if (next <= 0) {
        next = 0;
        _direction = 1;
      }

      _scrollController.jumpTo(next);
    });
  }

  void _pauseForInteraction() {
    _userInteracting = true;
    _resumeTimer?.cancel();
  }

  void _scheduleResume() {
    _resumeTimer?.cancel();
    _resumeTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() => _userInteracting = false);
      }
    });
  }

  // ============================================================
  // SMART IMAGE RESOLVER
  // ============================================================
  String _resolveImage(dynamic category) {
    // 1. Prefer image coming from the API
    String? apiImage;

    if (category is Map) {
      apiImage = category['image']?.toString();
    } else {
      try {
        apiImage = category.image?.toString();
      } catch (_) {}
    }

    if (apiImage != null &&
        apiImage.isNotEmpty &&
        apiImage.toLowerCase() != 'null') {
      // If backend returns relative path, make it absolute
      if (!apiImage.startsWith('http')) {
        apiImage = 'https://3.143.17.59:8443$apiImage';
      }
      return apiImage;
    }

    // 2. Fallback to nice real product image based on category name
    final name = category is Map
        ? (category['name']?.toString() ?? '')
        : (category.name?.toString() ?? '');

    return CategoryImages.getImage(name);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final cardWidth = (constraints.maxWidth - (12 * 4)) / 5;
          final displayCategories = widget.categories.length > 8
              ? widget.categories.sublist(0, 8)
              : widget.categories;

          return NotificationListener<ScrollNotification>(
            onNotification: (notification) {
              if (notification is ScrollStartNotification &&
                  notification.dragDetails != null) {
                _pauseForInteraction();
              } else if (notification is ScrollEndNotification) {
                _scheduleResume();
              }
              return false;
            },
            child: ListView.separated(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: displayCategories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final category = displayCategories[index];

                final title = category is Map
                    ? (category['name']?.toString() ?? 'Category')
                    : (category.name?.toString() ?? 'Category');

                final categoryId = category is Map
                    ? (category['id']?.toString() ?? '')
                    : (category.id?.toString() ?? '');

                final imageUrl = _resolveImage(category);

                return SizedBox(
                  width: cardWidth,
                  child: CategoryCard(
                    title: title,
                    image: imageUrl,
                    categoryId: categoryId,
                    index: index,
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
