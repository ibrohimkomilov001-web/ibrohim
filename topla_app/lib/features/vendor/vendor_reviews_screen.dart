import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../core/localization/app_localizations.dart';
import '../../services/vendor_service.dart';

class VendorReviewsScreen extends StatefulWidget {
  const VendorReviewsScreen({super.key});

  @override
  State<VendorReviewsScreen> createState() => _VendorReviewsScreenState();
}

class _VendorReviewsScreenState extends State<VendorReviewsScreen> {
  final List<Map<String, dynamic>> _reviews = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int _page = 1;
  int _totalPages = 1;

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadReviews();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _loadReviews() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await VendorService.getReviews(page: 1, limit: 20);
      final reviews =
          (data['reviews'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      final meta = data['meta'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _reviews.clear();
        _reviews.addAll(reviews);
        _page = 1;
        _totalPages = meta?['totalPages'] ?? 1;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || _page >= _totalPages) return;
    setState(() => _isLoadingMore = true);
    try {
      final data = await VendorService.getReviews(page: _page + 1, limit: 20);
      final reviews =
          (data['reviews'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (!mounted) return;
      setState(() {
        _reviews.addAll(reviews);
        _page++;
        _isLoadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoadingMore = false);
    }
  }

  // ============================================
  // Build
  // ============================================

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.translate('reviews')),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError()
              : _reviews.isEmpty
                  ? _buildEmpty()
                  : RefreshIndicator(
                      onRefresh: _loadReviews,
                      child: ListView.separated(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _reviews.length + (_isLoadingMore ? 1 : 0),
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, i) {
                          if (i == _reviews.length) {
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              ),
                            );
                          }
                          return _buildReviewCard(_reviews[i], theme);
                        },
                      ),
                    ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Iconsax.star, size: 56, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(
            context.l10n.translate('no_reviews'),
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
          ),
          const SizedBox(height: 4),
          Text(
            context.l10n.translate('wait_first_review'),
            style: TextStyle(fontSize: 13, color: Colors.grey[400]),
          ),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.red[200]),
          const SizedBox(height: 12),
          Text(context.l10n.translate('error_occurred'),
              style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: _loadReviews,
            icon: const Icon(Icons.refresh),
            label: Text(context.l10n.translate('reload')),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewCard(Map<String, dynamic> review, ThemeData theme) {
    final user = review['user'] as Map<String, dynamic>?;
    final userName =
        user?['fullName'] ?? context.l10n.translate('unknown_user');
    final avatarUrl = user?['avatarUrl'] as String?;
    final rating = review['rating'] as int? ?? 0;
    final comment = review['comment'] as String? ?? '';
    final createdAt = review['createdAt'] as String?;

    // Check if vendor already replied
    final hasReply =
        comment.contains('💬 ${context.l10n.translate('vendor_reply')}:');

    String formattedDate = '';
    if (createdAt != null) {
      try {
        formattedDate =
            DateFormat('dd.MM.yyyy').format(DateTime.parse(createdAt));
      } catch (_) {}
    }

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: avatar + name + rating + date
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  backgroundImage: avatarUrl != null
                      ? CachedNetworkImageProvider(avatarUrl)
                      : null,
                  child: avatarUrl == null
                      ? Text(
                          userName.isNotEmpty ? userName[0].toUpperCase() : '?',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.primary,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(userName,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 14)),
                      Text(formattedDate,
                          style:
                              TextStyle(fontSize: 11, color: Colors.grey[500])),
                    ],
                  ),
                ),
                // Stars
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(5, (i) {
                    return Icon(
                      i < rating
                          ? Icons.star_rounded
                          : Icons.star_outline_rounded,
                      size: 18,
                      color: i < rating ? Colors.amber : Colors.grey[300],
                    );
                  }),
                ),
              ],
            ),

            // Comment text
            if (comment.isNotEmpty) ...[
              const SizedBox(height: 10),
              // Split comment from vendor reply
              if (hasReply) ...[
                // Customer part
                Text(
                  comment
                      .split(
                          '\n\n💬 ${context.l10n.translate('vendor_reply')}:')
                      .first
                      .trim(),
                  style: const TextStyle(fontSize: 13.5, height: 1.4),
                ),
                const SizedBox(height: 8),
                // Vendor reply
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer
                        .withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                        color:
                            theme.colorScheme.primary.withValues(alpha: 0.15)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Iconsax.message,
                          size: 16, color: theme.colorScheme.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          comment
                              .split(
                                  '💬 ${context.l10n.translate('vendor_reply')}:')
                              .last
                              .trim(),
                          style: TextStyle(
                              fontSize: 13, color: theme.colorScheme.primary),
                        ),
                      ),
                    ],
                  ),
                ),
              ] else
                Text(
                  comment,
                  style: const TextStyle(fontSize: 13.5, height: 1.4),
                ),
            ],

            // Reply button
            if (!hasReply) ...[
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => _showReplyDialog(review['id'] as String),
                  icon: const Icon(Iconsax.send_1, size: 16),
                  label: Text(context.l10n.translate('reply'),
                      style: const TextStyle(fontSize: 13)),
                  style: TextButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showReplyDialog(String reviewId) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.translate('reply_to_review')),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: InputDecoration(
            hintText: context.l10n.translate('write_reply'),
            border: const OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(context.l10n.translate('cancel')),
          ),
          FilledButton(
            onPressed: () async {
              final text = controller.text.trim();
              if (text.isEmpty) return;
              Navigator.pop(ctx);
              try {
                await VendorService.replyToReview(reviewId, text);
                await _loadReviews();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(context.l10n.translate('reply_sent')),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content: Text('${context.l10n.translate('error')}: $e'),
                        backgroundColor: Colors.red),
                  );
                }
              }
            },
            child: Text(context.l10n.translate('send')),
          ),
        ],
      ),
    );
  }
}
