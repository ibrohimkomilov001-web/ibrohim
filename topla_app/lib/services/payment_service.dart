import 'package:flutter/foundation.dart';
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
  final Map<String, dynamic>? cardData;

  CardBindingResult({
    required this.success,
    this.bindingId,
    this.redirectUrl,
    this.errorMessage,
    this.cardData,
  });
}

/// Bo'lib to'lash rejasi
class InstallmentPlan {
  final String id;
  final int months;
  final double monthlyAmount;
  final double totalAmount;
  final double interestRate;
  final String provider;

  InstallmentPlan({
    required this.id,
    required this.months,
    required this.monthlyAmount,
    required this.totalAmount,
    required this.interestRate,
    required this.provider,
  });

  factory InstallmentPlan.fromJson(Map<String, dynamic> json) {
    return InstallmentPlan(
      id: json['id']?.toString() ?? '',
      months: json['months'] ?? 0,
      monthlyAmount:
          (json['monthlyAmount'] ?? json['monthly_amount'] ?? 0).toDouble(),
      totalAmount:
          (json['totalAmount'] ?? json['total_amount'] ?? 0).toDouble(),
      interestRate:
          (json['interestRate'] ?? json['interest_rate'] ?? 0).toDouble(),
      provider: json['provider'] ?? 'aliance',
    );
  }
}

/// TOPLA Payment Service
///
/// Barcha to'lov operatsiyalari backend orqali amalga oshiriladi.
/// Flutter to'g'ridan-to'g'ri bank API ga so'rov yubormaydi —
/// backend proxy vazifasini bajaradi. Bu xavfsizroq, chunki
/// merchant credentials faqat serverda saqlanadi.
class PaymentService {
  static final ApiClient _api = ApiClient();

  // ============================================================
  // CARD BINDING (TOKENIZATION) - Karta saqlash
  // ============================================================

  /// Yangi karta qo'shish jarayonini boshlash.
  ///
  /// Backend bank API ga so'rov yuboradi va redirect URL qaytaradi.
  /// Foydalanuvchi shu URL da karta ma'lumotlarini kiritadi.
  /// Muvaffaqiyatli bo'lsa, callback orqali token serverga qaytadi.
  static Future<CardBindingResult> initCardBinding({
    required String userId,
    String? returnUrl,
  }) async {
    try {
      final response = await _api.post('/payments/init-binding', body: {
        'returnUrl': returnUrl,
      });

      final data = response.dataMap;

      if (data['redirectUrl'] != null || data['redirect_url'] != null) {
        return CardBindingResult(
          success: true,
          redirectUrl: data['redirectUrl'] ?? data['redirect_url'],
        );
      }

      return CardBindingResult(
        success: false,
        errorMessage: data['message'] ?? 'Karta qo\'shishda xatolik',
      );
    } catch (e) {
      debugPrint('Card binding error: $e');
      return CardBindingResult(
        success: false,
        errorMessage: 'Tarmoq xatosi: $e',
      );
    }
  }

  /// Binding callback natijasini tekshirish.
  /// Bank redirect qilgandan keyin chaqiriladi.
  static Future<CardBindingResult> checkBindingStatus(String bindingId) async {
    try {
      final response = await _api.get('/payments/binding-status/$bindingId');
      final data = response.dataMap;

      return CardBindingResult(
        success: data['status'] == 'completed',
        bindingId: data['bindingId'] ?? data['binding_id'],
        cardData: data['card'] != null
            ? Map<String, dynamic>.from(data['card'])
            : null,
        errorMessage: data['status'] != 'completed'
            ? 'Karta qo\'shish yakunlanmadi'
            : null,
      );
    } catch (e) {
      return CardBindingResult(
        success: false,
        errorMessage: 'Status tekshirishda xatolik: $e',
      );
    }
  }

