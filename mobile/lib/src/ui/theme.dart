import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Couleurs — Design system Stitch « Sovereign Health Governance »
class AppColors {
  static const primary = Color(0xFF004C4C);
  static const primaryContainer = Color(0xFF006666);
  static const primaryLight = Color(0xFF86D4D3);
  static const primaryDark = Color(0xFF003838);
  static const secondary = Color(0xFF006E1C);
  static const danger = Color(0xFFD32F2F);
  static const emergency = Color(0xFFD32F2F);
  static const warning = Color(0xFFF57C00);
  static const successSurface = Color(0xFFE5EEFF);

  static const surface = Color(0xFFF8FAFC);
  static const surfaceGray = Color(0xFFF8FAFC);
  static const surfaceContainer = Color(0xFFE5EEFF);
  static const cardBg = Colors.white;
  static const divider = Color(0xFFE2E8F0);

  static const textPrimary = Color(0xFF0B1C30);
  static const textSecondary = Color(0xFF3F4948);
  static const textMuted = Color(0xFF6F7979);

  static const priorityP1 = Color(0xFFD32F2F);
  static const priorityP2 = Color(0xFFF57C00);
  static const priorityP3 = Color(0xFFFBC02D);
  static const priorityP4 = Color(0xFF1976D2);
  static const priorityP5 = Color(0xFF78909C);

  static Color statusColor(String status) {
    return switch (status) {
      'SOUMISE' => const Color(0xFF3B82F6),
      'ACCUSEE' => const Color(0xFF6366F1),
      'INSTRUITE' => const Color(0xFF8B5CF6),
      'AFFECTEE' => const Color(0xFF0EA5E9),
      'EN_TRAITEMENT' => const Color(0xFFF59E0B),
      'RESOLUE' => secondary,
      'ARBITREE' => const Color(0xFF14B8A6),
      'CLOTUREE' => const Color(0xFF6B7280),
      'ESCALADEE' => const Color(0xFFEA580C),
      'REJETEE' => danger,
      _ => const Color(0xFF6B7280),
    };
  }

  static Color priorityColor(String priority) {
    return switch (priority) {
      'P1' => priorityP1,
      'P2' => priorityP2,
      'P3' => priorityP3,
      'P4' => priorityP4,
      'P5' => priorityP5,
      _ => const Color(0xFF6B7280),
    };
  }
}

class AppTheme {
  static final _displayFont = GoogleFonts.atkinsonHyperlegibleTextTheme();
  static final _bodyFont = GoogleFonts.interTextTheme();

  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      error: AppColors.danger,
      surface: AppColors.surfaceGray,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: _bodyFont.apply(
        bodyColor: AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ).copyWith(
        headlineSmall: _displayFont.headlineSmall?.copyWith(
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
        titleLarge: _displayFont.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      ),
      scaffoldBackgroundColor: AppColors.surfaceGray,
      dividerColor: AppColors.divider,
      focusColor: AppColors.primary.withValues(alpha: 0.12),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        titleTextStyle: _displayFont.titleLarge?.copyWith(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.divider, width: 1),
        ),
        margin: const EdgeInsets.only(bottom: 12),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        elevation: 0,
        indicatorColor: AppColors.primary.withValues(alpha: 0.1),
        labelTextStyle: WidgetStatePropertyAll(
          _bodyFont.labelSmall?.copyWith(
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primaryContainer, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        labelStyle: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
        hintStyle: const TextStyle(fontSize: 14, color: AppColors.textMuted),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: _bodyFont.labelLarge?.copyWith(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          side: const BorderSide(color: AppColors.divider),
          textStyle: _bodyFont.labelLarge?.copyWith(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.divider, thickness: 1, space: 1),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        elevation: 2,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primaryContainer,
        foregroundColor: Colors.white,
        elevation: 2,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.cardBg,
        selectedColor: AppColors.primary.withValues(alpha: 0.12),
        checkmarkColor: AppColors.primary,
        labelStyle: _bodyFont.labelMedium?.copyWith(fontWeight: FontWeight.w600),
        side: const BorderSide(color: AppColors.divider),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
