import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../core/constants/constants.dart';
import '../models/filter_model.dart';

/// Professional Filter Bottom Sheet
/// Wildberries/Ozon uslubida filter
class CatalogFilterSheet extends StatefulWidget {
  final ProductFilter initialFilter;
  final double maxPriceLimit;
  final Function(ProductFilter) onApply;

  const CatalogFilterSheet({
    super.key,
    required this.initialFilter,
    this.maxPriceLimit = 100000000, // 100 million so'm
    required this.onApply,
  });

  /// Filter sheet ni ko'rsatish
  static Future<ProductFilter?> show(
    BuildContext context, {
    required ProductFilter currentFilter,
    double maxPriceLimit = 100000000,
  }) async {
    return await showModalBottomSheet<ProductFilter>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CatalogFilterSheet(
        initialFilter: currentFilter,
        maxPriceLimit: maxPriceLimit,
        onApply: (filter) => Navigator.pop(context, filter),
      ),
    );
  }

  @override
  State<CatalogFilterSheet> createState() => _CatalogFilterSheetState();
}

class _CatalogFilterSheetState extends State<CatalogFilterSheet> {
  late ProductFilter _filter;
  late RangeValues _priceRange;
  late double _selectedRating;

  @override
  void initState() {
    super.initState();
    _filter = widget.initialFilter;
    _priceRange = RangeValues(
      _filter.minPrice ?? 0,
      _filter.maxPrice ?? widget.maxPriceLimit,
    );
    _selectedRating = _filter.minRating ?? 0;
  }

  bool get _isUzbek => Localizations.localeOf(context).languageCode == 'uz';

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
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
          _buildHeader(),

          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Narx diapazoni
                  _buildPriceSection(),

                  const SizedBox(height: AppSizes.xl),

                  // Reyting
                  _buildRatingSection(),

                  const SizedBox(height: AppSizes.xl),

                  // Qo'shimcha filterlar
                  _buildToggleFilters(),

                  const SizedBox(height: AppSizes.xl),

                  // Saralash
                  _buildSortSection(),

