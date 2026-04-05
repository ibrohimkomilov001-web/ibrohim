import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';

import '../../core/repositories/i_lucky_wheel_repository.dart';
import '../../providers/lucky_wheel_provider.dart';

class SpinHistoryScreen extends StatefulWidget {
  const SpinHistoryScreen({super.key});

  @override
  State<SpinHistoryScreen> createState() => _SpinHistoryScreenState();
}

class _SpinHistoryScreenState extends State<SpinHistoryScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    try {
      await Provider.of<LuckyWheelProvider>(context, listen: false)
          .loadHistory();
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FE),
      body: SafeArea(
        child: Column(
          children: [
            // AppBar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios,
                        color: Colors.black87, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const Expanded(
                    child: Text(
                      'Yutganlarim',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            const SizedBox(height: 8),

              // Content
              Expanded(
                child: _isLoading
                    ? const Center(
                        child:
                            CircularProgressIndicator(color: Color(0xFF6C63FF)),
                      )
                    : Consumer<LuckyWheelProvider>(
                        builder: (context, provider, _) {
                          if (provider.history.isEmpty) {
                            return _buildEmptyState();
                          }

                          return RefreshIndicator(
                            onRefresh: _loadHistory,
                            color: const Color(0xFF6C63FF),
                            child: ListView(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              children: [
                                // History list
                                ...provider.history
                                    .map((item) => _HistoryCard(item: item)),

                                const SizedBox(height: 24),
                              ],
                            ),
                          );
                        },
                      ),
            ),
          ],
        ),
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
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                Iconsax.crown_1,
                size: 40,
                color: Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Hali aylantirilmagan',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Omad g\'ildiragini aylantiring va\nyutganlaringizni bu yerda ko\'ring!',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final SpinHistoryItem item;
  const _HistoryCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final isWin = item.isWin;
    final info = _getTypeInfo(item.prizeType);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
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
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: info.color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(info.icon, color: info.color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.prizeName,
                  style: TextStyle(
                    color: isWin ? Colors.black87 : Colors.grey.shade500,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Icon(Iconsax.calendar_1,
                        size: 12, color: Colors.grey.shade600),
                    const SizedBox(width: 4),
                    Text(
                      _formatDate(item.createdAt),
                      style:
                          TextStyle(fontSize: 11, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (item.promoCode != null) ...[
            GestureDetector(
              onTap: () {
                Clipboard.setData(ClipboardData(text: item.promoCode!));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Promo kod nusxalandi!'),
                    backgroundColor: Colors.green.shade700,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                );
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF6C63FF).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: const Color(0xFF6C63FF).withValues(alpha: 0.15),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      item.promoCode!.length > 10
                          ? '${item.promoCode!.substring(0, 10)}...'
                          : item.promoCode!,
                      style: const TextStyle(
                        color: Color(0xFF6C63FF),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'monospace',
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.copy_rounded,
                      size: 12,
                      color: const Color(0xFF6C63FF).withValues(alpha: 0.6),
                    ),
                  ],
                ),
              ),
            ),
          ] else if (!isWin) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Yutilmadi',
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ],
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

  _TypeInfo _getTypeInfo(String type) {
    switch (type) {
      case 'discount_percent':
        return _TypeInfo(
          icon: Iconsax.percentage_square,
          color: const Color(0xFF4CAF50),
        );
      case 'discount_fixed':
        return _TypeInfo(
          icon: Iconsax.money_recive,
          color: const Color(0xFFFF9800),
        );
      case 'free_delivery':
        return _TypeInfo(
          icon: Iconsax.truck_fast,
          color: const Color(0xFF2196F3),
        );
      case 'physical_gift':
        return _TypeInfo(
          icon: Iconsax.gift,
          color: const Color(0xFF9C27B0),
        );
      default:
        return _TypeInfo(
          icon: Iconsax.close_circle,
          color: const Color(0xFF666666),
        );
    }
  }
}

class _TypeInfo {
  final IconData icon;
  final Color color;
  _TypeInfo({required this.icon, required this.color});
}
