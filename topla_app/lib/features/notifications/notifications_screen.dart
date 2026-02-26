import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/constants.dart';
import '../../core/services/api_client.dart';
import '../../widgets/empty_states.dart';

class _NotifTypeInfo {
  final IconData icon;
  final Color color;
  final String label;

  const _NotifTypeInfo({
    required this.icon,
    required this.color,
    required this.label,
  });
}

_NotifTypeInfo _getTypeInfo(String type) {
  if (type.startsWith('order') || type == 'courier_new') {
    return const _NotifTypeInfo(
      icon: Iconsax.box_1,
      color: AppColors.primary,
      label: 'Buyurtma',
    );
  }
  if (type == 'promo' || type == 'sale' || type == 'flash_sale' || type == 'promo_new') {
    return const _NotifTypeInfo(
      icon: Iconsax.flash_1,
      color: AppColors.accent,
      label: 'Aksiya',
    );
  }
  if (type == 'system' || type == 'admin_broadcast') {
    return const _NotifTypeInfo(
      icon: Iconsax.info_circle,
      color: Color(0xFF8B5CF6),
      label: 'Tizim',
    );
  }
  return const _NotifTypeInfo(
    icon: Iconsax.notification_1,
    color: Color(0xFF64748B),
    label: 'Bildirishnoma',
  );
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  final ApiClient _api = ApiClient();
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  int _page = 1;
  int _totalPages = 1;
  int _unreadCount = 0;
  final ScrollController _scrollController = ScrollController();
  late TabController _tabController;

  static const _tabs = ['Barchasi', 'Buyurtma', 'Aksiya', 'Tizim'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _fetchNotifications();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        _page < _totalPages) {
      _loadMore();
    }
  }

  List<Map<String, dynamic>> get _filteredNotifications {
    final tabIndex = _tabController.index;
    if (tabIndex == 0) return _notifications;
    return _notifications.where((n) {
      final type = (n['type'] as String?) ?? '';
      switch (tabIndex) {
        case 1:
          return type.startsWith('order') || type == 'courier_new';
        case 2:
          return type == 'promo' || type == 'sale' || type == 'flash_sale' || type == 'promo_new';
        case 3:
          return type == 'system' || type == 'admin_broadcast';
        default:
          return true;
      }
    }).toList();
  }

  Future<void> _fetchNotifications() async {
    if (!_api.hasToken) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final response = await _api.get('/notifications', queryParams: {'page': '1', 'limit': '20'});
      if (response.success) {
        final data = response.dataMap;
        final list = (data['notifications'] as List? ?? [])
            .map((n) => Map<String, dynamic>.from(n))
            .toList();

        setState(() {
          _notifications = list;
          _unreadCount = data['unreadCount'] ?? 0;
          final pagination = data['pagination'] as Map<String, dynamic>?;
          _page = pagination?['page'] ?? 1;
          _totalPages = pagination?['totalPages'] ?? 1;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Bildirishnomalarni yuklashda xatolik: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || _page >= _totalPages) return;

    setState(() => _isLoadingMore = true);
    final nextPage = _page + 1;

    try {
      final response = await _api.get('/notifications', queryParams: {'page': '$nextPage', 'limit': '20'});
      if (response.success) {
        final data = response.dataMap;
        final list = (data['notifications'] as List? ?? [])
            .map((n) => Map<String, dynamic>.from(n))
            .toList();

        setState(() {
          _notifications.addAll(list);
          _page = nextPage;
          final pagination = data['pagination'] as Map<String, dynamic>?;
          _totalPages = pagination?['totalPages'] ?? 1;
          _isLoadingMore = false;
        });
      } else {
        setState(() => _isLoadingMore = false);
      }
    } catch (e) {
      debugPrint('Ko\'proq yuklashda xatolik: $e');
      setState(() => _isLoadingMore = false);
    }
  }

  Future<void> _markAsRead(String id) async {
    setState(() {
      final index = _notifications.indexWhere((n) => n['id'] == id);
      if (index != -1) {
        _notifications[index]['isRead'] = true;
        _unreadCount = (_unreadCount - 1).clamp(0, 999);
      }
    });

    try {
      await _api.put('/notifications/$id/read');
    } catch (e) {
      debugPrint('O\'qilgan deb belgilashda xatolik: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    setState(() {
      for (var n in _notifications) {
        n['isRead'] = true;
      }
      _unreadCount = 0;
    });

    try {
      await _api.put('/notifications/read-all');
    } catch (e) {
      debugPrint('Barchasini o\'qishda xatolik: $e');
    }
  }

  Future<void> _onRefresh() async {
    _page = 1;
    await _fetchNotifications();
  }

  String _resolveUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('/')) return 'https://topla.uz$url';
    return url;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0.5,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios, size: 20),
        ),
        title: const Text(
          'Bildirishnomalar',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A2E),
          ),
        ),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text(
                'Barchasini o\'qish',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              onTap: (_) => setState(() {}),
              indicatorColor: AppColors.primary,
              indicatorWeight: 2.5,
              labelColor: AppColors.primary,
              unselectedLabelColor: const Color(0xFF94A3B8),
              labelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
              dividerColor: const Color(0xFFE2E8F0),
              tabs: _tabs.map((t) => Tab(text: t)).toList(),
            ),
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return _buildShimmerLoading();
    if (_notifications.isEmpty) return const EmptyNotificationsWidget();

    final filtered = _filteredNotifications;
    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Iconsax.notification, size: 48, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            Text(
              'Bu turda bildirishnoma yo\'q',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
            ),
          ],
        ),
      );
    }

    final grouped = _groupByDate(filtered);

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.primary,
      child: ListView.builder(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        itemCount: grouped.length + (_isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == grouped.length) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            );
          }
          final group = grouped[index];
          return _buildDateGroup(group['label'] as String, group['items'] as List);
        },
      ),
    );
  }

  List<Map<String, dynamic>> _groupByDate(List<Map<String, dynamic>> items) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    final Map<String, List<Map<String, dynamic>>> groups = {};

    for (final item in items) {
      final createdAtStr = item['createdAt'] as String?;
      final createdAt = createdAtStr != null
          ? DateTime.tryParse(createdAtStr) ?? DateTime.now()
          : DateTime.now();
      final date = DateTime(createdAt.year, createdAt.month, createdAt.day);

      String label;
      if (date == today) {
        label = 'Bugun';
      } else if (date == yesterday) {
        label = 'Kecha';
      } else {
        label = '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
      }

      groups.putIfAbsent(label, () => []);
      groups[label]!.add(item);
    }

    return groups.entries.map((e) => {'label': e.key, 'items': e.value}).toList();
  }

  Widget _buildDateGroup(String label, List items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 12, 4, 8),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF64748B),
            ),
          ),
        ),
        ...items.map((n) => _buildNotificationCard(n as Map<String, dynamic>)),
      ],
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> notification) {
    final isUnread = notification['isRead'] != true;
    final type = (notification['type'] as String?) ?? 'system';
    final createdAtStr = notification['createdAt'] as String?;
    final createdAt = createdAtStr != null
        ? DateTime.tryParse(createdAtStr) ?? DateTime.now()
        : DateTime.now();
    final imageUrl = _resolveUrl(notification['imageUrl'] as String?);
    final linkUrl = notification['linkUrl'] as String?;
    final typeInfo = _getTypeInfo(type);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            if (isUnread) _markAsRead(notification['id']);
            if (linkUrl != null && linkUrl.isNotEmpty) _openLink(linkUrl);
          },
          borderRadius: BorderRadius.circular(AppSizes.radiusLg),
          child: Container(
            decoration: BoxDecoration(
              color: isUnread ? Colors.white : const Color(0xFFFAFAFA),
              borderRadius: BorderRadius.circular(AppSizes.radiusLg),
              border: isUnread
                  ? Border.all(color: typeInfo.color.withOpacity(0.2))
                  : null,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Rasm banner
                if (imageUrl.isNotEmpty)
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(AppSizes.radiusLg),
                    ),
                    child: Image.network(
                      imageUrl,
                      width: double.infinity,
                      height: 150,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),

                // Kontent
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Ikon
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: typeInfo.color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                        ),
                        child: Icon(
                          typeInfo.icon,
                          color: typeInfo.color,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Matn
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    notification['title'] ?? 'Bildirishnoma',
                                    style: TextStyle(
                                      fontWeight: isUnread ? FontWeight.w700 : FontWeight.w600,
                                      fontSize: 14,
                                      color: const Color(0xFF1A1A2E),
                                      height: 1.3,
                                    ),
                                  ),
                                ),
                                if (isUnread)
                                  Container(
                                    width: 8,
                                    height: 8,
                                    margin: const EdgeInsets.only(left: 8),
                                    decoration: BoxDecoration(
                                      color: typeInfo.color,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              notification['body'] ?? '',
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 13,
                                height: 1.4,
                              ),
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 8),

                            // Pastki qism: vaqt + tur + havola
                            Row(
                              children: [
                                Icon(Iconsax.clock, size: 12, color: Colors.grey.shade400),
                                const SizedBox(width: 4),
                                Text(
                                  _formatTime(createdAt),
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: typeInfo.color.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    typeInfo.label,
                                    style: TextStyle(
                                      color: typeInfo.color,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                if (linkUrl != null && linkUrl.isNotEmpty) ...[
                                  const Spacer(),
                                  Text(
                                    'Batafsil',
                                    style: TextStyle(
                                      color: AppColors.primary,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(width: 2),
                                  Icon(Iconsax.arrow_right_3, size: 12, color: AppColors.primary),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      itemCount: 6,
      itemBuilder: (_, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppSizes.radiusLg),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _shimmerBox(40, 40, radius: AppSizes.radiusMd),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _shimmerBox(double.infinity, 14),
                      const SizedBox(height: 8),
                      _shimmerBox(double.infinity, 10),
                      const SizedBox(height: 4),
                      _shimmerBox(150, 10),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          _shimmerBox(60, 8),
                          const SizedBox(width: 8),
                          _shimmerBox(50, 16, radius: 6),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _shimmerBox(double width, double height, {double radius = 6}) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.3, end: 0.7),
      duration: const Duration(milliseconds: 1000),
      curve: Curves.easeInOut,
      builder: (_, value, __) {
        return Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: const Color(0xFFE2E8F0).withOpacity(value),
            borderRadius: BorderRadius.circular(radius),
          ),
        );
      },
    );
  }

  Future<void> _openLink(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('Havolani ochishda xatolik: $e');
    }
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) {
      return 'Hozirgina';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes} daq oldin';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} soat oldin';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} kun oldin';
    } else {
      return '${dateTime.day.toString().padLeft(2, '0')}.${dateTime.month.toString().padLeft(2, '0')}.${dateTime.year}';
    }
  }
}
