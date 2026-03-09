import 'package:flutter/material.dart';

/// Badge types
enum BadgeType { primary, success, warning, danger, info, neutral }

/// Status badge widget
class StatusBadge extends StatelessWidget {
  final String text;
  final BadgeType type;
  final IconData? icon;
  final double fontSize;
  final bool outlined;

  const StatusBadge({
    super.key,
    required this.text,
    this.type = BadgeType.primary,
    this.icon,
    this.fontSize = 12,
    this.outlined = false,
  });

  Color get _backgroundColor {
    switch (type) {
      case BadgeType.primary:
        return const Color(0xFF3B82F6);
      case BadgeType.success:
        return const Color(0xFF22C55E);
      case BadgeType.warning:
        return const Color(0xFFF59E0B);
      case BadgeType.danger:
        return const Color(0xFFEF4444);
      case BadgeType.info:
        return const Color(0xFF06B6D4);
      case BadgeType.neutral:
        return const Color(0xFF6B7280);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: outlined
            ? Colors.transparent
            : _backgroundColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
        border: outlined ? Border.all(color: _backgroundColor, width: 1) : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: fontSize, color: _backgroundColor),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              color: _backgroundColor,
              fontSize: fontSize,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

/// Order status badge
class OrderStatusBadge extends StatelessWidget {
  final String status;

  const OrderStatusBadge({
    super.key,
    required this.status,
  });

  BadgeType get _type {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'kutilmoqda':
        return BadgeType.warning;
      case 'processing':
      case 'jarayonda':
        return BadgeType.primary;
      case 'shipped':
      case 'jo\'natildi':
        return BadgeType.info;
      case 'delivered':
      case 'yetkazildi':
        return BadgeType.success;
      case 'cancelled':
      case 'bekor qilindi':
        return BadgeType.danger;
      default:
        return BadgeType.neutral;
    }
  }

  String get _displayText {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Kutilmoqda';
      case 'processing':
        return 'Jarayonda';
      case 'shipped':
        return 'Jo\'natildi';
      case 'delivered':
        return 'Yetkazildi';
      case 'cancelled':
        return 'Bekor qilindi';
      default:
        return status;
    }
  }

  IconData get _icon {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'kutilmoqda':
        return Icons.schedule;
      case 'processing':
      case 'jarayonda':
        return Icons.autorenew;
      case 'shipped':
      case 'jo\'natildi':
        return Icons.local_shipping_outlined;
      case 'delivered':
      case 'yetkazildi':
        return Icons.check_circle;
      case 'cancelled':
      case 'bekor qilindi':
        return Icons.cancel_outlined;
      default:
        return Icons.info_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    return StatusBadge(
      text: _displayText,
      type: _type,
      icon: _icon,
    );
  }
}

/// Notification dot badge
class NotificationBadge extends StatelessWidget {
  final Widget child;
  final int count;
  final bool showZero;
  final Color? backgroundColor;
  final Color? textColor;

  const NotificationBadge({
    super.key,
    required this.child,
    this.count = 0,
    this.showZero = false,
    this.backgroundColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (count <= 0 && !showZero) {
      return child;
    }

    return Stack(
      clipBehavior: Clip.none,
      children: [
        child,
        Positioned(
          right: -4,
          top: -4,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: backgroundColor ?? Colors.red,
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                BoxShadow(
                  color: Colors.red.withValues(alpha: 0.3),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
            child: Center(
              child: Text(
                count > 99 ? '99+' : count.toString(),
                style: TextStyle(
                  color: textColor ?? Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// New/Hot badge
class PromoLabel extends StatelessWidget {
  final String text;
  final Color color;
  final IconData? icon;

  const PromoLabel({
    super.key,
    required this.text,
    this.color = Colors.red,
    this.icon,
  });

  factory PromoLabel.newItem() => const PromoLabel(
        text: 'YANGI',
        color: Colors.green,
        icon: Icons.fiber_new,
      );

  factory PromoLabel.hot() => const PromoLabel(
        text: 'HIT',
        color: Colors.orange,
        icon: Icons.local_fire_department,
      );

  factory PromoLabel.sale() => const PromoLabel(
        text: 'CHEGIRMA',
        color: Colors.red,
        icon: Icons.percent,
      );

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color, color.withValues(alpha: 0.8)],
        ),
        borderRadius: BorderRadius.circular(4),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: Colors.white),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// Rating badge
class RatingBadge extends StatelessWidget {
  final double rating;
  final int? reviewCount;
  final bool compact;

  const RatingBadge({
    super.key,
    required this.rating,
    this.reviewCount,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.star,
            size: 14,
            color: Colors.amber,
          ),
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.amber,
            ),
          ),
          if (reviewCount != null && !compact) ...[
            Text(
              ' ($reviewCount)',
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[600],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
