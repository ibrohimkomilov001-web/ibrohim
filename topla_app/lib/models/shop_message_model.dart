/// Do'kon xabari modeli
class ShopMessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String? senderName;
  final String? senderAvatar;
  final bool isFromShop;
  final String content;
  final String? imageUrl;
  final bool isRead;
  final DateTime createdAt;

  ShopMessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.senderName,
    this.senderAvatar,
    required this.isFromShop,
    required this.content,
    this.imageUrl,
    this.isRead = false,
    required this.createdAt,
  });

  factory ShopMessageModel.fromJson(Map<String, dynamic> json) {
    // Backend returns: { id, roomId, senderId, senderRole, message, imageUrl, isRead, createdAt,
    //   sender: { id, fullName, avatarUrl } }
    final sender = json['sender'] ?? json['sender_profile'];

    return ShopMessageModel(
      id: json['id'] ?? '',
      conversationId: json['roomId'] ?? json['conversation_id'] ?? '',
      senderId: json['senderId'] ?? json['sender_id'] ?? sender?['id'] ?? '',
      senderName: sender?['fullName'] ?? sender?['full_name'],
      senderAvatar: sender?['avatarUrl'] ?? sender?['avatar_url'],
      isFromShop: (json['senderRole'] ?? json['is_from_shop']) == 'vendor' ||
          json['is_from_shop'] == true,
      content: json['message'] ?? json['content'] ?? '',
      imageUrl: json['imageUrl'],
      isRead: json['isRead'] ?? json['is_read'] ?? false,
      createdAt: DateTime.parse((json['createdAt'] ??
              json['created_at'] ??
              DateTime.now().toIso8601String())
          .toString()),
    );
  }

  Map<String, dynamic> toJson() => {
        'conversation_id': conversationId,
        'sender_id': senderId,
        'is_from_shop': isFromShop,
        'content': content,
      };

  /// Formatlangan vaqt
  String get formattedTime {
    return '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
  }

  /// Oxirgi xabar bo'lsa sana ham ko'rsatiladi
  String formattedDateTime(bool showDate) {
    if (!showDate) return formattedTime;

    final now = DateTime.now();
    final diff = now.difference(createdAt);

    String date;
    if (diff.inDays == 0) {
      date = 'Bugun';
    } else if (diff.inDays == 1) {
      date = 'Kecha';
    } else {
      date =
          '${createdAt.day}.${createdAt.month.toString().padLeft(2, '0')}.${createdAt.year}';
    }

    return '$date, $formattedTime';
  }
}
