/// Do'kon bilan suhbat modeli
class ShopConversationModel {
  final String id;
  final String shopId;
  final String shopName;
  final String? shopLogoUrl;
  final String customerId;
  final String? customerName;
  final String? customerAvatar;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final DateTime createdAt;

  ShopConversationModel({
    required this.id,
    required this.shopId,
    required this.shopName,
    this.shopLogoUrl,
    required this.customerId,
    this.customerName,
    this.customerAvatar,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    required this.createdAt,
  });

  factory ShopConversationModel.fromJson(Map<String, dynamic> json) {
    // Backend returns: { id, shopId, customerId, lastMessageAt, createdAt,
    //   customer: { id, fullName, avatarUrl, phone },
    //   shop: { id, name, logoUrl },
    //   messages: [ { message, createdAt, senderRole, isRead } ],
    //   unreadCount }
    final shop = json['shop'] ?? json['shops'];
    final customer = json['customer'] ?? json['customer_profile'];
    final messages = json['messages'] as List?;
    final lastMsg =
        (messages != null && messages.isNotEmpty) ? messages[0] : null;

    return ShopConversationModel(
      id: json['id'] ?? '',
      shopId: json['shopId'] ?? json['shop_id'] ?? shop?['id'] ?? '',
      shopName: shop?['name'] ?? 'Do\'kon',
      shopLogoUrl: shop?['logoUrl'] ?? shop?['logo_url'],
      customerId:
          json['customerId'] ?? json['customer_id'] ?? customer?['id'] ?? '',
      customerName: customer?['fullName'] ?? customer?['full_name'],
      customerAvatar: customer?['avatarUrl'] ?? customer?['avatar_url'],
      lastMessage: lastMsg?['message'] ?? json['last_message'],
      lastMessageAt: (json['lastMessageAt'] ?? json['last_message_at']) != null
          ? DateTime.parse(
              (json['lastMessageAt'] ?? json['last_message_at']).toString())
          : null,
      unreadCount: json['unreadCount'] ?? json['unread_count'] ?? 0,
      createdAt: DateTime.parse((json['createdAt'] ??
              json['created_at'] ??
              DateTime.now().toIso8601String())
          .toString()),
    );
  }

  /// Formatlangan oxirgi xabar vaqti
  String get formattedLastMessageTime {
    if (lastMessageAt == null) return '';

    final now = DateTime.now();
    final diff = now.difference(lastMessageAt!);

    if (diff.inDays == 0) {
      return '${lastMessageAt!.hour.toString().padLeft(2, '0')}:${lastMessageAt!.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays == 1) {
      return 'Kecha';
    } else if (diff.inDays < 7) {
      const days = ['Dsh', 'Ssh', 'Chr', 'Pay', 'Jum', 'Shb', 'Yak'];
      return days[lastMessageAt!.weekday - 1];
    }
    return '${lastMessageAt!.day}.${lastMessageAt!.month.toString().padLeft(2, '0')}';
  }

  bool get hasUnread => unreadCount > 0;
}
