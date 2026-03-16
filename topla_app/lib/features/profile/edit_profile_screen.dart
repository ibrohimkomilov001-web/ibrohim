import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/auth_provider.dart';

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

          // Boshqa hisob qoshish tugmasi
          _buildAddAccountButton(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildAvatarSection() {
    final initials = _getInitials();

    return Column(
      children: [
        GestureDetector(
          onTap: _pickImage,
          child: Container(
            width: 90,
            height: 90,
            decoration: const BoxDecoration(
              color: Color(0xFFEEF2FF),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                initials,
                style: const TextStyle(
                  color: Color(0xFF2855C5),
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _pickImage,
          child: const Text(
            'Yangi rasm belgilash',
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
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
                      EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                style: const TextStyle(fontSize: 16),
                cursorColor: Colors.black54,
              ),
              const Divider(height: 1, indent: 16, color: Color(0xFFE5E5EA)),
              TextField(
                controller: _lastNameController,
                decoration: const InputDecoration(
                  hintText: 'Familiya',
                  hintStyle: TextStyle(color: Color(0xFFC4C4C6), fontSize: 16),
                  border: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                style: const TextStyle(fontSize: 16),
                cursorColor: Colors.black54,
              ),
            ],
          ),
        ),
        const Padding(
          padding: EdgeInsets.only(left: 16, top: 8, bottom: 24),
          child: Text(
            "Ismingizni kiriting va ixtiyoriy profil rasmi yoki video qo'shing.",
            style: TextStyle(color: Color(0xFF8E8E93), fontSize: 13),
          ),
        ),

        if (isGoogle) ...[
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: TextField(
              controller: _emailController,
              readOnly: true,
              decoration: const InputDecoration(
                hintText: 'Email',
                border: InputBorder.none,
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
              style: const TextStyle(fontSize: 16, color: Colors.black87),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(left: 16, top: 8, bottom: 24),
            child: Text(
              "Sizning Google hisobingiz pochtasi.",
              style: TextStyle(color: Color(0xFF8E8E93), fontSize: 13),
            ),
          ),
        ],

        // Birthday Section
        Container(
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Tug'ilgan kun", style: TextStyle(fontSize: 16)),
              const Text("Qo'shish",
                  style: TextStyle(fontSize: 16, color: Color(0xFFC4C4C6))),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 16, top: 8, bottom: 24),
          child: RichText(
            text: const TextSpan(
              text:
                  "Tug'ilgan kuningizni faqat kontaktlaringiz ko'rishi mumkin.\n",
              style: TextStyle(
                  color: Color(0xFF8E8E93), fontSize: 13, height: 1.4),
              children: [
                TextSpan(
                  text: "O'zgartirish >",
                  style: TextStyle(color: AppColors.primary),
                ),
              ],
            ),
          ),
        ),

        // Phone Section
        Container(
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
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
                    style:
                        const TextStyle(fontSize: 16, color: Color(0xFF8E8E93)),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right,
                      color: Color(0xFFC4C4C6), size: 20),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAddAccountButton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(context.l10n.translate('coming_soon')),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primary,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Text(
              "Boshqa hisob qo'shish",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.normal),
            ),
          ),
        ),
        const Padding(
          padding: EdgeInsets.only(left: 16, top: 8),
          child: Text(
            "Turli telefon raqamlari bilan to'rttagacha hisob kiritishingiz mumkin.",
            style: TextStyle(color: Color(0xFF8E8E93), fontSize: 13),
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

  void _pickImage() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.l10n.translate('camera_coming_soon')),
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
