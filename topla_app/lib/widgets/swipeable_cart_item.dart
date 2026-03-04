import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';
import '../core/localization/app_localizations.dart';
import '../core/utils/haptic_utils.dart';

/// Swipeable Cart Item Widget
/// Chapga surish - o'chirish, O'ngga surish - sevimli
class SwipeableCartItem extends StatefulWidget {
  final Widget child;
  final VoidCallback onDelete;
  final VoidCallback? onFavorite;
  final bool isFavorite;

  const SwipeableCartItem({
    super.key,
    required this.child,
    required this.onDelete,
    this.onFavorite,
    this.isFavorite = false,
  });

  @override
  State<SwipeableCartItem> createState() => _SwipeableCartItemState();
}

class _SwipeableCartItemState extends State<SwipeableCartItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;

  double _dragExtent = 0;
  bool _isDragging = false;

  static const double _deleteThreshold = 0.3;
  static const double _favoriteThreshold = 0.3;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _slideAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleDragStart(DragStartDetails details) {
    _isDragging = true;
  }

  void _handleDragUpdate(DragUpdateDetails details) {
    if (!_isDragging) return;

    setState(() {
      _dragExtent += details.delta.dx;
      // Cheklash
      _dragExtent = _dragExtent.clamp(-150.0, 100.0);
    });

    // Haptic feedback threshold'da
    if (_dragExtent.abs() > 50 && _dragExtent.abs() < 55) {
      HapticFeedback.selectionClick();
    }
  }

  void _handleDragEnd(DragEndDetails details) {
    _isDragging = false;
    final screenWidth = MediaQuery.of(context).size.width;

    if (_dragExtent < -screenWidth * _deleteThreshold) {
      // O'chirish
      HapticUtils.heavyImpact();
      _animateAndDelete();
    } else if (_dragExtent > screenWidth * _favoriteThreshold &&
        widget.onFavorite != null) {
      // Sevimliga qo'shish
      HapticUtils.favorite();
      widget.onFavorite!();
      _resetPosition();
    } else {
      _resetPosition();
    }
  }

  void _animateAndDelete() {
    _slideAnimation = Tween<Offset>(
      begin: Offset(_dragExtent / MediaQuery.of(context).size.width, 0),
      end: const Offset(-1.5, 0),
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInCubic,
    ));

    _controller.forward().then((_) {
      widget.onDelete();
    });
  }

  void _resetPosition() {
    setState(() {
      _dragExtent = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_dragExtent.abs() / 150).clamp(0.0, 1.0);
    final isDeleting = _dragExtent < 0;
    final isFavoriting = _dragExtent > 0;

    return Stack(
      children: [
        // Background actions
        Positioned.fill(
          child: Row(
            children: [
              // Favorite action (o'ng tomonda ko'rinadi)
              if (widget.onFavorite != null)
                Expanded(
                  child: Container(
                    alignment: Alignment.centerLeft,
                    padding: const EdgeInsets.only(left: 24),
                    decoration: BoxDecoration(
                      color: isFavoriting
                          ? Color.lerp(
                              Colors.grey.shade200,
                              AppColors.warning,
                              progress,
                            )
                          : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Transform.scale(
                      scale: isFavoriting ? 0.5 + progress * 0.5 : 0.5,
                      child: Icon(
                        widget.isFavorite
                            ? Icons.favorite
                            : Icons.favorite_border,
                        color: isFavoriting
                            ? Color.lerp(Colors.grey, Colors.white, progress)
                            : Colors.grey,
                        size: 28,
                      ),
                    ),
                  ),
                ),

              // Delete action (chap tomonda ko'rinadi)
              Expanded(
                child: Container(
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 24),
                  decoration: BoxDecoration(
                    color: isDeleting
                        ? Color.lerp(
                            Colors.grey.shade200,
                            AppColors.error,
                            progress,
                          )
                        : Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Transform.scale(
                    scale: isDeleting ? 0.5 + progress * 0.5 : 0.5,
                    child: Icon(
                      Icons.delete_outline,
                      color: isDeleting
                          ? Color.lerp(Colors.grey, Colors.white, progress)
                          : Colors.grey,
                      size: 28,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Sliding content
        SlideTransition(
          position: _slideAnimation,
          child: GestureDetector(
            onHorizontalDragStart: _handleDragStart,
            onHorizontalDragUpdate: _handleDragUpdate,
            onHorizontalDragEnd: _handleDragEnd,
            child: Transform.translate(
              offset: Offset(_dragExtent, 0),
              child: widget.child,
            ),
          ),
        ),
      ],
    );
  }
}

/// Dismissible with Confirmation
class DismissibleWithConfirmation extends StatelessWidget {
  final Widget child;
  final String itemName;
  final VoidCallback onDismissed;
  final Color backgroundColor;
  final IconData icon;

  const DismissibleWithConfirmation({
    super.key,
    required this.child,
    required this.itemName,
    required this.onDismissed,
    this.backgroundColor = Colors.red,
    this.icon = Icons.delete,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: UniqueKey(),
      direction: DismissDirection.endToStart,
      confirmDismiss: (direction) async {
        HapticFeedback.mediumImpact();
        return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(context.l10n.translate('delete')),
            content: Text(context.l10n
                .translate('delete_confirm_msg')
                .replaceAll('{name}', itemName)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: Text(context.l10n.translate('cancel')),
              ),
              ElevatedButton(
                onPressed: () {
                  HapticFeedback.heavyImpact();
                  Navigator.pop(context, true);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.error,
                ),
                child: Text(context.l10n.translate('delete')),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) => onDismissed(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(icon, color: Colors.white, size: 28),
      ),
      child: child,
    );
  }
}
