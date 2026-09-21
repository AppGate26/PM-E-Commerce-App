// presentation/home/widgets/price_filter_dialog.dart

import 'package:flutter/material.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class PriceFilterDialog extends StatefulWidget {
  final double? minPrice;
  final double? maxPrice;
  final Function(double?, double?) onApply;
  final VoidCallback onClear;

  const PriceFilterDialog({
    super.key,
    this.minPrice,
    this.maxPrice,
    required this.onApply,
    required this.onClear,
  });

  @override
  State<PriceFilterDialog> createState() => _PriceFilterDialogState();
}

class _PriceFilterDialogState extends State<PriceFilterDialog> {
  late TextEditingController _minController;
  late TextEditingController _maxController;

  @override
  void initState() {
    super.initState();
    _minController = TextEditingController(text: widget.minPrice?.toString() ?? '');
    _maxController = TextEditingController(text: widget.maxPrice?.toString() ?? '');
  }

  @override
  void dispose() {
    _minController.dispose();
    _maxController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Filter by Price'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _minController,
            decoration: const InputDecoration(
              labelText: 'Min Price (₦)',
              hintText: 'Enter minimum price',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _maxController,
            decoration: const InputDecoration(
              labelText: 'Max Price (₦)',
              hintText: 'Enter maximum price',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () {
            widget.onClear();
            Navigator.pop(context);
          },
          child: const Text('Clear'),
        ),
        ElevatedButton(
          onPressed: () {
            final min = _minController.text.isEmpty
                ? null
                : double.tryParse(_minController.text);
            final max = _maxController.text.isEmpty
                ? null
                : double.tryParse(_maxController.text);
            widget.onApply(min, max);
            Navigator.pop(context);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.blueBackground,
          ),
          child: const Text('Apply', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}