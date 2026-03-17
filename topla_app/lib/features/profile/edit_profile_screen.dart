import 'dart:io';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/orders_provider.dart';
import '../../providers/products_provider.dart';
import 'devices_screen.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic>? profile;

  const EditProfileScreen({super.key, this.profile});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;

  bool _isLoading = false;
  bool _hasPhone = false;
  File? _selectedImage;
  DateTime? _birthday;
  String _avatarUrl = '';

  // Track changes
  String _initialFirstName = '';
  String _initialLastName = '';
  String _initialEmail = '';
  String _initialPhone = '';
  bool _isChanged = false;

  @override
  void initState() {
    super.initState();
    final phone = widget.profile?['phone'] ?? '';
    // Google placeholder telefon raqamini haqiqiy deb qabul qilmaslik
    _hasPhone = phone.isNotEmpty &&
        !phone.contains('XX') &&
        !phone.startsWith('google_');

    _initialFirstName = widget.profile?['first_name'] ?? '';
    _initialLastName = widget.profile?['last_name'] ?? '';
    _initialEmail = widget.profile?['email'] ?? '';
    _initialPhone = _hasPhone ? phone : '';
    _avatarUrl = widget.profile?['avatar_url'] ?? '';

    // Google orqali kirganida ism to'liq first_name'da bo'lishi mumkin
    if (_initialLastName.isEmpty && _initialFirstName.contains(' ')) {
      final parts = _initialFirstName.split(RegExp(r'\s+'));
      _initialFirstName = parts.first;
      _initialLastName = parts.sublist(1).join(' ');
    }

    _firstNameController = TextEditingController(text: _initialFirstName);
    _lastNameController = TextEditingController(text: _initialLastName);
    _emailController = TextEditingController(text: _initialEmail);

    _firstNameController.addListener(_checkForChanges);
    _lastNameController.addListener(_checkForChanges);
    _emailController.addListener(_checkForChanges);
  }

  void _checkForChanges() {
    final hasChanges = _firstNameController.text != _initialFirstName ||
        _lastNameController.text != _initialLastName ||
        _emailController.text != _initialEmail;

    if (hasChanges != _isChanged) {
      setState(() => _isChanged = hasChanges);
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7), // iOS style background
      appBar: AppBar(
        title: const Text(
          'Profilni tahrirlash',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 17),
        ),
        backgroundColor: const Color(0xFFF2F2F7),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.primary),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isChanged)
            IconButton(
              icon: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.check, color: AppColors.primary),
              onPressed: _isLoading ? null : _saveProfile,
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        children: [
          // Avatar Section
          _buildAvatarSection(),

          const SizedBox(height: 32),

          // Form Section
          _buildForm(),

          const SizedBox(height: 8),

          // Qurilmalar
          _buildDevicesButton(),
          const SizedBox(height: 24),

          // Chiqish
          _buildLogoutButton(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildAvatarSection() {
    final initials = _getInitials();

    Widget avatarContent;
    if (_selectedImage != null) {
      avatarContent = ClipOval(
        child: Image.file(
          _selectedImage!,
          width: 90,
          height: 90,
          fit: BoxFit.cover,
        ),
      );
    } else if (_avatarUrl.isNotEmpty) {
      avatarContent = ClipOval(
        child: Image.network(
          _avatarUrl,
          width: 90,
          height: 90,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildInitialsAvatar(initials),
        ),
      );
    } else {
      avatarContent = _buildInitialsAvatar(initials);
    }

    return Column(
      children: [
        GestureDetector(
          onTap: _pickImage,
          child: SizedBox(width: 90, height: 90, child: avatarContent),
        ),
        const SizedBox(height: 10),
        GestureDetector(
          onTap: _pickImage,
          child: const Text(
            'Yangi rasm belgilash',
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInitialsAvatar(String initials) {
    return Container(
      width: 90,
      height: 90,
      decoration: const BoxDecoration(
        color: Color(0xFFE8F5E9),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(
            color: Color(0xFF66BB6A),
            fontSize: 32,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    final isGoogle =
        widget.profile?['is_google'] == true || _initialEmail.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              TextField(
                controller: _firstNameController,
                decoration: const InputDecoration(
                  hintText: 'Ism',
                  hintStyle: TextStyle(color: Color(0xFFC4C4C6), fontSize: 16),
                  border: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  isDense: true,
                ),
                style: const TextStyle(fontSize: 16),
                cursorColor: Colors.black54,
              ),
              const Divider(
                  height: 1,
                  indent: 16,
                  endIndent: 16,
                  color: Color(0xFFE5E5EA)),
              TextField(
                controller: _lastNameController,
                decoration: const InputDecoration(
                  hintText: 'Familiya',
                  hintStyle: TextStyle(color: Color(0xFFC4C4C6), fontSize: 16),
                  border: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  isDense: true,
                ),
                style: const TextStyle(fontSize: 16),
                cursorColor: Colors.black54,
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        if (isGoogle) ...[
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
            ),
            clipBehavior: Clip.antiAlias,
            child: TextField(
              controller: _emailController,
              readOnly: true,
              decoration: const InputDecoration(
                hintText: 'Email',
                border: InputBorder.none,
                focusedBorder: InputBorder.none,
                enabledBorder: InputBorder.none,
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                isDense: true,
              ),
              style: const TextStyle(fontSize: 16, color: Colors.black87),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Birthday Section
        GestureDetector(
          onTap: _pickBirthday,
          child: Container(
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Tug'ilgan kun", style: TextStyle(fontSize: 16)),
                Text(
                  _birthday != null
                      ? '${_birthday!.day.toString().padLeft(2, '0')}.${_birthday!.month.toString().padLeft(2, '0')}.${_birthday!.year}'
                      : "Qo'shish",
                  style: TextStyle(
                    fontSize: 16,
                    color: _birthday != null
                        ? const Color(0xFF8E8E93)
                        : const Color(0xFFC4C4C6),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Phone Section
        GestureDetector(
          onTap: _changePhone,
          child: Container(
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Raqamni almashtirish",
                    style: TextStyle(fontSize: 16)),
                Row(
                  children: [
                    Text(
                      _hasPhone ? _initialPhone : "Qo'shish",
                      style: const TextStyle(
                          fontSize: 16, color: Color(0xFF8E8E93)),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right,
                        color: Color(0xFFC4C4C6), size: 20),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _getInitials() {
    final first = _firstNameController.text.trim();
    final last = _lastNameController.text.trim();

    if (first.isEmpty && last.isEmpty) return 'U';

    String initials = '';
    if (first.isNotEmpty) initials += first[0].toUpperCase();
    if (last.isNotEmpty) {
      if (initials.isEmpty) {
        initials += last[0].toUpperCase();
      } else {
        // Just take the first characters of name + surname
        initials += last[0].toUpperCase();
      }
    }

    return initials.isEmpty ? 'U' : initials;
  }

  Future<void> _pickImage() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Kamera'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Galereya'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: source,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 80,
    );

    if (picked != null) {
      setState(() {
        _selectedImage = File(picked.path);
        _isChanged = true;
      });
    }
  }

  Future<void> _pickBirthday() async {
    final now = DateTime.now();
    final initial = _birthday ?? DateTime(2000, 1, 1);

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1930),
      lastDate: now,
      locale: const Locale('uz'),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: AppColors.primary,
                ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _birthday = picked;
        _isChanged = true;
      });
    }
  }

  void _changePhone() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Tez orada ishlaydi'),
      ),
    );
  }

  Widget _buildDevicesButton() {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const DevicesScreen()),
        );
      },
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Icon(Iconsax.mobile_copy,
                    color: Color(0xFF8E8E93), size: 20),
                const SizedBox(width: 10),
                const Text("Qurilmalar", style: TextStyle(fontSize: 16)),
              ],
            ),
            const Icon(Icons.chevron_right, color: Color(0xFFC4C4C6), size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      height: 44,
      child: OutlinedButton.icon(
        onPressed: () => _showLogoutDialog(),
        icon: Icon(Iconsax.logout_copy, color: Colors.red.shade400, size: 17),
        label: Text(
          context.l10n.translate('logout'),
          style: TextStyle(
            color: Colors.red.shade400,
            fontWeight: FontWeight.w500,
            fontSize: 15,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Colors.red.shade200),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(100),
          ),
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
              context.read<OrdersProvider>().clearOnLogout();
              context.read<CartProvider>().clearOnLogout();
              context.read<ProductsProvider>().clearFavoritesOnLogout();
              await context.read<AuthProvider>().signOut();
              if (mounted) {
                Navigator.pop(context);
              }
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

  Future<void> _saveProfile() async {
    if (_firstNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.translate('enter_full_name')),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final firstName = _firstNameController.text.trim();
      final lastName = _lastNameController.text.trim();

      await context.read<AuthProvider>().updateProfile(
            firstName: firstName,
            lastName: lastName,
            email: _emailController.text.trim().isEmpty
                ? null
                : _emailController.text.trim(),
            phone: widget.profile?['phone'],
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('profile_updated')),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${context.l10n.translate('error')}: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}
