import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/providers.dart';
import '../notifications/notifications_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = context.watch<AuthProvider>().isLoggedIn;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(
          context.l10n.translate('settings'),
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 17),
        ),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          children: [
            _buildGroupCard(
              children: [
                if (isLoggedIn) ...[
                  _buildMenuItem(
                    context: context,
                    icon: Iconsax.notification_copy,
                    label: 'Bildirishnomalar',
                    iconColor: const Color(0xFF8B5CF6),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const NotificationsScreen(),
                      ),
                    ),
                  ),
                  _divider(),
                ],
                Consumer<SettingsProvider>(
                  builder: (context, settings, _) => _buildMenuItem(
                    context: context,
                    icon: Iconsax.global_copy,
                    label: context.l10n.language,
                    iconColor: Colors.blueGrey,
                    trailing: Text(
                      settings.language == 'uz' ? 'O\'zbek' : 'Русский',
                      style:
                          TextStyle(color: Colors.grey.shade500, fontSize: 12),
                    ),
                    onTap: () => _showLanguageBottomSheet(context),
                  ),
                ),
                if (isLoggedIn) ...[
                  _divider(),
                  _buildMenuItem(
                    context: context,
                    icon: Iconsax.mobile_copy,
                    label: context.l10n.translate('devices'),
                    subtitle: context.l10n.translate('manage_devices'),
                    iconColor: Colors.cyan,
                    onTap: () => Navigator.pushNamed(context, '/devices'),
                  ),
                ],
                _divider(),
                _buildMenuItem(
                  context: context,
                  icon: Iconsax.message_question_copy,
                  label: context.l10n.helpCenter,
                  iconColor: Colors.lightBlue,
                  onTap: () => Navigator.pushNamed(context, '/help'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGroupCard({required List<Widget> children}) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _buildMenuItem({
    required BuildContext context,
    required IconData icon,
    required String label,
    String? subtitle,
    Widget? trailing,
    Color? iconColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: iconColor ?? Colors.grey.shade700, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 15,
                      color: Colors.grey.shade800,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 1),
                    Text(
                      subtitle,
                      style:
                          TextStyle(fontSize: 11, color: Colors.grey.shade400),
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null)
              trailing
            else
              Icon(Icons.chevron_right, color: Colors.grey.shade300, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _divider() {
    return Divider(
        height: 1, color: Colors.grey.shade100, indent: 46, endIndent: 14);
  }

  void _showLanguageBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => Consumer<SettingsProvider>(
        builder: (context, settings, _) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const SizedBox(width: 32),
                  Text(
                    context.l10n.translate('choose_language'),
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Icon(Icons.close,
                        color: Colors.grey.shade400, size: 22),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildLanguageOption(
                flagWidget: _buildUzbekistanFlag(),
                name: context.l10n.translate('uzbek_lang'),
                isSelected: settings.language == 'uz',
                onTap: () {
                  settings.setLanguage('uz');
                  Navigator.pop(context);
                },
              ),
              Divider(height: 1, color: Colors.grey.shade100),
              _buildLanguageOption(
                flagWidget: _buildRussiaFlag(),
                name: context.l10n.translate('russian_lang'),
                isSelected: settings.language == 'ru',
                onTap: () {
                  settings.setLanguage('ru');
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRussiaFlag() {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: ClipOval(
        child: Column(
          children: [
            Expanded(child: Container(color: Colors.white)),
            Expanded(child: Container(color: const Color(0xFF0039A6))),
            Expanded(child: Container(color: const Color(0xFFD52B1E))),
          ],
        ),
      ),
    );
  }

  Widget _buildUzbekistanFlag() {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: ClipOval(
        child: Column(
          children: [
            Expanded(flex: 2, child: Container(color: const Color(0xFF0099B5))),
            Expanded(flex: 1, child: Container(color: const Color(0xFFCE1126))),
            Expanded(flex: 1, child: Container(color: Colors.white)),
            Expanded(flex: 2, child: Container(color: const Color(0xFF1EB53A))),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageOption({
    required Widget flagWidget,
    required String name,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? Colors.black : Colors.grey.shade400,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.black,
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                name,
                style:
                    const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
            flagWidget,
          ],
        ),
      ),
    );
  }
}
