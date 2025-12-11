import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;

  static const EdgeInsets paddingXs = EdgeInsets.all(xs);
  static const EdgeInsets paddingSm = EdgeInsets.all(sm);
  static const EdgeInsets paddingMd = EdgeInsets.all(md);
  static const EdgeInsets paddingLg = EdgeInsets.all(lg);
  static const EdgeInsets paddingXl = EdgeInsets.all(xl);

  static const EdgeInsets horizontalXs = EdgeInsets.symmetric(horizontal: xs);
  static const EdgeInsets horizontalSm = EdgeInsets.symmetric(horizontal: sm);
  static const EdgeInsets horizontalMd = EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets horizontalLg = EdgeInsets.symmetric(horizontal: lg);
  static const EdgeInsets horizontalXl = EdgeInsets.symmetric(horizontal: xl);

  static const EdgeInsets verticalXs = EdgeInsets.symmetric(vertical: xs);
  static const EdgeInsets verticalSm = EdgeInsets.symmetric(vertical: sm);
  static const EdgeInsets verticalMd = EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets verticalLg = EdgeInsets.symmetric(vertical: lg);
  static const EdgeInsets verticalXl = EdgeInsets.symmetric(vertical: xl);
}

class AppRadius {
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
}

extension TextStyleContext on BuildContext {
  TextTheme get textStyles => Theme.of(this).textTheme;
}

extension TextStyleExtensions on TextStyle {
  TextStyle get bold => copyWith(fontWeight: FontWeight.bold);
  TextStyle get semiBold => copyWith(fontWeight: FontWeight.w600);
  TextStyle get medium => copyWith(fontWeight: FontWeight.w500);
  TextStyle get normal => copyWith(fontWeight: FontWeight.w400);
  TextStyle get light => copyWith(fontWeight: FontWeight.w300);
  TextStyle withColor(Color color) => copyWith(color: color);
  TextStyle withSize(double size) => copyWith(fontSize: size);
}

// =============================================================================
// TASKASSASSIN COLOR PALETTE - Based on Logo
// =============================================================================

class AppColors {
  // Background colors - Steel Blue inspired by logo background
  static const Color background = Color(0xFF1E3A5F);       // Deep steel blue
  static const Color surface = Color(0xFF254A73);          // Lighter steel blue
  static const Color surfaceVariant = Color(0xFF2C5580);   // Surface variant
  static const Color cardBg = Color(0xFF1A3250);           // Card background
  
  // Primary - Steel Blue from logo
  static const Color steelBlue = Color(0xFF4A7BAD);
  static const Color steelBlueBright = Color(0xFF5B8FC4);
  static const Color steelBlueDark = Color(0xFF3A6490);
  
  // Secondary - Dark Navy/Charcoal (assassin cloak)
  static const Color darkNavy = Color(0xFF1A2332);
  static const Color charcoal = Color(0xFF2D3748);
  static const Color slate = Color(0xFF3D4F5F);
  
  // Accent - Green (checkmarks from logo)
  static const Color checkGreen = Color(0xFF22C55E);
  static const Color checkGreenBright = Color(0xFF4ADE80);
  static const Color checkGreenDark = Color(0xFF16A34A);
  
  // Cream/White (hood and clipboard)
  static const Color cream = Color(0xFFF5F5F0);
  static const Color offWhite = Color(0xFFE8E8E3);
  
  // Orange accent for streaks/fire
  static const Color accentOrange = Color(0xFFF97316);
  static const Color accentOrangeBright = Color(0xFFFB923C);
  
  // Purple accent for levels
  static const Color accentPurple = Color(0xFF8B5CF6);
  static const Color accentPurpleBright = Color(0xFFA78BFA);
  
  // Text colors
  static const Color textPrimary = Color(0xFFFFFFFF);      // Pure white
  static const Color textSecondary = Color(0xFFE0E9F2);    // Very light steel
  static const Color textMuted = Color(0xFFB0C4D9);        // Brighter blue-gray
  
  // Border colors
  static const Color border = Color(0xFF3A5170);
  static const Color borderBright = Color(0xFF4A6A8A);
  
  // Error
  static const Color error = Color(0xFFF87171);
  static const Color errorDark = Color(0xFFEF4444);
  
