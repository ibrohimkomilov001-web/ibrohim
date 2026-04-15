import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import '../core/services/api_client.dart' as api;

/// API Error types
enum ApiErrorType {
  network,
  server,
  auth,
  validation,
  notFound,
  rateLimit,
  timeout,
  unknown,
}

/// API Exception class
class ApiException implements Exception {
  final String message;
  final ApiErrorType type;
  final int? statusCode;
  final dynamic originalError;

  ApiException({
    required this.message,
    required this.type,
    this.statusCode,
    this.originalError,
  });

  @override
  String toString() => 'ApiException: $message (type: $type)';

  /// Get user-friendly message in Uzbek
  String get userMessage {
    switch (type) {
      case ApiErrorType.network:
        return 'Internet aloqasi yo\'q. Iltimos, tarmoqni tekshiring.';
      case ApiErrorType.server:
        return 'Server bilan muammo. Keyinroq urinib ko\'ring.';
      case ApiErrorType.auth:
        return 'Avtorizatsiya xatosi. Qaytadan kiring.';
      case ApiErrorType.validation:
        return message;
      case ApiErrorType.notFound:
        return 'Ma\'lumot topilmadi.';
      case ApiErrorType.rateLimit:
        return 'Juda ko\'p so\'rov. Biroz kuting.';
      case ApiErrorType.timeout:
        return 'So\'rov vaqti tugadi. Qayta urinib ko\'ring.';
      case ApiErrorType.unknown:
        return 'Noma\'lum xatolik yuz berdi.';
    }
  }

  /// Get icon for error type
  IconData get icon {
    switch (type) {
      case ApiErrorType.network:
        return Icons.wifi_off;
      case ApiErrorType.server:
        return Icons.cloud_off;
      case ApiErrorType.auth:
        return Icons.lock_outline;
      case ApiErrorType.validation:
        return Icons.warning_amber;
      case ApiErrorType.notFound:
        return Icons.search_off;
      case ApiErrorType.rateLimit:
        return Icons.speed;
      case ApiErrorType.timeout:
        return Icons.timer_off;
      case ApiErrorType.unknown:
        return Icons.error_outline;
    }
  }
}

/// API Error Handler
class ApiErrorHandler {
  /// Parse and convert exceptions to ApiException
  static ApiException handle(dynamic error) {
    // Network errors
    if (error is SocketException) {
      return ApiException(
        message: 'No internet connection',
        type: ApiErrorType.network,
        originalError: error,
      );
    }

    // Timeout errors
    if (error is TimeoutException) {
      return ApiException(
        message: 'Request timeout',
        type: ApiErrorType.timeout,
        originalError: error,
      );
    }

    // API client ApiException
    if (error is api.ApiException) {
      return _handleApiClientException(error);
    }

    // Already ApiException (local)
    if (error is ApiException) {
      return error;
    }

    // Unknown error
    return ApiException(
      message: error.toString(),
      type: ApiErrorType.unknown,
      originalError: error,
    );
  }

  static ApiException _handleApiClientException(api.ApiException error) {
    // Map status codes to error types
    if (error.statusCode == 401 || error.statusCode == 403) {
      return ApiException(
        message: error.message,
        type: ApiErrorType.auth,
        statusCode: error.statusCode,
        originalError: error,
      );
    }
    if (error.statusCode == 404) {
      return ApiException(
        message: 'Ma\'lumot topilmadi',
        type: ApiErrorType.notFound,
        statusCode: error.statusCode,
        originalError: error,
      );
    }
    if (error.statusCode == 422 || error.statusCode == 400) {
      return ApiException(
        message: error.message,
        type: ApiErrorType.validation,
        statusCode: error.statusCode,
        originalError: error,
      );
    }
    if (error.statusCode == 429) {
      return ApiException(
        message: 'Juda ko\'p so\'rov',
        type: ApiErrorType.rateLimit,
        statusCode: error.statusCode,
        originalError: error,
      );
    }
    return ApiException(
      message: error.message,
      type: ApiErrorType.server,
      statusCode: error.statusCode,
      originalError: error,
    );
  }

  /// Execute API call with error handling
  static Future<T> execute<T>(Future<T> Function() apiCall) async {
    try {
      return await apiCall();
    } catch (e) {
      throw handle(e);
    }
  }

  /// Execute with retry
  static Future<T> executeWithRetry<T>(
    Future<T> Function() apiCall, {
    int maxRetries = 3,
    Duration delay = const Duration(seconds: 1),
  }) async {
    int attempts = 0;

    while (true) {
      try {
        return await apiCall();
      } catch (e) {
        attempts++;
        final error = handle(e);

        // Don't retry auth or validation errors
        if (error.type == ApiErrorType.auth ||
            error.type == ApiErrorType.validation ||
            error.type == ApiErrorType.notFound) {
          throw error;
        }

        if (attempts >= maxRetries) {
          throw error;
        }

        // Exponential backoff
        await Future.delayed(delay * attempts);
      }
    }
  }

  /// Show error snackbar — faqat terminalda ko'rsatish
  static void showErrorSnackbar(BuildContext context, dynamic error) {
    final apiError = error is ApiException ? error : handle(error);
    debugPrint('API Error: ${apiError.userMessage}');
  }

  /// Show error dialog — faqat terminalda ko'rsatish
  static Future<void> showErrorDialog(
    BuildContext context,
    dynamic error, {
    VoidCallback? onRetry,
  }) async {
    final apiError = error is ApiException ? error : handle(error);
    debugPrint('API Error Dialog: ${apiError.userMessage}');
    if (onRetry != null) {
      onRetry();
    }
  }
}

/// Result wrapper for API calls
class ApiResult<T> {
  final T? data;
  final ApiException? error;
  final bool isSuccess;

  ApiResult._({this.data, this.error, required this.isSuccess});

  factory ApiResult.success(T data) => ApiResult._(data: data, isSuccess: true);

  factory ApiResult.failure(ApiException error) =>
      ApiResult._(error: error, isSuccess: false);

  /// Execute and return result
  static Future<ApiResult<T>> from<T>(Future<T> Function() apiCall) async {
    try {
      final data = await apiCall();
      return ApiResult.success(data);
    } catch (e) {
      return ApiResult.failure(ApiErrorHandler.handle(e));
    }
  }

  /// Map success value
  ApiResult<R> map<R>(R Function(T data) mapper) {
    final currentData = data;
    if (isSuccess && currentData != null) {
      return ApiResult.success(mapper(currentData));
    }
    return ApiResult.failure(error!);
  }

  /// Get data or throw
  T getOrThrow() {
    if (isSuccess && data != null) {
      return data as T;
    }
    throw error!;
  }

  /// Get data or default
  T getOrDefault(T defaultValue) {
    if (isSuccess && data != null) {
      return data as T;
    }
    return defaultValue;
  }
}
