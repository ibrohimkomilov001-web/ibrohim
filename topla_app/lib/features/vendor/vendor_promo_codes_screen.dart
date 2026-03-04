import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:intl/intl.dart';
import '../../core/localization/app_localizations.dart';
import '../../services/vendor_service.dart';

class VendorPromoCodesScreen extends StatefulWidget {
  const VendorPromoCodesScreen({super.key});

  @override
  State<VendorPromoCodesScreen> createState() => _VendorPromoCodesScreenState();
}

class _VendorPromoCodesScreenState extends State<VendorPromoCodesScreen> {
  final List<Map<String, dynamic>> _promoCodes = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPromoCodes();
  }

  Future<void> _loadPromoCodes() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await VendorService.getPromoCodes(limit: 50);
      final codes =
          (data['promoCodes'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (!mounted) return;
      setState(() {
        _promoCodes.clear();
        _promoCodes.addAll(codes);
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.translate('promo_codes')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError()
              : _promoCodes.isEmpty
                  ? _buildEmpty()
                  : RefreshIndicator(
                      onRefresh: _loadPromoCodes,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _promoCodes.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, i) =>
                            _buildPromoCard(_promoCodes[i], theme),
                      ),
                    ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Iconsax.ticket_discount, size: 56, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(
            context.l10n.translate('no_promo_codes'),
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
          ),
          const SizedBox(height: 4),
          Text(
            context.l10n.translate('create_promo_hint'),
            style: TextStyle(fontSize: 13, color: Colors.grey[400]),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _showCreateDialog,
            icon: const Icon(Icons.add),
            label: Text(context.l10n.translate('create')),
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
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: _loadPromoCodes,
            icon: const Icon(Icons.refresh),
            label: Text(context.l10n.translate('reload')),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoCard(Map<String, dynamic> promo, ThemeData theme) {
    final code = promo['code'] as String? ?? '';
    final discountType = promo['discountType'] as String? ?? 'percentage';
    final discountValue = (promo['discountValue'] as num?)?.toDouble() ?? 0;
    final currentUses = promo['currentUses'] as int? ?? 0;
    final maxUses = promo['maxUses'] as int?;
    final isActive = promo['isActive'] as bool? ?? true;
    final expiresAt = promo['expiresAt'] as String?;
    final minOrderAmount = (promo['minOrderAmount'] as num?)?.toDouble() ?? 0;

    final isExpired = expiresAt != null &&
        DateTime.tryParse(expiresAt)?.isBefore(DateTime.now()) == true;
    final effectiveActive = isActive && !isExpired;

    String discountLabel;
    if (discountType == 'percentage') {
      discountLabel = '${discountValue.toInt()}%';
    } else {
      discountLabel =
          '${NumberFormat('#,###').format(discountValue.toInt())} ${context.l10n.translate('currency')}';
    }

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Code chip
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: effectiveActive
                        ? theme.colorScheme.primaryContainer
                        : Colors.grey[200],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: effectiveActive
                          ? theme.colorScheme.primary.withValues(alpha: 0.3)
                          : Colors.grey[300]!,
                    ),
                  ),
                  child: Text(
                    code,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      fontFamily: 'monospace',
                      color: effectiveActive
                          ? theme.colorScheme.primary
                          : Colors.grey,
                    ),
                  ),
                ),
                const Spacer(),
                // Discount badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: effectiveActive ? Colors.green : Colors.grey[200],
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '-$discountLabel',
                    style: TextStyle(
                      color: effectiveActive ? Colors.white : Colors.grey,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Stats row
            Row(
              children: [
                _buildStatChip(
                  Iconsax.people,
                  maxUses != null
                      ? '$currentUses/$maxUses'
                      : '$currentUses ${context.l10n.translate('used_count')}',
                  Colors.blue,
                ),
                const SizedBox(width: 12),
                if (minOrderAmount > 0)
                  _buildStatChip(
                    Iconsax.shopping_cart,
                    'Min: ${NumberFormat('#,###').format(minOrderAmount.toInt())}',
                    Colors.orange,
                  ),
              ],
            ),
            // Expiry + status row
            const SizedBox(height: 8),
            Row(
              children: [
                if (expiresAt != null) ...[
                  Icon(
                    isExpired ? Icons.timer_off : Iconsax.calendar,
                    size: 14,
                    color: isExpired ? Colors.red : Colors.grey[500],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isExpired
                        ? context.l10n.translate('expired')
                        : '${context.l10n.translate('valid_until')}: ${DateFormat('dd.MM.yyyy').format(DateTime.parse(expiresAt))}',
                    style: TextStyle(
                      fontSize: 12,
                      color: isExpired ? Colors.red : Colors.grey[500],
                    ),
                  ),
                ] else
                  Text(
                    context.l10n.translate('unlimited'),
                    style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                  ),
                const Spacer(),
                // Toggle + Delete
                Switch(
                  value: isActive,
                  onChanged: (val) => _toggleActive(promo['id'] as String, val),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                InkWell(
                  onTap: () => _confirmDelete(promo['id'] as String, code),
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child:
                        Icon(Iconsax.trash, size: 18, color: Colors.red[300]),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatChip(IconData icon, String text, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }

  // ============================================
  // Actions
  // ============================================

  void _showCreateDialog() {
    final codeCtrl = TextEditingController();
    final valueCtrl = TextEditingController();
    final minOrderCtrl = TextEditingController();
    final maxUsesCtrl = TextEditingController();
    String discountType = 'percentage';
    DateTime? expiresAt;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(context.l10n.translate('new_promo_code')),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: codeCtrl,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    labelText:
                        '${context.l10n.translate('promo_code_label')} *',
                    hintText: 'TOPLA20',
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: discountType,
                  decoration: InputDecoration(
                    labelText: context.l10n.translate('discount_type'),
                    border: const OutlineInputBorder(),
                  ),
                  items: [
                    DropdownMenuItem(
                        value: 'percentage',
                        child: Text(context.l10n.translate('percentage'))),
                    DropdownMenuItem(
                        value: 'fixed',
                        child: Text(context.l10n.translate('fixed_amount'))),
                  ],
                  onChanged: (v) {
                    if (v != null) setDialogState(() => discountType = v);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: valueCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText:
                        '${context.l10n.translate('discount_amount_label')} *',
                    suffixText: discountType == 'percentage'
                        ? '%'
                        : context.l10n.translate('currency'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: minOrderCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: context.l10n.translate('min_order_amount'),
                    hintText: context.l10n.translate('optional_hint'),
                    suffixText: context.l10n.translate('currency'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: maxUsesCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: context.l10n.translate('max_usage'),
                    hintText: context.l10n.translate('unlimited_uses'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                // Expiry date picker
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: ctx,
                      initialDate: DateTime.now().add(const Duration(days: 30)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      setDialogState(() => expiresAt = picked);
                    }
                  },
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: context.l10n.translate('validity_period'),
                      border: const OutlineInputBorder(),
                      suffixIcon: const Icon(Iconsax.calendar),
                    ),
                    child: Text(
                      expiresAt != null
                          ? DateFormat('dd.MM.yyyy').format(expiresAt!)
                          : context.l10n.translate('unlimited'),
                      style: TextStyle(
                        color: expiresAt != null ? null : Colors.grey[500],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(context.l10n.translate('cancel')),
            ),
            FilledButton(
              onPressed: () => _createPromo(
                ctx,
                code: codeCtrl.text.trim(),
                discountType: discountType,
                value: valueCtrl.text.trim(),
                minOrder: minOrderCtrl.text.trim(),
                maxUses: maxUsesCtrl.text.trim(),
                expiresAt: expiresAt,
              ),
              child: Text(context.l10n.translate('create')),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _createPromo(
    BuildContext dialogCtx, {
    required String code,
    required String discountType,
    required String value,
    required String minOrder,
    required String maxUses,
    DateTime? expiresAt,
  }) async {
    if (code.isEmpty || value.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(context.l10n.translate('enter_code_and_amount'))),
      );
      return;
    }

    final discountValue = double.tryParse(value);
    if (discountValue == null || discountValue <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(context.l10n.translate('invalid_discount_amount'))),
      );
      return;
    }

    Navigator.pop(dialogCtx);

    try {
      final data = <String, dynamic>{
        'code': code.toUpperCase(),
        'discountType': discountType,
        'discountValue': discountValue,
      };
      if (minOrder.isNotEmpty) {
        data['minOrderAmount'] = double.tryParse(minOrder) ?? 0;
      }
      if (maxUses.isNotEmpty) {
        data['maxUses'] = int.tryParse(maxUses);
      }
      if (expiresAt != null) {
        data['expiresAt'] = expiresAt.toUtc().toIso8601String();
      }

      await VendorService.createPromoCode(data);
      await _loadPromoCodes();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('promo_code_created')),
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
  }

  Future<void> _toggleActive(String id, bool active) async {
    try {
      await VendorService.updatePromoCode(id, {'isActive': active});
      await _loadPromoCodes();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${context.l10n.translate('error')}: $e')),
        );
      }
    }
  }

  Future<void> _confirmDelete(String id, String code) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(context.l10n.translate('delete_promo_code')),
        content:
            Text('"$code" ${context.l10n.translate('delete_promo_confirm')}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(context.l10n.translate('no')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(context.l10n.translate('delete'),
                style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await VendorService.deletePromoCode(id);
      await _loadPromoCodes();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.translate('promo_code_deleted'))),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${context.l10n.translate('error')}: $e')),
        );
      }
    }
  }
}
