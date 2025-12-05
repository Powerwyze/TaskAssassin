import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color background = Color(0xFF0F172A); // Slate 900
  static const Color surface = Color(0xFF1E293B); // Slate 800
  static const Color primary = Color(0xFF22C55E); // Green 500
  static const Color accent = Color(0xFF10B981); // Emerald 500
  static const Color danger = Color(0xFFEF4444); // Red 500
  static const Color warning = Color(0xFFEAB308); // Yellow 500
  static const Color textPrimary = Color(0xFFF1F5F9); // Slate 100
  static const Color textSecondary = Color(0xFF94A3B8); // Slate 400

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      cardColor: surface,
      textTheme: TextTheme(
        displayLarge: GoogleFonts.shareTechMono(color: textPrimary, fontSize: 32, fontWeight: FontWeight.bold),
        displayMedium: GoogleFonts.shareTechMono(color: textPrimary, fontSize: 24, fontWeight: FontWeight.bold),
        bodyLarge: GoogleFonts.inter(color: textPrimary, fontSize: 16),
        bodyMedium: GoogleFonts.inter(color: textSecondary, fontSize: 14),
        labelLarge: GoogleFonts.shareTechMono(color: textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
      ),
      colorScheme: ColorScheme.dark(
        primary: primary,
        secondary: accent,
        surface: surface,
        background: background,
        error: danger,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background/0.9,
        elevation: 0,
        centerTitle: false,
      ),
      useMaterial3: true,
    );
  }
}
