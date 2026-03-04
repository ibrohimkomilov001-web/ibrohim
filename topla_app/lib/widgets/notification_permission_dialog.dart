import 'package:flutter/material.dart';
import '../core/constants/constants.dart';
import '../core/localization/app_localizations.dart';
import '../services/push_notification_service.dart';

/// Bildirishnoma ruxsati so'rash dialogini ko'rsatish
Future<bool> showNotificationPermissionDialog(BuildContext context) async {
  final notificationService = PushNotificationService();

  // Agar avval so'ralgan bo'lsa, qayta so'ramaymiz
  final isAsked = await notificationService.isPermissionAsked();
  if (isAsked) return true;

  if (!context.mounted) return false;

  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) => const _NotificationPermissionDialog(),
  );

  return result ?? false;
}

class _NotificationPermissionDialog extends StatelessWidget {
  const _NotificationPermissionDialog();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_active_rounded,
                size: 40,
                color: AppColors.primary,
              ),
            ),

            const SizedBox(height: 24),

            // Title
            Text(
              context.l10n.translate('notification_permission_title'),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 12),

            // Description
            Text(
              context.l10n.translate('notification_permission_desc'),
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 24),

            // Features list
            _buildFeatureItem(
              context,
              Icons.local_offer_rounded,
              context.l10n.translate('notification_feature_1'),
            ),
            const SizedBox(height: 12),
            _buildFeatureItem(
              context,
              Icons.local_shipping_rounded,
              context.l10n.translate('notification_feature_2'),
            ),
            const SizedBox(height: 12),
            _buildFeatureItem(
              context,
              Icons.campaign_rounded,
              context.l10n.translate('notification_feature_3'),
            ),

            const SizedBox(height: 32),

            // Buttons
            Row(
              children: [
                // Skip button
                Expanded(
                  child: OutlinedButton(
                    onPressed: () async {
                      final notificationService = PushNotificationService();
                      await notificationService.setPermissionAsked();
                      if (context.mounted) {
                        Navigator.pop(context, false);
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      context.l10n.translate('later'),
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                const SizedBox(width: 12),

                // Allow button
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      final notificationService = PushNotificationService();
                      final granted =
                          await notificationService.requestPermissionOnly();
                      if (context.mounted) {
                        Navigator.pop(context, granted);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      context.l10n.translate('allow'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
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

  Widget _buildFeatureItem(BuildContext context, IconData icon, String text) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            icon,
            size: 18,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade700,
            ),
          ),
        ),
      ],
    );
  }
}
