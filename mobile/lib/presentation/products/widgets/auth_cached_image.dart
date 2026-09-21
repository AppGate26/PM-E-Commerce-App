import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';

class AuthCachedImage extends StatelessWidget {
  final String imageUrl;
  final double? height;
  final double? width;
  final BoxFit fit;
  final Widget? placeholder;
  final Widget? errorWidget;

  const AuthCachedImage({
    super.key,
    required this.imageUrl,
    this.height,
    this.width,
    this.fit = BoxFit.contain,
    this.placeholder,
    this.errorWidget,
  });

  @override
  Widget build(BuildContext context) {
    if (!imageUrl.startsWith('http')) {
      return Image.asset(
        imageUrl,
        height: height,
        width: width,
        fit: fit,
        errorBuilder: (_, __, ___) => Container(
          height: height ?? 100,
          width: width ?? 100,
          color: Colors.grey[200],
          child: const Icon(Icons.image, size: 40),
        ),
      );
    }

    // ✅ Check if it's an old server URL - use fallback
    final bool isOldServer =
        imageUrl.contains('3.135.182.212') || imageUrl.contains('52.14.68.171');

    // ✅ Use the original URL (don't modify it)
    final String finalUrl = imageUrl;

    return FutureBuilder<String?>(
      future: StorageService.getToken(),
      builder: (context, snapshot) {
        final token = snapshot.data;

        return CachedNetworkImage(
          imageUrl: finalUrl,
          height: height,
          width: width,
          fit: fit,
          httpHeaders: token != null && token.isNotEmpty
              ? {
                  'Authorization': 'Bearer $token',
                  'Accept': 'image/*',
                }
              : {},
          placeholder: (context, url) =>
              placeholder ??
              Container(
                height: height ?? 100,
                width: width ?? 100,
                color: Colors.grey[200],
                child: const Center(
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
          errorWidget: (context, url, error) {
            // ✅ For old server images, show a "No Image" placeholder
            if (isOldServer) {
              return Container(
                height: height ?? 100,
                width: width ?? 100,
                color: Colors.grey[200],
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.image_not_supported,
                        size: 30, color: Colors.grey),
                    const SizedBox(height: 4),
                    Text(
                      'Old Image',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              );
            }

            return errorWidget ??
                Container(
                  height: height ?? 100,
                  width: width ?? 100,
                  color: Colors.grey[200],
                  child: const Icon(Icons.broken_image,
                      size: 30, color: Colors.grey),
                );
          },
        );
      },
    );
  }
}
