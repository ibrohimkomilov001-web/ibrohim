import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../../core/constants/constants.dart';

/// Mahsulot sharhlari ekrani - Uzum/Wildberries darajasida
class ProductReviewsScreen extends StatefulWidget {
  final String productId;
  final String productName;
  final double rating;
  final int reviewCount;
  final List<Map<String, dynamic>> reviews;

  const ProductReviewsScreen({
    super.key,
    required this.productId,
    required this.productName,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.reviews = const [],
  });

  @override
  State<ProductReviewsScreen> createState() => _ProductReviewsScreenState();
}

class _ProductReviewsScreenState extends State<ProductReviewsScreen> {
  final TextEditingController _commentController = TextEditingController();
  final FocusNode _commentFocus = FocusNode();
  final ScrollController _scrollController = ScrollController();

  int _userRating = 0; // 0 = tanlanmagan
  String _sortBy = 'newest'; // newest, highest, lowest
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    _commentFocus.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // Sharhlar ro'yxati
          Expanded(
            child: CustomScrollView(
              controller: _scrollController,
              slivers: [
                // Rating summary
                SliverToBoxAdapter(child: _buildRatingSummary()),

                // Sort header
                SliverToBoxAdapter(child: _buildSortHeader()),

                // Divider
                const SliverToBoxAdapter(
                  child: Divider(height: 1, thickness: 0.5),
                ),

                // Reviews list
                widget.reviews.isEmpty
                    ? SliverFillRemaining(child: _buildEmptyState())
                    : SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final sortedReviews = _getSortedReviews();
                            if (index >= sortedReviews.length) return null;
                            return _buildReviewItem(
                                sortedReviews[index], index);
                          },
                          childCount: _getSortedReviews().length,
                        ),
                      ),

