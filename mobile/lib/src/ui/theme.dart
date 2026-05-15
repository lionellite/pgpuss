import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Couleurs officielles — Charte graphique du Gouvernement du Bénin
class AppColors {
  // Drapeau béninois
  static const primary = Color(0xFF008751);       // Vert
  static const primaryLight = Color(0xFF00A86B);
  static const primaryDark = Color(0xFF005F3A);
  static const secondary = Color(0xFFFCD116);     // Jaune
  static const danger = Color(0xFFE8112D);        // Rouge

  // Surfaces (design gouvernemental sobre)
  static const surface = Color(0xFFF7F8FA);
  static const cardBg = Colors.white;
  static const divider = Color(0xFFE8ECF0);

  // Texte
  static const textPrimary = Color(0xFF1A1D21);
  static const textSecondary = Color(0xFF5A6270);
  static const textMuted = Color(0xFF8E95A2);

  // Priorités
  static const priorityP1 = Color(0xFFDC2626);
  static const priorityP2 = Color(0xFFEA580C);
  static const priorityP3 = Color(0xFFF59E0B);
  static const priorityP4 = Color(0xFF3B82F6);
  static const priorityP5 = Color(0xFF6B7280);

  static Color statusColor(String status) {
    return switch (status) {
      'SOUMISE' => const Color(0xFF3B82F6),
      'ACCUSEE' => const Color(0xFF6366F1),
      'INSTRUITE' => const Color(0xFF8B5CF6),
      'AFFECTEE' => const Color(0xFF0EA5E9),
      'EN_TRAITEMENT' => const Color(0xFFF59E0B),
      'RESOLUE' => primary,
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

/// Thème Material 3 conforme aux normes gouvernementales béninoises :
/// - Police unique et cohérente (Inter)
/// - Design Material / Flat, sobre, non agressif
/// - Blocks bien aérés, confort de lecture
/// - Pas d'animations excessives
/// - Pied de page sobre
class AppTheme {
  static final _textTheme = GoogleFonts.interTextTheme();

  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      error: AppColors.danger,
      surface: AppColors.surface,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: _textTheme.apply(
        bodyColor: AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ),
      scaffoldBackgroundColor: AppColors.surface,
      dividerColor: AppColors.divider,

      // AppBar — sobre, plat, sans ombre
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        titleTextStyle: _textTheme.titleLarge?.copyWith(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
      ),

      // Cards — plates, bien aérées, coins doux
      cardTheme: CardThemeData(
        color: AppColors.cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.divider, width: 1),
        ),
        margin: const EdgeInsets.only(bottom: 12),
      ),

      // NavigationBar — sobre, fond blanc
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        elevation: 0,
        indicatorColor: AppColors.primary.withValues(alpha: 0.1),
        labelTextStyle: WidgetStatePropertyAll(
          _textTheme.labelSmall?.copyWith(
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Inputs — propres, bordure légère
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
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        labelStyle: const TextStyle(
          fontSize: 14,
          color: AppColors.textSecondary,
        ),
        hintStyle: const TextStyle(
          fontSize: 14,
          color: AppColors.textMuted,
        ),
      ),

      // Boutons — coins doux, pas d'ombre
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: _textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          side: const BorderSide(color: AppColors.divider),
          textStyle: _textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: 1,
        space: 1,
      ),

      // Snackbar — non agressif
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        elevation: 2,
      ),

      // Bottom sheet — coins doux
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
      ),
    );
  }
}
