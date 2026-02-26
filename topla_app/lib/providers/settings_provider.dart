import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Ilova sozlamalari uchun Provider
class SettingsProvider extends ChangeNotifier {
  static const String _languageKey = 'language';

  String _language = 'uz';
  bool _isLoading = true;

  String get language => _language;
  bool get isLoading => _isLoading;

  /// Joriy locale
  Locale get locale => Locale(_language);

  SettingsProvider() {
    _loadSettings();
  }

  /// Sozlamalarni yuklash
  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // Language
      _language = prefs.getString(_languageKey) ?? 'uz';
    } catch (e) {
      debugPrint('Settings yuklashda xatolik: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Tilni o'zgartirish
  Future<void> setLanguage(String lang) async {
    _language = lang;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_languageKey, lang);
    } catch (e) {
      debugPrint('Til saqlashda xatolik: $e');
    }
  }
}
