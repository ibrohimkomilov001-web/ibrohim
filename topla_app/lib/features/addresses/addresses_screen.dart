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
        actions: [
          IconButton(
            onPressed: _showAddAddressSheet,
            icon: const Icon(Icons.add, size: 26),
          ),
        ],
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
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
        itemCount: addresses.length,
        itemBuilder: (context, index) {
          final address = addresses[index];
          return _buildAddressCard(address);
        },
      ),
    );
  }

  Widget _buildAddressCard(AddressModel address) {
    IconData iconData;

    switch (address.title.toLowerCase()) {
      case 'uy':
      case 'home':
        iconData = Iconsax.home_2;
        break;
      case 'ish':
      case 'work':
        iconData = Iconsax.briefcase;
        break;
      default:
        iconData = Iconsax.location;
    }

    final isDefault = address.isDefault;

    return Dismissible(
      key: Key(address.id),
      background: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
        ),
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 24),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Iconsax.edit_2, color: AppColors.primary, size: 20),
            SizedBox(width: 8),
            Text('Tahrirlash',
                style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500,
                    fontSize: 13)),
          ],
        ),
      ),
      secondaryBackground: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppColors.error.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('O\'chirish',
                style: TextStyle(
                    color: AppColors.error,
                    fontWeight: FontWeight.w500,
                    fontSize: 13)),
            const SizedBox(width: 8),
            Icon(Iconsax.trash, color: AppColors.error, size: 20),
          ],
        ),
      ),
      confirmDismiss: (direction) async {
        if (direction == DismissDirection.startToEnd) {
          // Chapdan o'ngga — Tahrirlash
          _showEditAddressSheet(address);
          return false;
        } else {
          // O'ngdan chapga — O'chirish
          return await _confirmDelete(address);
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDefault
                ? AppColors.primary.withOpacity(0.3)
                : Colors.grey.shade200,
            width: 1,
          ),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _setAsDefault(address.id),
            borderRadius: BorderRadius.circular(14),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  // Icon
                  Icon(
                    iconData,
                    color: Colors.black54,
                    size: 22,
                  ),

                  const SizedBox(width: 12),

                  // Address Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              address.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: Colors.black87,
                              ),
                            ),
                            if (isDefault) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'Asosiy',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          address.fullAddress,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<bool> _confirmDelete(AddressModel address) async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Trash icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Iconsax.trash,
                  color: AppColors.error,
                  size: 24,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Manzilni o\'chirish',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '"${address.title}" manzilini o\'chirishni xohlaysizmi?',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade500,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              // Buttons
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context, false),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          'Bekor qilish',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.error,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'O\'chirish',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
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
        return true;
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
    return false;
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
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                // Header
                Row(
                  children: [
                    Text(
                      address != null ? 'Manzilni tahrirlash' : 'Yangi manzil',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Icon(Icons.close,
                          size: 22, color: Colors.grey.shade500),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                // Type selector
                const Text(
                  'Manzil turi',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 13,
                    color: Colors.black54,
                  ),
                ),
                const SizedBox(height: 8),
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

                const SizedBox(height: 16),

                // Address input
                const Text(
                  'To\'liq manzil',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 13,
                    color: Colors.black54,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: addressController,
                  maxLines: 2,
                  style: const TextStyle(fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Tuman, ko\'cha, uy raqami...',
                    hintStyle:
                        TextStyle(color: Colors.grey.shade400, fontSize: 14),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
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

                                // Strukturalangan manzil: viloyat, tuman, ko'cha ketma-ketligida
                                addressController.text =
                                    result.structuredAddress;

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
                              Iconsax.gps,
                              color: Colors.grey.shade600,
                            ),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Xaritadan tanlash tugmasi
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      Navigator.pop(context);
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
                        _showAddressBottomSheet(
                          address: address,
                          prefilledAddress: result['address'] as String?,
                          prefilledLatitude: result['latitude'] as double?,
                          prefilledLongitude: result['longitude'] as double?,
                        );
                      }
                    },
                    icon: Icon(Iconsax.map,
                        size: 18, color: Colors.grey.shade600),
                    label: Text('Xaritadan tanlash',
                        style: TextStyle(
                            fontSize: 13, color: Colors.grey.shade700)),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.grey.shade300),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 14),

                // Additional fields
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: apartmentController,
                        style: const TextStyle(fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Kvartira',
                          hintStyle: TextStyle(
                              color: Colors.grey.shade400, fontSize: 14),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: entranceController,
                        style: const TextStyle(fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Kirish',
                          hintStyle: TextStyle(
                              color: Colors.grey.shade400, fontSize: 14),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                TextField(
                  controller: floorController,
                  decoration: InputDecoration(
                    hintText: 'Qavat',
                    hintStyle:
                        TextStyle(color: Colors.grey.shade400, fontSize: 14),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Save button
                SizedBox(
                  width: double.infinity,
                  height: 48,
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
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            address != null ? 'Saqlash' : 'Qo\'shish',
                            style: const TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w500),
                          ),
                  ),
                ),

                const SizedBox(height: 12),
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.08)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected
                ? AppColors.primary.withOpacity(0.4)
                : Colors.grey.shade200,
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? AppColors.primary : Colors.grey.shade500,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: isSelected ? AppColors.primary : Colors.grey.shade600,
                fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
