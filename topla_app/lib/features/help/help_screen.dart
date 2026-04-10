import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/services/api_client.dart';
import 'support_chat_screen.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  String _appVersion = '';

  // Backend contact data
  String _supportPhone = '';
  String _telegramLink = 'https://t.me/topla_uz';
  String _instagramLink = 'https://instagram.com/topla.uz';

  @override
  void initState() {
    super.initState();
    _loadAppVersion();
    _loadContactInfo();
  }

  Future<void> _loadAppVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() {
          _appVersion = 'v${info.version} (${info.buildNumber})';
        });
      }
    } catch (_) {
      if (mounted) setState(() => _appVersion = 'v1.0.0');
    }
  }

  Future<void> _loadContactInfo() async {
    try {
      final api = ApiClient();
      final response = await api.get('/settings/public');
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true && body['data'] != null) {
          final data = body['data'] as Map<String, dynamic>;
          if (mounted) {
            setState(() {
              _supportPhone = data['supportPhone'] ?? '';
              if (data['telegramLink'] != null &&
                  (data['telegramLink'] as String).isNotEmpty) {
                _telegramLink = data['telegramLink'];
              }
              if (data['instagramLink'] != null &&
                  (data['instagramLink'] as String).isNotEmpty) {
                _instagramLink = data['instagramLink'];
              }
            });
          }
        }
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F5),
      appBar: AppBar(
        title: Text(
          l10n.translate('help'),
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 40),
        child: Column(
          children: [
            // ── Header with icon ──
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(0, 32, 0, 28),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Icon(
                      Iconsax.message_question_copy,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.translate('help'),
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n.translate('faq_title'),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ── Support chat button ──
            _buildSection(children: [
              _buildTile(
                icon: Iconsax.message_text_copy,
                iconColor: AppColors.primary,
                iconBg: AppColors.primary.withValues(alpha: 0.1),
                title: l10n.translate('help'),
                subtitle: 'Savol berish',
                trailing: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Yozish',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const SupportChatScreen()),
                  );
                },
              ),
            ]),

            const SizedBox(height: 16),

            // ── Contact section ──
            if (_supportPhone.isNotEmpty)
              _buildSection(children: [
                _buildTile(
                  icon: Iconsax.call_copy,
                  iconColor: AppColors.success,
                  iconBg: AppColors.success.withValues(alpha: 0.1),
                  title: l10n.translate('phone_number'),
                  subtitle: _supportPhone,
                  onTap: () async {
                    final uri = Uri.parse('tel:$_supportPhone');
                    try {
                      await launchUrl(uri);
                    } catch (_) {}
                  },
                ),
              ]),

            if (_supportPhone.isNotEmpty) const SizedBox(height: 16),

            // ── Links section ──
            _buildSection(children: [
              _buildTile(
                icon: Icons.help_outline_rounded,
                iconColor: const Color(0xFF8B5CF6),
                iconBg: const Color(0xFF8B5CF6).withValues(alpha: 0.1),
                title: l10n.translate('faq_title'),
                onTap: () async {
                  final uri = Uri.parse('https://topla.uz/faq');
                  try {
                    await launchUrl(uri,
                        mode: LaunchMode.externalApplication);
                  } catch (_) {}
                },
              ),
              _divider(),
              _buildTile(
                icon: Icons.description_outlined,
                iconColor: const Color(0xFFF59E0B),
                iconBg: const Color(0xFFF59E0B).withValues(alpha: 0.1),
                title: l10n.translate('terms_of_use'),
                onTap: () async {
                  final uri = Uri.parse('https://topla.uz/terms');
                  try {
                    await launchUrl(uri,
                        mode: LaunchMode.externalApplication);
                  } catch (_) {}
                },
              ),
              _divider(),
              _buildTile(
                icon: Icons.shield_outlined,
                iconColor: const Color(0xFF10B981),
                iconBg: const Color(0xFF10B981).withValues(alpha: 0.1),
                title: l10n.translate('privacy_policy'),
                onTap: () async {
                  final uri = Uri.parse('https://topla.uz/privacy');
                  try {
                    await launchUrl(uri,
                        mode: LaunchMode.externalApplication);
                  } catch (_) {}
                },
              ),
            ]),

            const SizedBox(height: 16),

            // ── Social links ──
            _buildSection(children: [
              _buildTile(
                icon: Icons.telegram,
                iconColor: const Color(0xFF0088CC),
                iconBg: const Color(0xFF0088CC).withValues(alpha: 0.1),
                title: 'Telegram',
                subtitle: '@topla_uz',
                onTap: () async {
                  final uri = Uri.parse(_telegramLink);
                  try {
                    await launchUrl(uri,
                        mode: LaunchMode.externalApplication);
                  } catch (_) {}
                },
              ),
              _divider(),
              _buildTile(
                icon: Icons.camera_alt_rounded,
                iconColor: const Color(0xFFE4405F),
                iconBg: const Color(0xFFE4405F).withValues(alpha: 0.1),
                title: 'Instagram',
                subtitle: '@topla.uz',
                onTap: () async {
                  final uri = Uri.parse(_instagramLink);
                  try {
                    await launchUrl(uri,
                        mode: LaunchMode.externalApplication);
                  } catch (_) {}
                },
              ),
            ]),

            const SizedBox(height: 16),

            // ── About section ──
            _buildSection(children: [
              _buildTile(
                icon: Icons.info_outline_rounded,
                iconColor: Colors.grey.shade600,
                iconBg: Colors.grey.shade200,
                title: l10n.translate('about_app'),
                trailing: Text(
                  _appVersion.isNotEmpty ? _appVersion : '...',
                  style: TextStyle(
                    color: Colors.grey.shade400,
                    fontSize: 13,
                  ),
                ),
                onTap: () {},
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({required List<Widget> children}) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(children: children),
    );
  }

  Widget _divider() {
    return Padding(
      padding: const EdgeInsets.only(left: 68),
      child: Divider(height: 1, color: Colors.grey.shade100),
    );
  }

  Widget _buildTile({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    String? subtitle,
    Widget? trailing,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade500,
                      ),
                    ),
                ],
              ),
            ),
            trailing ??
                Icon(
                  Icons.chevron_right,
                  color: Colors.grey.shade300,
                  size: 24,
                ),
          ],
        ),
      ),
    );
  }
}
