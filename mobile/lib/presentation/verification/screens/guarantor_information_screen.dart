import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class GuarantorInformationScreen extends StatefulWidget {
  const GuarantorInformationScreen({super.key});

  @override
  State<GuarantorInformationScreen> createState() =>
      _GuarantorInformationScreenState();
}

class _GuarantorInformationScreenState
    extends State<GuarantorInformationScreen> {
  final _guarantorNameController =
      TextEditingController(text: 'Mojeed Shukurat');
  final _guarantorAddressController =
      TextEditingController(text: '199, okokomaiko street, Agege, Lagos');
  final _phoneNumberController = TextEditingController(text: '08023441833');

  String? _selectedRelationship;
  bool _isExpanded = true;

  @override
  void dispose() {
    _guarantorNameController.dispose();
    _guarantorAddressController.dispose();
    _phoneNumberController.dispose();
    super.dispose();
  }

  void _saveGuarantorInfo() {
    if (_guarantorNameController.text.isEmpty ||
        _guarantorAddressController.text.isEmpty ||
        _phoneNumberController.text.isEmpty ||
        _selectedRelationship == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    // Handle save logic
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Guarantor information saved successfully'),
        backgroundColor: AppColors.blueBackground,
      ),
    );
    // Navigate back to verification centre or next screen
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.whiteBackground,
      body: SafeArea(
        child: Column(
          children: [
            // Header Section
            Container(
              height: 60,
              width: double.infinity,
              color: AppColors.blueBackground,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back,
                      color: AppColors.textLight,
                    ),
                    onPressed: () => context.pop(),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        'PERSONAL INFORMATION',
                        style: TextStyle(
                          color: AppColors.textLight,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 48), // Balance for back button
                ],
              ),
            ),

            // Guarantor Information Section Header
            Container(
              color: Colors.grey[200],
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  const Text(
                    'Guarantor Information',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF333333),
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _isExpanded = !_isExpanded;
                      });
                    },
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: AppColors.blueBackground,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.close,
                        color: AppColors.textLight,
                        size: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Content Section
            if (_isExpanded)
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTextField(
                        label: 'Guarantor Name',
                        controller: _guarantorNameController,
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        label: 'Guarantor\'s Home Address',
                        controller: _guarantorAddressController,
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        label: 'Phone Number',
                        controller: _phoneNumberController,
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 16),
                      _buildDropdownField(
                        label: 'Relationship',
                        value: _selectedRelationship,
                        items: [
                          'Select',
                          'Father',
                          'Mother',
                          'Sister',
                          'Brother',
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedRelationship = value;
                          });
                        },
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              )
            else
              const Expanded(
                child: SizedBox(),
              ),

            // Save Button
            if (_isExpanded)
              Container(
                padding: const EdgeInsets.all(16),
                alignment: Alignment.centerRight,
                child: ElevatedButton(
                  onPressed: _saveGuarantorInfo,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blueBackground,
                    foregroundColor: AppColors.textLight,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 14,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'SAVE',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(
            fontSize: 16,
            color: Colors.black87,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey[50],
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: Colors.grey[300]!,
                width: 1,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: Colors.grey[300]!,
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.blueBackground,
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey[50],
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: Colors.grey[300]!,
                width: 1,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: Colors.grey[300]!,
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.blueBackground,
                width: 2,
              ),
            ),
          ),
          hint: Text(
            'Select',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[400],
            ),
          ),
          items: items.map((String item) {
            return DropdownMenuItem<String>(
              value: item == 'Select' ? null : item,
              child: Text(
                item,
                style: const TextStyle(
                  fontSize: 16,
                  color: Colors.black87,
                ),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
