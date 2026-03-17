import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../core/constants/constants.dart';
import '../core/localization/app_localizations.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAllPressed;
  final Widget? trailing;

  const SectionHeader({
    super.key,
    required this.title,
    this.onSeeAllPressed,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSizes.lg,
        vertical: AppSizes.md,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (trailing != null)
            trailing!
          else if (onSeeAllPressed != null)
            GestureDetector(
              onTap: onSeeAllPressed,
              child: Row(
                children: [
                  Text(
                    context.l10n.seeAll,
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: AppSizes.xs),
                  const Icon(
                    Iconsax.arrow_right_3,
                    color: AppColors.primary,
                    size: 18,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