  /// Karta qo'shish (manual — backend ga token yuborish)
  static Future<SavedCardModel?> addCard({
    required String cardNumber,
    required String expiryDate,
    required String provider,
    String? cardHolder,
    String? token,
  }) async {
    try {
      final response = await _api.post('/payments/cards', body: {
        'cardNumber': cardNumber,
        'expiryDate': expiryDate,
        'provider': provider,
        'cardHolder': cardHolder,
        'token': token ?? 'manual_${DateTime.now().millisecondsSinceEpoch}',
      });

      return SavedCardModel.fromJson(response.dataMap);
    } catch (e) {
      debugPrint('Add card error: $e');
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
  /// Backend bank API ga so'rov yuboradi. Agar 3D Secure kerak bo'lsa,
  /// redirectUrl qaytariladi.
  static Future<PaymentResult> payWithSavedCard({
    required String orderId,
    required String bindingId,
    required int amountInTiyin,
    String? description,
  }) async {
    try {
      final response = await _api.post('/payments/process', body: {
        'orderId': orderId,
        'cardId': bindingId,
        'amount': amountInTiyin,
        'description': description ?? 'TOPLA buyurtma #$orderId',
        'paymentType': 'ONE_STEP',
      });

      final data = response.dataMap;

      if (data['status'] == 'completed' || data['status'] == 'success') {
        return PaymentResult.success(
          transactionId: data['transactionId'] ?? data['transaction_id'] ?? '',
          data: data,
        );
      } else if (data['redirectUrl'] != null || data['redirect_url'] != null) {
        return PaymentResult.redirect(
          data['redirectUrl'] ?? data['redirect_url'],
        );
      } else {
        return PaymentResult.failure(
          data['message'] ?? 'To\'lov rad etildi',
        );
      }
    } catch (e) {
      debugPrint('Payment error: $e');
      return PaymentResult.failure('To\'lov xatosi: $e');
    }
  }

  /// Yangi karta bilan to'lov (karta saqlanmaydi)
  ///
  /// Backend redirect URL qaytaradi, foydalanuvchi u yerda karta kiritadi.
  static Future<PaymentResult> payWithNewCard({
    required String orderId,
    required int amountInTiyin,
    String? description,
    String? returnUrl,
  }) async {
    try {
      final response = await _api.post('/payments/init-payment', body: {
        'orderId': orderId,
        'amount': amountInTiyin,
        'description': description ?? 'TOPLA buyurtma #$orderId',
        'returnUrl': returnUrl,
      });

      final data = response.dataMap;

      if (data['redirectUrl'] != null || data['redirect_url'] != null) {
        return PaymentResult.redirect(
          data['redirectUrl'] ?? data['redirect_url'],
        );
      } else {
        return PaymentResult.failure('Redirect URL olinmadi');
      }
    } catch (e) {
      debugPrint('Payment init error: $e');
      return PaymentResult.failure('Tarmoq xatosi: $e');
    }
  }

  /// TWO_STEP to'lov - Hold (Marketplace uchun)
  ///
  /// Pul kartada "band" qilinadi, lekin yechilmaydi.
  /// Buyurtma yakunlanganda completePayment() chaqiriladi.
  static Future<PaymentResult> holdPayment({
    required String orderId,
    required String bindingId,
    required int amountInTiyin,
    String? description,
  }) async {
    try {
      final response = await _api.post('/payments/process', body: {
        'orderId': orderId,
        'cardId': bindingId,
        'amount': amountInTiyin,
        'description': description ?? 'TOPLA buyurtma #$orderId',
        'paymentType': 'TWO_STEP',
      });

      final data = response.dataMap;

      if (data['status'] == 'held') {
        return PaymentResult.success(
          transactionId: data['transactionId'] ?? data['transaction_id'] ?? '',
          data: data,
        );
      } else if (data['redirectUrl'] != null) {
        return PaymentResult.redirect(data['redirectUrl']);
      } else {
        return PaymentResult.failure(data['message'] ?? 'Hold rad etildi');
      }
    } catch (e) {
      debugPrint('Hold payment error: $e');
      return PaymentResult.failure('Hold xatosi: $e');
    }
  }

  /// TWO_STEP to'lov - Complete (Pul yechish)
  static Future<PaymentResult> completePayment({
    required String transactionId,
    int? amountInTiyin,
  }) async {
    try {
      final response = await _api.post('/payments/complete', body: {
        'transactionId': transactionId,
        if (amountInTiyin != null) 'amount': amountInTiyin,
      });

      final data = response.dataMap;

      if (data['status'] == 'completed') {
        return PaymentResult.success(
          transactionId: transactionId,
          data: data,
        );
      } else {
        return PaymentResult.failure(data['message'] ?? 'Complete rad etildi');
      }
    } catch (e) {
      return PaymentResult.failure('Complete xatosi: $e');
    }
  }

  /// TWO_STEP to'lov - Reverse (Bekor qilish)
  static Future<PaymentResult> reversePayment({
    required String transactionId,
  }) async {
    try {
      final response = await _api.post('/payments/reverse', body: {
        'transactionId': transactionId,
      });

      final data = response.dataMap;

      if (data['status'] == 'reversed') {
        return PaymentResult.success(
          transactionId: transactionId,
          data: data,
        );
      } else {
        return PaymentResult.failure(data['message'] ?? 'Reverse rad etildi');
      }
    } catch (e) {
      return PaymentResult.failure('Reverse xatosi: $e');
    }
  }

  /// Refund - To'lovni qaytarish
  static Future<PaymentResult> refundPayment({
    required String transactionId,
    int? amountInTiyin,
  }) async {
    try {
      final response = await _api.post('/payments/refund', body: {
        'transactionId': transactionId,
        if (amountInTiyin != null) 'amount': amountInTiyin,
      });

      final data = response.dataMap;

      if (data['status'] == 'refunded') {
        return PaymentResult.success(
          transactionId: transactionId,
          data: data,
        );
      } else {
        return PaymentResult.failure(data['message'] ?? 'Refund rad etildi');
      }
    } catch (e) {
      return PaymentResult.failure('Refund xatosi: $e');
    }
  }

  // ============================================================
  // INSTALLMENT - Bo'lib to'lash
  // ============================================================

  /// Bo'lib to'lash rejalarini olish
  static Future<List<InstallmentPlan>> getInstallmentPlans({
    required int amountInTiyin,
  }) async {
    try {
      final response = await _api.get(
        '/payments/installment-plans?amount=$amountInTiyin',
      );

      return (response.dataList)
          .map((e) => InstallmentPlan.fromJson(e))
          .toList();
    } catch (e) {
      debugPrint('Get installment plans error: $e');
      return [];
    }
  }

  /// Bo'lib to'lash bilan to'lov
  static Future<PaymentResult> payWithInstallment({
    required String orderId,
    required String cardId,
    required int amountInTiyin,
    required int months,
    String? description,
  }) async {
    try {
      final response = await _api.post('/payments/installment', body: {
        'orderId': orderId,
        'cardId': cardId,
        'amount': amountInTiyin,
        'months': months,
        'description': description ?? 'TOPLA buyurtma #$orderId',
      });

      final data = response.dataMap;

      if (data['status'] == 'completed' || data['status'] == 'success') {
        return PaymentResult.success(
          transactionId: data['transactionId'] ?? data['transaction_id'] ?? '',
          data: data,
        );
      } else if (data['redirectUrl'] != null) {
        return PaymentResult.redirect(data['redirectUrl']);
      } else {
        return PaymentResult.failure(
          data['message'] ?? 'Bo\'lib to\'lash rad etildi',
        );
      }
    } catch (e) {
      return PaymentResult.failure('Bo\'lib to\'lash xatosi: $e');
    }
  }

  // ============================================================
  // TRANSACTION STATUS
  // ============================================================

  /// Tranzaksiya holatini tekshirish
  static Future<String?> checkTransactionStatus(String transactionId) async {
    try {
      final response = await _api.get(
        '/payments/transactions/status/$transactionId',
      );
      return response.dataMap['status'];
    } catch (e) {
      debugPrint('Check transaction status error: $e');
      return null;
    }
  }

  /// Buyurtma tranzaksiyalarini olish
  static Future<List<TransactionModel>> getOrderTransactions(
    String orderId,
  ) async {
    try {
      final response = await _api.get('/payments/transactions/$orderId');
      return (response.dataList)
          .map((e) => TransactionModel.fromJson(e))
          .toList();
    } catch (e) {
      debugPrint('Get order transactions error: $e');
      return [];
    }
  }

  // ============================================================
  // VENDOR PAYOUT - Vendorga pul o'tkazish
  // ============================================================

  /// Vendor balansidan kartaga pul o'tkazish (backend orqali)
  static Future<PaymentResult> requestPayout({
    required String cardId,
    required int amountInTiyin,
    String? description,
  }) async {
    try {
      final response = await _api.post('/payments/payout', body: {
        'cardId': cardId,
        'amount': amountInTiyin,
        'description': description,
      });

      final data = response.dataMap;

      if (data['status'] == 'success' || data['status'] == 'processing') {
        return PaymentResult.success(
          transactionId: data['payoutId'] ?? data['payout_id'] ?? '',
          data: data,
        );
      } else {
        return PaymentResult.failure(data['message'] ?? 'Payout rad etildi');
      }
    } catch (e) {
      return PaymentResult.failure('Payout xatosi: $e');
    }
  }

  // ============================================================
  // PAYMENT SETTINGS
  // ============================================================

  /// To'lov tizimi sozlamalarini olish (admin uchun)
  static Future<Map<String, dynamic>> getPaymentSettings() async {
    try {
      final response = await _api.get('/payments/settings');
      return response.dataMap;
    } catch (e) {
      return {};
    }
  }

  // ============================================================
  // COMMISSION CALCULATION
  // ============================================================

  /// Buyurtma uchun komissiyalarni hisoblash (lokal)
  static PaymentCommission calculateCommission({
    required double orderTotal,
    required double vendorCommissionRate,
    required String cardType,
  }) {
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
