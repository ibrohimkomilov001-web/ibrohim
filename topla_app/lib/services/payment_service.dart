import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../core/services/api_client.dart';
import '../models/models.dart';

/// To'lov holatlari
enum PaymentState {
  idle,
  processing,
  awaitingConfirmation, // 3D Secure / OTP kutish
  completed,
  failed,
  cancelled,
}

/// To'lov natijasi
class PaymentResult {
  final bool success;
  final String? transactionId;
  final String? errorMessage;
  final String? redirectUrl; // 3D Secure uchun
  final Map<String, dynamic>? data;

  PaymentResult({
    required this.success,
    this.transactionId,
    this.errorMessage,
    this.redirectUrl,
    this.data,
  });

  factory PaymentResult.success({
    required String transactionId,
    Map<String, dynamic>? data,
  }) {
    return PaymentResult(
      success: true,
      transactionId: transactionId,
      data: data,
    );
  }

  factory PaymentResult.failure(String message) {
    return PaymentResult(
      success: false,
      errorMessage: message,
    );
  }

  factory PaymentResult.redirect(String url) {
    return PaymentResult(
      success: false,
      redirectUrl: url,
    );
  }
}

/// Karta binding (tokenizatsiya) natijasi
class CardBindingResult {
  final bool success;
  final String? bindingId;
  final String? redirectUrl;
  final String? errorMessage;

  CardBindingResult({
    required this.success,
    this.bindingId,
    this.redirectUrl,
    this.errorMessage,
  });
}

/// Asia Alliance Bank Payment Service
///
/// Bu servis Asia Alliance Bank "Alliance e-com" API bilan ishlaydi.
/// Hozircha API dokumentatsiyasi kutilmoqda, shuning uchun umumiy
/// arxitektura yaratilgan. Bank API tayyor bo'lgach, tegishli endpoint
/// va parametrlarni yangilash kerak bo'ladi.
class PaymentService {
  // ============================================================
  // CONFIGURATION - Bank bilan shartnomadan keyin yangilang
  // ============================================================

  /// API Base URL (sandbox/production)
  static const String _baseUrl = 'https://api.aab.uz/ecom/v1'; // O'zgartiring

  /// Merchant credentials (Bank beradi)
  static const String _merchantId = 'YOUR_MERCHANT_ID';
  static const String _terminalId = 'YOUR_TERMINAL_ID';
  // ignore: unused_field
  static const String _secretKey = 'YOUR_SECRET_KEY';

  /// Callback URLs
  static const String _successUrl = 'https://yourapp.com/payment/success';
  // ignore: unused_field
  static const String _failureUrl = 'https://yourapp.com/payment/failure';
  static const String _callbackUrl =
      'https://api.topla.uz/api/v1/payments/callback';

  // ============================================================
  // API CLIENT
  // ============================================================

  static final ApiClient _api = ApiClient();

  // ============================================================
  // CARD BINDING (TOKENIZATION) - Karta saqlash
  // ============================================================

