import 'package:flutter/foundation.dart';
import '../../core/services/api_client.dart';
import '../../models/models.dart';

/// Saqlangan kartalar uchun repository
abstract class CardsRepository {
  /// Foydalanuvchining barcha saqlangan kartalarini olish
  Future<List<SavedCardModel>> getCards(String userId);

  /// Yangi karta qo'shish
  Future<SavedCardModel?> addCard(SavedCardModel card);

  /// Kartani o'chirish
  Future<bool> deleteCard(String cardId);

  /// Kartani asosiy qilish
  Future<bool> setDefaultCard(String userId, String cardId);

  /// Asosiy kartani olish
  Future<SavedCardModel?> getDefaultCard(String userId);
}

/// API bilan ishlaydigan CardsRepository implementatsiyasi
class CardsRepositoryImpl implements CardsRepository {
  final ApiClient _api;

  CardsRepositoryImpl({ApiClient? api}) : _api = api ?? ApiClient();

  @override
  Future<List<SavedCardModel>> getCards(String userId) async {
    try {
      final response = await _api.get('/payments/cards');
      return (response.dataList)
          .map((e) => SavedCardModel.fromJson(e))
          .toList();
    } catch (e) {
      debugPrint('Get cards error: $e');
      return [];
    }
  }

  @override
  Future<SavedCardModel?> addCard(SavedCardModel card) async {
    try {
      final response = await _api.post('/payments/cards', body: {
        'cardNumber': card.maskedPan,
        'token': card.bindingId,
        'provider': 'octobank',
        'expiryDate': card.expiryDate,
        'isDefault': card.isDefault,
      });

      return SavedCardModel.fromJson(response.dataMap);
    } catch (e) {
      debugPrint('Add card error: $e');
      return null;
    }
  }

  @override
  Future<bool> deleteCard(String cardId) async {
    try {
      await _api.delete('/payments/cards/$cardId');
      return true;
    } catch (e) {
      debugPrint('Delete card error: $e');
      return false;
    }
  }

  @override
  Future<bool> setDefaultCard(String userId, String cardId) async {
    try {
      await _api.put('/payments/cards/$cardId/default', body: {});
      return true;
    } catch (e) {
      debugPrint('Set default card error: $e');
      return false;
    }
  }

  @override
  Future<SavedCardModel?> getDefaultCard(String userId) async {
    try {
      final response = await _api.get('/payments/cards/default');
      return SavedCardModel.fromJson(response.dataMap);
    } on ApiException catch (e) {
      if (e.isNotFound) {
        // Agar default yo'q bo'lsa, birinchi kartani qaytarish
        final cards = await getCards(userId);
        return cards.isNotEmpty ? cards.first : null;
      }
      debugPrint('Get default card error: $e');
      return null;
    } catch (e) {
      debugPrint('Get default card error: $e');
      return null;
    }
  }
}
