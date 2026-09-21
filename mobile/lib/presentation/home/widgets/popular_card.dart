// presentation/home/widgets/popular_card.dart

import 'package:flutter/material.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/presentation/products/widgets/auth_cached_image.dart';

class PopularCard extends StatelessWidget {
  final String title;
  final String image;

  const PopularCard({
    super.key,
    required this.title,
    required this.image,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(16)),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                color: AppColors.lightBlueBackground,
                borderRadius: BorderRadius.circular(15),
              ),
              child: Center(
                child: image.startsWith('http')
                    ? AuthCachedImage(
                        imageUrl: image,
                        height: 100,
                        fit: BoxFit.contain,
                      )
                    : Image.asset(
                        image,
                        height: 100,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => Container(
                          height: 100,
                          color: Colors.grey[200],
                          child: const Icon(Icons.image, size: 30),
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 5),
          Text(
            title,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
        ],
      ),
    );
  }
}