  // Legacy aliases for backward compatibility with existing code
  static const Color neonTeal = steelBlue;
  static const Color neonTealBright = steelBlueBright;
  static const Color neonTealDark = steelBlueDark;
  static const Color neonGreen = checkGreen;
  static const Color neonGreenBright = checkGreenBright;
  static const Color neonOrange = accentOrange;
  static const Color neonOrangeBright = accentOrangeBright;
  static const Color neonPurple = accentPurple;
  static const Color neonPurpleBright = accentPurpleBright;
  static const Color neonMagenta = accentPurple;
  static const Color neonPink = accentPurpleBright;
  static const Color neonPinkDark = accentPurple;
}

// Keep CyberpunkColors as alias for backward compatibility
typedef CyberpunkColors = AppColors;

class FontSizes {
  static const double displayLarge = 57.0;
  static const double displayMedium = 45.0;
  static const double displaySmall = 36.0;
  static const double headlineLarge = 32.0;
  static const double headlineMedium = 28.0;
  static const double headlineSmall = 24.0;
  static const double titleLarge = 22.0;
  static const double titleMedium = 16.0;
  static const double titleSmall = 14.0;
  static const double labelLarge = 14.0;
  static const double labelMedium = 12.0;
  static const double labelSmall = 11.0;
  static const double bodyLarge = 16.0;
  static const double bodyMedium = 14.0;
  static const double bodySmall = 12.0;
}

// =============================================================================
// THEMES
// =============================================================================

ThemeData get lightTheme => darkTheme; // Force dark mode for cyberpunk aesthetic

ThemeData get darkTheme => ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  scaffoldBackgroundColor: CyberpunkColors.background,
  colorScheme: ColorScheme.dark(
    primary: CyberpunkColors.neonTeal,
    onPrimary: CyberpunkColors.background,
    primaryContainer: CyberpunkColors.neonTealDark,
    onPrimaryContainer: CyberpunkColors.neonTealBright,
    secondary: CyberpunkColors.neonPurple,
    onSecondary: Colors.white,
    secondaryContainer: CyberpunkColors.neonPurple.withValues(alpha: 0.2),
    onSecondaryContainer: CyberpunkColors.neonPurpleBright,
    tertiary: CyberpunkColors.neonGreen,
    onTertiary: CyberpunkColors.background,
    error: CyberpunkColors.error,
    onError: CyberpunkColors.background,
    errorContainer: CyberpunkColors.errorDark.withValues(alpha: 0.2),
    onErrorContainer: CyberpunkColors.error,
    surface: CyberpunkColors.surface,
    onSurface: CyberpunkColors.textPrimary,
    surfaceContainerHighest: CyberpunkColors.surfaceVariant,
    onSurfaceVariant: CyberpunkColors.textSecondary,
    outline: CyberpunkColors.border,
    shadow: Colors.black,
    inversePrimary: CyberpunkColors.neonTealBright,
  ),
  appBarTheme: AppBarTheme(
    backgroundColor: CyberpunkColors.background,
    foregroundColor: CyberpunkColors.textPrimary,
    elevation: 0,
    scrolledUnderElevation: 0,
    titleTextStyle: GoogleFonts.shareTechMono(
      fontSize: 20,
      fontWeight: FontWeight.bold,
      color: CyberpunkColors.textPrimary,
      letterSpacing: 1.5,
    ),
  ),
  cardTheme: CardThemeData(
    elevation: 0,
    color: CyberpunkColors.cardBg,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: BorderSide(
        color: CyberpunkColors.border,
        width: 1,
      ),
    ),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: CyberpunkColors.neonTeal,
      foregroundColor: CyberpunkColors.background,
      textStyle: GoogleFonts.shareTechMono(
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: CyberpunkColors.neonTeal,
      side: BorderSide(color: CyberpunkColors.neonTeal),
      textStyle: GoogleFonts.shareTechMono(
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: CyberpunkColors.neonTeal,
      textStyle: GoogleFonts.shareTechMono(
        fontWeight: FontWeight.bold,
        letterSpacing: 1.0,
      ),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: CyberpunkColors.surfaceVariant,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: CyberpunkColors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: CyberpunkColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: CyberpunkColors.neonTeal, width: 2),
    ),
    hintStyle: TextStyle(color: CyberpunkColors.textMuted),
    labelStyle: TextStyle(color: CyberpunkColors.textSecondary),
  ),
  chipTheme: ChipThemeData(
    backgroundColor: CyberpunkColors.surfaceVariant,
    selectedColor: CyberpunkColors.neonTeal.withValues(alpha: 0.2),
    labelStyle: GoogleFonts.shareTechMono(
      color: CyberpunkColors.textSecondary,
      letterSpacing: 1.0,
    ),
    side: BorderSide(color: CyberpunkColors.border),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
    ),
  ),
  dividerTheme: DividerThemeData(
    color: CyberpunkColors.border,
    thickness: 1,
  ),
  progressIndicatorTheme: ProgressIndicatorThemeData(
    color: CyberpunkColors.neonTeal,
    linearTrackColor: CyberpunkColors.border,
  ),
  snackBarTheme: SnackBarThemeData(
    backgroundColor: CyberpunkColors.cardBg,
    contentTextStyle: GoogleFonts.shareTechMono(
      color: CyberpunkColors.textPrimary,
    ),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
      side: BorderSide(color: CyberpunkColors.neonTeal),
    ),
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    backgroundColor: CyberpunkColors.surface,
    selectedItemColor: CyberpunkColors.neonGreen,
    unselectedItemColor: CyberpunkColors.textMuted,
    type: BottomNavigationBarType.fixed,
    selectedLabelStyle: GoogleFonts.shareTechMono(
      fontSize: 10,
      fontWeight: FontWeight.bold,
      letterSpacing: 1.0,
    ),
    unselectedLabelStyle: GoogleFonts.shareTechMono(
      fontSize: 10,
      letterSpacing: 1.0,
    ),
  ),
  textTheme: _buildTextTheme(),
);

