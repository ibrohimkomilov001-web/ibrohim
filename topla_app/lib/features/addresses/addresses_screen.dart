import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/services/nominatim_service.dart';
import '../../models/address_model.dart';
import '../../providers/addresses_provider.dart';
import '../../widgets/topla_refresh_indicator.dart';
import 'map_picker_screen.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  @override
  void initState() {
    super.initState();
    // Manzillarni yuklash
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AddressesProvider>().loadAddresses();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text(
          context.l10n.myAddresses,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: Consumer<AddressesProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return _buildErrorState(provider.error!);
          }

          if (provider.isEmpty) {
            return _buildEmptyState();
          }

          return _buildAddressList(provider.addresses);
        },
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: _showAddAddressSheet,
            icon: const Icon(Iconsax.add, size: 20),
            label: Text(
              context.l10n.locale.languageCode == 'ru'
                  ? 'Новый адрес'
                  : 'Yangi manzil',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(26),
              ),
            ),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.warning_2, size: 60, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'Xatolik yuz berdi',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: TextStyle(color: Colors.grey.shade600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              context.read<AddressesProvider>().loadAddresses();
            },
            icon: const Icon(Iconsax.refresh),
            label: const Text('Qayta urinish'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Iconsax.location,
              size: 60,
              color: Colors.grey.shade400,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Manzil yo\'q',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Yetkazib berish uchun manzil qo\'shing',
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressList(List<AddressModel> addresses) {
    return ToplaRefreshIndicator(
      onRefresh: () => context.read<AddressesProvider>().loadAddresses(),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
        itemCount: addresses.length,
        itemBuilder: (context, index) {
          final address = addresses[index];
          return _buildAddressCard(address);
        },
      ),
    );
  }

  Widget _buildAddressCard(AddressModel address) {
    // 1. Determine Colors based on type for "Colorful" look
    Color iconColor;
    Color iconBgColor;
    IconData iconData;

    switch (address.title.toLowerCase()) {
      case 'uy':
      case 'home':
        iconData = Iconsax.home_2;
        iconColor = const Color(0xFF3B82F6); // Blue
        iconBgColor = const Color(0xFFEFF6FF); // Blue 50
        break;
      case 'ish':
      case 'work':
        iconData = Iconsax.briefcase;
        iconColor = const Color(0xFFF97316); // Orange
        iconBgColor = const Color(0xFFFFF7ED); // Orange 50
        break;
      default:
        iconData = Iconsax.location;
        iconColor = const Color(0xFF8B5CF6); // Purple
        iconBgColor = const Color(0xFFF5F3FF); // Purple 50
    }

    final isDefault = address.isDefault;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        // Modern subtle border, highlighted if default
        border: Border.all(
          color: isDefault ? AppColors.primary : Colors.grey.shade200,
          width: isDefault ? 1.5 : 1,
        ),
        boxShadow: [
          if (isDefault)
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _setAsDefault(address.id),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 2. Colorful Icon Wrapper
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    iconData,
                    color: iconColor,
                    size: 22,
                  ),
                ),

                const SizedBox(width: 14),

                // 3. Address Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            address.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              color: Colors.black87,
                            ),
                          ),
                          if (isDefault) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Asosiy', // Default
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        address.fullAddress,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),

                // 4. Edit Action (Cleaner than popup)
                Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Radio button visual for selection
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDefault
                              ? AppColors.primary
                              : Colors.grey.shade300,
                          width: 2,
                        ),
                      ),
                      child: isDefault
                          ? Center(
                              child: Container(
                                width: 10,
                                height: 10,
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(height: 16),
                    // Subtle Edit Button
                    PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'edit') {
                          _showEditAddressSheet(address);
                        } else if (value == 'delete') {
                          _deleteAddress(address);
                        }
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Iconsax.edit_2),
                              SizedBox(width: 12),
                              Text('Tahrirlash'),
                            ],
                          ),
                        ),
                        PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Iconsax.trash, color: AppColors.error),
                              const SizedBox(width: 12),
                              Text(
                                'O\'chirish',
                                style: TextStyle(color: AppColors.error),
                              ),
                            ],
                          ),
                        ),
                      ],
                      child: Padding(
                        padding: const EdgeInsets.all(4.0),
                        child: Icon(
                          Iconsax.more,
                          size: 20,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _setAsDefault(String id) async {
    try {
      await context.read<AddressesProvider>().setAsDefault(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Asosiy manzil o\'zgartirildi'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Xatolik: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _deleteAddress(AddressModel address) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Manzilni o\'chirish'),
        content: const Text('Bu manzilni o\'chirishni xohlaysizmi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Bekor qilish'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('O\'chirish'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await context.read<AddressesProvider>().deleteAddress(address.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Manzil o\'chirildi'),
              backgroundColor: Colors.grey.shade700,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Xatolik: $e'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }

  void _showAddAddressSheet() {
    _showAddressBottomSheet();
  }

  void _showEditAddressSheet(AddressModel address) {
    _showAddressBottomSheet(address: address);
  }

  void _showAddressBottomSheet({
    AddressModel? address,
    String? prefilledAddress,
    double? prefilledLatitude,
    double? prefilledLongitude,
  }) {
    final addressController =
        TextEditingController(text: prefilledAddress ?? address?.address ?? '');
    final apartmentController =
        TextEditingController(text: address?.apartment ?? '');
    final entranceController =
        TextEditingController(text: address?.entrance ?? '');
    final floorController = TextEditingController(text: address?.floor ?? '');
    String selectedType = address?.title ?? 'Uy';
    bool isLoading = false;
    bool isGettingLocation = false;
    double? latitude = prefilledLatitude ?? address?.latitude;
    double? longitude = prefilledLongitude ?? address?.longitude;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Text(
                      address != null ? 'Manzilni tahrirlash' : 'Yangi manzil',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Iconsax.close_circle),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Type selector
                const Text(
                  'Manzil turi',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildTypeChip(
                      'Uy',
                      Iconsax.home_2,
                      selectedType == 'Uy',
                      () => setModalState(() => selectedType = 'Uy'),
                    ),
                    const SizedBox(width: 12),
                    _buildTypeChip(
                      'Ish',
                      Iconsax.building,
                      selectedType == 'Ish',
                      () => setModalState(() => selectedType = 'Ish'),
                    ),
                    const SizedBox(width: 12),
                    _buildTypeChip(
                      'Boshqa',
                      Iconsax.location,
                      selectedType == 'Boshqa',
                      () => setModalState(() => selectedType = 'Boshqa'),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Address input
                const Text(
                  'To\'liq manzil',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: addressController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: 'Tuman, ko\'cha, uy raqami...',
                    filled: true,
                    fillColor: Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                    suffixIcon: IconButton(
                      onPressed: isGettingLocation
                          ? null
                          : () async {
                              setModalState(() => isGettingLocation = true);
                              try {
                                // Lokatsiya ruxsatini tekshirish
                                LocationPermission permission =
                                    await Geolocator.checkPermission();
                                if (permission == LocationPermission.denied) {
                                  permission =
                                      await Geolocator.requestPermission();
                                  if (permission == LocationPermission.denied) {
                                    throw Exception(
                                        'Lokatsiya ruxsati berilmadi');
                                  }
                                }

                                if (permission ==
                                    LocationPermission.deniedForever) {
                                  throw Exception(
                                      'Lokatsiya ruxsati doimiy rad etilgan. Sozlamalardan yoqing.');
                                }

                                // Lokatsiyani olish
                                final position =
                                    await Geolocator.getCurrentPosition(
                                  locationSettings: const LocationSettings(
                                    accuracy: LocationAccuracy.high,
                                  ),
                                );

                                latitude = position.latitude;
                                longitude = position.longitude;

                                // Manzilni Nominatim orqali olish
                                final result =
                                    await NominatimService.reverseGeocode(
                                  latitude: position.latitude,
                                  longitude: position.longitude,
                                );

                                addressController.text = result.shortAddress;

                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                          'Lokatsiya muvaffaqiyatli aniqlandi'),
                                      backgroundColor: Colors.green,
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                }
                              } catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Xatolik: $e'),
                                      backgroundColor: AppColors.error,
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                }
                              } finally {
                                setModalState(() => isGettingLocation = false);
                              }
                            },
                      icon: isGettingLocation
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                          : Icon(
                              Iconsax.location,
                              color: AppColors.primary,
                            ),
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // Xaritadan tanlash tugmasi
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      Navigator.pop(context); // Bottom sheet yopish
                      final result = await Navigator.push<Map<String, dynamic>>(
                        context,
                        MaterialPageRoute(
                          builder: (context) => MapPickerScreen(
                            initialLatitude: latitude,
                            initialLongitude: longitude,
                          ),
                        ),
                      );

                      if (result != null) {
                        // Xaritadan qaytganda bottom sheet ni qayta ochish
                        _showAddressBottomSheet(
                          address: address,
                          prefilledAddress: result['address'] as String?,
                          prefilledLatitude: result['latitude'] as double?,
                          prefilledLongitude: result['longitude'] as double?,
                        );
                      }
                    },
                    icon: const Icon(Iconsax.map),
                    label: const Text('Xaritadan tanlash'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Additional fields
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: apartmentController,
                        decoration: InputDecoration(
                          hintText: 'Kvartira',
                          filled: true,
                          fillColor: Colors.grey.shade100,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: entranceController,
                        decoration: InputDecoration(
                          hintText: 'Kirish',
                          filled: true,
                          fillColor: Colors.grey.shade100,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: floorController,
                        decoration: InputDecoration(
                          hintText: 'Qavat',
                          filled: true,
                          fillColor: Colors.grey.shade100,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Save button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading
                        ? null
                        : () async {
                            if (addressController.text.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Manzilni kiriting'),
                                  backgroundColor: Colors.orange,
                                ),
                              );
                              return;
                            }

                            setModalState(() => isLoading = true);

                            try {
                              final provider =
                                  context.read<AddressesProvider>();

                              if (address != null) {
                                // Update
                                await provider.updateAddress(
                                  id: address.id,
                                  title: selectedType,
                                  address: addressController.text,
                                  apartment: apartmentController.text.isNotEmpty
                                      ? apartmentController.text
                                      : null,
                                  entrance: entranceController.text.isNotEmpty
                                      ? entranceController.text
                                      : null,
                                  floor: floorController.text.isNotEmpty
                                      ? floorController.text
                                      : null,
                                  latitude: latitude,
                                  longitude: longitude,
                                );
                              } else {
                                // Create
                                await provider.addAddress(
                                  title: selectedType,
                                  address: addressController.text,
                                  apartment: apartmentController.text.isNotEmpty
                                      ? apartmentController.text
                                      : null,
                                  entrance: entranceController.text.isNotEmpty
                                      ? entranceController.text
                                      : null,
                                  floor: floorController.text.isNotEmpty
                                      ? floorController.text
                                      : null,
                                  latitude: latitude,
                                  longitude: longitude,
                                );
                              }

                              if (context.mounted) {
                                Navigator.pop(context);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(address != null
                                        ? 'Manzil yangilandi'
                                        : 'Manzil qo\'shildi'),
                                    backgroundColor: AppColors.success,
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                              }
                            } catch (e) {
                              setModalState(() => isLoading = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Xatolik: $e'),
                                    backgroundColor: AppColors.error,
                                  ),
                                );
                              }
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(address != null ? 'Saqlash' : 'Qo\'shish'),
                  ),
                ),

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTypeChip(
    String label,
    IconData icon,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? Colors.white : Colors.grey.shade600,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey.shade700,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
