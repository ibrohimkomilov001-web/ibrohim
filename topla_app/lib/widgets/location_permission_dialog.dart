import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/constants.dart';
import '../core/localization/app_localizations.dart';

/// Joylashuv ruxsati so'rash dialogini ko'rsatish
Future<bool> showLocationPermissionDialog(BuildContext context) async {
  final prefs = await SharedPreferences.getInstance();
  final isAsked = prefs.getBool('locationPermissionAsked') ?? false;
  if (isAsked) return true;

  if (!context.mounted) return false;

  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) => const _LocationPermissionDialog(),
  );

  return result ?? false;
}

class _LocationPermissionDialog extends StatelessWidget {
  const _LocationPermissionDialog();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.location_on_rounded,
                size: 28,
                color: AppColors.success,
              ),
            ),

            const SizedBox(height: 14),

            // Title
            Text(
              context.l10n.translate('location_permission_title'),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 8),

            // Description
            Text(
              context.l10n.translate('location_permission_desc'),
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade600,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 16),

            // Features list
            _buildFeatureItem(
              context,
              Icons.store_rounded,
              context.l10n.translate('location_feature_1'),
            ),
            const SizedBox(height: 8),
            _buildFeatureItem(
              context,
              Icons.delivery_dining_rounded,
              context.l10n.translate('location_feature_2'),
            ),
            const SizedBox(height: 8),
            _buildFeatureItem(
              context,
              Icons.my_location_rounded,
              context.l10n.translate('location_feature_3'),
            ),

            const SizedBox(height: 20),

            // Buttons
            Row(
              children: [
                // Skip button
                Expanded(
                  child: OutlinedButton(
                    onPressed: () async {
                      final prefs = await SharedPreferences.getInstance();
                      await prefs.setBool('locationPermissionAsked', true);
                      if (context.mounted) {
                        Navigator.pop(context, false);
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100),
                      ),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      context.l10n.translate('later'),
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),

                const SizedBox(width: 10),

                // Allow button
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      final prefs = await SharedPreferences.getInstance();
                      await prefs.setBool('locationPermissionAsked', true);

                      final permission = await Geolocator.requestPermission();
                      final granted = permission == LocationPermission.always ||
                          permission == LocationPermission.whileInUse;

                      if (context.mounted) {
                        Navigator.pop(context, granted);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      context.l10n.translate('allow'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
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
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            size: 15,
            color: AppColors.success,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade700,
            ),
          ),
        ),
      ],
    );
  }
}
