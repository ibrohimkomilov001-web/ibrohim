import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants/constants.dart';
import '../models/filter_model.dart';
import '../models/brand_model.dart';

/// SHEIN uslubidagi professional filter sheet
/// Compact chips, gradient accents, 70% height bottom sheet
class SheinFilterSheet extends StatefulWidget {
  final ProductFilter currentFilter;
  final List<BrandModel> brands;
  final String categoryName;
  final Color accentColor;
  final int? productCount;

  const SheinFilterSheet({
    super.key,
    required this.currentFilter,
    this.brands = const [],
    this.categoryName = 'Filtrlar',
    this.accentColor = const Color(0xFFFF6B6B),
    this.productCount,
  });

  /// Filter sheet'ni ochish uchun static method
  static Future<ProductFilter?> show(
    BuildContext context, {
    required ProductFilter currentFilter,
    List<BrandModel> brands = const [],
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

                  // 4. Brendlar
                  if (widget.brands.isNotEmpty) ...[
                    _buildBrandsSection(),
                    _buildDivider(),
                  ],

                  // 5. Holatlar (Toggles)
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Narxi, so\'m', Icons.payments_outlined),
        const SizedBox(height: 12),

        // Manual input
        Row(
          children: [
            Expanded(
              child: _buildPriceInput(
                controller: _minPriceCtrl,
                label: 'd.',
                hint: 'dan',
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
                hint: 'gacha',
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
