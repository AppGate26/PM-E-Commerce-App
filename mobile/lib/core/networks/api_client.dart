import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';

class ApiClient {
  final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      followRedirects: true,
      validateStatus: (status) => status != null && status >= 200 && status < 300,
    ),
  );

  /// Global navigator key – must be passed to MaterialApp / GoRouter
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  /// Prevents multiple session-expired dialogs
  static bool _isHandlingSessionExpired = false;

  ApiClient() {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await StorageService.getToken();
          final fullUrl = options.uri.toString();

          print('🔵 [API Request] ${options.method} $fullUrl');

          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
            print('🔵 [Token] ✅ Present (${token.length} chars)');
          } else {
            print('🔵 [Token] ❌ Not found');
          }

          if (options.data != null) {
            print('🔵 [Request Data] ${options.data}');
          }

          return handler.next(options);
        },
        onResponse: (response, handler) {
          print(
              '🟢 [API Response] ${response.statusCode} ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (error, handler) async {
          final fullUrl = error.requestOptions.uri.toString();
          print('🔴 [API Error] ${error.requestOptions.method} $fullUrl');
          print('🔴 [Error Type] ${error.type}');
          print('🔴 [Error Message] ${error.message}');

          if (error.response != null) {
            final statusCode = error.response?.statusCode;
            print('🔴 [Error Status] $statusCode');
            print('🔴 [Error Response] ${error.response?.data}');

            // 401 = the backend couldn't authenticate the token at all (missing,
            // invalid, or expired) - that's a real session expiry.
            // 403 means the token is valid but the caller isn't allowed to do this
            // (e.g. a permissions/ownership check failed) - logging the user out for
            // that hides the real problem, so let it fall through to the normal
            // error handling instead (see ErrorHandler._handleDioError).
            if (statusCode == 401) {
              print('');
              print('═══════════════════════════════════════════════════');
              print('🔴 $statusCode – SESSION EXPIRED / INVALID TOKEN');
              print('═══════════════════════════════════════════════════');

              await _clearAuthAndRedirect();
              return handler.reject(error);
            }
          }

          return handler.next(error);
        },
      ),
    );
  }

  // ============================================================
  // SESSION EXPIRED – SAFE & PROFESSIONAL
  // ============================================================
  Future<void> _clearAuthAndRedirect() async {
    if (_isHandlingSessionExpired) {
      print('ℹ️ [Session] Already handling session expiry – skipping');
      return;
    }

    _isHandlingSessionExpired = true;

    try {
      // 1. Clear token + user data
      await StorageService.removeAllAuthData();
      _dio.options.headers.remove('Authorization');
      print('✅ [Session] Auth data cleared');

      // 2. Navigate after the current frame (avoids GoError)
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showSessionExpiredAndGoToLogin();
      });
    } catch (e) {
      print('🔴 [Session] Error during cleanup: $e');
      _isHandlingSessionExpired = false;
    }
  }

  void _showSessionExpiredAndGoToLogin() {
    final context = navigatorKey.currentContext;

    if (context == null || !context.mounted) {
      print('⚠️ [Session] No valid context – cannot show dialog');
      _isHandlingSessionExpired = false;
      return;
    }

    // Avoid showing dialog if we are already on login
    final currentLocation =
        GoRouter.of(context).routerDelegate.currentConfiguration.uri.toString();

    if (currentLocation.contains('login')) {
      print('ℹ️ [Session] Already on login screen');
      _isHandlingSessionExpired = false;
      return;
    }

    print('🔴 [Session] Showing session expired dialog...');

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
              SizedBox(width: 12),
              Text(
                'Session Expired',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 20),
              ),
            ],
          ),
          content: const Text(
            'Your session has expired. Please login again to continue.',
            style: TextStyle(fontSize: 15, height: 1.5),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(); // close dialog
                _goToLogin();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text(
                'Login Again',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
              ),
            ),
          ],
        );
      },
    ).then((_) {
      // safety reset
      _isHandlingSessionExpired = false;
    });
  }

  void _goToLogin() {
    final context = navigatorKey.currentContext;
    if (context == null || !context.mounted) {
      print('⚠️ [Session] No context for navigation');
      _isHandlingSessionExpired = false;
      return;
    }

    print('🔵 [Session] Navigating to Login...');
    GoRouter.of(context).go(AppRoutes.login);
    _isHandlingSessionExpired = false;
  }

  // ============================================================
  // PUBLIC HELPERS
  // ============================================================
  Dio get dio => _dio;

  Future<void> updateToken(String? token) async {
    print('🔄 [ApiClient] Updating token...');
    if (token != null && token.isNotEmpty) {
      await StorageService.saveToken(token);
      _dio.options.headers['Authorization'] = 'Bearer $token';
      print('🔄 [ApiClient] Token saved & set in headers');
    } else {
      await StorageService.removeToken();
      _dio.options.headers.remove('Authorization');
      print('🔄 [ApiClient] Token removed');
    }
  }
}