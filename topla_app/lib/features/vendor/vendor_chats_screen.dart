import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/shop_provider.dart';
import '../../models/shop_conversation_model.dart';
import 'vendor_chat_detail_screen.dart';

/// Vendor uchun barcha chatlar ro'yxati
class VendorChatsScreen extends StatefulWidget {
  const VendorChatsScreen({super.key});

  @override
  State<VendorChatsScreen> createState() => _VendorChatsScreenState();
}

class _VendorChatsScreenState extends State<VendorChatsScreen> {
  bool _isLoading = true;
  List<ShopConversationModel> _conversations = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  Future<void> _loadConversations() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final shopProvider = context.read<ShopProvider>();
      await shopProvider.loadConversations();
      if (mounted) {
        setState(() {
          _conversations = shopProvider.conversations;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = context.l10n.translate('chats_load_error');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.translate('messages')),
        actions: [
          IconButton(
            icon: const Icon(Iconsax.refresh),
            onPressed: _loadConversations,
            tooltip: context.l10n.translate('refresh'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : _conversations.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: _loadConversations,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _conversations.length,
                        separatorBuilder: (_, __) => Divider(
                          height: 1,
                          indent: 76,
                          color: AppColors.dividerLight,
                        ),
                        itemBuilder: (context, index) {
                          return _buildConversationTile(_conversations[index]);
                        },
                      ),
                    ),
    );
  }

  Widget _buildConversationTile(ShopConversationModel conversation) {
    final hasUnread = conversation.hasUnread;

    return InkWell(
      onTap: () async {
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => VendorChatDetailScreen(
              conversationId: conversation.id,
              customerName: conversation.customerName ??
                  context.l10n.translate('customer'),
              customerAvatarUrl: conversation.customerAvatar,
            ),
          ),
        );
        // Refresh on return
        _loadConversations();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            // Customer avatar
            Stack(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  backgroundImage: conversation.customerAvatar != null
                      ? CachedNetworkImageProvider(conversation.customerAvatar!)
                      : null,
                  child: conversation.customerAvatar == null
                      ? Icon(Iconsax.user, size: 24, color: AppColors.primary)
                      : null,
                ),
                if (hasUnread)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Center(
                        child: Text(
                          conversation.unreadCount > 9
                              ? '9+'
                              : '${conversation.unreadCount}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            // Name + last message
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          conversation.customerName ??
                              context.l10n.translate('customer'),
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontWeight: hasUnread
                                        ? FontWeight.w700
                                        : FontWeight.w600,
                                  ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        conversation.formattedLastMessageTime,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color:
                                  hasUnread ? AppColors.primary : Colors.grey,
                              fontWeight: hasUnread
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    conversation.lastMessage ??
                        context.l10n.translate('chat_started'),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: hasUnread
                              ? Theme.of(context).textTheme.bodyMedium?.color
                              : Colors.grey,
                          fontWeight:
                              hasUnread ? FontWeight.w500 : FontWeight.normal,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (hasUnread) ...[
              const SizedBox(width: 8),
              Icon(
                Iconsax.arrow_right_3,
                size: 16,
                color: AppColors.primary,
              ),
            ],
          ],
        ),
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
            context.l10n.translate('no_messages'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              context.l10n.translate('no_messages_desc'),
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

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.danger, size: 48, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(
            _error ?? context.l10n.translate('error_occurred'),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey,
                ),
          ),
          const SizedBox(height: 16),
          FilledButton.tonal(
            onPressed: _loadConversations,
            child: Text(context.l10n.translate('retry')),
          ),
        ],
      ),
    );
  }
}