TextTheme _buildTextTheme() => TextTheme(
  displayLarge: GoogleFonts.shareTechMono(
    fontSize: FontSizes.displayLarge,
    fontWeight: FontWeight.w400,
    letterSpacing: 2.0,
    color: CyberpunkColors.textPrimary,
  ),
  displayMedium: GoogleFonts.shareTechMono(
    fontSize: FontSizes.displayMedium,
    fontWeight: FontWeight.w400,
    letterSpacing: 1.5,
    color: CyberpunkColors.textPrimary,
  ),
  displaySmall: GoogleFonts.shareTechMono(
    fontSize: FontSizes.displaySmall,
    fontWeight: FontWeight.w400,
    letterSpacing: 1.5,
    color: CyberpunkColors.textPrimary,
  ),
  headlineLarge: GoogleFonts.shareTechMono(
    fontSize: FontSizes.headlineLarge,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.5,
    color: CyberpunkColors.textPrimary,
  ),
  headlineMedium: GoogleFonts.shareTechMono(
    fontSize: FontSizes.headlineMedium,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.2,
    color: CyberpunkColors.textPrimary,
  ),
  headlineSmall: GoogleFonts.shareTechMono(
    fontSize: FontSizes.headlineSmall,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.2,
    color: CyberpunkColors.textPrimary,
  ),
  titleLarge: GoogleFonts.shareTechMono(
    fontSize: FontSizes.titleLarge,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.2,
    color: CyberpunkColors.textPrimary,
  ),
  titleMedium: GoogleFonts.shareTechMono(
    fontSize: FontSizes.titleMedium,
    fontWeight: FontWeight.w500,
    letterSpacing: 1.0,
    color: CyberpunkColors.textPrimary,
  ),
  titleSmall: GoogleFonts.shareTechMono(
    fontSize: FontSizes.titleSmall,
    fontWeight: FontWeight.w500,
    letterSpacing: 1.0,
    color: CyberpunkColors.textPrimary,
  ),
  labelLarge: GoogleFonts.shareTechMono(
    fontSize: FontSizes.labelLarge,
    fontWeight: FontWeight.w500,
    letterSpacing: 1.5,
    color: CyberpunkColors.textPrimary,
  ),
  labelMedium: GoogleFonts.shareTechMono(
    fontSize: FontSizes.labelMedium,
    fontWeight: FontWeight.w500,
    letterSpacing: 1.5,
    color: CyberpunkColors.textSecondary,
  ),
  labelSmall: GoogleFonts.shareTechMono(
    fontSize: FontSizes.labelSmall,
    fontWeight: FontWeight.w500,
    letterSpacing: 1.5,
    color: CyberpunkColors.textSecondary,
  ),
  bodyLarge: GoogleFonts.inter(
    fontSize: FontSizes.bodyLarge,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.15,
    color: CyberpunkColors.textPrimary,
  ),
  bodyMedium: GoogleFonts.inter(
    fontSize: FontSizes.bodyMedium,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.25,
    color: CyberpunkColors.textPrimary,
  ),
  bodySmall: GoogleFonts.inter(
    fontSize: FontSizes.bodySmall,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.4,
    color: CyberpunkColors.textSecondary,
  ),
);
