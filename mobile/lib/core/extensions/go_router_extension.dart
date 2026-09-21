import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

extension GoRouterExtension on BuildContext {
  T getArgs<T>() {
    final extra = GoRouterState.of(this).extra;
    if (extra == null) {
      throw Exception('No data passed to screen');
    }
    return extra as T;
  }
}