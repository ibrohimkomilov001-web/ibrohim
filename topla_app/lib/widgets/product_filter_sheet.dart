import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/localization/app_localizations.dart';
import '../models/filter_model.dart';
import '../models/brand_model.dart';
import '../models/product_facets.dart';
import '../models/color_option.dart';
import '../models/category_filter_attribute.dart';

/// Topla.uz marketplace filter sheet
class ProductFilterSheet extends StatefulWidget {
  final ProductFilter currentFilter;
  final List<BrandModel> brands;
  final List<ColorOption> colors;
  final ProductFacets? facets;
  final List<CategoryFilterAttribute> categoryAttributes;
  final String categoryName;
  final Color accentColor;
  final int? productCount;
  final List<ShopFilterItem> shops;
  final bool isUzbek;

  const ProductFilterSheet({
    super.key,
    required this.currentFilter,
    this.brands = const [],
    this.colors = const [],
    this.facets,
    this.categoryAttributes = const [],
    this.categoryName = 'Filtrlar',
    this.accentColor = const Color(0xFFFF6B6B),
    this.productCount,
    this.shops = const [],
    this.isUzbek = true,
  });

  /// Filter sheet'ni ochish uchun static method
  static Future<ProductFilter?> show(
    BuildContext context, {
    required ProductFilter currentFilter,
    List<BrandModel> brands = const [],
    List<ColorOption> colors = const [],
    ProductFacets? facets,
    List<CategoryFilterAttribute> categoryAttributes = const [],
    String categoryName = 'Filtrlar',
    Color accentColor = const Color(0xFFFF6B6B),
    int? productCount,
    List<ShopFilterItem> shops = const [],
    bool? isUzbek,
  }) {
    final uz =
        isUzbek ?? (Localizations.localeOf(context).languageCode == 'uz');
    return showModalBottomSheet<ProductFilter>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ProductFilterSheet(
        currentFilter: currentFilter,
        brands: brands,
        colors: colors,
        facets: facets,
        categoryAttributes: categoryAttributes,
        categoryName: categoryName,
        accentColor: accentColor,
        productCount: productCount,
        shops: shops,
        isUzbek: uz,
      ),
    );
  }

  @override
  State<ProductFilterSheet> createState() => _ProductFilterSheetState();
}

class _ProductFilterSheetState extends State<ProductFilterSheet> {
  bool get _isUz => widget.isUzbek;
  String get _locale => _isUz ? 'uz' : 'ru';
  String _t(String key) => AppLocalizations.of(context)?.translate(key) ?? key;

  late ProductFilter _filter;

