import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../services/vendor_service.dart';
import '../../models/commission_model.dart';

/// Vendor - Komissiyalar ekrani
class VendorCommissionsScreen extends StatefulWidget {
  const VendorCommissionsScreen({super.key});

  @override
  State<VendorCommissionsScreen> createState() =>
      _VendorCommissionsScreenState();
}

class _VendorCommissionsScreenState extends State<VendorCommissionsScreen> {
  List<CommissionModel> _commissions = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  int _offset = 0;
  final int _limit = 30;
  bool _hasMore = true;

  double _totalCommission = 0;
  double _monthlyCommission = 0;

  @override
  void initState() {
    super.initState();
    _loadCommissions();
  }

  Future<void> _loadCommissions({bool refresh = true}) async {
    if (refresh) {
      setState(() {
        _isLoading = true;
        _offset = 0;
        _hasMore = true;
      });
    } else {
      if (!_hasMore || _isLoadingMore) return;
      setState(() => _isLoadingMore = true);
    }

    try {
      final commissions = await VendorService.getMyCommissions(
        limit: _limit,
        offset: _offset,
      );

      // Calculate totals
      if (refresh) {
        _totalCommission = 0;
        _monthlyCommission = 0;
        final now = DateTime.now();
        final monthStart = DateTime(now.year, now.month, 1);

        for (var c in commissions) {
          _totalCommission += c.commissionAmount;
          if (c.createdAt.isAfter(monthStart)) {
            _monthlyCommission += c.commissionAmount;
          }
        }
      }

      setState(() {
        if (refresh) {
          _commissions = commissions;
        } else {
          _commissions.addAll(commissions);
        }
        _offset += commissions.length;
        _hasMore = commissions.length == _limit;
        _isLoading = false;
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _isLoadingMore = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('${context.l10n.translate("error")}: $e'),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.translate('commissions')),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _loadCommissions(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Summary card
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.l10n.translate('monthly_commission'),
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${_formatNumber(_monthlyCommission)} ${context.l10n.translate("currency")}',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                                color: Theme.of(context).primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        width: 1,
                        height: 40,
                        color: Colors.grey[300],
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(left: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                context.l10n.translate('total_commission'),
                                style: TextStyle(
                                  color: Colors.grey[600],
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${_formatNumber(_totalCommission)} ${context.l10n.translate("currency")}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // List
                Expanded(
                  child: _commissions.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.percent,
                                  size: 64, color: Colors.grey),
                              const SizedBox(height: 16),
                              Text(context.l10n.translate('no_commissions'),
                                  style: const TextStyle(color: Colors.grey)),
                            ],
                          ),
                        )
                      : NotificationListener<ScrollNotification>(
                          onNotification: (notification) {
                            if (notification is ScrollEndNotification &&
                                notification.metrics.extentAfter < 200) {
                              _loadCommissions(refresh: false);
                            }
                            return false;
                          },
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _commissions.length + (_hasMore ? 1 : 0),
                            itemBuilder: (context, index) {
                              if (index == _commissions.length) {
                                return const Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(16),
                                    child: CircularProgressIndicator(),
                                  ),
                                );
                              }
                              return _buildCommissionItem(_commissions[index]);
                            },
                          ),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildCommissionItem(CommissionModel commission) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.percent, color: Colors.orange),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${context.l10n.translate("order")}: ${commission.orderNumber ?? commission.orderId}',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${context.l10n.translate("sale")}: ${_formatNumber(commission.orderAmount)} ${context.l10n.translate("currency")}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  Text(
                    _formatDate(commission.createdAt),
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '-${_formatNumber(commission.commissionAmount)} ${context.l10n.translate("currency")}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${commission.commissionRate.toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    return number.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (match) => '${match[1]} ',
        );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
