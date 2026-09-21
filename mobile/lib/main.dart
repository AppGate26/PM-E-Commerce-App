import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/core/routes/app_router.dart';
import 'package:pm_e_commerce_app/core/services/delivery_auth_service.dart';
import 'package:pm_e_commerce_app/core/services/recovery_auth_service.dart';
import 'package:pm_e_commerce_app/core/services/delivery_api_verification_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_theme.dart';
import 'package:provider/provider.dart';
import 'package:pm_e_commerce_app/core/services/cart_service.dart';
import 'package:pm_e_commerce_app/presentation/history/controller/history_controller.dart';

class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) {
        print('⚠️ ACCEPTING SELF-SIGNED CERTIFICATE FOR: $host');
        return true;
      };  
  }
}

void main() {
  HttpOverrides.global = MyHttpOverrides();

  if (Platform.isAndroid) {
    print('✅ Running on Android device with SSL bypass enabled');
  }

  DeliveryApiVerificationService.verifyAllApisConnected();

  runApp(
    ProviderScope(
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (context) => CartService()),
          ChangeNotifierProvider(create: (context) => HistoryController()),
          ChangeNotifierProvider(create: (context) => DeliveryAuthService()),
          ChangeNotifierProvider(create: (context) => RecoveryAuthService()),
        ],
        child: const MyApp(),
      ),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // ✅ Set the navigatorKey on the router before using it
    // Option 1: If you can set it directly on AppRouter.router
    // AppRouter.router.navigatorKey = ApiClient.navigatorKey;
    
    // Option 2: Use MaterialApp.router with a custom navigatorKey
    return MaterialApp.router(
      title: 'PM E-Commerce',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: AppRouter.router,
      // ✅ For MaterialApp.router, use the routeInformationParser and routerDelegate
      // Or set the navigatorKey inside your GoRouter configuration
    );
  }
}