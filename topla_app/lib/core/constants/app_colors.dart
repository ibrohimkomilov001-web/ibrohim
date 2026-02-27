import 'package:flutter/material.dart';

/// TOPLA App ranglari - Temu/Yandex Market uslubida
/// Sotuvni oshiruvchi ranglar
class AppColors {
  AppColors._();

  // === ASOSIY RANGLAR ===
  /// Asosiy ko'k - professional, ishonchli
  static const Color primary = Color(0xFF3B82F6);
  static const Color primaryDark = Color(0xFF2563EB);
  static const Color primaryLight = Color(0xFF60A5FA);

  // === AKSENT RANGLAR ===
  /// To'q sariq - chegirmalar
  static const Color accent = Color(0xFFFF6B35);
  static const Color accentDark = Color(0xFFE55A2B);
  static const Color accentLight = Color(0xFFFF8F6B);

  // === HIGHLIGHT RANGLAR ===
  /// Sariq - maxsus takliflar
  static const Color highlight = Color(0xFFFFD93D);
  static const Color highlightDark = Color(0xFFE5C235);
  static const Color highlightLight = Color(0xFFFFE566);

  // === SUCCESS RANGLAR ===
  /// Yashil - muvaffaqiyat, tasdiqlash
  static const Color success = Color(0xFF00C851);
  static const Color successDark = Color(0xFF00A843);
  static const Color successLight = Color(0xFF33D671);

  // === WARNING RANGLAR ===
  static const Color warning = Color(0xFFFFA000);
  static const Color warningDark = Color(0xFFFF8F00);
  static const Color warningLight = Color(0xFFFFB300);

  // === ERROR RANGLAR ===
  static const Color error = Color(0xFFFF5252);
  static const Color errorDark = Color(0xFFD32F2F);
  static const Color errorLight = Color(0xFFFF8A80);

  // === NEUTRAL RANGLAR (Light Mode) ===
  static const Color backgroundLight = Color(0xFFFAFAFA);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color dividerLight = Color(0xFFEEEEEE);

  // === TEXT RANGLAR (Light Mode) ===
  static const Color textPrimaryLight = Color(0xFF1A1A2E);
  static const Color textSecondaryLight = Color(0xFF666666);
  static const Color textTertiaryLight = Color(0xFF999999);
  static const Color textHintLight = Color(0xFFBDBDBD);

  // === NEUTRAL RANGLAR (Dark Mode) ===
  static const Color backgroundDark = Color(0xFF121212);
  static const Color surfaceDark = Color(0xFF1E1E1E);
  static const Color cardDark = Color(0xFF2C2C2C);
  static const Color dividerDark = Color(0xFF3D3D3D);

  // === TEXT RANGLAR (Dark Mode) ===
  static const Color textPrimaryDark = Color(0xFFFAFAFA);
  static const Color textSecondaryDark = Color(0xFFB3B3B3);
  static const Color textTertiaryDark = Color(0xFF808080);
  static const Color textHintDark = Color(0xFF5C5C5C);

  // === MAXSUS RANGLAR ===
  /// Cashback badge
  static const Color cashback = Color(0xFF9C27B0);

  /// Sale badge
  static const Color sale = Color(0xFFFF1744);

  /// New badge
  static const Color newBadge = Color(0xFF00BCD4);

  /// Hot badge
  static const Color hot = Color(0xFFFF5722);

  // === GRADIENT'LAR ===
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [accent, accentDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient saleGradient = LinearGradient(
    colors: [Color(0xFFFF4444), Color(0xFFFF6B35)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cashbackGradient = LinearGradient(
    colors: [Color(0xFF9C27B0), Color(0xFFE91E63)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // === SHIMMER RANGLAR ===
  static const Color shimmerBase = Color(0xFFE0E0E0);
  static const Color shimmerHighlight = Color(0xFFF5F5F5);
  static const Color shimmerBaseDark = Color(0xFF3D3D3D);
  static const Color shimmerHighlightDark = Color(0xFF4D4D4D);

  // === OVERLAY RANGLAR ===
  static const Color overlayLight = Color(0x0A000000);
  static const Color overlayMedium = Color(0x1A000000);
  static const Color overlayDark = Color(0x4D000000);
}