                // Bottom padding
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
              ],
            ),
          ),

          // Yulduzcha + xabar yozish paneli
          _buildInputPanel(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
        onPressed: () => Navigator.pop(context),
      ),
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Text(
            'Sharhlar',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
            ),
          ),
          if (widget.reviewCount > 0)
            Text(
              '${widget.reviewCount} ta sharh',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade500,
                fontWeight: FontWeight.w400,
              ),
            ),
        ],
      ),
      centerTitle: true,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 0.5,
          color: Colors.grey.shade200,
        ),
      ),
    );
  }

  Widget _buildRatingSummary() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.amber.shade50, Colors.orange.shade50],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Katta reyting
          Column(
            children: [
              Text(
                widget.rating.toStringAsFixed(1),
                style: const TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w800,
                  height: 1.0,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: List.generate(5, (i) {
                  final filled = i < widget.rating.round();
                  return Icon(
                    filled ? Icons.star_rounded : Icons.star_outline_rounded,
                    color: Colors.amber.shade700,
                    size: 18,
                  );
                }),
              ),
              const SizedBox(height: 4),
              Text(
                '${widget.reviewCount} ta sharh',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(width: 28),
          // Rating bars
          Expanded(
            child: Column(
              children: List.generate(5, (i) {
                final star = 5 - i;
                final count = widget.reviews
                    .where((r) => (r['rating'] ?? 0) == star)
                    .length;
                final pct = widget.reviewCount > 0
                    ? count / widget.reviewCount
                    : (star == 5
                        ? 0.7
                        : star == 4
                            ? 0.2
                            : star == 3
                                ? 0.05
                                : star == 2
                                    ? 0.03
                                    : 0.02);
                return _buildRatingBar(star, pct);
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingBar(int stars, double percentage) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.5),
      child: Row(
        children: [
          SizedBox(
            width: 14,
            child: Text(
              '$stars',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
          ),
          const SizedBox(width: 4),
          Icon(Icons.star_rounded, size: 13, color: Colors.amber.shade700),
          const SizedBox(width: 8),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: percentage,
                backgroundColor: Colors.white.withValues(alpha: 0.6),
                valueColor:
                    AlwaysStoppedAnimation<Color>(Colors.amber.shade600),
                minHeight: 7,
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 32,
            child: Text(
              '${(percentage * 100).toInt()}%',
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSortHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Text(
            'Barcha sharhlar',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.grey.shade800,
            ),
          ),
          const Spacer(),
          // Sort tugmasi
          GestureDetector(
            onTap: _showSortOptions,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Iconsax.sort, size: 14, color: Colors.grey.shade700),
                  const SizedBox(width: 6),
                  Text(
                    _sortBy == 'newest'
                        ? 'Yangi'
                        : _sortBy == 'highest'
                            ? 'Yuqori baho'
                            : 'Past baho',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade700,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 2),
                  Icon(Icons.keyboard_arrow_down_rounded,
                      size: 16, color: Colors.grey.shade600),
                ],
              ),
            ),
          ),
        ],
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
              color: Colors.amber.shade50,
              shape: BoxShape.circle,
            ),
            child: Icon(Iconsax.message_text,
                size: 36, color: Colors.amber.shade400),
          ),
          const SizedBox(height: 20),
          const Text(
            'Hali sharhlar yo\'q',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Birinchi bo\'lib sharh qoldiring!',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildReviewItem(Map<String, dynamic> review, int index) {
    final rating = (review['rating'] ?? 5) as int;
    final userName = review['userName'] ?? 'Foydalanuvchi';
    final date = review['date'] ?? '';
    final comment = review['comment'] ?? '';
    final likes = review['likes'] ?? 0;
    final isVerified = review['isVerified'] == true;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade100, width: 0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info row
          Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 20,
                backgroundColor: _avatarColor(index),
                child: Text(
                  userName.substring(0, 1).toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            userName,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isVerified) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.success.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.verified,
                                    size: 11, color: AppColors.success),
                                SizedBox(width: 3),
                                Text(
                                  'Sotib olgan',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: AppColors.success,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      date,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Stars
          Row(
            children: List.generate(5, (i) {
              return Icon(
                i < rating ? Icons.star_rounded : Icons.star_outline_rounded,
                color: Colors.amber,
                size: 18,
              );
            }),
          ),

          if (comment.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              comment,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade800,
                height: 1.5,
              ),
            ),
          ],

          const SizedBox(height: 12),

          // Like button
          Row(
            children: [
              _buildActionChip(
                icon: Iconsax.like_1,
                label: 'Foydali ($likes)',
                onTap: () {},
              ),
              const SizedBox(width: 10),
              _buildActionChip(
                icon: Iconsax.dislike,
                label: 'Foydasiz',
                onTap: () {},
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionChip({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: Colors.grey.shade600),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }

  /// Pastki input panel - yulduz + matn + yuborish
  Widget _buildInputPanel() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Yulduzlar
            Padding(
              padding: const EdgeInsets.only(top: 12, left: 16, right: 16),
              child: Row(
                children: [
                  Text(
                    'Baholang: ',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(width: 4),
                  ...List.generate(5, (i) {
                    final filled = i < _userRating;
                    return GestureDetector(
                      onTap: () => setState(() => _userRating = i + 1),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: AnimatedScale(
                          scale: filled ? 1.15 : 1.0,
                          duration: const Duration(milliseconds: 150),
                          child: Icon(
                            filled
                                ? Icons.star_rounded
                                : Icons.star_outline_rounded,
                            color: filled ? Colors.amber : Colors.grey.shade300,
                            size: 30,
                          ),
                        ),
                      ),
                    );
                  }),
                  const Spacer(),
                  if (_userRating > 0)
                    Text(
                      '$_userRating/5',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.amber.shade700,
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Input row
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 8, bottom: 8),
              child: Row(
                children: [
                  // Matn maydoni
                  Expanded(
                    child: Container(
                      constraints: const BoxConstraints(maxHeight: 100),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _commentController,
                        focusNode: _commentFocus,
                        maxLines: null,
                        textInputAction: TextInputAction.newline,
                        style: const TextStyle(fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Sharh yozing...',
                          hintStyle: TextStyle(
                            color: Colors.grey.shade400,
                            fontSize: 14,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 10,
                          ),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Yuborish tugmasi
                  GestureDetector(
                    onTap: _userRating > 0 ? _submitReview : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: _userRating > 0
                            ? AppColors.primary
                            : Colors.grey.shade200,
                        shape: BoxShape.circle,
                      ),
                      child: _isSubmitting
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Icon(
                              Icons.send_rounded,
                              color: _userRating > 0
                                  ? Colors.white
                                  : Colors.grey.shade400,
                              size: 20,
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============ HELPERS ============

  List<Map<String, dynamic>> _getSortedReviews() {
    final list = List<Map<String, dynamic>>.from(widget.reviews);
    switch (_sortBy) {
      case 'highest':
        list.sort((a, b) => (b['rating'] ?? 0).compareTo(a['rating'] ?? 0));
        break;
      case 'lowest':
        list.sort((a, b) => (a['rating'] ?? 0).compareTo(b['rating'] ?? 0));
        break;
      default: // newest - keep as is (assume backend sends newest first)
        break;
    }
    return list;
  }

  Color _avatarColor(int index) {
    final colors = [
      const Color(0xFF6366F1), // Indigo
      const Color(0xFFEC4899), // Pink
      const Color(0xFF14B8A6), // Teal
      const Color(0xFFF97316), // Orange
      const Color(0xFF8B5CF6), // Violet
      const Color(0xFF06B6D4), // Cyan
      const Color(0xFFEF4444), // Red
      const Color(0xFF22C55E), // Green
    ];
    return colors[index % colors.length];
  }

  void _showSortOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Saralash',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            _sortOption('newest', 'Eng yangi', Iconsax.clock),
            _sortOption('highest', 'Yuqori baho', Iconsax.arrow_up_3),
            _sortOption('lowest', 'Past baho', Iconsax.arrow_down),
            SizedBox(height: MediaQuery.of(ctx).padding.bottom + 16),
          ],
        ),
      ),
    );
  }

  Widget _sortOption(String value, String label, IconData icon) {
    final isSelected = _sortBy == value;
    return ListTile(
      leading: Icon(icon,
          color: isSelected ? AppColors.primary : Colors.grey.shade600,
          size: 20),
      title: Text(
        label,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          color: isSelected ? AppColors.primary : Colors.black87,
        ),
      ),
      trailing: isSelected
          ? Icon(Icons.check_circle, color: AppColors.primary, size: 22)
          : null,
      onTap: () {
        setState(() => _sortBy = value);
        Navigator.pop(context);
      },
    );
  }

  void _submitReview() {
    if (_userRating == 0) return;

    setState(() => _isSubmitting = true);

    // TODO: Backend ga sharh yuborish
    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      _commentController.clear();
      _commentFocus.unfocus();
      setState(() => _userRating = 0);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              SizedBox(width: 10),
              Text('Sharhingiz qabul qilindi!'),
            ],
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
        ),
      );
    });
  }
}
