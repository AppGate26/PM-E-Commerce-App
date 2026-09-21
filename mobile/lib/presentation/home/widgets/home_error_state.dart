// presentation/home/widgets/home_error_state.dart

import 'package:flutter/material.dart';

class HomeErrorState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const HomeErrorState({
    super.key,
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 140,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 40, color: Colors.grey[400]),
            const SizedBox(height: 8),
            Text(
              'Failed to load products',
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}