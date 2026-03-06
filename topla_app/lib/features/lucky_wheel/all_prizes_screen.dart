import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';

import '../../core/repositories/i_lucky_wheel_repository.dart';
import '../../providers/lucky_wheel_provider.dart';

class AllPrizesScreen extends StatelessWidget {
  const AllPrizesScreen({super.key});

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
                      'Barcha Sovg\'alar',
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

              // Prizes list
              Expanded(
                child: Consumer<LuckyWheelProvider>(
                  builder: (context, provider, _) {
                    if (provider.isLoading) {
                      return const Center(
                        child:
                            CircularProgressIndicator(color: Color(0xFF6C63FF)),
                      );
                    }

                    if (provider.prizes.isEmpty) {
                      return Center(
                        child: Text(
                          'Sovg\'alar hozircha yo\'q',
                          style: TextStyle(
                              color: Colors.grey.shade600, fontSize: 15),
                        ),
                      );
                    }

                    final prizes = provider.prizes
                        .where((p) => p.type != 'nothing')
                        .toList();
                    final nothingPrize = provider.prizes
                        .where((p) => p.type == 'nothing')
                        .toList();

                    return ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        // Yutish mumkin bo'lgan sovg'alar
                        if (prizes.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Text(
                              'Yutish mumkin bo\'lgan sovg\'alar',
                              style: TextStyle(
                                color: Colors.grey.shade700,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          ...prizes.map((p) => _PrizeCard(prize: p)),
                        ],

                        if (nothingPrize.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Text(
                              'Boshqa segmentlar',
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          ...nothingPrize.map((p) => _PrizeCard(prize: p)),
                        ],

                        const SizedBox(height: 24),
                      ],
                    );
                  },
                ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PrizeCard extends StatelessWidget {
  final LuckyWheelPrize prize;
  const _PrizeCard({required this.prize});

  @override
  Widget build(BuildContext context) {
    final info = _getPrizeInfo(prize);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Color dot from wheel
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: info.accentColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(13),
              border: Border.all(
                color: info.accentColor.withOpacity(0.3),
              ),
            ),
            child: Icon(info.icon, color: info.accentColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  prize.nameUz,
                  style: const TextStyle(
                    color: Colors.black87,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  info.description,
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (prize.value != null && prize.isWin)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: info.accentColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _formatValue(prize),
                style: TextStyle(
                  color: info.accentColor,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatValue(LuckyWheelPrize prize) {
    if (prize.type == 'discount_percent') {
      return '${prize.value}%';
    }
    if (prize.type == 'discount_fixed') {
      final val = int.tryParse(prize.value ?? '0') ?? 0;
      return '${val.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} so\'m';
    }
    return prize.value ?? '';
  }

  _PrizeInfo _getPrizeInfo(LuckyWheelPrize prize) {
    switch (prize.type) {
      case 'discount_percent':
        return _PrizeInfo(
          icon: Iconsax.percentage_square,
          accentColor: const Color(0xFF4CAF50),
          description: 'Foiz chegirma promo kodi',
        );
      case 'discount_fixed':
        return _PrizeInfo(
          icon: Iconsax.money_recive,
          accentColor: const Color(0xFFFF9800),
          description: 'So\'m chegirma promo kodi',
        );
      case 'free_delivery':
        return _PrizeInfo(
          icon: Iconsax.truck_fast,
          accentColor: const Color(0xFF2196F3),
          description: 'Bepul yetkazish promo kodi',
        );
      case 'physical_gift':
        return _PrizeInfo(
          icon: Iconsax.gift,
          accentColor: const Color(0xFF9C27B0),
          description: 'Jismoniy sovg\'a',
        );
      default:
        return _PrizeInfo(
          icon: Iconsax.close_circle,
          accentColor: const Color(0xFF666666),
          description: 'Keyingi safar omadingizni sinang',
        );
    }
  }
}

class _PrizeInfo {
  final IconData icon;
  final Color accentColor;
  final String description;

  _PrizeInfo({
    required this.icon,
    required this.accentColor,
    required this.description,
  });
}
