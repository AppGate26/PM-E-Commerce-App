import 'package:flutter/material.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      scaffoldBackgroundColor: AppColors.lightBackground,
      primaryColor: AppColors.blueBackground,
      fontFamily: 'Montserrat',
    );
  }
}

// import 'package:flutter/material.dart';
// import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
// import 'package:pm_e_commerce_app/core/theme/app_text_style.dart';

// class AppTheme {
//   static ThemeData get lightTheme {
//     return ThemeData(
//       scaffoldBackgroundColor: AppColors.lightBackground,
//       primaryColor: AppColors.blueBackground,

//       fontFamily: 'Inter', // my body text font

//       textTheme: const TextTheme(
//         displayLarge: AppTextStyles.heading1, // Playfair Display
//         displayMedium: AppTextStyles.heading2, // Playfair Display
//         displaySmall: AppTextStyles.heading3, // Playfair Display
//         headlineMedium: AppTextStyles.heading3, // Playfair Display
//         titleLarge: AppTextStyles.heading3, // Playfair Display
//         bodyLarge: AppTextStyles.bodyLarge, // Inter
//         bodyMedium: AppTextStyles.bodyMedium, // Inter
//         bodySmall: AppTextStyles.bodySmall, // Inter
//       ),
//     );
//   }
// }
