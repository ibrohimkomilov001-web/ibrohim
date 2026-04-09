import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/lucky_wheel_provider.dart';
import '../../core/repositories/i_lucky_wheel_repository.dart';

class MyPromoCodesScreen extends StatefulWidget {
  const MyPromoCodesScreen({super.key});

  @override
  State<MyPromoCodesScreen> createState() => _MyPromoCodesScreenState();
}

class _MyPromoCodesScreenState extends State<MyPromoCodesScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadPromoCodes();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadPromoCodes() async {
    setState(() => _isLoading = true);
    try {
      final provider = Provider.of<LuckyWheelProvider>(context, listen: false);
      await provider.loadMyPromoCodes();
    } catch (_) {}
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text(
          'Promokodlarim',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 17),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, size: 24, color: Colors.black87),
            onPressed: _showAddPromoCodeDialog,
          ),
          const SizedBox(width: 4),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFFE91E63),
          unselectedLabelColor: const Color(0xFF999999),
          indicatorColor: const Color(0xFFE91E63),
          indicatorWeight: 2.5,
          labelStyle:
              const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontSize: 13),
          labelPadding: const EdgeInsets.symmetric(horizontal: 4),
          tabs: const [
            Tab(text: 'Barchasi'),
            Tab(text: 'Faol'),
            Tab(text: 'Ishlatilgan'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Consumer<LuckyWheelProvider>(
              builder: (context, provider, _) {
                return TabBarView(
                  controller: _tabController,
                  children: [
                    _buildPromoList(provider.myPromoCodes),
                    _buildPromoList(provider.myPromoCodes
                        .where((p) => p.isActive)
                        .toList()),
                    _buildPromoList(provider.myPromoCodes
                        .where((p) => p.isUsed || p.isExpired)
                        .toList()),
                  ],
                );
              },
            ),
    );
  }

  Widget _buildPromoList(List<MyPromoCode> codes) {
    if (codes.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadPromoCodes,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: codes.length,
        itemBuilder: (context, index) {
          return _buildPromoCard(codes[index]);
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFFCE4EC),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Iconsax.ticket_discount_copy,
                size: 40,
                color: Color(0xFFE91E63),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Promokodlar yo\'q',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF333333),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Omad g\'ildiragini aylantiring va\npromokodlar yutib oling!',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF999999),
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPromoCard(MyPromoCode promo) {
    final typeInfo = _getTypeInfo(promo);
    final statusInfo = _getStatusInfo(promo);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
        children: [
          // Bitta qator: chegirma + kod + nusxalash + status
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            child: Row(
              children: [
                // Chegirma badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: typeInfo.bgColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    promo.formattedDiscount,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: typeInfo.iconColor,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Promo kod
                Expanded(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8F8F8),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE8E8E8)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            promo.code,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: promo.isActive
                                  ? const Color(0xFF333333)
                                  : const Color(0xFFBBBBBB),
                              letterSpacing: 0.8,
                              fontFamily: 'monospace',
                              decoration: promo.isUsed
                                  ? TextDecoration.lineThrough
                                  : null,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (promo.isActive) ...[
                          const SizedBox(width: 6),
                          InkWell(
                            onTap: () => _copyCode(promo.code),
                            child: const Icon(
                              Iconsax.copy_copy,
                              size: 16,
                              color: Color(0xFFE91E63),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Status badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusInfo.bgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusInfo.label,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: statusInfo.textColor,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Pastki qism — sana + muddat
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
            child: Row(
              children: [
                Icon(Iconsax.calendar_1_copy,
                    size: 13, color: Colors.grey.shade500),
                const SizedBox(width: 4),
                Text(
                  _formatDate(promo.createdAt),
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                ),
                const Spacer(),
                if (promo.expiresAt != null && promo.isActive) ...[
                  Icon(
                    Iconsax.timer_1_copy,
                    size: 13,
                    color: (promo.daysRemaining ?? 0) <= 3
                        ? Colors.red.shade400
                        : Colors.grey.shade500,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatExpiry(promo),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: (promo.daysRemaining ?? 0) <= 3
                          ? Colors.red.shade400
                          : Colors.grey.shade500,
                    ),
                  ),
                ] else if (promo.isUsed && promo.usedAt != null) ...[
                  Icon(Iconsax.tick_circle_copy,
                      size: 13, color: Colors.grey.shade400),
                  const SizedBox(width: 4),
                  Text(
                    'Ishlatilgan: ${_formatDate(promo.usedAt!)}',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                  ),
                ] else if (promo.isExpired) ...[
                  Icon(Iconsax.close_circle_copy,
                      size: 13, color: Colors.red.shade300),
                  const SizedBox(width: 4),
                  Text(
                    'Muddati tugagan',
                    style: TextStyle(fontSize: 11, color: Colors.red.shade300),
                  ),
                ],
              ],
            ),
          ),

          // Muddat progress bar
          if (promo.isActive && promo.expiresAt != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
              child: _buildExpiryProgress(promo),
            ),
        ],
      ),
    );
  }

  Widget _buildExpiryProgress(MyPromoCode promo) {
    final totalDays = promo.expiresAt!.difference(promo.createdAt).inDays;
    final remaining = promo.daysRemaining ?? 0;
    final progress = totalDays > 0 ? remaining / totalDays : 0.0;

    Color barColor;
    if (remaining <= 3) {
      barColor = Colors.red.shade400;
    } else if (remaining <= 7) {
      barColor = Colors.orange.shade400;
    } else {
      barColor = const Color(0xFF4CAF50);
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: LinearProgressIndicator(
        value: progress.clamp(0.0, 1.0),
        backgroundColor: const Color(0xFFEEEEEE),
        valueColor: AlwaysStoppedAnimation<Color>(barColor),
        minHeight: 4,
      ),
    );
  }

  void _showAddPromoCodeDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        titlePadding: const EdgeInsets.fromLTRB(20, 16, 8, 0),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Promokod kiritish',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            IconButton(
              icon: const Icon(Icons.close, size: 20, color: Color(0xFF999999)),
              onPressed: () => Navigator.pop(ctx),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              autofocus: true,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                hintText: 'Promokodni kiriting',
                hintStyle:
                    const TextStyle(fontSize: 14, color: Color(0xFF999999)),
                filled: true,
                fillColor: const Color(0xFFF5F5F5),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: () async {
                  final code = controller.text.trim();
                  if (code.isEmpty) return;
                  Navigator.pop(ctx);
                  try {
                    final provider =
                        Provider.of<LuckyWheelProvider>(context, listen: false);
                    final result = await provider.verifyPromoCode(code);
                    if (mounted) {
                      final discountType = result['discountType'] ?? '';
                      final discountValue = result['discountValue'] ?? 0;
                      final l10n = context.l10n;
                      String discountText = '';
                      if (discountType == 'percentage') {
                        discountText =
                            '$discountValue% ${l10n.translate('discount_label')}';
                      } else {
                        discountText =
                            '${discountValue.toInt()} ${l10n.translate('currency_som')} ${l10n.translate('discount_label')}';
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                              '✅ ${l10n.translate('promo_activated')} $discountText. ${l10n.translate('promo_use_at_order')}',
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 13)),
                          backgroundColor: const Color(0xFF4CAF50),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24)),
                          duration: const Duration(seconds: 3),
                          margin: const EdgeInsets.only(
                              left: 40, right: 40, bottom: 80),
                        ),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                              e.toString().replaceAll('Exception: ', ''),
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 13)),
                          backgroundColor: Colors.red.shade400,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24)),
                          duration: const Duration(seconds: 3),
                          margin: const EdgeInsets.only(
                              left: 40, right: 40, bottom: 80),
                        ),
                      );
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100)),
                  elevation: 0,
                ),
                child: const Text('Qo\'shish',
                    style:
                        TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
        actionsPadding: EdgeInsets.zero,
        actions: const [],
      ),
    );
  }

  void _copyCode(String code) {
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'Promokod nusxalandi',
          style: TextStyle(color: Color(0xFF333333), fontSize: 13),
        ),
        backgroundColor: const Color(0xFFF0F0F0),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        duration: const Duration(seconds: 2),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        margin: const EdgeInsets.only(left: 40, right: 40, bottom: 80),
        elevation: 2,
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'yan',
      'fev',
      'mar',
      'apr',
      'may',
      'iyn',
      'iyl',
      'avg',
      'sen',
      'okt',
      'noy',
      'dek',
    ];
    return '${date.day} ${months[date.month - 1]}, ${date.year}';
  }

  String _formatExpiry(MyPromoCode promo) {
    final days = promo.daysRemaining ?? 0;
    if (days == 0) return 'Bugun tugaydi';
    if (days == 1) return 'Ertaga tugaydi';
    return '$days kun qoldi';
  }

  _PromoTypeInfo _getTypeInfo(MyPromoCode promo) {
    switch (promo.prizeType) {
      case 'discount_percent':
        return _PromoTypeInfo(
          icon: Iconsax.percentage_square_copy,
          bgColor: const Color(0xFFE8F5E9),
          iconColor: const Color(0xFF4CAF50),
          label: 'Foiz chegirma',
        );
      case 'discount_fixed':
        return _PromoTypeInfo(
          icon: Iconsax.money_recive_copy,
          bgColor: const Color(0xFFFFF3E0),
          iconColor: const Color(0xFFFF9800),
          label: 'So\'m chegirma',
        );
      case 'free_delivery':
        return _PromoTypeInfo(
          icon: Iconsax.truck_fast_copy,
          bgColor: const Color(0xFFE3F2FD),
          iconColor: const Color(0xFF2196F3),
          label: 'Bepul yetkazish',
        );
      case 'physical_gift':
        return _PromoTypeInfo(
          icon: Iconsax.gift_copy,
          bgColor: const Color(0xFFF3E5F5),
          iconColor: const Color(0xFF9C27B0),
          label: 'Sovg\'a',
        );
      default:
        return _PromoTypeInfo(
          icon: Iconsax.ticket_discount_copy,
          bgColor: const Color(0xFFFCE4EC),
          iconColor: const Color(0xFFE91E63),
          label: 'Promokod',
        );
    }
  }

  _PromoStatusInfo _getStatusInfo(MyPromoCode promo) {
    if (promo.isUsed) {
      return _PromoStatusInfo(
        label: 'Ishlatilgan',
        bgColor: const Color(0xFFEEEEEE),
        textColor: const Color(0xFF999999),
      );
    }
    if (promo.isExpired) {
      return _PromoStatusInfo(
        label: 'Muddati tugagan',
        bgColor: const Color(0xFFFFEBEE),
        textColor: const Color(0xFFE53935),
      );
    }
    final days = promo.daysRemaining ?? 30;
    if (days <= 3) {
      return _PromoStatusInfo(
        label: '$days kun qoldi',
        bgColor: const Color(0xFFFFF3E0),
        textColor: const Color(0xFFFF9800),
      );
    }
    return _PromoStatusInfo(
      label: 'Faol',
      bgColor: const Color(0xFFE8F5E9),
      textColor: const Color(0xFF4CAF50),
    );
  }
}

class _PromoTypeInfo {
  final IconData icon;
  final Color bgColor;
  final Color iconColor;
  final String label;
  _PromoTypeInfo(
      {required this.icon,
      required this.bgColor,
      required this.iconColor,
      required this.label});
}

class _PromoStatusInfo {
  final String label;
  final Color bgColor;
  final Color textColor;
  _PromoStatusInfo(
      {required this.label, required this.bgColor, required this.textColor});
}
