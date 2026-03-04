import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/constants.dart';
import '../../core/utils/haptic_utils.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/shop_provider.dart';
import '../../models/shop_message_model.dart';

/// Vendor uchun bitta mijoz bilan chat sahifasi
class VendorChatDetailScreen extends StatefulWidget {
  final String conversationId;
  final String customerName;
  final String? customerAvatarUrl;

  const VendorChatDetailScreen({
    super.key,
    required this.conversationId,
    required this.customerName,
    this.customerAvatarUrl,
  });

  @override
  State<VendorChatDetailScreen> createState() => _VendorChatDetailScreenState();
}

class _VendorChatDetailScreenState extends State<VendorChatDetailScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    final shopProvider = context.read<ShopProvider>();
    await shopProvider.loadMessages(widget.conversationId);
    await shopProvider.markMessagesAsRead(widget.conversationId);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    _messageController.clear();
    await HapticUtils.success();

    if (!mounted) return;
    final shopProvider = context.read<ShopProvider>();
    final success = await shopProvider.sendMessage(
      conversationId: widget.conversationId,
      message: content,
    );

    if (success) {
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              backgroundImage: widget.customerAvatarUrl != null
                  ? CachedNetworkImageProvider(widget.customerAvatarUrl!)
                  : null,
              child: widget.customerAvatarUrl == null
                  ? Icon(Iconsax.user, size: 18, color: AppColors.primary)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.customerName,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    context.l10n.translate('customer'),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Quick reply suggestions
          _buildQuickReplies(),
          Expanded(
            child: Consumer<ShopProvider>(
              builder: (context, shopProvider, _) {
                if (shopProvider.isLoadingMessages &&
                    shopProvider.currentMessages.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                final messages = shopProvider.currentMessages;

                if (messages.isEmpty) {
                  return _buildEmptyState();
                }

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    final showDate = index == 0 ||
                        !_isSameDay(
                          messages[index - 1].createdAt,
                          message.createdAt,
                        );
                    // For vendor, "isMe" = sender is vendor (isFromShop)
                    final isMe = message.isFromShop;

                    return _buildMessageItem(message, isMe, showDate);
                  },
                );
              },
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildQuickReplies() {
    final quickReplies = [
      context.l10n.translate('quick_reply_hello'),
      context.l10n.translate('quick_reply_order_ready'),
      context.l10n.translate('quick_reply_available'),
      context.l10n.translate('quick_reply_not_available'),
    ];

    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        itemCount: quickReplies.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          return ActionChip(
            label: Text(
              quickReplies[index],
              style: TextStyle(fontSize: 12, color: AppColors.primary),
            ),
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            side: BorderSide.none,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            onPressed: () {
              _messageController.text = quickReplies[index];
              _sendMessage();
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Iconsax.message,
              size: 40,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            context.l10n.translate('chat_empty'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              context.l10n.translate('send_message_to_customer'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageItem(
    ShopMessageModel message,
    bool isMe,
    bool showDate,
  ) {
    return Column(
      children: [
        if (showDate) _buildDateDivider(message.createdAt),
        // Show image if exists
        if (message.imageUrl != null)
          Align(
            alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.65,
              ),
              margin: EdgeInsets.only(
                top: 4,
                bottom: 2,
                left: isMe ? 48 : 0,
                right: isMe ? 0 : 48,
              ),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
              ),
              clipBehavior: Clip.antiAlias,
              child: CachedNetworkImage(
                imageUrl: message.imageUrl!,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  height: 150,
                  color: Colors.grey[200],
                  child: const Center(child: CircularProgressIndicator()),
                ),
                errorWidget: (_, __, ___) => Container(
                  height: 100,
                  color: Colors.grey[200],
                  child: const Icon(Icons.broken_image, color: Colors.grey),
                ),
              ),
            ),
          ),
        Align(
          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75,
            ),
            margin: EdgeInsets.only(
              top: message.imageUrl != null ? 2 : 4,
              bottom: 4,
              left: isMe ? 48 : 0,
              right: isMe ? 0 : 48,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isMe ? AppColors.primary : AppColors.surfaceLight,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(18),
                topRight: const Radius.circular(18),
                bottomLeft: Radius.circular(isMe ? 18 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 18),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (message.content.isNotEmpty)
                  Text(
                    message.content,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: isMe
                              ? Colors.white
                              : Theme.of(context).textTheme.bodyMedium?.color,
                        ),
                  ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      message.formattedTime,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: isMe
                                ? Colors.white.withValues(alpha: 0.7)
                                : Colors.grey,
                            fontSize: 10,
                          ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 4),
                      Icon(
                        message.isRead ? Icons.done_all : Icons.done,
                        size: 14,
                        color: message.isRead
                            ? Colors.lightBlueAccent
                            : Colors.white.withValues(alpha: 0.7),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDateDivider(DateTime date) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: AppColors.dividerLight)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              _formatDateDivider(date),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.grey,
                  ),
            ),
          ),
          Expanded(child: Divider(color: AppColors.dividerLight)),
        ],
      ),
    );
  }

  String _formatDateDivider(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) return context.l10n.translate('today');
    if (diff.inDays == 1) return context.l10n.translate('yesterday');

    return '${date.day}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  Widget _buildInputArea() {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 8,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: Border(
          top: BorderSide(color: AppColors.dividerLight.withValues(alpha: 0.5)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              textCapitalization: TextCapitalization.sentences,
              maxLines: 4,
              minLines: 1,
              decoration: InputDecoration(
                hintText: context.l10n.translate('write_message'),
                hintStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: AppColors.surfaceLight,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          Consumer<ShopProvider>(
            builder: (context, shopProvider, _) {
              return IconButton(
                onPressed: shopProvider.isSendingMessage ? null : _sendMessage,
                icon: shopProvider.isSendingMessage
                    ? SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.primary,
                        ),
                      )
                    : Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Iconsax.send_1,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
              );
            },
          ),
        ],
      ),
    );
  }
}
