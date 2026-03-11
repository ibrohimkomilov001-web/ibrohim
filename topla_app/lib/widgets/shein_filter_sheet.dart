import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants/constants.dart';
import '../models/filter_model.dart';
import '../models/brand_model.dart';
import '../models/product_facets.dart';
import '../models/color_option.dart';
import '../models/category_filter_attribute.dart';

/// SHEIN uslubidagi professional filter sheet
/// Compact chips, gradient accents, 70% height bottom sheet
/// Ranglar (hex swatch), o'lchamlar, brendlar (count bilan), dynamic atributlar
class SheinFilterSheet extends StatefulWidget {
  final ProductFilter currentFilter;
  final List<BrandModel> brands;
  final List<ColorOption> colors;
  final ProductFacets? facets;
  final List<CategoryFilterAttribute> categoryAttributes;
  final String categoryName;
  final Color accentColor;
  final int? productCount;

  const SheinFilterSheet({
    super.key,
    required this.currentFilter,
    this.brands = const [],
    this.colors = const [],
    this.facets,
    this.categoryAttributes = const [],
    this.categoryName = 'Filtrlar',
    this.accentColor = const Color(0xFFFF6B6B),
    this.productCount,
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
  }) {
    return showModalBottomSheet<ProductFilter>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SheinFilterSheet(
        currentFilter: currentFilter,
        brands: brands,
        colors: colors,
        facets: facets,
        categoryAttributes: categoryAttributes,
        categoryName: categoryName,
        accentColor: accentColor,
        productCount: productCount,
      ),
    );
  }

  @override
  State<SheinFilterSheet> createState() => _SheinFilterSheetState();
}

class _SheinFilterSheetState extends State<SheinFilterSheet> {
  late ProductFilter _filter;

  // Price controllers
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

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final bottomPadding = MediaQuery.of(context).viewPadding.bottom;

    return Container(
      height: screenHeight * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Header
          _buildHeader(),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),

                  // 1. Saralash
                  _buildSortSection(),
                  _buildDivider(),

                  // 2. Narx
                  _buildPriceSection(),
                  _buildDivider(),

                  // 3. Reyting
                  _buildRatingSection(),
                  _buildDivider(),

                  // 4. Ranglar
                  if (_effectiveColors.isNotEmpty) ...[
                    _buildColorsSection(),
                    _buildDivider(),
                  ],

                  // 5. O'lchamlar
                  if (_effectiveSizes.isNotEmpty) ...[
                    _buildSizesSection(),
                    _buildDivider(),
                  ],

                  // 6. Brendlar
                  if (widget.brands.isNotEmpty) ...[
                    _buildBrandsSection(),
                    _buildDivider(),
                  ],

                  // 7. Dinamik kategoriya atributlari
                  ...widget.categoryAttributes.map((attr) => Column(
                        children: [
                          _buildCategoryAttributeSection(attr),
                          _buildDivider(),
                        ],
                      )),

