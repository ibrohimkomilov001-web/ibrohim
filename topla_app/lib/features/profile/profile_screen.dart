import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../models/user_role.dart';
import '../../models/user_profile.dart';
import '../../providers/providers.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final isLoggedIn = authProvider.isLoggedIn;
        final profile = authProvider.profile;

        if (authProvider.isLoading) {
          return Scaffold(
            appBar: AppBar(
              title: Text(
                context.l10n.profile,
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 17),
              ),
            ),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF5F5F5),
          body: SafeArea(
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  const SizedBox(height: 12),

                  // Error
                  if (authProvider.error != null)
                    _buildErrorBanner(authProvider.error!),

                  // Header
                  isLoggedIn
                      ? _buildLoggedInHeader(profile)
                      : _buildGuestHeader(),

                  const SizedBox(height: 8),

                  // Menu
                  if (isLoggedIn) ...[
                    _buildShoppingSection(),
                    const SizedBox(height: 8),
                  ],
                  _buildAccountSection(isLoggedIn),
                  const SizedBox(height: 8),
                  _buildSettingsSection(isLoggedIn),

                  const SizedBox(height: 8),

                  // Logout
                  if (isLoggedIn) _buildLogoutButton(),

                  // App version
                  _buildAppVersion(),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildErrorBanner(String error) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red.shade400, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              error,
              style: TextStyle(color: Colors.red.shade700, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuestHeader() {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/auth'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        decoration: BoxDecoration(
          color: const Color(0xFFF5F6FE),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFEEF0FC),
          ),
        ),
        child: Row(
          children: [
            // Avatar icon
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0xFFE6E8FD),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person_outline_rounded,
                color: Color(0xFF3B5BDB),
                size: 30,
              ),
            ),
            const SizedBox(width: 16),
            // Text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    context.l10n.translate('login_to_profile'),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1F2937),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    context.l10n.translate('via_phone'),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade500,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            // Chevron
            Icon(
              Icons.chevron_right_rounded,
              color: const Color(0xFF9CA3AF).withValues(alpha: 0.7),
              size: 26,
            ),
            const SizedBox(width: 4),
          ],
        ),
      ),
    );
  }

  Widget _buildLoggedInHeader(UserProfile? profile) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
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
      child: Row(
        children: [
          // Avatar
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              image: profile?.avatarUrl != null
                  ? DecorationImage(
                      image: CachedNetworkImageProvider(profile!.avatarUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: profile?.avatarUrl == null
                ? const Icon(Icons.person_outline,
                    color: AppColors.primary, size: 26)
                : null,
          ),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile?.fullName ??
                      profile?.firstName ??
                      context.l10n.translate('user'),
                  style: const TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  // google_ placeholder ni ko'rsatmaslik
                  (profile?.phone != null &&
                          !profile!.phone!.startsWith('google_'))
                      ? profile.phone!
                      : profile?.email ?? '',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                ),
              ],
            ),
          ),
          // Edit
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => EditProfileScreen(
                    profile: {
                      'first_name': profile?.firstName ?? '',
                      'last_name': profile?.lastName ?? '',
                      'phone': profile?.phone ?? '',
                      'email': profile?.email ?? '',
                    },
                  ),
                ),
              ).then((result) {
                if (result == true && mounted) {
                  Provider.of<AuthProvider>(context, listen: false)
                      .loadProfile();
                }
              });
            },
            child: Container(
              width: 32,
              height: 32,
              color: Colors.transparent,
              child: const Icon(Iconsax.edit_2_copy,
                  color: AppColors.primary, size: 20),
            ),
          ),
        ],
      ),
    );
  }

  // ===== Shopping Section =====
  Widget _buildShoppingSection() {
    return _buildGroupCard(
      title: context.l10n.translate('shopping'),
      children: [
        _buildMenuItem(
          icon: Iconsax.clipboard_text_copy,
          label: context.l10n.myOrders,
          iconColor: Colors.blue,
          onTap: () => Navigator.pushNamed(context, '/orders'),
        ),
        _divider(),
        _buildMenuItem(
          icon: Iconsax.box_tick_copy,
          label: context.l10n.translate('purchased_products'),
          iconColor: Colors.green,
          onTap: () => Navigator.pushNamed(context, '/purchased-products'),
        ),
        _divider(),
        _buildMenuItem(
          icon: Iconsax.refresh_left_square_copy,
          label: context.l10n.translate('returns'),
          iconColor: Colors.orange,
          onTap: () => Navigator.pushNamed(context, '/returns'),
        ),
        _divider(),
        _buildMenuItem(
          icon: Iconsax.star_copy,
          label: context.l10n.translate('reviews_and_questions'),
          iconColor: Colors.amber,
          onTap: () => Navigator.pushNamed(context, '/reviews-questions'),
        ),
      ],
    );
  }

  // ===== Account Section =====
  Widget _buildAccountSection(bool isLoggedIn) {
    return _buildGroupCard(
      title: context.l10n.translate('account'),
      children: [
        if (isLoggedIn) ...[
          _buildMenuItem(
            icon: Iconsax.heart_copy,
            label: context.l10n.favorites,
            iconColor: Colors.red,
            onTap: () => Navigator.pushNamed(context, '/favorites'),
          ),
          _divider(),
        ],
        _buildMenuItem(
          icon: Iconsax.location_copy,
          label: context.l10n.myAddresses,
          iconColor: Colors.purple,
          onTap: () => Navigator.pushNamed(context, '/addresses'),
          showLogin: !isLoggedIn,
        ),
        _divider(),
        _buildMenuItem(
          icon: Iconsax.card_copy,
          label: context.l10n.paymentMethod,
          iconColor: Colors.teal,
          onTap: () => Navigator.pushNamed(context, '/payment-methods'),
          showLogin: !isLoggedIn,
        ),
        _divider(),
        _buildMenuItem(
          icon: Iconsax.people_copy,
          label: context.l10n.inviteFriends,
          iconColor: Colors.indigo,
          onTap: () => Navigator.pushNamed(context, '/invite'),
          showLogin: !isLoggedIn,
        ),
        if (isLoggedIn) ...[
          _divider(),
          _buildMenuItem(
            icon: Iconsax.mobile_copy,
            label: context.l10n.translate('devices'),
            subtitle: context.l10n.translate('manage_devices'),
            iconColor: Colors.cyan,
            onTap: () => Navigator.pushNamed(context, '/devices'),
          ),
        ],
      ],
    );
  }

  // ===== Settings Section =====
  Widget _buildSettingsSection(bool isLoggedIn) {
    return _buildGroupCard(
      children: [
        Consumer<SettingsProvider>(
          builder: (context, settings, _) => _buildMenuItem(
            icon: Iconsax.global_copy,
            label: context.l10n.language,
            iconColor: Colors.blueGrey,
            trailing: Text(
              settings.language == 'uz' ? 'O\'zbek' : 'Русский',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
            ),
            onTap: () => _showLanguageBottomSheet(),
          ),
        ),
        _divider(),
        _buildMenuItem(
          icon: Iconsax.message_question_copy,
          label: context.l10n.helpCenter,
          iconColor: Colors.lightBlue,
          onTap: () => Navigator.pushNamed(context, '/help'),
        ),
        // Vendor / Admin / Open Shop
        if (isLoggedIn) ...[
          _divider(),
          Consumer<AuthProvider>(
            builder: (context, authProvider, _) {
              final profile = authProvider.profile;
              if (profile == null) return const SizedBox.shrink();

              final role = profile.role;

              if (role == UserRole.vendor) {
                return _buildMenuItem(
                  icon: Iconsax.shop_copy,
                  label: context.l10n.translate('my_shop'),
                  iconColor: AppColors.accent,
                  onTap: () => Navigator.pushNamed(context, '/mobile-vendor'),
                );
              }

              // Regular user and admin - open shop option
              // Admin uchun web panel ishlatiladi
              if (!role.isAdmin) {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildMenuItem(
                      icon: Iconsax.shop_add_copy,
                      label: context.l10n.translate('open_shop'),
                      subtitle: context.l10n.translate('become_seller'),
                      iconColor: Colors.orange.shade700,
                      onTap: () => _openVendorWebsite(),
                    ),
                    _divider(),
                    _buildMenuItem(
                      icon: Iconsax.location_copy,
                      label: context.l10n.translate('open_pickup_point'),
                      subtitle: context.l10n.translate('become_pickup_partner'),
                      iconColor: Colors.teal.shade600,
                      onTap: () => _openPickupPartnerWebsite(),
                    ),
                  ],
                );
              }

              return const SizedBox.shrink();
            },
          ),
        ],
      ],
    );
  }

  // ===== Group Card =====
  Widget _buildGroupCard({String? title, required List<Widget> children}) {
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
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.only(left: 14, top: 12, bottom: 2),
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade400,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ...children,
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String label,
    String? subtitle,
    Widget? trailing,
    Color? iconColor,
    bool showLogin = false,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: showLogin ? () => Navigator.pushNamed(context, '/auth') : onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Icon(
              icon,
              color: iconColor ?? Colors.grey.shade700,
              size: 20,
            ),
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
            if (showLogin)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  context.l10n.login,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
            else if (trailing != null)
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

  Widget _buildLogoutButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SizedBox(
        width: double.infinity,
        height: 42,
        child: OutlinedButton.icon(
          onPressed: () => _showLogoutDialog(),
          icon: Icon(Iconsax.logout_copy, color: Colors.red.shade400, size: 17),
          label: Text(
            context.l10n.logout,
            style: TextStyle(
              color: Colors.red.shade400,
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
          style: OutlinedButton.styleFrom(
            side: BorderSide(color: Colors.red.shade200),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAppVersion() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Text(
        'topla • ${context.l10n.translate('version')} 1.0.0',
        style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
      ),
    );
  }

  // ===== Dialogs & Bottom Sheets =====

  void _openVendorWebsite() async {
    final uri = Uri.parse('https://vendor.topla.uz');
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('cannot_open_site')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _openPickupPartnerWebsite() async {
    final uri = Uri.parse('https://pickup.topla.uz');
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('cannot_open_site')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showLanguageBottomSheet() {
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

  void _showLogoutDialog() {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(
          context.l10n.translate('logout_question'),
          style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade700),
        ),
        actions: [
          CupertinoActionSheetAction(
            isDestructiveAction: true,
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().signOut();
            },
            child: Text(
              context.l10n.translate('logout_action'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx),
          child: Text(
            context.l10n.translate('cancel'),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade800,
            ),
          ),
        ),
      ),
    );
  }
}
