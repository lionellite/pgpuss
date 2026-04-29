import 'package:flutter/material.dart';

class BeninColors {
  static const Color green = Color(0xFF008751);
  static const Color yellow = Color(0xFFFCD116);
  static const Color red = Color(0xFFE8112D);
  static const Color lightBg = Color(0xFFF4F7F6);
  static const Color textDark = Color(0xFF1A1A1A);
}

class BeninTheme {
  static ThemeData get light => ThemeData(
    useMaterial3: true,
    primaryColor: BeninColors.green,
    colorScheme: ColorScheme.fromSeed(
      seedColor: BeninColors.green,
      primary: BeninColors.green,
      secondary: BeninColors.yellow,
      error: BeninColors.red,
    ),
    scaffoldBackgroundColor: Colors.white,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: BeninColors.textDark,
      elevation: 0,
      centerTitle: true,
    ),
  );
}