                  const SizedBox(height: 100), // Bottom padding
                ],
              ),
            ),
          ),

          // Bottom buttons
          _buildBottomButtons(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(AppSizes.lg),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            _isUzbek ? 'Filterlar' : 'Фильтры',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (_filter.hasActiveFilters)
            TextButton(
              onPressed: _clearAllFilters,
              child: Text(
                _isUzbek ? 'Tozalash' : 'Сбросить',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPriceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              _isUzbek ? 'Narx diapazoni' : 'Диапазон цен',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              '${_formatPrice(_priceRange.start.toInt())} - ${_formatPrice(_priceRange.end.toInt())}',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSizes.md),
        SliderTheme(
          data: SliderThemeData(
            activeTrackColor: AppColors.primary,
            inactiveTrackColor: Colors.grey.shade200,
            thumbColor: AppColors.primary,
            overlayColor: AppColors.primary.withValues(alpha: 0.2),
            rangeThumbShape: const RoundRangeSliderThumbShape(
              enabledThumbRadius: 12,
            ),
            rangeTrackShape: const RoundedRectRangeSliderTrackShape(),
          ),
          child: RangeSlider(
            values: _priceRange,
            min: 0,
            max: widget.maxPriceLimit,
            divisions: 100,
            onChanged: (values) {
              setState(() {
                _priceRange = values;
              });
            },
          ),
        ),
        const SizedBox(height: AppSizes.sm),
        // Min/Max input fields
        Row(
          children: [
            Expanded(
              child: _buildPriceInput(
                label: _isUzbek ? 'dan' : 'от',
                value: _priceRange.start.toInt(),
                onChanged: (val) {
                  if (val < _priceRange.end) {
                    setState(() {
                      _priceRange =
                          RangeValues(val.toDouble(), _priceRange.end);
                    });
                  }
                },
              ),
            ),
            const SizedBox(width: AppSizes.md),
            Expanded(
              child: _buildPriceInput(
                label: _isUzbek ? 'gacha' : 'до',
                value: _priceRange.end.toInt(),
                onChanged: (val) {
                  if (val > _priceRange.start) {
                    setState(() {
                      _priceRange =
                          RangeValues(_priceRange.start, val.toDouble());
                    });
                  }
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPriceInput({
    required String label,
    required int value,
    required Function(int) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSizes.md,
        vertical: AppSizes.sm,
      ),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
          Text(
            _formatPrice(value),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _isUzbek ? 'Minimal reyting' : 'Минимальный рейтинг',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSizes.md),
        Row(
          children: List.generate(5, (index) {
            final rating = index + 1;
            final isSelected = _selectedRating >= rating;
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedRating = _selectedRating == rating.toDouble()
                        ? 0
                        : rating.toDouble();
                  });
                },
                child: Container(
                  margin: EdgeInsets.only(
                    right: index < 4 ? AppSizes.xs : 0,
                  ),
                  padding: const EdgeInsets.symmetric(
                    vertical: AppSizes.md,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary.withValues(alpha: 0.1)
                        : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    border: Border.all(
                      color:
                          isSelected ? AppColors.primary : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Iconsax.star_1,
                            color: isSelected
                                ? Colors.amber
                                : Colors.grey.shade400,
                            size: 18,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            '$rating',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? AppColors.primary
                                  : Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        _isUzbek ? 'va yuqori' : 'и выше',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildToggleFilters() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _isUzbek ? 'Qo\'shimcha' : 'Дополнительно',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSizes.md),
        _buildToggleItem(
          icon: Iconsax.box_1,
          title: _isUzbek ? 'Faqat mavjud' : 'Только в наличии',
          subtitle: _isUzbek ? 'Stokda bor mahsulotlar' : 'Товары в наличии',
          value: _filter.onlyInStock,
          onChanged: (val) {
            setState(() {
              _filter = _filter.copyWith(onlyInStock: val);
            });
          },
        ),
        _buildToggleItem(
          icon: Iconsax.discount_shape,
          title: _isUzbek ? 'Chegirmali' : 'Со скидкой',
          subtitle:
              _isUzbek ? 'Chegirma mavjud mahsulotlar' : 'Товары со скидками',
          value: _filter.onlyWithDiscount,
          onChanged: (val) {
            setState(() {
              _filter = _filter.copyWith(onlyWithDiscount: val);
            });
          },
          accentColor: AppColors.sale,
        ),
      ],
    );
  }

  Widget _buildToggleItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required Function(bool) onChanged,
    Color? accentColor,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSizes.sm),
      decoration: BoxDecoration(
        color: value
            ? (accentColor ?? AppColors.primary).withValues(alpha: 0.05)
            : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        border: Border.all(
          color: value
              ? (accentColor ?? AppColors.primary).withValues(alpha: 0.3)
              : Colors.transparent,
        ),
      ),
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: value
                ? (accentColor ?? AppColors.primary).withValues(alpha: 0.1)
                : Colors.grey.shade200,
            borderRadius: BorderRadius.circular(AppSizes.radiusSm),
          ),
          child: Icon(
            icon,
            color: value
                ? (accentColor ?? AppColors.primary)
                : Colors.grey.shade500,
          ),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: value
                ? (accentColor ?? AppColors.primary)
                : Colors.grey.shade800,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade500,
          ),
        ),
        trailing: Switch(
          value: value,
          onChanged: onChanged,
          activeColor: accentColor ?? AppColors.primary,
        ),
      ),
    );
  }

  Widget _buildSortSection() {
    final sortOptions = [
      (
        ProductFilter.sortByPopular,
        _isUzbek ? 'Mashhur' : 'Популярные',
        Iconsax.chart_2
      ),
      (
        ProductFilter.sortByNewest,
        _isUzbek ? 'Yangi' : 'Новинки',
        Iconsax.calendar
      ),
      (
        ProductFilter.sortByPriceLow,
        _isUzbek ? 'Arzon' : 'Дешевле',
        Iconsax.arrow_down_2
      ),
      (
        ProductFilter.sortByPriceHigh,
        _isUzbek ? 'Qimmat' : 'Дороже',
        Iconsax.arrow_up_2
      ),
      (
        ProductFilter.sortByRating,
        _isUzbek ? 'Reyting' : 'Рейтинг',
        Iconsax.star_1
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _isUzbek ? 'Saralash' : 'Сортировка',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSizes.md),
        Wrap(
          spacing: AppSizes.sm,
          runSpacing: AppSizes.sm,
          children: sortOptions.map((option) {
            final isSelected = _filter.sortBy == option.$1;
            return GestureDetector(
              onTap: () {
                setState(() {
                  _filter = _filter.copyWith(sortBy: option.$1);
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSizes.md,
                  vertical: AppSizes.sm,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      option.$3,
                      size: 18,
                      color: isSelected ? Colors.white : Colors.grey.shade600,
                    ),
                    const SizedBox(width: AppSizes.xs),
                    Text(
                      option.$2,
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: isSelected ? Colors.white : Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildBottomButtons() {
    return Container(
      padding: EdgeInsets.only(
        left: AppSizes.lg,
        right: AppSizes.lg,
        bottom: MediaQuery.of(context).padding.bottom + AppSizes.md,
        top: AppSizes.md,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          // Tozalash button
          Expanded(
            child: OutlinedButton(
              onPressed: _clearAllFilters,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: AppSizes.md),
                side: BorderSide(color: Colors.grey.shade300),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                ),
              ),
              child: Text(
                _isUzbek ? 'Tozalash' : 'Сбросить',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade700,
                ),
              ),
            ),
          ),
          const SizedBox(width: AppSizes.md),
          // Qo'llash button
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _applyFilters,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: AppSizes.md),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Iconsax.tick_circle, size: 20),
                  const SizedBox(width: AppSizes.sm),
                  Text(
                    _isUzbek ? 'Qo\'llash' : 'Применить',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _clearAllFilters() {
    setState(() {
      _filter = ProductFilter.empty();
      _priceRange = RangeValues(0, widget.maxPriceLimit);
      _selectedRating = 0;
    });
  }

  void _applyFilters() {
    final appliedFilter = _filter.copyWith(
      minPrice: _priceRange.start > 0 ? _priceRange.start : null,
      maxPrice: _priceRange.end < widget.maxPriceLimit ? _priceRange.end : null,
      minRating: _selectedRating > 0 ? _selectedRating : null,
      clearMinPrice: _priceRange.start <= 0,
      clearMaxPrice: _priceRange.end >= widget.maxPriceLimit,
      clearMinRating: _selectedRating <= 0,
    );
    widget.onApply(appliedFilter);
  }

  String _formatPrice(int price) {
    if (price >= 1000000) {
      return '${(price / 1000000).toStringAsFixed(1)}M';
    } else if (price >= 1000) {
      return '${(price / 1000).toStringAsFixed(0)}K';
    }
    return price.toString();
  }
}