                  // 8. Holatlar (Toggles)
                  _buildStatusSection(),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),

          // Bottom sticky bar
          _buildBottomBar(bottomPadding),
        ],
      ),
    );
  }

  /// Glassmorphism header
  Widget _buildHeader() {
    final activeCount = _filter.activeFilterCount;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 12, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Row(
            children: [
              // Title with badge
              Text(
                'Filtrlar',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade900,
                ),
              ),
              if (activeCount > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        widget.accentColor,
                        widget.accentColor.withValues(alpha: 0.8),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$activeCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
              const Spacer(),
              // Clear button
              if (_filter.hasActiveFilters)
                TextButton(
                  onPressed: _clearAllFilters,
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.grey.shade600,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  child: const Text(
                    'Tozalash',
                    style: TextStyle(fontSize: 14),
                  ),
                ),
              // Close button
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(
                  Icons.close_rounded,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 20),
      height: 1,
      color: Colors.grey.shade100,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPUTED HELPERS
  // ═══════════════════════════════════════════════════════════════

  /// Facets yoki colors listdan ranglarni olish
  List<_ColorItem> get _effectiveColors {
    final facets = widget.facets;
    if (facets != null && facets.colors.isNotEmpty) {
      return facets.colors
          .map((c) => _ColorItem(
              id: c.id,
              nameUz: c.nameUz,
              nameRu: c.nameRu,
              hexCode: c.hexCode,
              count: c.count))
          .toList();
    }
    if (widget.colors.isNotEmpty) {
      return widget.colors
          .map((c) => _ColorItem(
              id: c.id,
              nameUz: c.nameUz,
              nameRu: c.nameRu,
              hexCode: c.hexCode,
              count: c.productCount))
          .toList();
    }
    return [];
  }

  /// Facets dan o'lchamlarni olish
  List<SizeFacet> get _effectiveSizes {
    return widget.facets?.sizes ?? [];
  }

  /// Brand uchun product count olish (facets dan)
  int? _getBrandCount(String brandId) {
    final facets = widget.facets;
    if (facets == null) return null;
    final match = facets.brands.where((b) => b.id == brandId);
    if (match.isEmpty) return null;
    return match.first.count;
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION: RANGLAR (Colors)
  // ═══════════════════════════════════════════════════════════════
  Widget _buildColorsSection() {
    final colors = _effectiveColors;
    final visibleColors = colors.take(12).toList();
    final hasMore = colors.length > 12;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _buildSectionTitle('Rang', Icons.palette_outlined),
            const Spacer(),
            if (hasMore)
              TextButton(
                onPressed: () => _showAllColors(context),
                style: TextButton.styleFrom(
                  foregroundColor: widget.accentColor,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                ),
                child: Text(
                  'Barchasi (${colors.length})',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: visibleColors.map((color) {
            final isSelected = _filter.colorIds.contains(color.id);
            return _buildColorSwatch(color, isSelected);
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildColorSwatch(_ColorItem color, bool isSelected) {
    final colorValue = _parseHexColor(color.hexCode);
    final isLight = _isLightColor(colorValue);

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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: colorValue,
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected
                    ? widget.accentColor
                    : (isLight ? Colors.grey.shade300 : Colors.transparent),
                width: isSelected ? 3 : 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: widget.accentColor.withValues(alpha: 0.3),
                        blurRadius: 8,
                        spreadRadius: 1,
                      )
                    ]
                  : null,
            ),
            child: isSelected
                ? Icon(
                    Icons.check_rounded,
                    size: 20,
                    color: isLight ? Colors.grey.shade800 : Colors.white,
                  )
                : null,
          ),
          const SizedBox(height: 4),
          SizedBox(
            width: 52,
            child: Text(
              color.nameUz,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade600,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ),
          if (color.count > 0)
            Text(
              '${color.count}',
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey.shade400,
              ),
            ),
        ],
      ),
    );
  }

  Color _parseHexColor(String hex) {
    String cleaned = hex.replaceAll('#', '');
    if (cleaned.length == 6) cleaned = 'FF$cleaned';
    return Color(int.parse(cleaned, radix: 16));
  }

  bool _isLightColor(Color color) {
    return (0.299 * color.red + 0.587 * color.green + 0.114 * color.blue) > 186;
  }

  void _showAllColors(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AllColorsSheet(
        colors: _effectiveColors,
        selectedColorIds: _filter.colorIds,
        accentColor: widget.accentColor,
        onColorsSelected: (selectedIds) {
          _updateFilter(_filter.copyWith(colorIds: selectedIds));
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION: O'LCHAMLAR (Sizes)
  // ═══════════════════════════════════════════════════════════════
  Widget _buildSizesSection() {
    final sizes = _effectiveSizes;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('O\'lcham', Icons.straighten_outlined),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: sizes.map((size) {
            final isSelected = _filter.sizeIds.contains(size.id);
            return _buildSizeChip(size, isSelected);
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSizeChip(SizeFacet size, bool isSelected) {
    return GestureDetector(
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
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          gradient: isSelected
              ? LinearGradient(
                  colors: [
                    widget.accentColor.withValues(alpha: 0.15),
                    widget.accentColor.withValues(alpha: 0.05),
                  ],
                )
              : null,
          color: isSelected ? null : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? widget.accentColor : Colors.grey.shade200,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              size.nameUz,
              style: TextStyle(
                color: isSelected ? widget.accentColor : Colors.grey.shade800,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                fontSize: 14,
              ),
            ),
            if (size.count > 0) ...[
              const SizedBox(width: 4),
              Text(
                '(${size.count})',
                style: TextStyle(
                  fontSize: 12,
                  color: isSelected
                      ? widget.accentColor.withValues(alpha: 0.7)
                      : Colors.grey.shade400,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION: DINAMIK KATEGORIYA ATRIBUTLARI
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
        return _buildChipsAttribute(attr); // Same UI as chips
      case FilterType.radio:
        return _buildRadioAttribute(attr);
    }
  }

  Widget _buildChipsAttribute(CategoryFilterAttribute attr) {
    final options = attr.options;
    if (options.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(attr.attributeNameUz, Icons.tune_rounded),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((option) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Text(
                option.label,
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildRangeAttribute(CategoryFilterAttribute attr) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(
          '${attr.attributeNameUz}${attr.unit != null ? ' (${attr.unit})' : ''}',
          Icons.linear_scale_rounded,
        ),
        const SizedBox(height: 12),
        if (attr.rangeConfig != null &&
            attr.rangeConfig!.minValue != null &&
            attr.rangeConfig!.maxValue != null)
          Text(
            '${attr.rangeConfig!.minValue!.toStringAsFixed(0)} - ${attr.rangeConfig!.maxValue!.toStringAsFixed(0)}',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
      ],
    );
  }

  Widget _buildToggleAttribute(CategoryFilterAttribute attr) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _buildSectionTitle(attr.attributeNameUz, Icons.toggle_on_outlined),
            const Spacer(),
            Switch(
              value: false, // TODO: connect to filter state
              onChanged: (_) {},
              activeColor: widget.accentColor,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRadioAttribute(CategoryFilterAttribute attr) {
    return _buildChipsAttribute(attr);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: SARALASH (Sort)
  // ═══════════════════════════════════════════════════════════════
  Widget _buildSortSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Saralash', Icons.sort_rounded),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: [
              _buildSortChip('Mashhur', ProductFilter.sortByPopular, '🔥'),
              _buildSortChip('Yangi', ProductFilter.sortByNewest, '✨'),
              _buildSortChip('Arzon→', ProductFilter.sortByPriceLow, '💰'),
              _buildSortChip('Qimmat→', ProductFilter.sortByPriceHigh, '💎'),
              _buildSortChip('Reyting', ProductFilter.sortByRating, '⭐'),
              _buildSortChip('Chegirma', ProductFilter.sortByDiscount, '🏷️'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSortChip(String label, String sortValue, String emoji) {
    final isSelected = _filter.sortBy == sortValue;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          _updateFilter(_filter.copyWith(
            sortBy: sortValue,
            sortAscending: sortValue == ProductFilter.sortByPriceLow,
          ));
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            gradient: isSelected
                ? LinearGradient(
                    colors: [
                      widget.accentColor.withValues(alpha: 0.15),
                      widget.accentColor.withValues(alpha: 0.05),
                    ],
                  )
                : null,
            color: isSelected ? null : Colors.grey.shade50,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? widget.accentColor : Colors.grey.shade200,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 14)),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? widget.accentColor : Colors.grey.shade700,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: NARX (Price)
  // ═══════════════════════════════════════════════════════════════
  Widget _buildPriceSection() {
    final priceRange = widget.facets?.priceRange;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _buildSectionTitle('Narxi, so\'m', Icons.payments_outlined),
            if (priceRange != null) ...[
              const Spacer(),
              Text(
                '${_formatPrice(priceRange.min)} - ${_formatPrice(priceRange.max)}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade400,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),

        // Manual input
        Row(
          children: [
            Expanded(
              child: _buildPriceInput(
                controller: _minPriceCtrl,
                label: 'd.',
                hint: priceRange != null ? _formatPrice(priceRange.min) : 'dan',
                onChanged: (value) {
                  final price = double.tryParse(value);
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
                label: 'g.',
                hint:
                    priceRange != null ? _formatPrice(priceRange.max) : 'gacha',
                onChanged: (value) {
                  final price = double.tryParse(value);
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

  String _formatPrice(double price) {
    if (price >= 1000000) {
      return '${(price / 1000000).toStringAsFixed(1)}M';
    } else if (price >= 1000) {
      return '${(price / 1000).toStringAsFixed(0)}K';
    }
    return price.toStringAsFixed(0);
  }

  Widget _buildPriceInput({
    required TextEditingController controller,
    required String label,
    required String hint,
    required Function(String) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade500,
            ),
          ),
          TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(
                color: Colors.grey.shade400,
                fontSize: 16,
              ),
              border: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.zero,
            ),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade800,
            ),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: REYTING (Rating)
  // ═══════════════════════════════════════════════════════════════
  Widget _buildRatingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Reyting', Icons.star_rounded),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildRatingChip(4.5, '4.5+'),
            _buildRatingChip(4.0, '4+'),
            _buildRatingChip(3.5, '3.5+'),
            _buildRatingChip(3.0, '3+'),
          ],
        ),
      ],
    );
  }

  Widget _buildRatingChip(double rating, String label) {
    final isSelected = _filter.minRating == rating;
    final starCount = rating.floor();

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        _updateFilter(_filter.copyWith(
          minRating: isSelected ? null : rating,
          clearMinRating: isSelected,
        ));
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          gradient: isSelected
              ? const LinearGradient(
                  colors: [Color(0xFFFFD700), Color(0xFFFFA500)],
                )
              : null,
          color: isSelected ? null : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(20),
          border: isSelected ? null : Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Stars
            Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (i) {
                return Icon(
                  i < starCount
                      ? Icons.star_rounded
                      : Icons.star_outline_rounded,
                  size: 16,
                  color: isSelected
                      ? Colors.white
                      : (i < starCount
                          ? const Color(0xFFFFB800)
                          : Colors.grey.shade300),
                );
              }),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey.shade700,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: BRENDLAR (Brands)
  // ═══════════════════════════════════════════════════════════════
  Widget _buildBrandsSection() {
    // Show first 6 brands
    final visibleBrands = widget.brands.take(6).toList();
    final hasMore = widget.brands.length > 6;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _buildSectionTitle('Brendlar', Icons.business_rounded),
            const Spacer(),
            if (hasMore)
              TextButton(
                onPressed: () => _showAllBrands(context),
                style: TextButton.styleFrom(
                  foregroundColor: widget.accentColor,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                ),
                child: Text(
                  'Barchasi (${widget.brands.length})',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: visibleBrands.map((brand) {
            final isSelected = _filter.brandIds.contains(brand.id);
            return _buildBrandChip(brand, isSelected);
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildBrandChip(BrandModel brand, bool isSelected) {
    final count = _getBrandCount(brand.id);

    return GestureDetector(
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
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          gradient: isSelected
              ? LinearGradient(
                  colors: [
                    widget.accentColor.withValues(alpha: 0.15),
                    widget.accentColor.withValues(alpha: 0.05),
                  ],
                )
              : null,
          color: isSelected ? null : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? widget.accentColor : Colors.grey.shade200,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected) ...[
              Icon(
                Icons.check_rounded,
                size: 16,
                color: widget.accentColor,
              ),
              const SizedBox(width: 6),
            ],
            Text(
              brand.nameUz,
              style: TextStyle(
                color: isSelected ? widget.accentColor : Colors.grey.shade700,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                fontSize: 14,
              ),
            ),
            if (count != null && count > 0) ...[
              const SizedBox(width: 4),
              Text(
                '($count)',
                style: TextStyle(
                  fontSize: 12,
                  color: isSelected
                      ? widget.accentColor.withValues(alpha: 0.7)
                      : Colors.grey.shade400,
                ),
              ),
            ],
          ],
        ),
      ),
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
        accentColor: widget.accentColor,
        onBrandsSelected: (selectedIds) {
          _updateFilter(_filter.copyWith(brandIds: selectedIds));
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5: HOLATLAR (Status toggles)
  // ═══════════════════════════════════════════════════════════════
  Widget _buildStatusSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Holat', Icons.local_offer_outlined),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildStatusChip(
              '🏷️ Chegirmada',
              _filter.onlyWithDiscount,
              (val) => _updateFilter(_filter.copyWith(onlyWithDiscount: val)),
            ),
            _buildStatusChip(
              '✓ Original',
              _filter.isOriginal ?? false,
              (val) => _updateFilter(_filter.copyWith(isOriginal: val)),
            ),
            _buildStatusChip(
              '📦 Mavjud',
              _filter.onlyInStock,
              (val) => _updateFilter(_filter.copyWith(onlyInStock: val)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatusChip(String label, bool isSelected, Function(bool) onTap) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap(!isSelected);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          gradient: isSelected
              ? LinearGradient(
                  colors: [
                    widget.accentColor,
                    widget.accentColor.withValues(alpha: 0.8),
                  ],
                )
              : null,
          color: isSelected ? null : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(20),
          border: isSelected ? null : Border.all(color: Colors.grey.shade200),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey.shade700,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════
  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade800,
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // BOTTOM BAR
  // ═══════════════════════════════════════════════════════════════
  Widget _buildBottomBar(double bottomPadding) {
    final count = widget.productCount ?? 0;

    return Container(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottomPadding),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Clear button
          if (_filter.hasActiveFilters)
            Expanded(
              flex: 1,
              child: TextButton(
                onPressed: _clearAllFilters,
                style: TextButton.styleFrom(
                  foregroundColor: Colors.grey.shade600,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text(
                  'Tozalash',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),

          if (_filter.hasActiveFilters) const SizedBox(width: 12),

          // Apply button
          Expanded(
            flex: 2,
            child: GestureDetector(
              onTap: _applyAndClose,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary,
                      AppColors.primary.withValues(alpha: 0.85),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    count > 0
                        ? 'Tovarlarni ko\'rsatish ($count)'
                        : 'Tovarlarni ko\'rsatish',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Color item (unified from ColorOption/ColorFacet)
// ═══════════════════════════════════════════════════════════════════════════
class _ColorItem {
  final String id;
  final String nameUz;
  final String? nameRu;
  final String hexCode;
  final int count;

  const _ColorItem({
    required this.id,
    required this.nameUz,
    this.nameRu,
    required this.hexCode,
    this.count = 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ALL COLORS SHEET (for "Barchasi" button)
// ═══════════════════════════════════════════════════════════════════════════
class _AllColorsSheet extends StatefulWidget {
  final List<_ColorItem> colors;
  final Set<String> selectedColorIds;
  final Color accentColor;
  final Function(Set<String>) onColorsSelected;

  const _AllColorsSheet({
    required this.colors,
    required this.selectedColorIds,
    required this.accentColor,
    required this.onColorsSelected,
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

  bool _isLight(Color color) {
    return (0.299 * color.red + 0.587 * color.green + 0.114 * color.blue) > 186;
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final bottomPadding = MediaQuery.of(context).viewPadding.bottom;

    return Container(
      height: screenHeight * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 12, 16),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Row(
                  children: [
                    Text(
                      'Ranglar',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey.shade900,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () {
                        widget.onColorsSelected(_selected);
                        Navigator.pop(context);
                      },
                      icon: Icon(
                        Icons.check_rounded,
                        color: widget.accentColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Colors grid
          Expanded(
            child: GridView.builder(
              padding: EdgeInsets.fromLTRB(20, 0, 20, bottomPadding + 20),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                childAspectRatio: 0.75,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: widget.colors.length,
              itemBuilder: (context, index) {
                final color = widget.colors[index];
                final isSelected = _selected.contains(color.id);
                final colorValue = _parseHex(color.hexCode);
                final isLight = _isLight(colorValue);

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selected.remove(color.id);
                      } else {
                        _selected.add(color.id);
                      }
                    });
                  },
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: colorValue,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isSelected
                                ? widget.accentColor
                                : (isLight
                                    ? Colors.grey.shade300
                                    : Colors.transparent),
                            width: isSelected ? 3 : 1,
                          ),
                        ),
                        child: isSelected
                            ? Icon(Icons.check_rounded,
                                size: 22,
                                color: isLight
                                    ? Colors.grey.shade800
                                    : Colors.white)
                            : null,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        color.nameUz,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          color: isSelected
                              ? widget.accentColor
                              : Colors.grey.shade700,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                      if (color.count > 0)
                        Text(
                          '${color.count}',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey.shade400,
                          ),
                        ),
                    ],
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
// ALL BRANDS SHEET (for "Barchasi" button)
// ═══════════════════════════════════════════════════════════════════════════
class _AllBrandsSheet extends StatefulWidget {
  final List<BrandModel> brands;
  final Set<String> selectedBrandIds;
  final Color accentColor;
  final Function(Set<String>) onBrandsSelected;

  const _AllBrandsSheet({
    required this.brands,
    required this.selectedBrandIds,
    required this.accentColor,
    required this.onBrandsSelected,
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
    return widget.brands
        .where(
            (b) => b.nameUz.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final bottomPadding = MediaQuery.of(context).viewPadding.bottom;

    return Container(
      height: screenHeight * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 12, 16),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Row(
                  children: [
                    Text(
                      'Brendlar',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey.shade900,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () {
                        widget.onBrandsSelected(_selected);
                        Navigator.pop(context);
                      },
                      icon: Icon(
                        Icons.check_rounded,
                        color: widget.accentColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Search
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: TextField(
                    controller: _searchCtrl,
                    decoration: InputDecoration(
                      hintText: 'Brend qidirish...',
                      hintStyle: TextStyle(color: Colors.grey.shade400),
                      border: InputBorder.none,
                      icon: Icon(Icons.search, color: Colors.grey.shade400),
                    ),
                    onChanged: (val) => setState(() => _searchQuery = val),
                  ),
                ),
              ],
            ),
          ),

          // Brands list
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.fromLTRB(20, 0, 20, bottomPadding + 20),
              itemCount: _filteredBrands.length,
              itemBuilder: (context, index) {
                final brand = _filteredBrands[index];
                final isSelected = _selected.contains(brand.id);

                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    brand.nameUz,
                    style: TextStyle(
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
                      color: isSelected
                          ? widget.accentColor
                          : Colors.grey.shade800,
                    ),
                  ),
                  trailing: Checkbox(
                    value: isSelected,
                    activeColor: widget.accentColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                    ),
                    onChanged: (val) {
                      setState(() {
                        if (val == true) {
                          _selected.add(brand.id);
                        } else {
                          _selected.remove(brand.id);
                        }
                      });
                    },
                  ),
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selected.remove(brand.id);
                      } else {
                        _selected.add(brand.id);
                      }
                    });
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
