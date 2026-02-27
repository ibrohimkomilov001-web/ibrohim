import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/vendor_service.dart';
import '../../models/shop_model.dart';
import '../../core/constants/constants.dart';

/// Vendor - Shartnoma va hujjatlar ekrani
class VendorDocumentsScreen extends StatefulWidget {
  const VendorDocumentsScreen({super.key});

  @override
  State<VendorDocumentsScreen> createState() => _VendorDocumentsScreenState();
}

class _VendorDocumentsScreenState extends State<VendorDocumentsScreen> {
  ShopModel? _shop;
  bool _isLoading = true;
  List<Map<String, dynamic>> _documents = [];
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        VendorService.getMyShop(),
        VendorService.getDocuments(),
      ]);
      if (!mounted) return;
      setState(() {
        _shop = results[0] as ShopModel?;
        _documents = results[1] as List<Map<String, dynamic>>;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hujjatlar'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Do'kon ma'lumotlari
                  _buildInfoCard(),
                  const SizedBox(height: 16),

                  // Yuklangan hujjatlar
                  _buildDocumentsSection(),
                  const SizedBox(height: 16),

                  // Shartnoma
                  _buildContractSection(),
                  const SizedBox(height: 16),

                  // Komissiya shartlari
                  _buildCommissionSection(),
                  const SizedBox(height: 16),

                  // Qoidalar
                  _buildRulesSection(),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.store, color: Colors.blue),
                const SizedBox(width: 8),
                const Text(
                  'Do\'kon ma\'lumotlari',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildInfoRow('Do\'kon nomi', _shop?.name ?? '-'),
            _buildInfoRow('ID', _shop?.id ?? '-', copyable: true),
            _buildInfoRow(
              'Holati',
              _shop?.isVerified == true ? 'Tasdiqlangan' : 'Tasdiqlanmagan',
              valueColor:
                  _shop?.isVerified == true ? Colors.green : Colors.orange,
            ),
            _buildInfoRow(
              'Ro\'yxatdan o\'tgan',
              _shop != null ? _formatDate(_shop!.createdAt) : '-',
            ),
            _buildInfoRow(
              'Komissiya stavkasi',
              '${_shop?.commissionRate ?? 10}%',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value,
      {bool copyable = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: Colors.grey[600]),
          ),
          Row(
            children: [
              Text(
                value,
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  color: valueColor,
                ),
              ),
              if (copyable) ...[
                const SizedBox(width: 8),
                InkWell(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: value));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Nusxalandi')),
                    );
                  },
                  child: const Icon(Icons.copy, size: 16, color: Colors.grey),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  // ============================================
  // Hujjatlar bo'limi
  // ============================================

  static const _documentTypes = {
    'passport': 'Pasport nusxasi',
    'inn': 'INN (STIR) guvohnomasi',
    'license': 'Litsenziya',
    'certificate': 'Sertifikat',
    'other': 'Boshqa hujjat',
  };

  Widget _buildDocumentsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Iconsax.document_upload, color: AppColors.primary),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Mening hujjatlarim',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                if (!_isUploading)
                  TextButton.icon(
                    onPressed: _showUploadDialog,
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Yuklash'),
                  ),
              ],
            ),
            const Divider(height: 16),
            if (_isUploading)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (_documents.isEmpty && !_isUploading)
              Container(
                padding: const EdgeInsets.all(20),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Iconsax.document, size: 40, color: Colors.grey[400]),
                      const SizedBox(height: 8),
                      Text(
                        'Hujjatlar yuklanmagan',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Pasport, INN yoki litsenziya yuklang',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                ),
              ),
            ..._documents.map(_buildDocumentTile),
          ],
        ),
      ),
    );
  }

  Widget _buildDocumentTile(Map<String, dynamic> doc) {
    final status = doc['status'] as String? ?? 'pending';
    final type = doc['type'] as String? ?? 'other';
    final name = doc['name'] as String? ?? 'Hujjat';
    final fileUrl = doc['fileUrl'] as String?;

    Color statusColor;
    IconData statusIcon;
    String statusText;
    switch (status) {
      case 'approved':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusText = 'Tasdiqlangan';
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
        statusText = 'Rad etilgan';
        break;
      default:
        statusColor = Colors.orange;
        statusIcon = Icons.hourglass_bottom;
        statusText = 'Tekshirilmoqda';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: statusColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          if (fileUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: fileUrl,
                width: 48,
                height: 48,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => Container(
                  width: 48,
                  height: 48,
                  color: Colors.grey[200],
                  child: const Icon(Icons.image, color: Colors.grey),
                ),
              ),
            )
          else
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.description, color: Colors.grey),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  _documentTypes[type] ?? type,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(statusIcon, size: 14, color: statusColor),
                  const SizedBox(width: 4),
                  Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 12,
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              if (status == 'pending' || status == 'rejected')
                InkWell(
                  onTap: () => _confirmDeleteDocument(doc['id'] as String),
                  child: Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child:
                        Icon(Iconsax.trash, size: 16, color: Colors.red[300]),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  void _showUploadDialog() {
    String selectedType = 'passport';
    final nameController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Hujjat yuklash'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedType,
                decoration: const InputDecoration(
                  labelText: 'Hujjat turi',
                  border: OutlineInputBorder(),
                ),
                items: _documentTypes.entries.map((e) {
                  return DropdownMenuItem(value: e.key, child: Text(e.value));
                }).toList(),
                onChanged: (val) {
                  if (val != null) setDialogState(() => selectedType = val);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Hujjat nomi',
                  hintText: 'Masalan: Shahsiy pasport',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Bekor qilish'),
            ),
            FilledButton(
              onPressed: () {
                if (nameController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Hujjat nomini kiriting')),
                  );
                  return;
                }
                Navigator.pop(ctx);
                _pickAndUploadDocument(
                    selectedType, nameController.text.trim());
              },
              child: const Text('Rasmni tanlash'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickAndUploadDocument(String type, String name) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 2000,
      imageQuality: 85,
    );
    if (picked == null) return;

    setState(() => _isUploading = true);
    try {
      // 1. Upload image
      final imageUrl =
          await VendorService.uploadImage(picked.path, picked.name);

      // 2. Create document record
      await VendorService.uploadDocument(
        type: type,
        name: name,
        fileUrl: imageUrl,
      );

      // 3. Reload list
      await _loadData();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hujjat muvaffaqiyatli yuklandi'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isUploading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Xatolik: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _confirmDeleteDocument(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hujjatni o\'chirish'),
        content: const Text('Hujjatni o\'chirishni xohlaysizmi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Yo\'q'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('O\'chirish', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await VendorService.deleteDocument(id);
      await _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Hujjat o\'chirildi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
        );
      }
    }
  }

  Widget _buildContractSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.description, color: Colors.green),
                const SizedBox(width: 8),
                const Text(
                  'Shartnoma',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Oferta shartnomasi qabul qilingan',
                          style: TextStyle(fontWeight: FontWeight.w500),
                        ),
                        Text(
                          _shop != null ? _formatDate(_shop!.createdAt) : '-',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => _showContractDetails(),
              icon: const Icon(Icons.visibility),
              label: const Text('Shartnomani ko\'rish'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommissionSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.percent, color: Colors.orange),
                const SizedBox(width: 8),
                const Text(
                  'Komissiya shartlari',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildCommissionItem(
              'Standart komissiya',
              '${_shop?.commissionRate ?? 10}%',
              'Har bir sotuvdan ushlab qolinadi',
            ),
            _buildCommissionItem(
              'To\'lov uchun komissiya',
              '0%',
              'Mablag\' yechib olishda',
            ),
            _buildCommissionItem(
              'Minimal to\'lov',
              '100 000 so\'m',
              'Yechib olish uchun minimal summa',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommissionItem(String title, String value, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.orange,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRulesSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.rule, color: Colors.purple),
                const SizedBox(width: 8),
                const Text(
                  'Qoidalar',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildRuleItem(
              '1',
              'Mahsulot moderatsiyasi',
              'Barcha mahsulotlar moderatsiyadan o\'tishi kerak',
            ),
            _buildRuleItem(
              '2',
              'Sifat talablari',
              'Mahsulot rasmlari aniq va sifatli bo\'lishi kerak',
            ),
            _buildRuleItem(
              '3',
              'Narx aniqligi',
              'Ko\'rsatilgan narx haqiqiy narxga mos kelishi kerak',
            ),
            _buildRuleItem(
              '4',
              'Buyurtmalarni bajarish',
              'Buyurtmalar 24 soat ichida tasdiqlanishi kerak',
            ),
            _buildRuleItem(
              '5',
              'Mijozlarga xizmat',
              'Mijozlar bilan professional muloqot qilish',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRuleItem(String number, String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: Colors.purple.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.purple,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showContractDetails() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Oferta shartnomasi',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: SingleChildScrollView(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                child: const Text(
                  '''
TOPLA PLATFORMASI OFERTA SHARTNOMASI

1. UMUMIY QOIDALAR

1.1. Ushbu oferta shartnomasi (keyingi o'rinlarda "Shartnoma") TOPLA platformasi (keyingi o'rinlarda "Platforma") va do'kon egasi (keyingi o'rinlarda "Vendor") o'rtasidagi munosabatlarni tartibga soladi.

1.2. Platformada ro'yxatdan o'tish va do'kon ochish orqali Vendor ushbu Shartnoma shartlarini to'liq qabul qiladi.

2. PLATFORMA MAJBURIYATLARI

2.1. Vendorga mahsulotlarini joylashtirish va sotish uchun platforma xizmatlarini taqdim etish.

2.2. Buyurtmalar haqida ma'lumotlarni o'z vaqtida yetkazish.

2.3. Vendor hisobiga tushgan mablag'larni o'z vaqtida to'lash.

3. VENDOR MAJBURIYATLARI

3.1. Haqiqiy va to'g'ri ma'lumotlar taqdim etish.

3.2. Mahsulot sifatini ta'minlash.

3.3. Buyurtmalarni o'z vaqtida bajarish.

3.4. Komissiya to'lovlarini o'z vaqtida amalga oshirish.

4. KOMISSIYA

4.1. Har bir muvaffaqiyatli buyurtmadan Platforma belgilangan foizda komissiya ushlab qoladi.

4.2. Komissiya stavkasi individual ravishda belgilanishi mumkin.

5. TO'LOVLAR

5.1. Vendor balansidagi mablag'lar so'rov asosida bank hisobiga o'tkaziladi.

5.2. Minimal yechib olish summasi 100,000 so'm.

6. JAVOBGARLIK

6.1. Platforma mahsulot sifati uchun javobgar emas.

6.2. Vendor qonunchilik talablariga rioya qilishi shart.

7. SHARTNOMANI BEKOR QILISH

7.1. Har qaysi tomon 30 kun oldindan xabardor qilib shartnomani bekor qilishi mumkin.

7.2. Qoidalar buzilganda Platforma shartnomani bir tomonlama bekor qilishi mumkin.

Shartnoma qabul qilingan sana: 2026
                  ''',
                  style: TextStyle(height: 1.6),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}
