import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../models/payout_model.dart';
import '../../models/shop_model.dart';
import '../../services/vendor_service.dart';

/// Vendor - To'lovlar
class VendorPayoutsScreen extends StatefulWidget {
  const VendorPayoutsScreen({super.key});

  @override
  State<VendorPayoutsScreen> createState() => _VendorPayoutsScreenState();
}

class _VendorPayoutsScreenState extends State<VendorPayoutsScreen> {
  List<PayoutModel> _payouts = [];
  ShopModel? _shop;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final shop = await VendorService.getMyShop();
      final payouts = await VendorService.getMyPayouts();
      setState(() {
        _shop = shop;
        _payouts = payouts;
      });
    } catch (e) {
      debugPrint('Error loading data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _requestPayout() async {
    final amountController = TextEditingController();
    PaymentMethod selectedMethod = PaymentMethod.click;

    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.l10n.translate('withdraw'),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${context.l10n.translate("available_balance")}: ${_shop?.formattedBalance ?? '0 ${context.l10n.translate("currency")}'}',
                style: TextStyle(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: context.l10n.translate('amount'),
                  suffixText: context.l10n.translate('currency'),
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                context.l10n.translate('payment_method'),
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: PaymentMethod.values.map((method) {
                  final isSelected = selectedMethod == method;
                  return ChoiceChip(
                    label: Text(_getMethodName(method, context)),
                    selected: isSelected,
                    onSelected: (selected) {
                      setModalState(() => selectedMethod = method);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final amount = double.tryParse(amountController.text);
                    if (amount != null && amount > 0) {
                      Navigator.pop(context, {
                        'amount': amount,
                        'method': selectedMethod,
                      });
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(context.l10n.translate('send_request')),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (result != null) {
      try {
        await VendorService.requestPayout(
          amount: result['amount'],
          bankName: (result['method'] as PaymentMethod).name,
          accountNumber: '',
          accountHolder: '',
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(context.l10n.translate('request_sent')),
              backgroundColor: Colors.green,
            ),
          );
        }
        _loadData();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${context.l10n.translate("error")}: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  String _getMethodName(PaymentMethod method, BuildContext context) {
    switch (method) {
      case PaymentMethod.click:
        return 'Click';
      case PaymentMethod.payme:
        return 'Payme';
      case PaymentMethod.bankTransfer:
        return context.l10n.translate('bank_transfer');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.translate('payments')),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _requestPayout,
        backgroundColor: AppColors.primary,
        icon: const Icon(Iconsax.money_send),
        label: Text(context.l10n.translate('withdraw')),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: Column(
                children: [
                  // Balance card
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary,
                          AppColors.primary.withValues(alpha: 0.8),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.l10n.translate('available_balance'),
                              style: const TextStyle(
                                color: Colors.white70,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _shop?.formattedBalance ??
                                  '0 ${context.l10n.translate("currency")}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const Icon(
                          Iconsax.wallet,
                          color: Colors.white,
                          size: 48,
                        ),
                      ],
                    ),
                  ),
                  // Payouts list
                  Expanded(
                    child: _payouts.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Iconsax.money,
                                  size: 64,
                                  color: Colors.grey.shade400,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  context.l10n.translate('no_payouts_history'),
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _payouts.length,
                            itemBuilder: (context, index) {
                              return _buildPayoutCard(_payouts[index]);
                            },
                          ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildPayoutCard(PayoutModel payout) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor:
              _getStatusColor(payout.status).withValues(alpha: 0.1),
          child: Icon(
            _getStatusIcon(payout.status),
            color: _getStatusColor(payout.status),
          ),
        ),
        title: Text(
          payout.formattedNetAmount,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '${payout.paymentMethodText} • ${_formatDate(payout.createdAt)}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: _getStatusColor(payout.status).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            payout.statusText,
            style: TextStyle(
              color: _getStatusColor(payout.status),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(PayoutStatus status) {
    switch (status) {
      case PayoutStatus.pending:
        return Colors.orange;
      case PayoutStatus.processing:
        return Colors.blue;
      case PayoutStatus.completed:
        return Colors.green;
      case PayoutStatus.failed:
      case PayoutStatus.cancelled:
        return Colors.red;
    }
  }

  IconData _getStatusIcon(PayoutStatus status) {
    switch (status) {
      case PayoutStatus.pending:
        return Iconsax.clock;
      case PayoutStatus.processing:
        return Iconsax.timer;
      case PayoutStatus.completed:
        return Iconsax.tick_circle;
      case PayoutStatus.failed:
      case PayoutStatus.cancelled:
        return Iconsax.close_circle;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}.${date.month}.${date.year}';
  }
}
