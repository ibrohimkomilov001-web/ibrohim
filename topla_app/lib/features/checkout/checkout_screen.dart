import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/utils/haptic_utils.dart';
import '../../core/services/nominatim_service.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../services/payment_service.dart';
import '../addresses/map_picker_screen.dart';
import 'order_success_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final double promoDiscount;
  final String? promoCodeId;

  const CheckoutScreen({
    super.key,
    this.promoDiscount = 0,
    this.promoCodeId,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _isLoading = false;

  // Manzil
  String? _selectedAddressId;

  // Promo kod
  late double _promoDiscount;

  // To'lov usuli
  String _paymentMethod = 'cash'; // cash, card

  // Saqlangan kartalar
  List<SavedCardModel> _savedCards = [];
  SavedCardModel? _selectedCard;

  // Yetkazib berish vaqti
  String _deliveryTime = 'tomorrow'; // tomorrow, day_after, scheduled
  DateTime? _scheduledDate;
  String? _scheduledTimeSlot;

  // Yetkazish usuli
  String _deliveryMethod = 'courier'; // courier, pickup

  // Qabul qiluvchi
  final TextEditingController _recipientNameController =
      TextEditingController();
  final TextEditingController _recipientPhoneController =
      TextEditingController();

  // Telefon qilinmasin
  bool _doNotCall = false;

  // Izoh
  final TextEditingController _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _promoDiscount = widget.promoDiscount;
    // Default ertaga
    _scheduledDate = DateTime.now().add(const Duration(days: 1));
    // Manzillarni yuklash
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final addressProvider = context.read<AddressesProvider>();
      addressProvider.loadAddresses().then((_) {
        // Asosiy manzilni tanlash
        final defaultAddress = addressProvider.defaultAddress;
        if (defaultAddress != null && mounted) {
          setState(() {
            _selectedAddressId = defaultAddress.id;
          });
        }
      });

      // Qabul qiluvchi ma'lumotlarini profildan olish
      final profile = context.read<AuthProvider>().profile;
      if (profile != null) {
        _recipientNameController.text = profile.fullName ?? '';
        // google_ placeholder telefon raqamini ko'rsatmaslik
        final phone = profile.phone ?? '';
        _recipientPhoneController.text =
            phone.startsWith('google_') ? '' : phone;
      }

      // Saqlangan kartalarni yuklash
      _loadSavedCards();
    });
  }

  Future<void> _loadSavedCards() async {
    final userId = context.read<AuthProvider>().currentUserId;
    if (userId == null) return;

    try {
      final cards = await PaymentService.getSavedCards(userId);
      if (mounted) {
        setState(() {
          _savedCards = cards;
          _selectedCard = cards.isNotEmpty
              ? cards.firstWhere((c) => c.isDefault, orElse: () => cards.first)
              : null;
        });
      }
    } catch (e) {
      // Cards loading failed silently
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    _recipientNameController.dispose();
    _recipientPhoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<CartProvider>(
      builder: (context, cartProvider, _) {
        return Scaffold(
          backgroundColor: Colors.grey.shade100,
          appBar: AppBar(
            title: const Text(
              'Buyurtmani rasmiylashtirish',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            backgroundColor: Colors.white,
            surfaceTintColor: Colors.white,
          ),
          body: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),

                      // 1. Yetkazish usuli — ixcham kartalar
                      _buildCompactDeliveryMethod(),

                      const SizedBox(height: 8),

                      // 2. Manzil — oddiy qator
                      _buildAddressRow(),

                      // 3. Qabul qiluvchi — oddiy qator
                      _buildRecipientRow(),

                      // Divider
                      Container(height: 8, color: Colors.grey.shade100),

                      // 4. Yetkazish sanasi
                      _buildCompactDeliveryDate(),

                      Container(height: 8, color: Colors.grey.shade100),

                      // 5. To'lov usuli
                      _buildCompactPaymentMethod(),

                      Container(height: 8, color: Colors.grey.shade100),

                      // 6. Kuryer uchun izoh
                      _buildCompactComment(),

                      // 7. Telefon qilinmasin
                      _buildDoNotCallToggle(),

                      Container(height: 8, color: Colors.grey.shade100),

                      // 8. Buyurtma xulosasi
                      _buildOrderSummary(cartProvider),

                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),

              // Bottom bar
              _buildBottomBar(cartProvider),
            ],
          ),
        );
      },
    );
  }

  // ========== Ixcham yetkazish usuli kartalari ==========
  Widget _buildCompactDeliveryMethod() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        children: [
          // Topshirish punkti
          Expanded(
            child: _buildDeliveryCard(
              value: 'pickup',
              title: 'Topshirish punkti',
              subtitle: 'Ertaga',
              extraInfo: 'bepul',
              extraInfoColor: AppColors.success,
              isEnabled: false,
            ),
          ),
          const SizedBox(width: 10),
          // Kuryer
          Expanded(
            child: _buildDeliveryCard(
              value: 'courier',
              title: 'Kuryer',
              subtitle: 'Ertaga yoki keyinroq',
              extraInfo: '50 000 so\'m',
              extraInfoColor: Colors.black87,
              isEnabled: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeliveryCard({
    required String value,
    required String title,
    required String subtitle,
    required String extraInfo,
    required Color extraInfoColor,
    required bool isEnabled,
  }) {
    final isSelected = _deliveryMethod == value;

    return GestureDetector(
      onTap: isEnabled
          ? () {
              HapticUtils.lightImpact();
              setState(() => _deliveryMethod = value);
            }
          : null,
      child: Opacity(
        opacity: isEnabled ? 1.0 : 0.5,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? Colors.black87 : Colors.grey.shade300,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        Text(
                          extraInfo,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: extraInfoColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Checkbox
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color:
                          isSelected ? AppColors.primary : Colors.grey.shade200,
                      border: Border.all(
                        color: isSelected
                            ? AppColors.primary
                            : Colors.grey.shade300,
                        width: 2,
                      ),
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, color: Colors.white, size: 12)
                        : null,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ========== Manzil qatori ==========
  Widget _buildAddressRow() {
    return Consumer<AddressesProvider>(
      builder: (context, provider, _) {
        final selected = _selectedAddressId != null
            ? provider.addresses
                .where((a) => a.id == _selectedAddressId)
                .firstOrNull
            : null;

        return InkWell(
          onTap: () => _showQuickAddAddress(),
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Manzil',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        selected?.fullAddress ??
                            selected?.address ??
                            'Manzilni tanlang',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: selected != null
                              ? Colors.black87
                              : Colors.grey.shade400,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  color: Colors.grey.shade400,
                  size: 26,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ========== Qabul qiluvchi qatori ==========
  Widget _buildRecipientRow() {
    final name = _recipientNameController.text.isNotEmpty
        ? _recipientNameController.text
        : 'Tanlang';
    final phone = _recipientPhoneController.text;

    return InkWell(
      onTap: () => _showRecipientBottomSheet(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Colors.grey.shade200, width: 0.5),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Qabul qiluvchi',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    phone.isNotEmpty ? '$name, $phone' : name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: _recipientNameController.text.isNotEmpty
                          ? Colors.black87
                          : Colors.grey.shade400,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: Colors.grey.shade400,
              size: 26,
            ),
          ],
        ),
      ),
    );
  }

  // ========== Qabul qiluvchi bottom sheet ==========
  void _showRecipientBottomSheet() {
    final profile = context.read<AuthProvider>().profile;
    final tempNameController =
        TextEditingController(text: _recipientNameController.text);
    final tempPhoneController =
        TextEditingController(text: _recipientPhoneController.text);
    bool isEditing = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Container(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Drag handle
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
                    const SizedBox(height: 16),

                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Qabul qiluvchi',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pop(ctx),
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade200,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close, size: 20),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    if (!isEditing) ...[
                      // Profil ma'lumotlari
                      InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () {
                          // Profilni tanlash
                          final phone = profile?.phone ?? '';
                          setState(() {
                            _recipientNameController.text =
                                profile?.fullName ?? '';
                            _recipientPhoneController.text =
                                phone.startsWith('google_') ? '' : phone;
                          });
                          Navigator.pop(ctx);
                        },
                        child: Row(
                          children: [
                            // Radio
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.primary,
                                border: Border.all(
                                    color: AppColors.primary, width: 2),
                              ),
                              child: Center(
                                child: Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            // Ma'lumotlar
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    profile?.fullName ?? 'Ism kiritilmagan',
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          profile?.email ?? '',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey.shade500,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (profile?.phone != null &&
                                          profile!.phone!.isNotEmpty &&
                                          !profile.phone!
                                              .startsWith('google_')) ...[
                                        Text(
                                          '  ',
                                          style: TextStyle(
                                              color: Colors.grey.shade400),
                                        ),
                                        Flexible(
                                          child: Text(
                                            profile.phone!,
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.grey.shade500,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            // Edit iconka
                            GestureDetector(
                              onTap: () {
                                tempNameController.text =
                                    profile?.fullName ?? '';
                                tempPhoneController.text =
                                    (profile?.phone ?? '').startsWith('google_')
                                        ? ''
                                        : (profile?.phone ?? '');
                                setModalState(() => isEditing = true);
                              },
                              child: Icon(
                                Icons.edit_outlined,
                                color: Colors.grey.shade400,
                                size: 22,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Boshqa qabul qiluvchi qo'shish
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                            // Tozalash va formaga o'tish
                            tempNameController.clear();
                            tempPhoneController.clear();
                            setModalState(() => isEditing = true);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey.shade100,
                            foregroundColor: Colors.black87,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.add, size: 20),
                              const SizedBox(width: 8),
                              const Text(
                                'Boshqa qabul qiluvchi qo\'shish',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else ...[
                      // Tahrirlash rejimi
                      TextField(
                        controller: tempNameController,
                        decoration: InputDecoration(
                          labelText: 'Ism',
                          prefixIcon: const Icon(Iconsax.user, size: 20),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade200),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade200),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: tempPhoneController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: 'Telefon raqam',
                          prefixIcon: const Icon(Iconsax.call, size: 20),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade200),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade200),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                            if (tempNameController.text.trim().isEmpty) {
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                const SnackBar(content: Text('Ismni kiriting')),
                              );
                              return;
                            }
                            setState(() {
                              _recipientNameController.text =
                                  tempNameController.text;
                              _recipientPhoneController.text =
                                  tempPhoneController.text;
                            });
                            Navigator.pop(ctx);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Text(
                            'Saqlash',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ========== Telefon qilinmasin ==========
  Widget _buildDoNotCallToggle() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Telefon qilinmasin',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
          Transform.scale(
            scale: 0.8,
            child: Switch(
              value: _doNotCall,
              onChanged: (v) => setState(() => _doNotCall = v),
              activeColor: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  // ========== Ixcham yetkazish sanasi ==========
  Widget _buildCompactDeliveryDate() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Yetkazish sanasi',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),

          // 10 kunlik sana ro'yxati
          SizedBox(
            height: 60,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 10,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final date = DateTime.now().add(Duration(days: index + 1));
                String label;

                if (index == 0) {
                  label = 'Ertaga';
                } else if (index == 1) {
                  label = 'Ertadan keyin';
                } else {
                  final weekdays = [
                    'Dushanba',
                    'Seshanba',
                    'Chorshanba',
                    'Payshanba',
                    'Juma',
                    'Shanba',
                    'Yakshanba'
                  ];
                  label = weekdays[date.weekday - 1]; // Hafta kuni
                }

                final dateText =
                    '${date.day}.${date.month.toString().padLeft(2, '0')}';

                // Tanlanganligini tekshirish (_scheduledDate bilan solishtirish)
                // Agar _scheduledDate null bo'lsa va index 0 (ertaga) bo'lsa, default tanlangan deb oldik
                final isSelected = _scheduledDate != null
                    ? (_scheduledDate!.year == date.year &&
                        _scheduledDate!.month == date.month &&
                        _scheduledDate!.day == date.day)
                    : (index == 0); // Default 'ertaga' tanlangan

                // Agar hech narsa tanlanmagan bo'lsa (default), _scheduledDate ni ham shu kunga set qilish kerak bo'lishi mumkin keyinchalik,
                // lekin hozircha vizual ko'rsatish

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _deliveryTime = 'custom_date'; // umumiy type
                      _scheduledDate = date;
                    });
                  },
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.primary.withValues(alpha: 0.08)
                          : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected
                            ? AppColors.primary
                            : Colors.grey.shade300,
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight:
                                isSelected ? FontWeight.w600 : FontWeight.w500,
                            color:
                                isSelected ? AppColors.primary : Colors.black87,
                          ),
                        ),
                        Text(
                          dateText,
                          style: TextStyle(
                            fontSize: 11,
                            color: isSelected
                                ? AppColors.primary
                                : Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Vaqt oralig'i
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Icon(Iconsax.clock, size: 18, color: Colors.grey.shade600),
                const SizedBox(width: 8),
                const Text(
                  '9:00 dan 21:00 gacha yetkazib beriladi',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ========== Ixcham to'lov usuli ==========
  Widget _buildCompactPaymentMethod() {
    String paymentText = 'Naqd pul';
    IconData paymentIcon = Iconsax.wallet_money;
    Color iconColor = Colors.green;

    if (_paymentMethod == 'card') {
      paymentIcon = Iconsax.card;
      iconColor = AppColors.primary;
      if (_selectedCard != null) {
        paymentText = _selectedCard!.displayName; // Karta nomi (4 ta raqam)
      } else {
        paymentText = 'Plastik karta';
      }
    }

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'To\'lov usuli',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: _showPaymentMethodSelector,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(paymentIcon, color: iconColor),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      paymentText,
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showPaymentMethodSelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const Text(
                'To\'lov usulini tanlang',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),

              // Naqd pul
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Padding(
                  padding: EdgeInsets.only(left: 8),
                  child:
                      Icon(Iconsax.wallet_money, color: Colors.green, size: 28),
                ),
                title: const Text('Naqd pul',
                    style: TextStyle(fontWeight: FontWeight.w500)),
                trailing: _paymentMethod == 'cash'
                    ? const Icon(Icons.check_circle, color: AppColors.primary)
                    : const Icon(Icons.circle_outlined, color: Colors.grey),
                onTap: () {
                  setState(() => _paymentMethod = 'cash');
                  Navigator.pop(ctx);
                },
              ),
              const Divider(height: 1),

              // Kartalar
              if (_savedCards.isNotEmpty) ...[
                ..._savedCards.map((card) {
                  final isSelected =
                      _paymentMethod == 'card' && _selectedCard?.id == card.id;
                  final Color cardColor = Color(card.cardType.colorValue);
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      margin: const EdgeInsets.only(left: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 4),
                      decoration: BoxDecoration(
                        color: cardColor,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        card.cardType.displayName.substring(0, 2).toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    title: Text(card.displayName),
                    subtitle: Text('Muddati: ${card.expiryDate}'),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle,
                            color: AppColors.primary)
                        : const Icon(Icons.circle_outlined, color: Colors.grey),
                    onTap: () {
                      setState(() {
                        _paymentMethod = 'card';
                        _selectedCard = card;
                      });
                      Navigator.pop(ctx);
                    },
                  );
                }),
                const Divider(height: 1),
              ],

              // Karta qo'shish
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Padding(
                  padding: EdgeInsets.only(left: 8),
                  child:
                      Icon(Iconsax.card_add, color: Colors.black87, size: 28),
                ),
                title: const Text('Yangi karta qo\'shish',
                    style: TextStyle(fontWeight: FontWeight.w500)),
                onTap: () {
                  Navigator.pop(ctx);
                  _addNewCard();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ========== Ixcham izoh ==========
  Widget _buildCompactComment() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Kuryer uchun izoh',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _commentController,
            maxLines: 2,
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Masalan: Domofon kodi, qavat, mo\'ljal...',
              hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
              filled: true,
              fillColor: Colors.grey.shade50,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
        ],
      ),
    );
  }

  void _showQuickAddAddress() {
    final addressController = TextEditingController();
    final apartmentController = TextEditingController();
    String?
        editingType; // null = ro'yxat ko'rinishi, 'Uy'/'Ish'/'Boshqa' = forma
    bool isSaving = false;
    bool isGettingLocation = false;
    double? lat;
    double? lon;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final addresses = context.read<AddressesProvider>().addresses;

          // Uy va Ish manzili bormi?
          final hasHome = addresses.any((a) => a.title.toLowerCase() == 'uy');
          final hasWork = addresses.any((a) => a.title.toLowerCase() == 'ish');

          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(ctx).size.height * 0.8,
            ),
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: editingType != null
                // ===== FORMA KO'RINISHI =====
                ? _buildAddressForm(
                    ctx: ctx,
                    setModalState: setModalState,
                    addressController: addressController,
                    apartmentController: apartmentController,
                    selectedType: editingType!,
                    isSaving: isSaving,
                    isGettingLocation: isGettingLocation,
                    lat: lat,
                    lon: lon,
                    onBack: () => setModalState(() => editingType = null),
                    onSavingChanged: (v) => setModalState(() => isSaving = v),
                    onLocationChanged: (v) =>
                        setModalState(() => isGettingLocation = v),
                    onLatLonChanged: (la, lo) {
                      lat = la;
                      lon = lo;
                    },
                  )
                // ===== RO'YXAT KO'RINISHI =====
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Drag handle
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 12, bottom: 8),
                          child: Container(
                            width: 36,
                            height: 4,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                      ),

                      // Sarlavha
                      const Padding(
                        padding: EdgeInsets.fromLTRB(20, 8, 20, 16),
                        child: Text(
                          'Yetkazish manzillari',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),

                      // Uy manzilini kiritish (faqat mavjud bo'lmasa)
                      if (!hasHome)
                        _buildAddTypeRow(
                          icon: Icons.add,
                          label: 'Uy manzilini kiritish',
                          onTap: () {
                            addressController.clear();
                            apartmentController.clear();
                            setModalState(() => editingType = 'Uy');
                          },
                        ),

                      // Ish manzilini kiritish (faqat mavjud bo'lmasa)
                      if (!hasWork)
                        _buildAddTypeRow(
                          icon: Icons.add,
                          label: 'Ish manzilini kiritish',
                          onTap: () {
                            addressController.clear();
                            apartmentController.clear();
                            setModalState(() => editingType = 'Ish');
                          },
                        ),

                      // Saqlangan manzillar
                      if (addresses.isNotEmpty) ...[
                        ...addresses.map((address) {
                          final isSelected = _selectedAddressId == address.id;
                          IconData addrIcon;
                          switch (address.title.toLowerCase()) {
                            case 'uy':
                              addrIcon = Icons.home_outlined;
                              break;
                            case 'ish':
                              addrIcon = Icons.work_outline;
                              break;
                            default:
                              addrIcon = Icons.location_on_outlined;
                          }

                          return InkWell(
                            onTap: () {
                              HapticUtils.lightImpact();
                              setState(() => _selectedAddressId = address.id);
                              Navigator.pop(ctx);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 14),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary.withValues(alpha: 0.04)
                                    : null,
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    addrIcon,
                                    size: 24,
                                    color: isSelected
                                        ? AppColors.primary
                                        : Colors.black54,
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          address.fullAddress.isNotEmpty
                                              ? address.fullAddress
                                              : address.title,
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w500,
                                            color: isSelected
                                                ? AppColors.primary
                                                : Colors.black87,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Kuryer orqali',
                                          style: TextStyle(
                                            fontSize: 13,
                                            color: Colors.grey.shade500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(
                                    Icons.edit_outlined,
                                    size: 20,
                                    color: Colors.grey.shade400,
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                      ],

                      const SizedBox(height: 16),

                      // Manzil qo'shish tugmasi
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                        child: SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            onPressed: () {
                              addressController.clear();
                              apartmentController.clear();
                              setModalState(() => editingType = 'Boshqa');
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey.shade100,
                              foregroundColor: Colors.black87,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Text(
                              'Manzil qo\'shish',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
          );
        },
      ),
    );
  }

  // Manzil turi qo'shish qatori (+ Uy manzilini kiritish)
  Widget _buildAddTypeRow({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          children: [
            Icon(icon, size: 24, color: Colors.black87),
            const SizedBox(width: 16),
            Text(
              label,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Manzil kiritish formasi
  Widget _buildAddressForm({
    required BuildContext ctx,
    required StateSetter setModalState,
    required TextEditingController addressController,
    required TextEditingController apartmentController,
    required String selectedType,
    required bool isSaving,
    required bool isGettingLocation,
    required double? lat,
    required double? lon,
    required VoidCallback onBack,
    required ValueChanged<bool> onSavingChanged,
    required ValueChanged<bool> onLocationChanged,
    required void Function(double, double) onLatLonChanged,
  }) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
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
          const SizedBox(height: 12),

          // Header: Orqaga + sarlavha
          Row(
            children: [
              GestureDetector(
                onTap: onBack,
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_back, size: 20),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '$selectedType manzili',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Manzil input
          Text(
            'Manzil',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: addressController,
            maxLines: 1,
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Tuman, ko\'cha, uy raqami...',
              hintStyle: TextStyle(
                color: Colors.grey.shade400,
                fontSize: 13,
              ),
              filled: true,
              fillColor: Colors.grey.shade50,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 14,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: AppColors.primary,
                  width: 1.5,
                ),
              ),
              suffixIcon: isGettingLocation
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : IconButton(
                      onPressed: () async {
                        onLocationChanged(true);
                        try {
                          LocationPermission permission =
                              await Geolocator.checkPermission();
                          if (permission == LocationPermission.denied) {
                            permission = await Geolocator.requestPermission();
                          }
                          if (permission == LocationPermission.denied ||
                              permission == LocationPermission.deniedForever) {
                            throw Exception('Lokatsiya ruxsati yo\'q');
                          }
                          final position = await Geolocator.getCurrentPosition(
                            locationSettings: const LocationSettings(
                              accuracy: LocationAccuracy.high,
                            ),
                          );
                          onLatLonChanged(
                              position.latitude, position.longitude);
                          final result = await NominatimService.reverseGeocode(
                            latitude: position.latitude,
                            longitude: position.longitude,
                          );
                          addressController.text = result.shortAddress;
                        } catch (e) {
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(
                                content: Text('$e'),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                        } finally {
                          onLocationChanged(false);
                        }
                      },
                      icon: const Icon(
                        Icons.my_location,
                        color: Colors.black54,
                        size: 20,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 10),

          // Xaritadan tanlash
          GestureDetector(
            onTap: () async {
              Navigator.pop(ctx);
              final mapResult = await Navigator.push<Map<String, dynamic>>(
                context,
                MaterialPageRoute(
                  builder: (_) => MapPickerScreen(
                    initialLatitude: lat,
                    initialLongitude: lon,
                  ),
                ),
              );
              if (mapResult != null && mounted) {
                final provider = context.read<AddressesProvider>();
                final newAddr = await provider.addAddress(
                  title: selectedType,
                  address: mapResult['address'] ?? '',
                  latitude: mapResult['latitude'],
                  longitude: mapResult['longitude'],
                  apartment: apartmentController.text.isNotEmpty
                      ? apartmentController.text
                      : null,
                );
                setState(() => _selectedAddressId = newAddr.id);
              }
            },
            child: Row(
              children: [
                Icon(Icons.map_outlined, size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  'Xaritadan tanlash',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Kvartira
          Text(
            'Qo\'shimcha (ixtiyoriy)',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: apartmentController,
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Kvartira, podyezd, qavat',
              hintStyle: TextStyle(
                color: Colors.grey.shade400,
                fontSize: 13,
              ),
              filled: true,
              fillColor: Colors.grey.shade50,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 14,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: AppColors.primary,
                  width: 1.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Saqlash
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: isSaving
                  ? null
                  : () async {
                      if (addressController.text.isEmpty) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(
                            content: const Text('Manzilni kiriting'),
                            backgroundColor: Colors.orange.shade700,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        );
                        return;
                      }
                      onSavingChanged(true);
                      try {
                        final provider = context.read<AddressesProvider>();
                        final newAddr = await provider.addAddress(
                          title: selectedType,
                          address: addressController.text,
                          apartment: apartmentController.text.isNotEmpty
                              ? apartmentController.text
                              : null,
                          latitude: lat,
                          longitude: lon,
                        );
                        if (mounted) {
                          setState(() => _selectedAddressId = newAddr.id);
                        }
                        if (ctx.mounted) Navigator.pop(ctx);
                        if (mounted) {
                          HapticUtils.success();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Row(
                                children: [
                                  Icon(Icons.check_circle,
                                      color: Colors.white, size: 18),
                                  SizedBox(width: 8),
                                  Text('Manzil qo\'shildi!'),
                                ],
                              ),
                              backgroundColor: AppColors.success,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          );
                        }
                      } catch (e) {
                        onSavingChanged(false);
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
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
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Saqlash',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _addNewCard() async {
    final userId = context.read<AuthProvider>().currentUserId;
    if (userId == null) return;

    try {
      final result = await PaymentService.initCardBinding(userId: userId);

      if (result.success && result.redirectUrl != null) {
        final uri = Uri.parse(result.redirectUrl!);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
          // Qaytganda kartalarni yangilash
          _loadSavedCards();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result.errorMessage ?? 'Xatolik yuz berdi')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: $e')),
        );
      }
    }
  }

  Widget _buildOrderSummary(CartProvider cartProvider) {
    final subtotal = cartProvider.subtotal;
    final deliveryFee = cartProvider.deliveryFee;
    final total = subtotal + deliveryFee - _promoDiscount;

    return Container(
      padding: const EdgeInsets.all(AppSizes.lg),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Buyurtma xulosasi',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: AppSizes.md),
          _buildSummaryRow('Mahsulotlar (${cartProvider.totalQuantity})',
              _formatPrice(subtotal.toInt())),
          _buildSummaryRow(
              'Yetkazib berish', _formatPrice(deliveryFee.toInt())),
          if (_promoDiscount > 0)
            _buildSummaryRow(
              'Chegirma',
              '-${_formatPrice(_promoDiscount.toInt())}',
              isDiscount: true,
            ),
          const Divider(height: 24),
          _buildSummaryRow(
            'Jami',
            _formatPrice(total.toInt()),
            isBold: true,
          ),

          // Xavfsizlik badge
          const SizedBox(height: AppSizes.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Iconsax.shield_tick, size: 16, color: Colors.grey.shade500),
              const SizedBox(width: 6),
              Text(
                'Xavfsiz to\'lov kafolatlanadi',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value,
      {bool isBold = false, bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              fontSize: isBold ? 16 : 14,
            ),
          ),
          Text(
            isDiscount
                ? '$value ${context.l10n.translate('currency')}'
                : '$value ${context.l10n.translate('currency')}',
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              fontSize: isBold ? 16 : 14,
              color: isDiscount
                  ? AppColors.success
                  : (isBold ? AppColors.primary : null),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(CartProvider cartProvider) {
    final total =
        cartProvider.subtotal + cartProvider.deliveryFee - _promoDiscount;

    return Container(
      padding: const EdgeInsets.all(AppSizes.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed:
                _isLoading ? null : () => _handlePlaceOrder(cartProvider),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(
                    'Buyurtma berish • ${_formatPrice(total.toInt())} so\'m',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _handlePlaceOrder(CartProvider cartProvider) async {
    // Manzil validatsiyasi
    if (_selectedAddressId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Iltimos, manzilni tanlang')),
      );
      return;
    }

    // Qabul qiluvchi validatsiyasi
    if (_recipientNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Qabul qiluvchi ismini kiriting')),
      );
      return;
    }
    if (_recipientPhoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Qabul qiluvchi telefon raqamini kiriting')),
      );
      return;
    }

    // Yetkazish sanasi validatsiyasi
    if (_deliveryTime == 'scheduled' && _scheduledDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Yetkazish sanasini tanlang')),
      );
      return;
    }

    // Buyurtma berish
    await _placeOrder(cartProvider);
  }

  Future<void> _placeOrder(CartProvider cartProvider) async {
    setState(() {
      _isLoading = true;
    });

    // Haptic feedback
    HapticUtils.mediumImpact();

    try {
      // Buyurtma ma'lumotlarini yig'ish
      final orderItems = cartProvider.items
          .map((item) => {
                'product_id': item.productId,
                'name': item.product?.nameUz ?? 'Mahsulot',
                'image': item.product?.firstImage,
                'quantity': item.quantity,
                'price': item.product?.price ?? 0,
              })
          .toList();

      final totalAmount =
          cartProvider.subtotal + cartProvider.deliveryFee - _promoDiscount;

      // Summa tiyin formatida (1 so'm = 100 tiyin)
      final amountInTiyin = (totalAmount * 100).round();

      // Karta orqali to'lov
      if (_paymentMethod == 'card') {
        if (_selectedCard == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Iltimos, karta tanlang')),
          );
          setState(() => _isLoading = false);
          return;
        }

        // Avval buyurtma yaratamiz (pending status)
        final order =
            await _createPendingOrder(cartProvider, orderItems, amountInTiyin);
        if (order == null) {
          setState(() => _isLoading = false);
          return;
        }

        // Karta orqali to'lovni amalga oshiramiz
        await _processCardPayment(order.id, amountInTiyin, cartProvider);
      } else {
        // Naqd pul - oddiy buyurtma
        final order = await context.read<OrdersProvider>().createOrder(
              addressId: _selectedAddressId!,
              paymentMethod: _paymentMethod,
              deliveryTime: _deliveryTime,
              scheduledDate: _scheduledDate,
              scheduledTimeSlot: _scheduledTimeSlot,
              comment: _commentController.text.isNotEmpty
                  ? _commentController.text
                  : null,
              recipientName: _recipientNameController.text.isNotEmpty
                  ? _recipientNameController.text
                  : null,
              recipientPhone: _recipientPhoneController.text.isNotEmpty
                  ? _recipientPhoneController.text
                  : null,
              deliveryMethod: _deliveryMethod,
              items: orderItems,
              subtotal: cartProvider.subtotal,
              deliveryFee: cartProvider.deliveryFee,
              discount: _promoDiscount,
            );

        if (mounted && order != null) {
          // Haptic success
          HapticUtils.orderCreated();

          // Savatni tozalash
          cartProvider.clearCart();

          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => OrderSuccessScreen(
                orderId: order.id,
                paymentMethod: 'cash',
                deliveryTime: _deliveryTime,
                deliveryDate: _scheduledDate,
                scheduledTimeSlot: _scheduledTimeSlot,
              ),
            ),
          );
        }
      }
    } catch (e) {
      HapticUtils.error();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik yuz berdi: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<dynamic> _createPendingOrder(
    CartProvider cartProvider,
    List<Map<String, dynamic>> orderItems,
    int amountInTiyin,
  ) async {
    try {
      return await context.read<OrdersProvider>().createOrder(
            addressId: _selectedAddressId!,
            paymentMethod: 'card',
            deliveryTime: _deliveryTime,
            scheduledDate: _scheduledDate,
            scheduledTimeSlot: _scheduledTimeSlot,
            comment: _commentController.text.isNotEmpty
                ? _commentController.text
                : null,
            recipientName: _recipientNameController.text.isNotEmpty
                ? _recipientNameController.text
                : null,
            recipientPhone: _recipientPhoneController.text.isNotEmpty
                ? _recipientPhoneController.text
                : null,
            deliveryMethod: _deliveryMethod,
            items: orderItems,
            subtotal: cartProvider.subtotal,
            deliveryFee: cartProvider.deliveryFee,
            discount: _promoDiscount,
          );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Buyurtma yaratishda xatolik: $e')),
        );
      }
      return null;
    }
  }

  Future<void> _processCardPayment(
    String orderId,
    int amountInTiyin,
    CartProvider cartProvider,
  ) async {
    try {
      // To'lovni boshlash
      final result = await PaymentService.payWithSavedCard(
        orderId: orderId,
        bindingId: _selectedCard!.bindingId,
        amountInTiyin: amountInTiyin,
        description: 'TOPLA Buyurtma #$orderId',
      );

      if (result.success) {
        // 3D Secure kerak bo'lsa
        if (result.redirectUrl != null) {
          final confirmed = await _handle3DSecure(result.redirectUrl!);
          if (!confirmed) {
            // To'lov bekor qilindi
            await _cancelOrder(orderId);
            return;
          }
        }

        // Muvaffaqiyatli - savatni tozalash
        if (mounted) {
          context.read<CartProvider>().clearCart();

          // To'lov statusini yangilash
          await context.read<OrdersProvider>().updatePaymentStatus(
                orderId,
                'paid',
              );

          if (!mounted) return;

          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => OrderSuccessScreen(
                orderId: orderId,
                paymentMethod: 'card',
                cardLastDigits: _selectedCard!.maskedPan.substring(
                  _selectedCard!.maskedPan.length - 4,
                ),
                deliveryTime: _deliveryTime,
                deliveryDate: _scheduledDate,
                scheduledTimeSlot: _scheduledTimeSlot,
              ),
            ),
          );
        }
      } else {
        // To'lov muvaffaqiyatsiz
        await _cancelOrder(orderId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.errorMessage ?? 'To\'lov amalga oshmadi'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      await _cancelOrder(orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('To\'lov xatosi: $e')),
        );
      }
    }
  }

  Future<bool> _handle3DSecure(String redirectUrl) async {
    final uri = Uri.parse(redirectUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);

      // TODO: Deep link orqali qaytishni kutish
      // Hozircha foydalanuvchi tasdiqlaydi
      if (!mounted) return false;
      final confirmed = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('3D Secure'),
          content: const Text(
            'Bank sahifasida to\'lovni tasdiqladingizmi?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Bekor qilish'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
              ),
              child: const Text('Ha, tasdiqladim'),
            ),
          ],
        ),
      );

      return confirmed ?? false;
    }
    return false;
  }

  Future<void> _cancelOrder(String orderId) async {
    try {
      await context.read<OrdersProvider>().cancelOrder(orderId);
    } catch (e) {
      debugPrint('Buyurtmani bekor qilishda xatolik: $e');
    }
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]} ',
        );
  }
}
