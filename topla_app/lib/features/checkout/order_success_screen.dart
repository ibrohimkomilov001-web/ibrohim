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
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSizes.xl),
          child: Column(
            children: [
              const Spacer(),

              // Success animation
              AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Container(
                      width: 150,
                      height: 150,
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Iconsax.tick_circle,
                        size: 80,
                        color: AppColors.success,
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: AppSizes.xl),

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

              const SizedBox(height: AppSizes.md),

              // Order ID
              FadeTransition(
                opacity: _fadeAnimation,
                child: Text(
                  'Buyurtma raqami: ${widget.orderId}',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey.shade600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: AppSizes.lg),

              // Description
              FadeTransition(
                opacity: _fadeAnimation,
                child: Text(
                  'Tez orada operator siz bilan bog\'lanadi va buyurtmangizni tasdiqlaydi.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: AppSizes.xxl),

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
                        icon: Iconsax.truck,
                        label: 'Yetkazib berish',
                        value: _getDeliveryTimeText(),
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

              const Spacer(),

              // Buttons
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // Buyurtmani kuzatish - buyurtmalar sahifasiga o'tish
                    Navigator.pushNamedAndRemoveUntil(
                      context,
                      '/main',
                      (route) => false,
                    );
                    // Buyurtmalar sahifasiga yo'naltirish
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
            ],
          ),
        ),
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
      case 'click':
        return 'Click';
      case 'payme':
        return 'Payme';
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
