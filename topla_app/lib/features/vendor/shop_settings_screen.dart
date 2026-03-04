import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/services/api_client.dart';
import '../../models/shop_model.dart';
import '../../services/vendor_service.dart';

/// Do'kon sozlamalari ekrani
class ShopSettingsScreen extends StatefulWidget {
  final ShopModel shop;

  const ShopSettingsScreen({super.key, required this.shop});

  @override
  State<ShopSettingsScreen> createState() => _ShopSettingsScreenState();
}

class _ShopSettingsScreenState extends State<ShopSettingsScreen> {
  late TextEditingController _nameController;
  late TextEditingController _descriptionController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  bool _isLoading = false;
  bool _isUploadingLogo = false;
  bool _isUploadingBanner = false;

  // Current images (updated after upload)
  String? _currentLogoUrl;
  String? _currentBannerUrl;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.shop.name);
    _descriptionController =
        TextEditingController(text: widget.shop.description ?? '');
    _phoneController = TextEditingController(text: widget.shop.phone ?? '');
    _emailController = TextEditingController(text: widget.shop.email ?? '');
    _addressController = TextEditingController(text: widget.shop.address ?? '');
    _cityController = TextEditingController(text: widget.shop.city ?? '');
    _currentLogoUrl = widget.shop.logoUrl;
    _currentBannerUrl = widget.shop.bannerUrl;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadLogo() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );

    if (image == null) return;

    setState(() => _isUploadingLogo = true);

    try {
      final url = await _uploadImage(image, 'logo');
      await VendorService.updateShop(
        shopId: widget.shop.id,
        logoUrl: url,
      );
      setState(() => _currentLogoUrl = url);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('logo_uploaded')),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${context.l10n.translate('error')}: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isUploadingLogo = false);
    }
  }

  Future<void> _pickAndUploadBanner() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      maxHeight: 400,
      imageQuality: 85,
    );

    if (image == null) return;

    setState(() => _isUploadingBanner = true);

    try {
      final url = await _uploadImage(image, 'banner');
      await VendorService.updateShop(
        shopId: widget.shop.id,
        bannerUrl: url,
      );
      setState(() => _currentBannerUrl = url);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('banner_uploaded')),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${context.l10n.translate('error')}: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isUploadingBanner = false);
    }
  }

  Future<String> _uploadImage(XFile image, String type) async {
    final api = ApiClient();
    final response = await api.upload(
      '/upload/image',
      filePath: image.path,
      fieldName: 'image',
      fields: {'folder': 'shops'},
    );
    return response.dataMap['url'] as String;
  }

  Future<void> _saveSettings() async {
    if (_nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.translate('enter_shop_name')),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await VendorService.updateShop(
        shopId: widget.shop.id,
        name: _nameController.text,
        description: _descriptionController.text.isNotEmpty
            ? _descriptionController.text
            : null,
        phone: _phoneController.text.isNotEmpty ? _phoneController.text : null,
        email: _emailController.text.isNotEmpty ? _emailController.text : null,
        address:
            _addressController.text.isNotEmpty ? _addressController.text : null,
        city: _cityController.text.isNotEmpty ? _cityController.text : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('settings_saved')),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${context.l10n.translate('error')}: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.translate('shop_settings')),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveSettings,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    context.l10n.translate('save'),
                    style: const TextStyle(color: Colors.white),
                  ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Banner section
          Stack(
            children: [
              Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  image: _currentBannerUrl != null
                      ? DecorationImage(
                          image: CachedNetworkImageProvider(_currentBannerUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: _currentBannerUrl == null
                    ? Center(
                        child: Icon(
                          Iconsax.image,
                          size: 40,
                          color: AppColors.primary.withValues(alpha: 0.5),
                        ),
                      )
                    : null,
              ),
              Positioned(
                right: 8,
                bottom: 8,
                child: InkWell(
                  onTap: _isUploadingBanner ? null : _pickAndUploadBanner,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: _isUploadingBanner
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Iconsax.gallery_edit, size: 20),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              context.l10n.translate('banner_image_hint'),
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ),

          const SizedBox(height: 24),

          // Logo section
          Center(
            child: Column(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                      backgroundImage: _currentLogoUrl != null
                          ? CachedNetworkImageProvider(_currentLogoUrl!)
                          : null,
                      child: _currentLogoUrl == null
                          ? Icon(Iconsax.shop,
                              size: 40, color: AppColors.primary)
                          : null,
                    ),
                    if (_isUploadingLogo)
                      const Positioned.fill(
                        child: CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.black38,
                          child: CircularProgressIndicator(color: Colors.white),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: _isUploadingLogo ? null : _pickAndUploadLogo,
                  icon: const Icon(Iconsax.gallery_edit),
                  label: Text(context.l10n.translate('change_logo')),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Status
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: widget.shop.isVerified
                  ? Colors.green.withValues(alpha: 0.1)
                  : Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  widget.shop.isVerified
                      ? Iconsax.verify_copy
                      : Iconsax.warning_2,
                  color: widget.shop.isVerified ? Colors.green : Colors.orange,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.shop.isVerified
                            ? context.l10n.translate('verified')
                            : context.l10n.translate('not_verified'),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: widget.shop.isVerified
                              ? Colors.green
                              : Colors.orange,
                        ),
                      ),
                      Text(
                        widget.shop.isVerified
                            ? context.l10n.translate('shop_active')
                            : context.l10n.translate('awaiting_verification'),
                        style: TextStyle(
                          fontSize: 12,
                          color: widget.shop.isVerified
                              ? Colors.green.shade700
                              : Colors.orange.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Form fields
          Text(
            context.l10n.translate('basic_info'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: context.l10n.translate('shop_name'),
              prefixIcon: const Icon(Iconsax.shop),
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _descriptionController,
            decoration: InputDecoration(
              labelText: context.l10n.translate('description_label'),
              prefixIcon: const Icon(Iconsax.document_text),
              border: const OutlineInputBorder(),
            ),
            maxLines: 3,
          ),

          const SizedBox(height: 24),

          Text(
            context.l10n.translate('contact_info'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _phoneController,
            decoration: InputDecoration(
              labelText: context.l10n.translate('phone_label'),
              prefixIcon: const Icon(Iconsax.call),
              border: const OutlineInputBorder(),
            ),
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Iconsax.sms),
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.emailAddress,
          ),

          const SizedBox(height: 24),

          Text(
            context.l10n.translate('address_section'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _cityController,
            decoration: InputDecoration(
              labelText: context.l10n.translate('city_label'),
              prefixIcon: const Icon(Iconsax.location),
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _addressController,
            decoration: InputDecoration(
              labelText: context.l10n.translate('address_section'),
              prefixIcon: const Icon(Iconsax.map),
              border: const OutlineInputBorder(),
            ),
          ),

          const SizedBox(height: 24),

          // Commission info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.l10n.translate('commission_label'),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(context.l10n.translate('current_rate')),
                    Text(
                      '${widget.shop.commissionRate}%',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  context.l10n.translate('deducted_per_sale_short'),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
