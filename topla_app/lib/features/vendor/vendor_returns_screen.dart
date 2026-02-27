import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:intl/intl.dart';
import '../../services/vendor_service.dart';

class VendorReturnsScreen extends StatefulWidget {
  const VendorReturnsScreen({super.key});

  @override
  State<VendorReturnsScreen> createState() => _VendorReturnsScreenState();
}

class _VendorReturnsScreenState extends State<VendorReturnsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<Map<String, dynamic>> _returns = [];
  bool _isLoading = true;
  String? _error;
  String? _currentFilter;
  int _page = 1;
  int _totalPages = 1;
  bool _isLoadingMore = false;
  final ScrollController _scrollController = ScrollController();

  static const _tabs = [
    {'label': 'Barchasi', 'status': null},
    {'label': 'Kutilmoqda', 'status': 'pending'},
    {'label': 'Tasdiqlangan', 'status': 'approved'},
    {'label': 'Rad etilgan', 'status': 'rejected'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _scrollController.addListener(_onScroll);
    _loadReturns();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    final filter = _tabs[_tabController.index]['status'];
    if (_currentFilter != filter) {
      _currentFilter = filter;
      _loadReturns();
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _loadReturns() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data =
          await VendorService.getReturns(page: 1, status: _currentFilter);
      final returns =
          (data['returns'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      final meta = data['meta'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _returns.clear();
        _returns.addAll(returns);
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
      final data = await VendorService.getReturns(
          page: _page + 1, status: _currentFilter);
      final returns =
          (data['returns'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (!mounted) return;
      setState(() {
        _returns.addAll(returns);
        _page++;
        _isLoadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Qaytarishlar'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: _tabs.map((t) => Tab(text: t['label'] as String)).toList(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError()
              : _returns.isEmpty
                  ? _buildEmpty()
                  : RefreshIndicator(
                      onRefresh: _loadReturns,
                      child: ListView.separated(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _returns.length + (_isLoadingMore ? 1 : 0),
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, i) {
                          if (i == _returns.length) {
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              ),
                            );
                          }
                          return _buildReturnCard(_returns[i]);
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
          Icon(Iconsax.box_remove, size: 56, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(
            'Qaytarishlar yo\'q',
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
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
          Text('Xatolik', style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: _loadReturns,
            icon: const Icon(Icons.refresh),
            label: const Text('Qayta yuklash'),
          ),
        ],
      ),
    );
  }

  Widget _buildReturnCard(Map<String, dynamic> ret) {
    final status = ret['status'] as String? ?? 'pending';
    final reason = ret['reason'] as String? ?? '';
    final description = ret['description'] as String?;
    final images = (ret['images'] as List?)?.cast<String>() ?? [];
    final adminNote = ret['adminNote'] as String?;
    final createdAt = ret['createdAt'] as String?;

    final order = ret['order'] as Map<String, dynamic>?;
    final orderNumber = order?['orderNumber'] as String? ?? '';
    final items =
        (order?['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final user = ret['user'] as Map<String, dynamic>?;
    final userName = user?['fullName'] ?? 'Noma\'lum';

    Color statusColor;
    String statusText;
    IconData statusIcon;
    switch (status) {
      case 'approved':
        statusColor = Colors.green;
        statusText = 'Tasdiqlangan';
        statusIcon = Icons.check_circle;
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusText = 'Rad etilgan';
        statusIcon = Icons.cancel;
        break;
      case 'refunded':
        statusColor = Colors.blue;
        statusText = 'Qaytarildi';
        statusIcon = Icons.payments;
        break;
      default:
        statusColor = Colors.orange;
        statusText = 'Kutilmoqda';
        statusIcon = Icons.hourglass_bottom;
    }

    String formattedDate = '';
    if (createdAt != null) {
      try {
        formattedDate =
            DateFormat('dd.MM.yyyy HH:mm').format(DateTime.parse(createdAt));
      } catch (_) {}
    }

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: order number + status
            Row(
              children: [
                Icon(Iconsax.box_remove, size: 20, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    orderNumber,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 14, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        statusText,
                        style: TextStyle(
                            fontSize: 12,
                            color: statusColor,
                            fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Customer + date
            Row(
              children: [
                Text('Mijoz: ',
                    style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                Text(userName,
                    style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w500)),
                const Spacer(),
                Text(formattedDate,
                    style: TextStyle(fontSize: 11, color: Colors.grey[400])),
              ],
            ),

            const SizedBox(height: 8),
            const Divider(height: 1),
            const SizedBox(height: 8),

            // Order items
            ...items.take(3).map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${item['name']} x${item['quantity']}',
                          style: const TextStyle(fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        '${NumberFormat('#,###').format((item['price'] as num?)?.toInt() ?? 0)} so\'m',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                )),
            if (items.length > 3)
              Text(
                '... va yana ${items.length - 3} ta mahsulot',
                style: TextStyle(fontSize: 12, color: Colors.grey[400]),
              ),

            const SizedBox(height: 8),

            // Reason
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Sabab:',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 2),
                  Text(reason, style: const TextStyle(fontSize: 13)),
                  if (description != null && description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(description,
                        style:
                            TextStyle(fontSize: 12, color: Colors.grey[600])),
                  ],
                ],
              ),
            ),

            // Images
            if (images.isNotEmpty) ...[
              const SizedBox(height: 8),
              SizedBox(
                height: 60,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: images.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 6),
                  itemBuilder: (_, i) => ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.network(
                      images[i],
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[200],
                        child: const Icon(Icons.image, size: 24),
                      ),
                    ),
                  ),
                ),
              ),
            ],

            // Admin note
            if (adminNote != null && adminNote.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Iconsax.info_circle,
                        size: 16, color: Colors.blue[600]),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Admin izohi:',
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Colors.blue[600]),
                          ),
                          Text(adminNote,
                              style: TextStyle(
                                  fontSize: 12, color: Colors.blue[800])),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
