/// lib/core/theme.dart
import 'package:flutter/material.dart';

ThemeData buildTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorSchemeSeed: const Color(0xFF2B8A3E),
    brightness: Brightness.light,
  );
  return base.copyWith(
    inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
  );
}
