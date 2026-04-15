import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/services/api_client.dart';
import '../../providers/orders_provider.dart';
import '../../models/order_model.dart';
import '../../widgets/glass_back_button.dart';

class ReturnsScreen extends StatefulWidget {
  const ReturnsScreen({super.key});

  @override
  State<ReturnsScreen> createState() => _ReturnsScreenState();
}

class _ReturnsScreenState extends State<ReturnsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiClient _api = ApiClient();
  List<Map<String, dynamic>> _returns = [];
  bool _isLoading = true;
  String? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadReturns();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadReturns() async {
    setState(() => _isLoading = true);
    try {
      final params = <String, dynamic>{};
      if (_selectedStatus != null) params['status'] = _selectedStatus;
      final response = await _api.get('/returns', queryParams: params);
      final list = response.dataList;
      setState(() {
        _returns =
            list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(
          context.l10n.translate('returns'),
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 17),
        ),
        leading: const GlassBackButton(),
        actions: [
          GlassActionButton(
            icon: Icons.add,
            iconSize: 20,
            onPressed: () => _showCreateReturnSheet(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: context.l10n.translate('my_returns')),
            Tab(text: context.l10n.translate('return_rules')),
          ],
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          dividerColor: Colors.transparent,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildReturnsTab(),
          _buildRulesTab(),
        ],
      ),
    );
  }

  // ============ RETURNS TAB ============

  Widget _buildReturnsTab() {
    return Column(
      children: [
        // Returns list
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _returns.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: _loadReturns,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _returns.length,
                        itemBuilder: (context, index) =>
                            _buildReturnCard(_returns[index]),
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildReturnCard(Map<String, dynamic> returnData) {
    final status = returnData['status'] as String? ?? 'pending';
    final order = returnData['order'] as Map<String, dynamic>?;
    final items = (order?['items'] as List?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList() ??
        [];
    final reason = returnData['reason'] as String? ?? '';
    final createdAt = DateTime.tryParse(returnData['createdAt'] ?? '');
    final statusInfo = _getStatusInfo(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${context.l10n.translate('order_label')} #${order?['orderNumber'] ?? ''}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusInfo['color'].withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusInfo['label'],
                    style: TextStyle(
                      color: statusInfo['color'],
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Items preview
          if (items.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  ...items.take(3).map((item) {
                    final imageUrl = item['imageUrl'] as String?;
                    return Container(
                      width: 44,
                      height: 44,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        color: Colors.grey.shade100,
                        image: imageUrl != null
                            ? DecorationImage(
                                image: CachedNetworkImageProvider(imageUrl),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: imageUrl == null
                          ? Icon(Iconsax.box_1,
                              size: 20, color: Colors.grey.shade400)
                          : null,
                    );
                  }),
                  if (items.length > 3)
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        color: Colors.grey.shade200,
                      ),
                      child: Center(
                        child: Text(
                          '+${items.length - 3}',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

          // Reason
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
            child: Row(
              children: [
                Icon(Iconsax.message_question,
                    size: 14, color: Colors.grey.shade500),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    reason,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),

          // Footer
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  createdAt != null
                      ? '${createdAt.day}.${createdAt.month.toString().padLeft(2, '0')}.${createdAt.year}'
                      : '',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey.shade400,
                  ),
                ),
                if (status == 'pending')
                  TextButton(
                    onPressed: () => _cancelReturn(returnData['id'] as String),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.error,
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(0, 30),
                    ),
                    child: Text(
                      context.l10n.translate('cancel_action'),
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getStatusInfo(String status) {
    switch (status) {
      case 'approved':
        return {
          'color': AppColors.success,
          'label': context.l10n.translate('approved'),
        };
      case 'rejected':
        return {
          'color': AppColors.error,
          'label': context.l10n.translate('rejected'),
        };
      case 'refunded':
        return {
          'color': const Color(0xFF6C63FF),
          'label': context.l10n.translate('returned'),
        };
      default:
        return {
          'color': AppColors.warning,
          'label': context.l10n.translate('waiting'),
        };
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(40),
              ),
              child: const Icon(
                Iconsax.box_1,
                size: 40,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              context.l10n.translate('returns_empty'),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.l10n.translate('returns_empty_subtitle'),
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // ============ RULES TAB ============

  Widget _buildRulesTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildFaqItem(
            icon: Icons.help_outline,
            title: "Qaysi buyurtmalarni qaytarish mumkin?",
            description:
                "Ilovada faqat yetkazib berilgan buyurtmalar bo'yicha qaytarish arizasi yuborish mumkin. Mahsulot qaytarish shartlariga mos bo'lishi va taqiqlangan toifaga kirmasligi kerak.",
          ),
          _buildFaqItem(
            icon: Icons.edit_outlined,
            title: "Qaytarish arizasi qanday yuboriladi?",
            description:
                "Qaytarishlar sahifasidagi + tugmasini bosing, yetkazilgan buyurtmani tanlang, sababni ko'rsating va kerak bo'lsa izoh hamda rasmlarni qo'shing. Shundan so'ng ariza ko'rib chiqish uchun yuboriladi.",
          ),
          _buildFaqItem(
            icon: Icons.block_outlined,
            title: "Qaysi mahsulotlar qabul qilinmaydi?",
            description:
                "Oziq-ovqat, dori vositalari, kosmetika, gigiyena vositalari va foydalanish izi yaqqol ko'rinadigan mahsulotlar odatda qaytarib olinmaydi. Qadoq jiddiy shikastlangan yoki tovar ishlatilgan bo'lsa, ariza rad etilishi mumkin.",
          ),
          _buildFaqItem(
            icon: Icons.calendar_today_outlined,
            title: "Qaytarish muddati qancha?",
            description:
                "Qaytarish arizasini buyurtma yetkazilgandan keyin imkon qadar tez yuboring. Odatda arizalar 7 kun ichida qabul qilinadi, ayrim toifalarda esa muddat qisqaroq bo'lishi mumkin.",
          ),
          _buildFaqItem(
            icon: Icons.inventory_2_outlined,
            title: "Rasm yoki izoh qo'shish kerakmi?",
            description:
                "Agar mahsulotda muammo bo'lsa, 1-5 ta rasm va qisqa izoh qo'shish tavsiya etiladi. Bu arizani tezroq ko'rib chiqish va to'g'ri qaror qabul qilishga yordam beradi.",
          ),
          _buildFaqItem(
            icon: Icons.credit_card_outlined,
            title: "Pul mablag'i qachon qaytariladi?",
            description:
                "Ariza tasdiqlangandan keyin mablag' to'lov usulingizga qaytariladi. Odatda bu 2-3 kun ichida amalga oshadi, ayrim hollarda bank yoki to'lov tizimiga qarab 10 ish kunigacha cho'zilishi mumkin.",
          ),
        ],
      ),
    );
  }

  Widget _buildFaqItem({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 22, color: Colors.black87),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.black87,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ============ CREATE RETURN ============

  void _showCreateReturnSheet() async {
    // Load delivered orders
    final ordersProvider = context.read<OrdersProvider>();
    await ordersProvider.loadOrders();
    final deliveredOrders = ordersProvider.completedOrders;

    if (!mounted) return;

    if (deliveredOrders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          margin: const EdgeInsets.only(bottom: 24, left: 40, right: 40),
          content: Text(
            context.l10n.translate('no_delivered_orders'),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13),
          ),
          backgroundColor: AppColors.warning,
          behavior: SnackBarBehavior.floating,
          shape: const StadiumBorder(),
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CreateReturnSheet(
        orders: deliveredOrders,
        onCreated: () {
          _loadReturns();
          _tabController.animateTo(0);
        },
      ),
    );
  }

  Future<void> _cancelReturn(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n.translate('cancel_return_question')),
        content: Text(context.l10n.translate('cancel_return_confirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(context.l10n.translate('no')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text(context.l10n.translate('yes_cancel')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _api.delete('/returns/$id');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('request_cancelled')),
          ),
        );
        _loadReturns();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('error')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}

// ============ CREATE RETURN BOTTOM SHEET ============

class _CreateReturnSheet extends StatefulWidget {
  final List<OrderModel> orders;
  final VoidCallback onCreated;

  const _CreateReturnSheet({
    required this.orders,
    required this.onCreated,
  });

  @override
  State<_CreateReturnSheet> createState() => _CreateReturnSheetState();
}

class _CreateReturnSheetState extends State<_CreateReturnSheet> {
  final ApiClient _api = ApiClient();
  OrderModel? _selectedOrder;
  String? _selectedReason;
  final TextEditingController _descriptionController = TextEditingController();
  final List<File> _images = [];
  bool _isSubmitting = false;

  final List<Map<String, String>> _reasons = [
    {'value': 'defective', 'labelKey': 'reason_defective'},
    {'value': 'wrong_item', 'labelKey': 'reason_wrong_item'},
    {'value': 'not_as_described', 'labelKey': 'reason_not_as_described'},
    {'value': 'damaged', 'labelKey': 'reason_damaged'},
    {'value': 'size_issue', 'labelKey': 'reason_size_issue'},
    {'value': 'changed_mind', 'labelKey': 'reason_changed_mind'},
  ];

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    if (_images.length >= 5) return;
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 80,
    );
    if (picked.isNotEmpty) {
      setState(() {
        final remaining = 5 - _images.length;
        for (var i = 0; i < picked.length && i < remaining; i++) {
          _images.add(File(picked[i].path));
        }
      });
    }
  }

  Future<void> _submit() async {
    if (_selectedOrder == null || _selectedReason == null) return;

    setState(() => _isSubmitting = true);

    try {
      // Upload images first
      final imageUrls = <String>[];
      for (final file in _images) {
        final uploadResponse = await _api.upload(
          '/upload/image',
          filePath: file.path,
          fieldName: 'file',
          fields: {'folder': 'general'},
        );
        final url = uploadResponse.dataMap['url'] as String?;
        if (url != null) imageUrls.add(url);
      }

      // Create return request
      await _api.post('/returns', body: {
        'orderId': _selectedOrder!.id,
        'reason': _selectedReason,
        'description': _descriptionController.text.trim(),
        'images': imageUrls,
      });

      if (mounted) {
        Navigator.pop(context);
        widget.onCreated();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('return_created')),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${context.l10n.translate('error')}: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      context.l10n.translate('new_return'),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              const Divider(),
              // Form
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Step 1: Select Order
                    _buildSectionTitle(
                        '1', context.l10n.translate('select_order')),
                    const SizedBox(height: 8),
                    ...widget.orders.map((order) => _buildOrderOption(order)),
                    const SizedBox(height: 20),

                    // Step 2: Select Reason
                    _buildSectionTitle(
                        '2', context.l10n.translate('return_reason')),
                    const SizedBox(height: 8),
                    ..._reasons.map((r) => _buildReasonOption(r)),
                    const SizedBox(height: 20),

                    // Step 3: Description
                    _buildSectionTitle(
                        '3', context.l10n.translate('description')),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _descriptionController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText:
                            context.l10n.translate('describe_problem_hint'),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.primary),
                        ),
                        contentPadding: const EdgeInsets.all(14),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Step 4: Photos
                    _buildSectionTitle(
                        '4', context.l10n.translate('photo_optional')),
                    const SizedBox(height: 8),
                    _buildImagePicker(),
                    const SizedBox(height: 30),
                  ],
                ),
              ),

              // Submit button
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    top: BorderSide(color: Colors.grey.shade200),
                  ),
                ),
                child: SafeArea(
                  top: false,
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: (_selectedOrder != null &&
                              _selectedReason != null &&
                              !_isSubmitting)
                          ? _submit
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        disabledBackgroundColor: Colors.grey.shade300,
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              context.l10n.translate('submit_request'),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionTitle(String step, String title) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              step,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildOrderOption(OrderModel order) {
    final isSelected = _selectedOrder?.id == order.id;
    return GestureDetector(
      onTap: () => setState(() => _selectedOrder = order),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.05)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.primary : Colors.grey.shade400,
              size: 22,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '#${order.orderNumber}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${order.items.length} ${context.l10n.translate('items_count_suffix')} · ${_formatOrderPrice(context, order.total)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              '${order.createdAt.day}.${order.createdAt.month.toString().padLeft(2, '0')}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatOrderPrice(BuildContext context, double price) {
    final intPrice = price.toInt();
    final str = intPrice.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i > 0) buffer.write(' ');
    }
    return '${buffer.toString().split('').reversed.join()} ${context.l10n.translate('currency')}';
  }

  Widget _buildReasonOption(Map<String, String> reason) {
    final isSelected = _selectedReason == reason['value'];
    final label = context.l10n.locale.languageCode == 'ru'
        ? reason['ru']!
        : reason['uz']!;
    return GestureDetector(
      onTap: () => setState(() => _selectedReason = reason['value']),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.05)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.primary : Colors.grey.shade400,
              size: 20,
            ),
            const SizedBox(width: 10),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: isSelected ? AppColors.primary : null,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePicker() {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        ..._images.asMap().entries.map((entry) {
          return Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.file(
                  entry.value,
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                top: -4,
                right: -4,
                child: GestureDetector(
                  onTap: () => setState(() => _images.removeAt(entry.key)),
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: AppColors.error,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child:
                        const Icon(Icons.close, color: Colors.white, size: 14),
                  ),
                ),
              ),
            ],
          );
        }),
        if (_images.length < 5)
          GestureDetector(
            onTap: _pickImages,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: Colors.grey.shade300,
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Iconsax.camera, size: 24, color: Colors.grey.shade500),
                  const SizedBox(height: 4),
                  Text(
                    '${_images.length}/5',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
