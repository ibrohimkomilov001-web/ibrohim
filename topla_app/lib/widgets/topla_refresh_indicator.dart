import 'package:flutter/material.dart';
import '../core/constants/constants.dart';

/// TOPLA branded RefreshIndicator — blue color, white background, smooth feel.
class ToplaRefreshIndicator extends StatelessWidget {
  const ToplaRefreshIndicator({
    super.key,
    required this.onRefresh,
    required this.child,
    this.displacement = 40.0,
    this.edgeOffset = 0.0,
  });

  final Future<void> Function() onRefresh;
  final Widget child;
  final double displacement;
  final double edgeOffset;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.primary,
      backgroundColor: Colors.white,
      strokeWidth: 2.5,
      displacement: displacement,
      edgeOffset: edgeOffset,
      child: child,
    );
  }
}