  final TextEditingController _minPriceCtrl = TextEditingController();
  final TextEditingController _maxPriceCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _filter = widget.currentFilter;
    _minPriceCtrl.text = _filter.minPrice?.toInt().toString() ?? '';
    _maxPriceCtrl.text = _filter.maxPrice?.toInt().toString() ?? '';
  }

  @override
  void dispose() {
    _minPriceCtrl.dispose();
    _maxPriceCtrl.dispose();
    super.dispose();
  }

  void _updateFilter(ProductFilter newFilter) {
    setState(() => _filter = newFilter);
  }

  void _clearAllFilters() {
    HapticFeedback.lightImpact();
    setState(() {
      _filter = ProductFilter.empty();
      _minPriceCtrl.clear();
      _maxPriceCtrl.clear();
    });
  }

  void _applyAndClose() {
    HapticFeedback.mediumImpact();
    Navigator.pop(context, _filter);
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPUTED HELPERS
  // ═══════════════════════════════════════════════════════════════

  List<_ColorItemData> get _effectiveColors {
    final facets = widget.facets;
    if (facets != null && facets.colors.isNotEmpty) {
      return facets.colors
          .map((c) => _ColorItemData(
              id: c.id,
              nameUz: c.nameUz,
              nameRu: c.nameRu,
              hexCode: c.hexCode,
              count: c.count))
          .toList();
    }
    if (widget.colors.isNotEmpty) {
      return widget.colors
          .map((c) => _ColorItemData(
              id: c.id,
              nameUz: c.nameUz,
              nameRu: c.nameRu,
              hexCode: c.hexCode,
              count: c.productCount))
          .toList();
    }
    // Fallback ranglar
    return const [
      _ColorItemData(
          id: 'yellow', nameUz: 'Sariq', nameRu: 'желтый', hexCode: '#FFD700'),
      _ColorItemData(
          id: 'gold',
          nameUz: 'Oltin',
          nameRu: 'золотистый',
          hexCode: '#DAA520'),
      _ColorItemData(
          id: 'beige', nameUz: 'Bej', nameRu: 'бежевый', hexCode: '#F5F5DC'),
      _ColorItemData(
          id: 'white', nameUz: 'Oq', nameRu: 'белый', hexCode: '#FFFFFF'),
      _ColorItemData(
          id: 'green', nameUz: 'Yashil', nameRu: 'зеленый', hexCode: '#008000'),
      _ColorItemData(
          id: 'brown',
          nameUz: 'Jigarrang',
          nameRu: 'коричневый',
          hexCode: '#8B4513'),
      _ColorItemData(
          id: 'red', nameUz: 'Qizil', nameRu: 'красный', hexCode: '#FF0000'),
      _ColorItemData(
          id: 'orange',
          nameUz: 'To\'q sariq',
          nameRu: 'оранжевый',
          hexCode: '#FFA500'),
      _ColorItemData(
          id: 'pink', nameUz: 'Pushti', nameRu: 'розовый', hexCode: '#FF69B4'),
      _ColorItemData(
          id: 'silver',
          nameUz: 'Kumush',
          nameRu: 'серебристый',
          hexCode: '#C0C0C0'),
      _ColorItemData(
          id: 'grey', nameUz: 'Kulrang', nameRu: 'серый', hexCode: '#808080'),
      _ColorItemData(
          id: 'purple',
          nameUz: 'Binafsha',
          nameRu: 'фиолетовый',
          hexCode: '#800080'),
      _ColorItemData(
          id: 'black', nameUz: 'Qora', nameRu: 'черный', hexCode: '#000000'),
      _ColorItemData(
          id: 'blue', nameUz: 'Ko\'k', nameRu: 'синий', hexCode: '#0000FF'),
      _ColorItemData(
          id: 'lightblue',
          nameUz: 'Havorang',
          nameRu: 'голубой',
          hexCode: '#87CEEB'),
    ];
  }

  List<SizeFacet> get _effectiveSizes {
    return widget.facets?.sizes ?? [];
  }

  List<ShopFilterItem> get _effectiveShops {
    if (widget.shops.isNotEmpty) return widget.shops;
    // Fallback do'konlar
    return const [
      ShopFilterItem(id: 'topla-official', name: 'Topla Official'),
      ShopFilterItem(id: 'tech-store', name: 'Tech Store'),
      ShopFilterItem(id: 'gadget-world', name: 'Gadget World'),
      ShopFilterItem(id: 'smart-home-uz', name: 'Smart Home UZ'),
      ShopFilterItem(id: 'best-electronics', name: 'Best Electronics'),
      ShopFilterItem(id: 'mobile-land', name: 'Mobile Land'),
      ShopFilterItem(id: 'digital-plaza', name: 'Digital Plaza'),
      ShopFilterItem(id: 'mega-market', name: 'Mega Market'),
      ShopFilterItem(id: 'premium-store', name: 'Premium Store'),
      ShopFilterItem(id: 'tech-planet', name: 'Tech Planet'),
    ];
  }

  // ═══════════════════════════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final bottomPadding = MediaQuery.of(context).viewPadding.bottom;

    return Container(
      height: screenHeight * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),

                  // 1. Narxi
                  _buildPriceSection(),
                  _buildDivider(),

                  // 2. Yetkazish muddati
                  _buildDeliveryTimeSection(),
                  _buildDivider(),

                  // 3. WOW-narx toggle
                  _buildToggleRow(
                    _t('wow_price'),
                    _filter.onlyWithDiscount,
                    (val) =>
                        _updateFilter(_filter.copyWith(onlyWithDiscount: val)),
                  ),
                  _buildDivider(),

                  // 4. Original toggle
                  _buildToggleRow(
                    'Original',
                    _filter.isOriginal ?? false,
                    (val) => _updateFilter(_filter.copyWith(
                        isOriginal: val ? true : null, clearIsOriginal: !val)),
                    hasHelp: true,
                  ),
                  _buildDivider(),

                  // 5. Brend
                  if (widget.brands.isNotEmpty) ...[
                    _buildBrandsSection(),
                    _buildDivider(),
                  ],

                  // 6. Dinamik kategoriya atributlari
                  ...widget.categoryAttributes.map((attr) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildCategoryAttributeSection(attr),
                        _buildDivider(),
                      ],
                    );
                  }),

                  // 7. Ranglar
                  _buildColorsSection(),
                  _buildDivider(),

                  // 8. O'lchamlar
                  if (_effectiveSizes.isNotEmpty) ...[
                    _buildSizesSection(),
                    _buildDivider(),
                  ],

                  // 9. Yuqori reyting toggle
                  _buildToggleRow(
                    _isUz ? 'Yuqori reyting' : 'Высокий рейтинг',
                    _filter.minRating != null && _filter.minRating! >= 4.0,
                    (val) => _updateFilter(_filter.copyWith(
                      minRating: val ? 4.0 : null,
                      clearMinRating: !val,
                    )),
                  ),
                  _buildDivider(),

                  // 10. Yetkazish usuli
                  _buildDeliveryTypeSection(),
                  _buildDivider(),

                  // 11. Do'kon
                  if (_effectiveShops.isNotEmpty) ...[
                    _buildShopsSection(),
                    _buildDivider(),
                  ],

                  // 12. Stokda bor toggle
                  _buildToggleRow(
                    _t('in_stock'),
                    _filter.onlyInStock,
                    (val) => _updateFilter(_filter.copyWith(onlyInStock: val)),
                  ),

                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
          _buildBottomBar(bottomPadding),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════

  Widget _buildHeader() {
    return Column(
      children: [
        // Handle bar
        Container(
          margin: const EdgeInsets.only(top: 12),
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.grey.shade300,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 12, 8),
          child: SizedBox(
            height: 32,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Center: Filtrlar (always centered)
                Center(
                  child: Text(
                    _t('filter_title'),
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),
                ),
                // Left: Tozalash
                if (_filter.hasActiveFilters)
                  Positioned(
                    left: 0,
                    child: GestureDetector(
                      onTap: _clearAllFilters,
                      child: Text(
                        _t('reset_filters'),
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.redAccent,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                // Right: Close
                Positioned(
                  right: 0,
                  child: GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.close,
                        color: Colors.grey.shade600,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // FAOL FILTERLAR (Active Filters Row)
  // ═══════════════════════════════════════════════════════════════

  // ignore: unused_element
  Widget _buildActiveFiltersRow() {
    final chips = <Widget>[];

    // Tozalash tugmasi
    chips.add(
      GestureDetector(
        onTap: _clearAllFilters,
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Icon(Icons.close, size: 18, color: Colors.grey.shade600),
        ),
      ),
    );

    // Narx
    if (_filter.minPrice != null || _filter.maxPrice != null) {
      final min = _filter.minPrice?.toInt().toString() ?? '';
      final max = _filter.maxPrice?.toInt().toString() ?? '';
      chips.add(_buildActiveChip(
        '$min - $max ${_t('currency_som')}',
        () {
          _minPriceCtrl.clear();
          _maxPriceCtrl.clear();
          _updateFilter(
              _filter.copyWith(clearMinPrice: true, clearMaxPrice: true));
        },
      ));
    }

    // Yetkazish muddati
    if (_filter.deliveryHours != null) {
      String label;
      switch (_filter.deliveryHours) {
        case 72:
          label = _t('up_to_3_days');
          break;
        case 168:
          label = _t('up_to_7_days');
          break;
        default:
          label = _isUz
              ? '${_filter.deliveryHours} soat'
              : '${_filter.deliveryHours} ч';
      }
      chips.add(_buildActiveChip(
        label,
        () => _updateFilter(_filter.copyWith(clearDeliveryHours: true)),
      ));
    }

    // WOW-narx
    if (_filter.onlyWithDiscount) {
      chips.add(_buildActiveChip(
        _t('wow_price'),
        () => _updateFilter(_filter.copyWith(onlyWithDiscount: false)),
      ));
    }

    // Original
    if (_filter.isOriginal == true) {
      chips.add(_buildActiveChip(
        'Original',
        () => _updateFilter(_filter.copyWith(clearIsOriginal: true)),
      ));
    }

    // Brendlar
    for (final brandId in _filter.brandIds) {
      final brand = widget.brands.where((b) => b.id == brandId).firstOrNull;
      if (brand != null) {
        chips.add(_buildActiveChip(
          brand.getName(_locale),
          () {
            final newIds = Set<String>.from(_filter.brandIds)..remove(brandId);
            _updateFilter(_filter.copyWith(brandIds: newIds));
          },
        ));
      }
    }

    // Ranglar
    for (final colorId in _filter.colorIds) {
      final color = _effectiveColors.where((c) => c.id == colorId).firstOrNull;
      if (color != null) {
        chips.add(_buildActiveChip(
          _isUz ? color.nameUz : (color.nameRu ?? color.nameUz),
          () {
            final newIds = Set<String>.from(_filter.colorIds)..remove(colorId);
            _updateFilter(_filter.copyWith(colorIds: newIds));
          },
        ));
      }
    }

    // O'lchamlar
    for (final sizeId in _filter.sizeIds) {
      final size = _effectiveSizes.where((s) => s.id == sizeId).firstOrNull;
      if (size != null) {
        chips.add(_buildActiveChip(
          size.getName(_locale),
          () {
            final newIds = Set<String>.from(_filter.sizeIds)..remove(sizeId);
            _updateFilter(_filter.copyWith(sizeIds: newIds));
          },
        ));
      }
    }

    // Yetkazish usuli
    if (_filter.deliveryType != null) {
      String label;
      switch (_filter.deliveryType) {
        case 'courier':
          label = _t('courier');
          break;
        case 'pickup_point':
          label = _t('delivery_point');
          break;
        case 'pickup':
          label = _t('self_pickup');
          break;
        default:
          label = _filter.deliveryType!;
      }
      chips.add(_buildActiveChip(
        label,
        () => _updateFilter(_filter.copyWith(clearDeliveryType: true)),
      ));
    }

    // Reyting
    if (_filter.minRating != null) {
      chips.add(_buildActiveChip(
        _t('high_rating'),
        () => _updateFilter(_filter.copyWith(clearMinRating: true)),
      ));
    }

    // Stokda bor
    if (_filter.onlyInStock) {
      chips.add(_buildActiveChip(
        _t('in_stock'),
        () => _updateFilter(_filter.copyWith(onlyInStock: false)),
      ));
    }

    // Do'konlar
    for (final shopId in _filter.shopIds) {
      final shop = _effectiveShops.where((s) => s.id == shopId).firstOrNull;
      chips.add(_buildActiveChip(
        shop?.name ?? shopId,
        () {
          final newIds = Set<String>.from(_filter.shopIds)..remove(shopId);
          _updateFilter(_filter.copyWith(shopIds: newIds));
        },
      ));
    }

    // Dinamik atributlar
    for (final entry in _filter.attributes.entries) {
      final attr = entry.value;
      if (!attr.hasValue) continue;
      final catAttr = widget.categoryAttributes
          .where((a) => a.attributeKey == entry.key)
          .firstOrNull;
      final name = catAttr?.getName(_locale) ?? entry.key;
      chips.add(_buildActiveChip(
        name,
        () => _updateFilter(_filter.withoutAttribute(entry.key)),
      ));
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: chips
              .map((c) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: c,
                  ))
              .toList(),
        ),
      ),
    );
  }

  Widget _buildActiveChip(String label, VoidCallback onRemove) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF232323),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close, size: 16, color: Colors.white70),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DIVIDER
  // ═══════════════════════════════════════════════════════════════

  Widget _buildDivider() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 10),
      height: 1,
      color: Colors.grey.shade200,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // NARX (Price)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildPriceSection() {
    final priceRange = widget.facets?.priceRange;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _t('price_som'),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade900,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildPriceInput(
                controller: _minPriceCtrl,
                label: _t('from_price'),
                hint: priceRange != null ? _formatPrice(priceRange.min) : '0',
                onChanged: (value) {
                  final price = double.tryParse(value.replaceAll(' ', ''));
                  _updateFilter(_filter.copyWith(
                    minPrice: price,
                    clearMinPrice: value.isEmpty,
                  ));
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildPriceInput(
                controller: _maxPriceCtrl,
                label: _t('to_price'),
                hint: priceRange != null ? _formatPrice(priceRange.max) : '0',
                onChanged: (value) {
                  final price = double.tryParse(value.replaceAll(' ', ''));
                  _updateFilter(_filter.copyWith(
                    maxPrice: price,
                    clearMaxPrice: value.isEmpty,
                  ));
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPriceInput({
    required TextEditingController controller,
    required String label,
    required String hint,
    required Function(String) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 38, // Qat'iy balandlik berildi (standart input o'lchami)
          padding: const EdgeInsets.symmetric(horizontal: 12),
          alignment:
              Alignment.centerLeft, // Ichki elementlarni markazga tekislash
          decoration: BoxDecoration(
            color: const Color(0xFFF2F2F2),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade300, width: 0.5),
          ),
          child: Theme(
            data: Theme.of(context).copyWith(
              colorScheme: Theme.of(context).colorScheme.copyWith(
                    primary: Colors.grey.shade800,
                  ),
            ),
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              cursorColor: Colors.grey.shade800,
              decoration: InputDecoration(
                isCollapsed: true, // TextField marginlarini olib tashlaydi
                filled: true,
                fillColor: Colors.transparent,
                hintText: hint,
                hintStyle: TextStyle(
                  color: Colors.grey.shade400,
                  fontSize: 15,
                  fontWeight: FontWeight.w400,
                ),
                border: InputBorder.none,
                focusedBorder: InputBorder.none,
                enabledBorder: InputBorder.none,
                errorBorder: InputBorder.none,
                disabledBorder: InputBorder.none,
                contentPadding: EdgeInsets.zero, // Paddinglarni nollash
              ),
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade800,
              ),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  String _formatPrice(double price) {
    final intPrice = price.toInt();
    final str = intPrice.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i != 0) buffer.write(' ');
    }
    return buffer.toString().split('').reversed.join();
  }

  // ═══════════════════════════════════════════════════════════════
  // YETKAZISH MUDDATI (Delivery Time)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildDeliveryTimeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _t('delivery_period'),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade900,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildRadioChip(
                label: _t('up_to_3_days'),
                isSelected: _filter.deliveryHours == 72,
                onTap: () {
                  HapticFeedback.selectionClick();
                  _updateFilter(_filter.copyWith(
                    deliveryHours: _filter.deliveryHours == 72 ? null : 72,
                    clearDeliveryHours: _filter.deliveryHours == 72,
                  ));
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildRadioChip(
                label: _t('up_to_7_days'),
                isSelected: _filter.deliveryHours == 168,
                onTap: () {
                  HapticFeedback.selectionClick();
                  _updateFilter(_filter.copyWith(
                    deliveryHours: _filter.deliveryHours == 168 ? null : 168,
                    clearDeliveryHours: _filter.deliveryHours == 168,
                  ));
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildRadioChip(
                label: _t('not_important'),
                isSelected: _filter.deliveryHours == null,
                hideClose: true,
                onTap: () {
                  HapticFeedback.selectionClick();
                  _updateFilter(_filter.copyWith(clearDeliveryHours: true));
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // YETKAZISH USULI (Delivery Type)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildDeliveryTypeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _t('delivery_method_title'),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade900,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildRadioChip(
                label: _t('courier'),
                isSelected: _filter.deliveryType == 'courier',
                onTap: () {
                  HapticFeedback.selectionClick();
                  if (_filter.deliveryType == 'courier') {
                    _updateFilter(_filter.copyWith(clearDeliveryType: true));
                  } else {
                    _updateFilter(_filter.copyWith(deliveryType: 'courier'));
                  }
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildRadioChip(
                label: _t('pickup_point'),
                isSelected: _filter.deliveryType == 'pickup_point',
                onTap: () {
                  HapticFeedback.selectionClick();
                  if (_filter.deliveryType == 'pickup_point') {
                    _updateFilter(_filter.copyWith(clearDeliveryType: true));
                  } else {
                    _updateFilter(
                        _filter.copyWith(deliveryType: 'pickup_point'));
                  }
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildRadioChip(
                label: _t('self_pickup'),
                isSelected: _filter.deliveryType == 'pickup',
                onTap: () {
                  HapticFeedback.selectionClick();
                  if (_filter.deliveryType == 'pickup') {
                    _updateFilter(_filter.copyWith(clearDeliveryType: true));
                  } else {
                    _updateFilter(_filter.copyWith(deliveryType: 'pickup'));
                  }
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildRadioChip(
                label: _t('not_important'),
                isSelected: _filter.deliveryType == null,
                hideClose: true,
                onTap: () {
                  HapticFeedback.selectionClick();
                  _updateFilter(_filter.copyWith(clearDeliveryType: true));
                },
              ),
            ),
            const Expanded(flex: 2, child: SizedBox()),
          ],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TOGGLE ROW
  // ═══════════════════════════════════════════════════════════════

  Widget _buildToggleRow(String label, bool value, Function(bool) onChanged,
      {bool hasHelp = false}) {
    return Row(
      children: [
        Expanded(
          child: Row(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade900,
                ),
              ),
              if (hasHelp) ...[
                const SizedBox(width: 5),
                Icon(Icons.help_outline, size: 16, color: Colors.grey.shade400),
              ],
            ],
          ),
        ),
        SizedBox(
          width: 44,
          height: 24,
          child: FittedBox(
            fit: BoxFit.contain,
            child: Switch(
              value: value,
              onChanged: (val) {
                HapticFeedback.selectionClick();
                onChanged(val);
              },
              activeColor: Colors.white,
              activeTrackColor: const Color(0xFF4E6AFF),
              inactiveThumbColor: Colors.white,
              inactiveTrackColor: Colors.grey.shade300,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // BREND (Brands)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildBrandsSection() {
    final visibleBrands = widget.brands.take(5).toList();
    final hasMore = widget.brands.length > 5;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              _t('brand'),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade900,
              ),
            ),
            const Spacer(),
            if (hasMore)
              GestureDetector(
                onTap: () => _showAllBrands(context),
                child: Row(
                  children: [
                    Text(
                      _t('all_items'),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(Icons.chevron_right,
                        size: 18, color: Colors.grey.shade600),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: visibleBrands.map((brand) {
            final isSelected = _filter.brandIds.contains(brand.id);
            return _buildSimpleChip(
              label: brand.getName(_locale),
              isSelected: isSelected,
              onTap: () {
                HapticFeedback.selectionClick();
                final newBrands = Set<String>.from(_filter.brandIds);
                if (isSelected) {
                  newBrands.remove(brand.id);
                } else {
                  newBrands.add(brand.id);
                }
                _updateFilter(_filter.copyWith(brandIds: newBrands));
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  void _showAllBrands(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AllBrandsSheet(
        brands: widget.brands,
        selectedBrandIds: _filter.brandIds,
        isUzbek: _isUz,
        onBrandsSelected: (selectedIds) {
          _updateFilter(_filter.copyWith(brandIds: selectedIds));
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DO'KONLAR (Shops)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildShopsSection() {
    final shops = _effectiveShops;
    final visibleShops = shops.take(4).toList();
    final hasMore = shops.length > 4;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              _t('shop'),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade900,
              ),
            ),
            const Spacer(),
            if (hasMore)
              GestureDetector(
                onTap: () => _showAllShops(context),
                child: Row(
                  children: [
                    Text(
                      _t('all_items'),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(Icons.chevron_right,
                        size: 18, color: Colors.grey.shade600),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        if (visibleShops.length >= 3) ...[
          Row(
            children: [
              for (int i = 0; i < 3 && i < visibleShops.length; i++) ...[
                if (i > 0) const SizedBox(width: 8),
                Expanded(
                  child: Builder(builder: (context) {
                    final shop = visibleShops[i];
                    final isSelected = _filter.shopIds.contains(shop.id);
                    return _buildRadioChip(
                      label: shop.name,
                      isSelected: isSelected,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        final newShops = Set<String>.from(_filter.shopIds);
                        if (isSelected) {
                          newShops.remove(shop.id);
                        } else {
                          newShops.add(shop.id);
                        }
                        _updateFilter(_filter.copyWith(shopIds: newShops));
                      },
                    );
                  }),
                ),
              ],
            ],
          ),
          if (visibleShops.length > 3) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                for (int i = 3; i < visibleShops.length; i++) ...[
                  if (i > 3) const SizedBox(width: 8),
                  Expanded(
                    child: Builder(builder: (context) {
                      final shop = visibleShops[i];
                      final isSelected = _filter.shopIds.contains(shop.id);
                      return _buildRadioChip(
                        label: shop.name,
                        isSelected: isSelected,
                        onTap: () {
                          HapticFeedback.selectionClick();
                          final newShops = Set<String>.from(_filter.shopIds);
                          if (isSelected) {
                            newShops.remove(shop.id);
                          } else {
                            newShops.add(shop.id);
                          }
                          _updateFilter(_filter.copyWith(shopIds: newShops));
                        },
                      );
                    }),
                  ),
                ],
                // Fill remaining space
                if (visibleShops.length == 4)
                  const Expanded(flex: 2, child: SizedBox()),
              ],
            ),
          ],
        ] else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: visibleShops.map((shop) {
              final isSelected = _filter.shopIds.contains(shop.id);
              return _buildRadioChip(
                label: shop.name,
                isSelected: isSelected,
                onTap: () {
                  HapticFeedback.selectionClick();
                  final newShops = Set<String>.from(_filter.shopIds);
                  if (isSelected) {
                    newShops.remove(shop.id);
                  } else {
                    newShops.add(shop.id);
                  }
                  _updateFilter(_filter.copyWith(shopIds: newShops));
                },
              );
            }).toList(),
          ),
      ],
    );
  }

  void _showAllShops(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AllShopsSheet(
        shops: _effectiveShops,
        selectedShopIds: _filter.shopIds,
        isUzbek: _isUz,
        onShopsSelected: (selectedIds) {
          _updateFilter(_filter.copyWith(shopIds: selectedIds));
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RANGLAR (Colors)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildColorsSection() {
    final colors = _effectiveColors;
    final visibleColors = colors.take(5).toList();
    final hasMore = colors.length > 5;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              _t('color_label'),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade900,
              ),
            ),
            const Spacer(),
            if (hasMore)
              GestureDetector(
                onTap: () => _showAllColors(context),
                child: Row(
                  children: [
                    Text(
                      _t('all_items'),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(Icons.chevron_right,
                        size: 18, color: Colors.grey.shade600),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: visibleColors.map((color) {
            final isSelected = _filter.colorIds.contains(color.id);
            return _buildColorChip(color, isSelected);
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildColorChip(_ColorItemData color, bool isSelected) {
    final colorValue = _parseHexColor(color.hexCode);
    final isLight = colorValue.computeLuminance() > 0.8;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        final newColors = Set<String>.from(_filter.colorIds);
        if (isSelected) {
          newColors.remove(color.id);
        } else {
          newColors.add(color.id);
        }
        _updateFilter(_filter.copyWith(colorIds: newColors));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.grey.shade200 : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? Colors.grey.shade400 : Colors.grey.shade200,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 15,
              height: 15,
              decoration: BoxDecoration(
                color: colorValue,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isLight ? Colors.grey.shade300 : Colors.transparent,
                  width: 1,
                ),
              ),
              child: isSelected
                  ? Icon(Icons.check_rounded,
                      size: 11,
                      color: isLight ? Colors.grey.shade800 : Colors.white)
                  : null,
            ),
            const SizedBox(width: 6),
            Text(
              _isUz ? color.nameUz : (color.nameRu ?? color.nameUz),
              style: TextStyle(),
            ),
          ],
        ),
      ),
    );
  }

  void _showAllColors(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AllColorsSheet(
        colors: _effectiveColors,
        selectedColorIds: _filter.colorIds,
        isUzbek: _isUz,
        onColorsSelected: (selectedIds) {
          _updateFilter(_filter.copyWith(colorIds: selectedIds));
        },
      ),
    );
  }

  Color _parseHexColor(String hex) {
    String cleaned = hex.replaceAll('#', '');
    if (cleaned.length == 6) cleaned = 'FF$cleaned';
    return Color(int.parse(cleaned, radix: 16));
  }

  // ═══════════════════════════════════════════════════════════════
  // O'LCHAMLAR (Sizes)
  // ═══════════════════════════════════════════════════════════════

  Widget _buildSizesSection() {
    final sizes = _effectiveSizes;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _t('size_label'),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade900,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: sizes.map((size) {
            final isSelected = _filter.sizeIds.contains(size.id);
            return _buildSimpleChip(
              label: _isUz ? size.nameUz : (size.nameRu ?? size.nameUz),
              isSelected: isSelected,
              onTap: () {
                HapticFeedback.selectionClick();
                final newSizes = Set<String>.from(_filter.sizeIds);
                if (isSelected) {
                  newSizes.remove(size.id);
                } else {
                  newSizes.add(size.id);
                }
                _updateFilter(_filter.copyWith(sizeIds: newSizes));
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DINAMIK KATEGORIYA ATRIBUTLARI
  // ═══════════════════════════════════════════════════════════════

  Widget _buildCategoryAttributeSection(CategoryFilterAttribute attr) {
    switch (attr.filterType) {
      case FilterType.chips:
        return _buildChipsAttribute(attr);
      case FilterType.range:
        return _buildRangeAttribute(attr);
      case FilterType.toggle:
        return _buildToggleAttribute(attr);
      case FilterType.color:
        return _buildChipsAttribute(attr);
      case FilterType.radio:
        return _buildRadioAttribute(attr);
    }
  }

  Widget _buildChipsAttribute(CategoryFilterAttribute attr) {
    final options = attr.options;
    if (options.isEmpty) return const SizedBox.shrink();

    final selectedAttr = _filter.attributes[attr.attributeKey];
    final selectedValues = selectedAttr?.selectedValues ?? {};
    final visibleOptions = options.take(5).toList();
    final hasMore = options.length > 5;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Flexible(
              child: Text(
                attr.getName(_locale),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade900,
                ),
              ),
            ),
            if (attr.hasHelp) ...[
              const SizedBox(width: 6),
              Icon(Icons.help_outline, size: 18, color: Colors.grey.shade400),
            ],
            const Spacer(),
            if (hasMore)
              GestureDetector(
                onTap: () => _showAllAttributeOptions(attr),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _t('all_items'),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(Icons.chevron_right,
                        size: 18, color: Colors.grey.shade600),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: visibleOptions.map((option) {
            final isSelected = selectedValues.contains(option.value);
            return _buildSimpleChip(
              label: option.getLabel(_locale),
              isSelected: isSelected,
              onTap: () {
                HapticFeedback.selectionClick();
                final newSelected = Set<String>.from(selectedValues);
                if (isSelected) {
                  newSelected.remove(option.value);
                } else {
                  newSelected.add(option.value);
                }
                if (newSelected.isEmpty) {
                  _updateFilter(_filter.withoutAttribute(attr.attributeKey));
                } else {
                  _updateFilter(_filter.withAttribute(
                    attr.attributeKey,
                    SelectedFilterValue(
                      attributeKey: attr.attributeKey,
                      filterType: attr.filterType,
                      selectedValues: newSelected,
                    ),
                  ));
                }
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  void _showAllAttributeOptions(CategoryFilterAttribute attr) {
    final selectedAttr = _filter.attributes[attr.attributeKey];
    final selectedValues = Set<String>.from(selectedAttr?.selectedValues ?? {});

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
                    child: Row(
                      children: [
                        const Spacer(),
                        Text(
                          attr.getName(_locale),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () {
                            if (selectedValues.isEmpty) {
                              _updateFilter(
                                  _filter.withoutAttribute(attr.attributeKey));
                            } else {
                              _updateFilter(_filter.withAttribute(
                                attr.attributeKey,
                                SelectedFilterValue(
                                  attributeKey: attr.attributeKey,
                                  filterType: attr.filterType,
                                  selectedValues: selectedValues,
                                ),
                              ));
                            }
                            Navigator.pop(ctx);
                          },
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.close,
                                color: Colors.grey.shade600, size: 18),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: attr.options.map((option) {
                          final isSelected =
                              selectedValues.contains(option.value);
                          return _buildSimpleChip(
                            label: option.getLabel(_locale),
                            isSelected: isSelected,
                            onTap: () {
                              setSheetState(() {
                                if (isSelected) {
                                  selectedValues.remove(option.value);
                                } else {
                                  selectedValues.add(option.value);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildRangeAttribute(CategoryFilterAttribute attr) {
    final selectedAttr = _filter.attributes[attr.attributeKey];
    final currentMin = selectedAttr?.minValue;
    final currentMax = selectedAttr?.maxValue;
    final rangeMin = attr.rangeConfig?.minValue ?? 0;
    final rangeMax = attr.rangeConfig?.maxValue ?? 100;
    final unit = attr.unit ?? attr.rangeConfig?.unit ?? '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${attr.getName(_locale)}${unit.isNotEmpty ? ', $unit' : ''}',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade900,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildRangeInput(
                label: _t('from_price'),
                hint: _formatRangeVal(rangeMin),
                initialValue: currentMin,
                onChanged: (v) {
                  _updateFilter(_filter.withAttribute(
                    attr.attributeKey,
                    SelectedFilterValue(
                      attributeKey: attr.attributeKey,
                      filterType: FilterType.range,
                      minValue: v,
                      maxValue: currentMax,
                    ),
                  ));
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildRangeInput(
                label: _t('to_price'),
                hint: _formatRangeVal(rangeMax),
                initialValue: currentMax,
                onChanged: (v) {
                  _updateFilter(_filter.withAttribute(
                    attr.attributeKey,
                    SelectedFilterValue(
                      attributeKey: attr.attributeKey,
                      filterType: FilterType.range,
                      minValue: currentMin,
                      maxValue: v,
                    ),
                  ));
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRangeInput({
    required String label,
    required String hint,
    double? initialValue,
    required Function(double?) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
          TextField(
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              isDense: true,
              contentPadding: EdgeInsets.zero,
              border: InputBorder.none,
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
            ),
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            controller: TextEditingController(
                text:
                    initialValue != null ? _formatRangeVal(initialValue) : ''),
            onChanged: (val) => onChanged(double.tryParse(val)),
          ),
        ],
      ),
    );
  }

  String _formatRangeVal(double val) {
    return val == val.roundToDouble()
        ? val.toInt().toString()
        : val.toStringAsFixed(2);
  }

  Widget _buildToggleAttribute(CategoryFilterAttribute attr) {
    final selectedAttr = _filter.attributes[attr.attributeKey];
    final isOn = selectedAttr?.toggleValue ?? false;

    return _buildToggleRow(
      attr.getName(_locale),
      isOn,
      (val) {
        if (val) {
          _updateFilter(_filter.withAttribute(
            attr.attributeKey,
            SelectedFilterValue(
              attributeKey: attr.attributeKey,
              filterType: FilterType.toggle,
              toggleValue: true,
            ),
          ));
        } else {
          _updateFilter(_filter.withoutAttribute(attr.attributeKey));
        }
      },
      hasHelp: attr.hasHelp,
    );
  }

  Widget _buildRadioAttribute(CategoryFilterAttribute attr) {
    final options = attr.options;
    if (options.isEmpty) return const SizedBox.shrink();

    final selectedAttr = _filter.attributes[attr.attributeKey];
    final selectedValues = selectedAttr?.selectedValues ?? {};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          attr.getName(_locale),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade900,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ...options.map((option) {
              final isSelected = selectedValues.contains(option.value);
              return _buildRadioChip(
                label: option.getLabel(_locale),
                isSelected: isSelected,
                onTap: () {
                  HapticFeedback.selectionClick();
                  final newSelected = <String>{option.value};
                  _updateFilter(_filter.withAttribute(
                    attr.attributeKey,
                    SelectedFilterValue(
                      attributeKey: attr.attributeKey,
                      filterType: FilterType.radio,
                      selectedValues: newSelected,
                    ),
                  ));
                },
              );
            }),
            _buildRadioChip(
              label: _t('not_important'),
              isSelected: selectedValues.isEmpty,
              hideClose: true,
              onTap: () {
                HapticFeedback.selectionClick();
                _updateFilter(_filter.withoutAttribute(attr.attributeKey));
              },
            ),
          ],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // CHIPS
  // ═══════════════════════════════════════════════════════════════

  /// Oddiy chip (Brend, O'lcham, Atributlar uchun)
  Widget _buildSimpleChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF232323) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? const Color(0xFF232323) : Colors.grey.shade200,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isSelected ? Colors.white : Colors.grey.shade800,
          ),
        ),
      ),
    );
  }

  /// Radio chip (sariq nuqta bilan)
  Widget _buildRadioChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    bool hideClose = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEEF2FF) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF4E6AFF) : Colors.grey.shade200,
            width: isSelected ? 1.2 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected)
              Icon(
                Icons.check_circle_rounded,
                size: 14,
                color: const Color(0xFF4E6AFF),
              ),
            if (!isSelected)
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.grey.shade300,
                ),
              ),
            const SizedBox(width: 5),
            Flexible(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  label,
                  maxLines: 1,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: isSelected
                        ? const Color(0xFF4E6AFF)
                        : Colors.grey.shade800,
                  ),
                ),
              ),
            ),
            if (isSelected && !hideClose) ...[
              const SizedBox(width: 4),
              Icon(
                Icons.close_rounded,
                size: 14,
                color: const Color(0xFF4E6AFF),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // BOTTOM BAR
  // ═══════════════════════════════════════════════════════════════

  Widget _buildBottomBar(double bottomPadding) {
    final hasFilters = _filter.hasActiveFilters;
    return Container(
      padding: EdgeInsets.fromLTRB(16, 8, 16, 8 + bottomPadding),
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
      child: SizedBox(
        width: double.infinity,
        height: 40,
        child: Material(
          color: hasFilters ? const Color(0xFF4E6AFF) : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(100),
          child: InkWell(
            onTap: hasFilters ? _applyAndClose : () => Navigator.pop(context),
            borderRadius: BorderRadius.circular(100),
            splashColor: hasFilters
                ? Colors.white.withValues(alpha: 0.15)
                : Colors.grey.withValues(alpha: 0.1),
            highlightColor:
                hasFilters ? const Color(0xFF3B54E0) : Colors.grey.shade300,
            child: Center(
              child: Text(
                hasFilters
                    ? (widget.productCount != null && widget.productCount! > 0
                        ? '${_t('show_products')} (${widget.productCount})'
                        : _t('show_products'))
                    : _t('cancel'),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: hasFilters ? Colors.white : Colors.grey.shade600,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Color item data
// ═══════════════════════════════════════════════════════════════════════════

class _ColorItemData {
  final String id;
  final String nameUz;
  final String? nameRu;
  final String hexCode;
  final int count;

  const _ColorItemData({
    required this.id,
    required this.nameUz,
    this.nameRu,
    required this.hexCode,
    this.count = 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ALL COLORS SHEET
// ═══════════════════════════════════════════════════════════════════════════

class _AllColorsSheet extends StatefulWidget {
  final List<_ColorItemData> colors;
  final Set<String> selectedColorIds;
  final Function(Set<String>) onColorsSelected;
  final bool isUzbek;

  const _AllColorsSheet({
    required this.colors,
    required this.selectedColorIds,
    required this.onColorsSelected,
    this.isUzbek = true,
  });

  @override
  State<_AllColorsSheet> createState() => _AllColorsSheetState();
}

class _AllColorsSheetState extends State<_AllColorsSheet> {
  late Set<String> _selected;

  @override
  void initState() {
    super.initState();
    _selected = Set.from(widget.selectedColorIds);
  }

  Color _parseHex(String hex) {
    String cleaned = hex.replaceAll('#', '');
    if (cleaned.length == 6) cleaned = 'FF$cleaned';
    return Color(int.parse(cleaned, radix: 16));
  }

  bool _isLightColor(Color color) {
    return color.computeLuminance() > 0.8;
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final bottomPadding = MediaQuery.of(context).viewPadding.bottom;

    return Container(
      height: screenHeight * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Header: ← Rang
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 2, 16, 2),
            child: Row(
              children: [
                IconButton(
                  onPressed: () {
                    widget.onColorsSelected(_selected);
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.arrow_back, size: 22),
                  color: Colors.black,
                  padding: const EdgeInsets.all(12),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      AppLocalizations.of(context)?.translate('color_label') ??
                          'Rang',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 48), // balance for back button
              ],
            ),
          ),
          Divider(height: 1, color: Colors.grey.shade200),
          // List of colors
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.only(
                  top: 8, bottom: bottomPadding > 0 ? bottomPadding : 16),
              itemCount: widget.colors.length,
              itemBuilder: (context, index) {
                final color = widget.colors[index];
                final isSelected = _selected.contains(color.id);
                final colorValue = _parseHex(color.hexCode);
                final isLight = _isLightColor(colorValue);

                return InkWell(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selected.remove(color.id);
                      } else {
                        _selected.add(color.id);
                      }
                    });
                  },
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                    child: Row(
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: colorValue,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isLight
                                  ? Colors.grey.shade300
                                  : Colors.transparent,
                              width: 1,
                            ),
                          ),
                          child: isSelected
                              ? Icon(Icons.check_rounded,
                                  size: 15,
                                  color: isLight
                                      ? Colors.grey.shade800
                                      : Colors.white)
                              : null,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            widget.isUzbek
                                ? color.nameUz
                                : (color.nameRu ?? color.nameUz),
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: Colors.grey.shade900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ALL BRANDS SHEET
// ═══════════════════════════════════════════════════════════════════════════

class _AllBrandsSheet extends StatefulWidget {
  final List<BrandModel> brands;
  final Set<String> selectedBrandIds;
  final Function(Set<String>) onBrandsSelected;
  final bool isUzbek;

  const _AllBrandsSheet({
    required this.brands,
    required this.selectedBrandIds,
    required this.onBrandsSelected,
    this.isUzbek = true,
  });

  @override
  State<_AllBrandsSheet> createState() => _AllBrandsSheetState();
}

class _AllBrandsSheetState extends State<_AllBrandsSheet> {
  late Set<String> _selected;
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selected = Set.from(widget.selectedBrandIds);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<BrandModel> get _filteredBrands {
    if (_searchQuery.isEmpty) return widget.brands;
    final locale = widget.isUzbek ? 'uz' : 'ru';
    return widget.brands
        .where((b) => b
            .getName(locale)
            .toLowerCase()
            .contains(_searchQuery.toLowerCase()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final bottomPadding = MediaQuery.of(context).viewPadding.bottom;

    return Container(
      height: screenHeight * 0.75,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
            child: Row(
              children: [
                const Spacer(),
                Text(
                  widget.isUzbek ? 'Brendlar' : 'Бренды',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () {
                    widget.onBrandsSelected(_selected);
                    Navigator.pop(context);
                  },
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.close,
                        color: Colors.grey.shade600, size: 18),
                  ),
                ),
              ],
            ),
          ),
          // Qidiruv
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText:
                      widget.isUzbek ? 'Brend qidirish...' : 'Поиск бренда...',
                  hintStyle: TextStyle(color: Colors.grey.shade400),
                  border: InputBorder.none,
                  icon: Icon(Icons.search, color: Colors.grey.shade400),
                ),
                onChanged: (val) => setState(() => _searchQuery = val),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.fromLTRB(20, 0, 20, bottomPadding + 20),
              itemCount: _filteredBrands.length,
              itemBuilder: (context, index) {
                final brand = _filteredBrands[index];
                final isSelected = _selected.contains(brand.id);

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selected.remove(brand.id);
                      } else {
                        _selected.add(brand.id);
                      }
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: Colors.grey.shade200,
                          width: 1,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF232323)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(6),
                            border: isSelected
                                ? null
                                : Border.all(
                                    color: Colors.grey.shade300, width: 1.5),
                          ),
                          child: isSelected
                              ? const Icon(Icons.check,
                                  size: 16, color: Colors.white)
                              : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            brand.getName(widget.isUzbek ? 'uz' : 'ru'),
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w500,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Do'kon filter modeli
class ShopFilterItem {
  final String id;
  final String name;
  const ShopFilterItem({required this.id, required this.name});
}

/// Barcha do'konlar ro'yxati + qidiruv
class _AllShopsSheet extends StatefulWidget {
  final List<ShopFilterItem> shops;
  final Set<String> selectedShopIds;
  final ValueChanged<Set<String>> onShopsSelected;
  final bool isUzbek;

  const _AllShopsSheet({
    required this.shops,
    required this.selectedShopIds,
    required this.onShopsSelected,
    this.isUzbek = true,
  });

  @override
  State<_AllShopsSheet> createState() => _AllShopsSheetState();
}

class _AllShopsSheetState extends State<_AllShopsSheet> {
  late Set<String> _selectedIds;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _selectedIds = Set<String>.from(widget.selectedShopIds);
  }

  void _toggle(String shopId) {
    setState(() {
      if (_selectedIds.contains(shopId)) {
        _selectedIds.remove(shopId);
      } else {
        _selectedIds.add(shopId);
      }
    });
    widget.onShopsSelected(_selectedIds);
  }

  @override
  Widget build(BuildContext context) {
    final filteredShops = _searchQuery.isEmpty
        ? widget.shops
        : widget.shops
            .where((s) =>
                s.name.toLowerCase().contains(_searchQuery.toLowerCase()))
            .toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
            child: Row(
              children: [
                const Spacer(),
                Text(
                  widget.isUzbek ? 'Do\'konlar' : 'Магазины',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.close,
                        color: Colors.grey.shade600, size: 18),
                  ),
                ),
              ],
            ),
          ),
          // Qidiruv maydoni
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: widget.isUzbek
                      ? 'Do\'konni qidirish...'
                      : 'Поиск магазина...',
                  hintStyle: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 15,
                  ),
                  prefixIcon:
                      Icon(Icons.search, color: Colors.grey.shade400, size: 22),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
                style: const TextStyle(fontSize: 15),
              ),
            ),
          ),
          // Do'konlar ro'yxati
          Expanded(
            child: filteredShops.isEmpty
                ? Center(
                    child: Text(
                      widget.isUzbek ? 'Topilmadi' : 'Не найдено',
                      style:
                          TextStyle(color: Colors.grey.shade500, fontSize: 15),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filteredShops.length,
                    itemBuilder: (context, index) {
                      final shop = filteredShops[index];
                      final isSelected = _selectedIds.contains(shop.id);
                      return GestureDetector(
                        onTap: () => _toggle(shop.id),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(
                                color: Colors.grey.shade200,
                                width: 1,
                              ),
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 22,
                                height: 22,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF232323)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(6),
                                  border: isSelected
                                      ? null
                                      : Border.all(
                                          color: Colors.grey.shade300,
                                          width: 1.5),
                                ),
                                child: isSelected
                                    ? const Icon(Icons.check,
                                        size: 16, color: Colors.white)
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Icon(Icons.store_outlined,
                                    size: 16, color: Colors.grey.shade500),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  shop.name,
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: isSelected
                                        ? FontWeight.w600
                                        : FontWeight.w500,
                                    color: Colors.black87,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