  /// Yangi karta qo'shish uchun binding jarayonini boshlash
  ///
  /// Qaytarilgan URL ga foydalanuvchini yo'naltiring.
  /// U yerda karta ma'lumotlarini kiritadi va OTP tasdiqlaydi.
  /// Muvaffaqiyatli bo'lsa, callback URL ga token qaytadi.
  static Future<CardBindingResult> initCardBinding({
    required String userId,
    String? returnUrl,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/binding/init'),
        headers: _getHeaders(),
        body: jsonEncode({
          'merchant_id': _merchantId,
          'terminal_id': _terminalId,
          'client_id': userId,
          'return_url': returnUrl ?? _successUrl,
          'callback_url': _callbackUrl,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return CardBindingResult(
          success: true,
          redirectUrl: data['redirect_url'],
        );
      } else {
        return CardBindingResult(
          success: false,
          errorMessage: 'Karta qo\'shishda xatolik: ${response.statusCode}',
        );
      }
    } catch (e) {
      debugPrint('Card binding error: $e');
      return CardBindingResult(
        success: false,
        errorMessage: 'Tarmoq xatosi: $e',
      );
    }
  }

  /// Binding callback'dan kelgan tokenni saqlash
  static Future<SavedCardModel?> saveCardFromCallback({
    required String userId,
    required String bindingId,
    required String maskedPan,
    required String cardType,
    required String expiryDate,
  }) async {
    try {
      // API ga saqlash
      final response = await _api.post('/payments/cards', body: {
        'cardNumber': maskedPan,
        'token': bindingId,
        'provider': cardType.toLowerCase() == 'click' ? 'click' : 'payme',
        'expiryDate': expiryDate,
      });

      return SavedCardModel.fromJson(response.dataMap);
    } catch (e) {
      debugPrint('Save card error: $e');
      return null;
    }
  }

  /// Saqlangan kartani o'chirish
  static Future<bool> deleteCard(String cardId) async {
    try {
      await _api.delete('/payments/cards/$cardId');
      return true;
    } catch (e) {
      debugPrint('Delete card error: $e');
      return false;
    }
  }

  /// Kartani asosiy qilish
  static Future<bool> setDefaultCard(String userId, String cardId) async {
    try {
      // API orqali default kartani belgilash
      await _api.put('/payments/cards/$cardId/default', body: {});

      return true;
    } catch (e) {
      debugPrint('Set default card error: $e');
      return false;
    }
  }

  /// Foydalanuvchining saqlangan kartalarini olish
  static Future<List<SavedCardModel>> getSavedCards(String userId) async {
    try {
      final response = await _api.get('/payments/cards');

      return (response.dataList)
          .map((e) => SavedCardModel.fromJson(e))
          .toList();
    } catch (e) {
      debugPrint('Get saved cards error: $e');
      return [];
    }
  }

  // ============================================================
  // PAYMENT - To'lov
  // ============================================================

  /// Saqlangan karta bilan to'lov (ONE_STEP - bir bosqichli)
  ///
  /// Pul darhol yechiladi. Oddiy savdo uchun.
  static Future<PaymentResult> payWithSavedCard({
    required String orderId,
    required String bindingId,
    required int amountInTiyin, // 1 so'm = 100 tiyin
    String? description,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/payment/charge'),
        headers: _getHeaders(),
        body: jsonEncode({
          'merchant_id': _merchantId,
          'terminal_id': _terminalId,
          'order_id': orderId,
          'amount': amountInTiyin,
          'currency': 860, // UZS
          'binding_id': bindingId,
          'description': description ?? 'TOPLA buyurtma #$orderId',
          'callback_url': _callbackUrl,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['status'] == 'success') {
          // To'lov muvaffaqiyatli
          await _recordTransaction(
            orderId: orderId,
            transactionId: data['transaction_id'],
            amount: amountInTiyin,
            status: 'completed',
          );

          return PaymentResult.success(
            transactionId: data['transaction_id'],
            data: data,
          );
        } else if (data['status'] == 'pending' &&
            data['redirect_url'] != null) {
          // 3D Secure kerak
          return PaymentResult.redirect(data['redirect_url']);
        } else {
          return PaymentResult.failure(data['message'] ?? 'To\'lov rad etildi');
        }
      } else {
        return PaymentResult.failure('Server xatosi: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Payment error: $e');
      return PaymentResult.failure('Tarmoq xatosi: $e');
    }
  }

  /// Yangi karta bilan to'lov (karta saqlanmaydi)
  ///
  /// Foydalanuvchi redirect qilinadi, karta kiritadi va to'laydi.
  static Future<PaymentResult> payWithNewCard({
    required String orderId,
    required int amountInTiyin,
    String? description,
    String? returnUrl,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/payment/init'),
        headers: _getHeaders(),
        body: jsonEncode({
          'merchant_id': _merchantId,
          'terminal_id': _terminalId,
          'order_id': orderId,
          'amount': amountInTiyin,
          'currency': 860,
          'description': description ?? 'TOPLA buyurtma #$orderId',
          'return_url': returnUrl ?? _successUrl,
          'callback_url': _callbackUrl,
          'payment_type': 'ONE_STEP',
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['redirect_url'] != null) {
          // To'lov sahifasiga yo'naltirish
          await _recordTransaction(
            orderId: orderId,
            transactionId: data['payment_id'],
            amount: amountInTiyin,
            status: 'pending',
          );

          return PaymentResult.redirect(data['redirect_url']);
        } else {
          return PaymentResult.failure('Redirect URL olinmadi');
        }
      } else {
        return PaymentResult.failure('Server xatosi: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Payment init error: $e');
      return PaymentResult.failure('Tarmoq xatosi: $e');
    }
  }

  /// TWO_STEP to'lov - Hold (Marketplace uchun)
  ///
  /// Pul kartada "band" qilinadi, lekin yechilmaydi.
  /// Buyurtma yakunlanganda complete() chaqiriladi.
  static Future<PaymentResult> holdPayment({
    required String orderId,
    required String bindingId,
    required int amountInTiyin,
    String? description,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/payment/hold'),
        headers: _getHeaders(),
        body: jsonEncode({
          'merchant_id': _merchantId,
          'terminal_id': _terminalId,
          'order_id': orderId,
          'amount': amountInTiyin,
          'currency': 860,
          'binding_id': bindingId,
          'description': description ?? 'TOPLA buyurtma #$orderId',
          'payment_type': 'TWO_STEP',
          'callback_url': _callbackUrl,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['status'] == 'held') {
          await _recordTransaction(
            orderId: orderId,
            transactionId: data['transaction_id'],
            amount: amountInTiyin,
            status: 'held',
          );

          return PaymentResult.success(
            transactionId: data['transaction_id'],
            data: data,
          );
        } else if (data['redirect_url'] != null) {
          return PaymentResult.redirect(data['redirect_url']);
        } else {
          return PaymentResult.failure(data['message'] ?? 'Hold rad etildi');
        }
      } else {
        return PaymentResult.failure('Server xatosi: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Hold payment error: $e');
      return PaymentResult.failure('Tarmoq xatosi: $e');
    }
  }

  /// TWO_STEP to'lov - Complete (Pul yechish)
  ///
  /// Hold qilingan pulni yechish. Buyurtma yetkazilgandan keyin chaqiriladi.
  static Future<PaymentResult> completePayment({
    required String transactionId,
    int? amountInTiyin, // Agar partial capture kerak bo'lsa
  }) async {
    try {
      final body = {
        'merchant_id': _merchantId,
        'terminal_id': _terminalId,
        'transaction_id': transactionId,
      };

      if (amountInTiyin != null) {
        body['amount'] = amountInTiyin.toString();
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/payment/complete'),
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['status'] == 'completed') {
          await _updateTransactionStatus(transactionId, 'completed');

          return PaymentResult.success(
            transactionId: transactionId,
            data: data,
          );
        } else {
          return PaymentResult.failure(
              data['message'] ?? 'Complete rad etildi');
        }
      } else {
        return PaymentResult.failure('Server xatosi: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Complete payment error: $e');
      return PaymentResult.failure('Tarmoq xatosi: $e');
    }
  }

  /// TWO_STEP to'lov - Reverse (Bekor qilish)
  ///
  /// Hold qilingan pulni qaytarish. Buyurtma bekor qilinganda.
  static Future<PaymentResult> reversePayment({
    required String transactionId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/payment/reverse'),
        headers: _getHeaders(),
        body: jsonEncode({
          'merchant_id': _merchantId,
          'terminal_id': _terminalId,
          'transaction_id': transactionId,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['status'] == 'reversed') {
          await _updateTransactionStatus(transactionId, 'reversed');

          return PaymentResult.success(
            transactionId: transactionId,
            data: data,
          );
        } else {
          return PaymentResult.failure(data['message'] ?? 'Reverse rad etildi');
        }
      } else {
        return PaymentResult.failure('Server xatosi: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Reverse payment error: $e');
      return PaymentResult.failure('Tarmoq xatosi: $e');
    }
  }

  /// Refund - To'lovni qaytarish
  ///
  /// Completed to'lovni qaytarish. Faqat admin bajarishi mumkin.
  static Future<PaymentResult> refundPayment({
    required String transactionId,
    int? amountInTiyin, // Partial refund uchun
  }) async {
    try {
      final body = {
        'merchant_id': _merchantId,
        'terminal_id': _terminalId,
        'transaction_id': transactionId,
      };

      if (amountInTiyin != null) {
        body['amount'] = amountInTiyin.toString();
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/payment/refund'),
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['status'] == 'refunded') {
          await _updateTransactionStatus(transactionId, 'refunded');

          return PaymentResult.success(
            transactionId: transactionId,
            data: data,
          );
        } else {
          return PaymentResult.failure(data['message'] ?? 'Refund rad etildi');
        }
      } else {
        return PaymentResult.failure('Server xatosi: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Refund payment error: $e');
      return PaymentResult.failure('Tarmoq xatosi: $e');
    }
  }

  // ============================================================
  // VENDOR PAYOUT - Vendorga pul o'tkazish (A2C)
  // ============================================================

  /// Vendor balansidan kartaga pul o'tkazish
  static Future<PaymentResult> payoutToCard({
    required String payoutId,
    required String cardNumber,
    required int amountInTiyin,
    String? description,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/payout/card'),
        headers: _getHeaders(),
        body: jsonEncode({
          'merchant_id': _merchantId,
          'terminal_id': _terminalId,
          'payout_id': payoutId,
          'card_number': cardNumber,
          'amount': amountInTiyin,
          'currency': 860,
          'description': description ?? 'TOPLA payout #$payoutId',
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['status'] == 'success') {
          return PaymentResult.success(
            transactionId: data['transaction_id'],
            data: data,
          );
        } else {
          return PaymentResult.failure(data['message'] ?? 'Payout rad etildi');
        }
      } else {
        return PaymentResult.failure('Server xatosi: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Payout error: $e');
      return PaymentResult.failure('Tarmoq xatosi: $e');
    }
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /// API uchun headerlar
  static Map<String, String> _getHeaders() {
    // Signature yaratish (HMAC yoki boshqa algoritm - bank spesifikatsiyasiga qarab)
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();

    return {
      'Content-Type': 'application/json',
      'X-Merchant-Id': _merchantId,
      'X-Terminal-Id': _terminalId,
      'X-Timestamp': timestamp,
      'X-Signature': _generateSignature(timestamp),
    };
  }

  /// Signature yaratish
  static String _generateSignature(String timestamp) {
    // TODO: Bank spesifikatsiyasiga qarab implement qilish
    // Odatda: HMAC-SHA256(merchantId + timestamp + secretKey)
    return 'signature_placeholder';
  }

  /// Tranzaksiyani bazaga yozish
  static Future<void> _recordTransaction({
    required String orderId,
    required String transactionId,
    required int amount,
    required String status,
  }) async {
    try {
      await _api.post('/payments/transactions', body: {
        'orderId': orderId,
        'transactionId': transactionId,
        'amount': amount,
        'currency': 'UZS',
        'status': status,
        'provider': 'asia_alliance',
      });
    } catch (e) {
      debugPrint('Record transaction error: $e');
    }
  }

  /// Tranzaksiya statusini yangilash
  static Future<void> _updateTransactionStatus(
    String transactionId,
    String status,
  ) async {
    try {
      await _api.put('/payments/transactions/$transactionId', body: {
        'status': status,
      });
    } catch (e) {
      debugPrint('Update transaction status error: $e');
    }
  }

  /// Tranzaksiya holatini tekshirish
  static Future<String?> checkTransactionStatus(String transactionId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/payment/status?transaction_id=$transactionId'),
        headers: _getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['status'];
      }
      return null;
    } catch (e) {
      debugPrint('Check transaction status error: $e');
      return null;
    }
  }

  // ============================================================
  // COMMISSION CALCULATION - Komissiya hisoblash
  // ============================================================

  /// Buyurtma uchun komissiyalarni hisoblash
  static PaymentCommission calculateCommission({
    required double orderTotal,
    required double
        vendorCommissionRate, // Vendor komissiya foizi (masalan, 10.0)
    required String cardType,
  }) {
    // Bank komissiyasi (karta turiga qarab)
    double bankRate;
    switch (cardType.toLowerCase()) {
      case 'uzcard':
      case 'humo':
        bankRate = 0.2; // 0.2%
        break;
      case 'visa':
      case 'mastercard':
        bankRate = 2.0; // 2%
        break;
      default:
        bankRate = 1.0; // 1% default
    }

    final bankCommission = orderTotal * bankRate / 100;
    final platformCommission = orderTotal * vendorCommissionRate / 100;
    final vendorAmount = orderTotal - bankCommission - platformCommission;

    return PaymentCommission(
      orderTotal: orderTotal,
      bankCommission: bankCommission,
      bankRate: bankRate,
      platformCommission: platformCommission,
      platformRate: vendorCommissionRate,
      vendorAmount: vendorAmount,
    );
  }
}

/// Komissiya hisoblash natijasi
class PaymentCommission {
  final double orderTotal;
  final double bankCommission;
  final double bankRate;
  final double platformCommission;
  final double platformRate;
  final double vendorAmount;

  PaymentCommission({
    required this.orderTotal,
    required this.bankCommission,
    required this.bankRate,
    required this.platformCommission,
    required this.platformRate,
    required this.vendorAmount,
  });

  @override
  String toString() {
    return '''
    Buyurtma: $orderTotal so'm
    Bank komissiyasi ($bankRate%): $bankCommission so'm
    Platform komissiyasi ($platformRate%): $platformCommission so'm
    Vendor oladi: $vendorAmount so'm
    ''';
  }
}
