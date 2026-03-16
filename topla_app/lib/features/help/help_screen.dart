import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import 'support_chat_screen.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  String _appVersion = '';
  bool _showSocialLinks = false;

  @override
  void initState() {
    super.initState();
    _loadAppVersion();
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
      if (mounted) {
        setState(() => _appVersion = 'v1.0.0');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text(
          l10n.translate('help'),
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Yordam chati section ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Yordam chati card
                  InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const SupportChatScreen()),
                      );
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Icon(
                              Iconsax.message_text,
                              color: AppColors.primary,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Yordam chati',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Savollaringizga tez javob oling',
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
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
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            _buildAppInfo(l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildAppInfo(AppLocalizations l10n) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildInfoRow(
            icon: Icons.help_outline_rounded,
            title: l10n.translate('faq_title'),
            onTap: () async {
              final uri = Uri.parse('https://topla.uz/faq');
              try {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              } catch (_) {}
            },
          ),
          Divider(height: 24, color: Colors.grey.shade200),
          _buildInfoRow(
            icon: Icons.description_outlined,
            title: l10n.translate('terms_of_use'),
            onTap: () async {
              final uri = Uri.parse('https://topla.uz/terms');
              try {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              } catch (_) {}
            },
          ),
          Divider(height: 24, color: Colors.grey.shade200),
          _buildInfoRow(
            icon: Icons.shield_outlined,
            title: l10n.translate('privacy_policy'),
            onTap: () async {
              final uri = Uri.parse('https://topla.uz/privacy');
              try {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              } catch (_) {}
            },
          ),
          Divider(height: 24, color: Colors.grey.shade200),
          _buildInfoRow(
            icon: Icons.info_outline_rounded,
            title: l10n.translate('about_app'),
            trailing: Text(
              _appVersion.isNotEmpty ? _appVersion : '...',
              style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 14,
              ),
            ),
            onTap: () {},
          ),
          Divider(height: 24, color: Colors.grey.shade200),
          _buildInfoRow(
            icon: Icons.share_rounded,
            title: 'Ijtimoiy tarmoqlar',
            trailing: AnimatedRotation(
              turns: _showSocialLinks ? 0.25 : 0,
              duration: const Duration(milliseconds: 200),
              child: Icon(
                Icons.chevron_right,
                color: Colors.grey.shade300,
                size: 28,
              ),
            ),
            onTap: () {
              setState(() => _showSocialLinks = !_showSocialLinks);
            },
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildSocialIcon(
                    'Telegram',
                    'https://t.me/topla_uz',
                    const Color(0xFF0088CC),
                    Icons.telegram,
                  ),
                  _buildSocialIcon(
                    'Instagram',
                    'https://instagram.com/topla.uz',
                    const Color(0xFFE4405F),
                    Icons.camera_alt_rounded,
                  ),
                  _buildSocialIcon(
                    'Facebook',
                    'https://facebook.com/topla.uz',
                    const Color(0xFF1877F2),
                    Icons.facebook_rounded,
                  ),
                  _buildSocialIcon(
                    'YouTube',
                    'https://youtube.com/@topla_uz',
                    const Color(0xFFFF0000),
                    Icons.play_circle_fill_rounded,
                  ),
                ],
              ),
            ),
            crossFadeState: _showSocialLinks
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 300),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String title,
    Widget? trailing,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, color: Colors.black87, size: 22),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          trailing ??
              Icon(
                Icons.chevron_right,
                color: Colors.grey.shade300,
                size: 28,
              ),
        ],
      ),
    );
  }

  Widget _buildSocialIcon(
    String label,
    String url,
    Color color,
    IconData icon,
  ) {
    return GestureDetector(
      onTap: () async {
        final uri = Uri.parse(url);
        try {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } catch (_) {}
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
