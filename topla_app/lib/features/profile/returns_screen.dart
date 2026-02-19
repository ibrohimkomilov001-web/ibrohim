import 'dart:io';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/services/api_client.dart';
import '../../providers/orders_provider.dart';
import '../../models/order_model.dart';

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
    final isRu = context.l10n.locale.languageCode == 'ru';
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(
          isRu ? 'Возвраты' : 'Qaytarishlar',
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 17),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: isRu ? 'Мои возвраты' : 'Qaytarishlarim'),
            Tab(text: isRu ? 'Правила' : 'Qoidalar'),
          ],
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildReturnsTab(isRu),
          _buildRulesTab(isRu),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateReturnSheet(isRu),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Iconsax.add),
        label: Text(isRu ? 'Новый возврат' : 'Yangi qaytarish'),
      ),
    );
  }

  // ============ RETURNS TAB ============

  Widget _buildReturnsTab(bool isRu) {
    return Column(
      children: [
        // Status filter
        _buildStatusFilter(isRu),

        // Returns list
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _returns.isEmpty
                  ? _buildEmptyState(isRu)
                  : RefreshIndicator(
                      onRefresh: _loadReturns,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _returns.length,
                        itemBuilder: (context, index) =>
                            _buildReturnCard(_returns[index], isRu),
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildStatusFilter(bool isRu) {
    final statuses = [
      {'value': null, 'label': isRu ? 'Все' : 'Barchasi'},
      {'value': 'pending', 'label': isRu ? 'Ожидание' : 'Kutilmoqda'},
      {'value': 'approved', 'label': isRu ? 'Одобрено' : 'Tasdiqlangan'},
      {'value': 'rejected', 'label': isRu ? 'Отклонено' : 'Rad etilgan'},
      {'value': 'refunded', 'label': isRu ? 'Возвращено' : 'Qaytarilgan'},
    ];

    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: statuses.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final status = statuses[index];
          final isActive = _selectedStatus == status['value'];
          return ChoiceChip(
            label: Text(status['label'] as String),
            selected: isActive,
            onSelected: (_) {
              setState(() => _selectedStatus = status['value'] as String?);
              _loadReturns();
            },
            selectedColor: AppColors.primary,
            labelStyle: TextStyle(
              color: isActive ? Colors.white : Colors.grey.shade700,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
            backgroundColor: Colors.white,
            side: BorderSide(
              color: isActive ? AppColors.primary : Colors.grey.shade300,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
          );
        },
      ),
    );
  }

  Widget _buildReturnCard(Map<String, dynamic> returnData, bool isRu) {
    final status = returnData['status'] as String? ?? 'pending';
    final order = returnData['order'] as Map<String, dynamic>?;
    final items = (order?['items'] as List?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList() ??
        [];
    final reason = returnData['reason'] as String? ?? '';
    final createdAt = DateTime.tryParse(returnData['createdAt'] ?? '');
    final statusInfo = _getStatusInfo(status, isRu);

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
                  '${isRu ? 'Заказ' : 'Buyurtma'} #${order?['orderNumber'] ?? ''}',
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
                                image: NetworkImage(imageUrl),
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
                    onPressed: () =>
                        _cancelReturn(returnData['id'] as String, isRu),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.error,
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(0, 30),
                    ),
                    child: Text(
                      isRu ? 'Отменить' : 'Bekor qilish',
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

  Map<String, dynamic> _getStatusInfo(String status, bool isRu) {
    switch (status) {
      case 'approved':
        return {
          'color': AppColors.success,
          'label': isRu ? 'Одобрено' : 'Tasdiqlangan',
        };
      case 'rejected':
        return {
          'color': AppColors.error,
          'label': isRu ? 'Отклонено' : 'Rad etilgan',
        };
      case 'refunded':
        return {
          'color': const Color(0xFF6C63FF),
          'label': isRu ? 'Возвращено' : 'Qaytarilgan',
        };
      default:
        return {
          'color': AppColors.warning,
          'label': isRu ? 'Ожидание' : 'Kutilmoqda',
        };
    }
  }

  Widget _buildEmptyState(bool isRu) {
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
                Iconsax.refresh_left_square,
                size: 40,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              isRu ? 'Нет возвратов' : 'Qaytarishlar yo\'q',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isRu
                  ? 'Здесь будут отображаться ваши запросы на возврат'
                  : 'Bu yerda qaytarish so\'rovlaringiz ko\'rinadi',
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

  Widget _buildRulesTab(bool isRu) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Policy header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Iconsax.shield_tick,
                      color: Colors.white, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isRu
                            ? 'Гарантия возврата 14 дней'
                            : '14 kunlik qaytarish kafolati',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        isRu
                            ? 'Мы гарантируем возврат средств'
                            : 'Biz mablag\'ni qaytarishni kafolatlaymiz',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Steps
          _buildStepCard(
            1,
            isRu ? 'Создайте заявку' : 'So\'rov yarating',
            isRu
                ? 'Выберите заказ и укажите причину возврата. Приложите фото при необходимости.'
                : 'Buyurtmani tanlang va qaytarish sababini ko\'rsating. Kerak bo\'lsa rasm qo\'shing.',
            Iconsax.document_text,
          ),
          _buildStepCard(
            2,
            isRu ? 'Ожидайте проверку' : 'Tekshiruvni kuting',
            isRu
                ? 'Наша команда рассмотрит вашу заявку в течение 24 часов.'
                : 'Bizning jamoamiz so\'rovingizni 24 soat ichida ko\'rib chiqadi.',
            Iconsax.timer_1,
          ),
          _buildStepCard(
            3,
            isRu ? 'Возврат средств' : 'Mablag\' qaytariladi',
            isRu
                ? 'После одобрения средства будут возвращены в течение 3-5 рабочих дней.'
                : 'Tasdiqlangandan so\'ng mablag\' 3-5 ish kuni ichida qaytariladi.',
            Iconsax.money_recive,
          ),

          const SizedBox(height: 16),

          // Rules list
          Container(
            padding: const EdgeInsets.all(16),
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
                Text(
                  isRu ? 'Условия возврата' : 'Qaytarish shartlari',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                _buildRuleItem(
                  Iconsax.calendar_1,
                  isRu
                      ? 'Возврат возможен в течение 14 дней после доставки'
                      : 'Qaytarish yetkazib berilgandan keyin 14 kun ichida mumkin',
                ),
                _buildRuleItem(
                  Iconsax.box_1,
                  isRu
                      ? 'Товар должен быть в оригинальной упаковке'
                      : 'Mahsulot asl qadoqda bo\'lishi kerak',
                ),
                _buildRuleItem(
                  Iconsax.document_text,
                  isRu
                      ? 'Сохраните чек и документы к товару'
                      : 'Chek va hujjatlarni saqlang',
                ),
                _buildRuleItem(
                  Iconsax.camera,
                  isRu
                      ? 'Приложите фото товара к заявке'
                      : 'So\'rovga mahsulot rasmini qo\'shing',
                ),
                _buildRuleItem(
                  Iconsax.danger,
                  isRu
                      ? 'Товары личной гигиены возврату не подлежат'
                      : 'Shaxsiy gigiena mahsulotlari qaytarilmaydi',
                  isLast: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepCard(
      int step, String title, String description, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.12),
                  AppColors.primary.withValues(alpha: 0.06),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(icon, color: AppColors.primary, size: 22),
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        '$step',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRuleItem(IconData icon, String text, {bool isLast = false}) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: AppColors.primary, size: 16),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    text,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade700,
                      height: 1.3,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        if (!isLast) Divider(height: 1, color: Colors.grey.shade100),
      ],
    );
  }

  // ============ CREATE RETURN ============

  void _showCreateReturnSheet(bool isRu) async {
    // Load delivered orders
    final ordersProvider = context.read<OrdersProvider>();
    await ordersProvider.loadOrders();
    final deliveredOrders = ordersProvider.completedOrders;

    if (!mounted) return;

    if (deliveredOrders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isRu
              ? 'У вас нет доставленных заказов для возврата'
              : 'Sizda qaytarish uchun yetkazilgan buyurtmalar yo\'q'),
          backgroundColor: AppColors.warning,
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
        isRu: isRu,
        onCreated: () {
          _loadReturns();
          _tabController.animateTo(0);
        },
      ),
    );
  }

  Future<void> _cancelReturn(String id, bool isRu) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isRu ? 'Отменить возврат?' : 'Qaytarishni bekor qilish?'),
        content: Text(isRu
            ? 'Вы уверены, что хотите отменить заявку на возврат?'
            : 'Qaytarish so\'rovini bekor qilmoqchimisiz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(isRu ? 'Нет' : 'Yo\'q'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text(isRu ? 'Да, отменить' : 'Ha, bekor qilish'),
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
            content: Text(isRu ? 'Заявка отменена' : 'So\'rov bekor qilindi'),
          ),
        );
        _loadReturns();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isRu ? 'Ошибка' : 'Xatolik'),
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
  final bool isRu;
  final VoidCallback onCreated;

  const _CreateReturnSheet({
    required this.orders,
    required this.isRu,
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

  final List<Map<String, String>> _reasons = [];

  @override
  void initState() {
    super.initState();
    _reasons.addAll([
      {
        'value': 'defective',
        'uz': 'Nuqsonli mahsulot',
        'ru': 'Дефектный товар',
      },
      {
        'value': 'wrong_item',
        'uz': 'Noto\'g\'ri mahsulot yuborilgan',
        'ru': 'Отправлен не тот товар',
      },
      {
        'value': 'not_as_described',
        'uz': 'Ta\'rifga mos kelmaydi',
        'ru': 'Не соответствует описанию',
      },
      {
        'value': 'damaged',
        'uz': 'Shikastlangan mahsulot',
        'ru': 'Поврежденный товар',
      },
      {
        'value': 'size_issue',
        'uz': 'O\'lcham mos kelmadi',
        'ru': 'Не подошел размер',
      },
      {
        'value': 'changed_mind',
        'uz': 'Fikrimi o\'zgartirdim',
        'ru': 'Передумал(а)',
      },
    ]);
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
            content: Text(widget.isRu
                ? 'Заявка на возврат создана'
                : 'Qaytarish so\'rovi yaratildi'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.isRu ? 'Ошибка' : 'Xatolik'}: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRu = widget.isRu;

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
                      isRu ? 'Новый возврат' : 'Yangi qaytarish',
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
                        '1', isRu ? 'Выберите заказ' : 'Buyurtmani tanlang'),
                    const SizedBox(height: 8),
                    ...widget.orders.map((order) => _buildOrderOption(order)),
                    const SizedBox(height: 20),

                    // Step 2: Select Reason
                    _buildSectionTitle(
                        '2', isRu ? 'Причина возврата' : 'Qaytarish sababi'),
                    const SizedBox(height: 8),
                    ..._reasons.map((r) => _buildReasonOption(r)),
                    const SizedBox(height: 20),

                    // Step 3: Description
                    _buildSectionTitle('3', isRu ? 'Описание' : 'Tavsif'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _descriptionController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: isRu
                            ? 'Опишите проблему подробнее...'
                            : 'Muammoni batafsil tasvirlab bering...',
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
                    _buildSectionTitle('4',
                        isRu ? 'Фото (необязательно)' : 'Rasm (ixtiyoriy)'),
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
                              isRu ? 'Отправить заявку' : 'So\'rov yuborish',
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
                    '${order.items.length} ${widget.isRu ? 'товаров' : 'mahsulot'} · ${_formatOrderPrice(order.total)}',
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

  String _formatOrderPrice(double price) {
    final intPrice = price.toInt();
    final str = intPrice.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i > 0) buffer.write(' ');
    }
    return '${buffer.toString().split('').reversed.join()} ${widget.isRu ? 'сум' : 'so\'m'}';
  }

  Widget _buildReasonOption(Map<String, String> reason) {
    final isSelected = _selectedReason == reason['value'];
    final label = widget.isRu ? reason['ru']! : reason['uz']!;
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
