import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/constants/constants.dart';

class OrderSuccessScreen extends StatefulWidget {
  final String orderId;
  final String? paymentMethod;
  final String? cardLastDigits;
  final String? deliveryTime;
  final DateTime? deliveryDate;
  final String? scheduledTimeSlot;
  final String? deliveryMethod;
  final String? pickupCode;
  final String? pickupToken;

  const OrderSuccessScreen({
    super.key,
    required this.orderId,
    this.paymentMethod,
    this.cardLastDigits,
    this.deliveryTime,
    this.deliveryDate,
    this.scheduledTimeSlot,
    this.deliveryMethod,
    this.pickupCode,
    this.pickupToken,
  });

  @override
  State<OrderSuccessScreen> createState() => _OrderSuccessScreenState();
}

class _OrderSuccessScreenState extends State<OrderSuccessScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.elasticOut,
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.3, 1.0, curve: Curves.easeIn),
      ),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isPickup =
        widget.deliveryMethod == 'pickup' && widget.pickupToken != null;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSizes.xl),
          child: Column(
            children: [
              const SizedBox(height: 40),

              // Success animation
              AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Iconsax.tick_circle,
                        size: 64,
                        color: AppColors.success,
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: AppSizes.lg),

              // Title
              FadeTransition(
                opacity: _fadeAnimation,
                child: const Text(
                  'Buyurtma qabul qilindi!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: AppSizes.sm),

              // Order ID
              FadeTransition(
                opacity: _fadeAnimation,
                child: Text(
                  'Buyurtma raqami: ${widget.orderId}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: AppSizes.md),

              // Description
              FadeTransition(
                opacity: _fadeAnimation,
                child: Text(
                  isPickup
                      ? 'Buyurtmangiz tayyor bo\'lganda bildirishnoma olasiz. Topshirish punktiga borganda QR kodni ko\'rsating.'
                      : 'Tez orada operator siz bilan bog\'lanadi va buyurtmangizni tasdiqlaydi.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              // ===== QR Kod bo'limi (faqat pickup uchun) =====
              if (isPickup) ...[
                const SizedBox(height: AppSizes.xl),
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: _buildQrSection(),
                ),
              ],

              const SizedBox(height: AppSizes.xl),

              // Order info card
              FadeTransition(
                opacity: _fadeAnimation,
                child: Container(
                  padding: const EdgeInsets.all(AppSizes.lg),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                  ),
                  child: Column(
                    children: [
                      _buildInfoRow(
                        icon: isPickup ? Iconsax.building : Iconsax.truck,
                        label: isPickup ? 'Olish usuli' : 'Yetkazib berish',
                        value: isPickup
                            ? 'Topshirish punktidan olish'
                            : _getDeliveryTimeText(),
                      ),
                      const Divider(height: 24),
                      _buildInfoRow(
                        icon: widget.paymentMethod == 'card'
                            ? Iconsax.card
                            : Iconsax.money,
                        label: 'To\'lov',
                        value: _getPaymentText(),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: AppSizes.xxl),

              // Buttons
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushNamedAndRemoveUntil(
                      context,
                      '/main',
                      (route) => false,
                    );
                    Navigator.pushNamed(context, '/orders');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Buyurtmani kuzatish',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: AppSizes.md),

              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pushNamedAndRemoveUntil(
                      context,
                      '/main',
                      (route) => false,
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Asosiy sahifaga qaytish',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  // ===== QR + PIN kod bo'limi =====
  Widget _buildQrSection() {
    final qrData = jsonEncode({
      'orderId': widget.orderId,
      'token': widget.pickupToken,
    });

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Iconsax.scan_barcode, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              const Text(
                'QR kodni ko\'rsating',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Topshirish punktiga borganda shu QR kodni ko\'rsating',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 20),

          // QR Code
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: QrImageView(
              data: qrData,
              version: QrVersions.auto,
              size: 200.0,
              backgroundColor: Colors.white,
              errorCorrectionLevel: QrErrorCorrectLevel.M,
            ),
          ),

          // PIN kod
          if (widget.pickupCode != null) ...[
            const SizedBox(height: 16),
            Text(
              'yoki kodni ayting',
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade500,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                widget.pickupCode!,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 6,
                  color: Colors.black87,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _getDeliveryTimeText() {
    if (widget.deliveryTime == 'scheduled' && widget.deliveryDate != null) {
      final date = widget.deliveryDate!;
      final dateStr =
          '${date.day}.${date.month.toString().padLeft(2, '0')}.${date.year}';
      if (widget.scheduledTimeSlot != null) {
        return '$dateStr, ${widget.scheduledTimeSlot}';
      }
      return dateStr;
    }
    return 'Bugun, 1-2 soat ichida';
  }

  String _getPaymentText() {
    switch (widget.paymentMethod) {
      case 'card':
        if (widget.cardLastDigits != null) {
          return 'Karta •••• ${widget.cardLastDigits}';
        }
        return 'Plastik karta';
      default:
        return 'Naqd pul';
    }
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: AppSizes.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
