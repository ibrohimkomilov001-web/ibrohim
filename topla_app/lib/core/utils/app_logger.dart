import 'package:flutter/foundation.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

/// Log darajalari
enum LogLevel { debug, info, warning, error }

/// Markazlashtirilgan logger utility
///
/// Production'da faqat error va warning ko'rsatiladi
/// Debug mode'da barcha loglar ko'rsatiladi
class AppLogger {
  AppLogger._();

  static LogLevel _minLevel = kDebugMode ? LogLevel.debug : LogLevel.warning;

  /// Minimal log darajasini sozlash
  static void setMinLevel(LogLevel level) {
    _minLevel = level;
  }

  /// Debug log
  static void d(String tag, String message, [Object? error]) {
    _log(LogLevel.debug, tag, message, error);
  }

  /// Info log
  static void i(String tag, String message, [Object? error]) {
    _log(LogLevel.info, tag, message, error);
  }

  /// Warning log
  static void w(String tag, String message, [Object? error]) {
    _log(LogLevel.warning, tag, message, error);
  }

  /// Error log
  static void e(String tag, String message,
      [Object? error, StackTrace? stackTrace]) {
    _log(LogLevel.error, tag, message, error, stackTrace);
  }

  static void _log(
    LogLevel level,
    String tag,
    String message, [
    Object? error,
    StackTrace? stackTrace,
  ]) {
    if (level.index < _minLevel.index) return;

    final emoji = _getEmoji(level);
    final levelName = level.name.toUpperCase();
    final timestamp = DateTime.now().toIso8601String().substring(11, 23);

    final buffer = StringBuffer();
    buffer.write('$emoji [$timestamp] [$levelName] [$tag] $message');

    if (error != null) {
      buffer.write('\n  Error: $error');
    }

    if (stackTrace != null && level == LogLevel.error) {
      buffer.write('\n  StackTrace: $stackTrace');
    }

    // Production'da console.log ishlatmaslik
    if (kDebugMode || level == LogLevel.error) {
      debugPrint(buffer.toString());
    }

    // Production'da crash reporting - Firebase Crashlytics
    if (level == LogLevel.error && !kDebugMode) {
      FirebaseCrashlytics.instance.recordError(
        error ?? message,
        stackTrace,
        reason: '[$tag] $message',
      );
    }
  }

  static String _getEmoji(LogLevel level) {
    switch (level) {
      case LogLevel.debug:
        return '🔍';
      case LogLevel.info:
        return 'ℹ️';
      case LogLevel.warning:
        return '⚠️';
      case LogLevel.error:
        return '❌';
    }
  }
}
