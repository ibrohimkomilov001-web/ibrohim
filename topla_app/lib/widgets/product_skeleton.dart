import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../core/constants/constants.dart';

/// Shimmer placeholder — oddiy rounded container
Widget _bone({
  double? width,
  double height = 14,
  double radius = 6,
  Color? color,
}) {
  return Container(
    width: width,
    height: height,
    decoration: BoxDecoration(
      color: color ?? Colors.white,
      borderRadius: BorderRadius.circular(radius),
    ),
  );
}

/// Product skeleton — bitta mahsulot karta skeleti (grid uchun)
class ProductSkeleton extends StatelessWidget {
  const ProductSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? Colors.grey.shade800 : Colors.grey.shade200;
    final highlightColor = isDark ? Colors.grey.shade700 : Colors.grey.shade50;
    final cardColor = isDark ? Colors.grey.shade900 : Colors.white;

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          border: Border.all(
            color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
            width: 0.5,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Rasm placeholder
            Expanded(
              flex: 5,
              child: Container(
                decoration: BoxDecoration(
                  color: baseColor.withValues(alpha: 0.4),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(AppSizes.radiusMd),
                  ),
                ),
                child: Center(
                  child: Icon(
                    Icons.image_outlined,
                    size: 40,
                    color: baseColor.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ),
            // Kontent
            Expanded(
              flex: 4,
              child: Padding(
                padding: const EdgeInsets.all(AppSizes.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Title — 2 qator
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _bone(height: 12, width: double.infinity),
                        const SizedBox(height: 6),
                        _bone(height: 12, width: 80),
                      ],
                    ),
                    // Rating yulduzchalar
                    Row(
                      children: List.generate(
                        5,
                        (i) => Padding(
                          padding: const EdgeInsets.only(right: 2),
                          child: _bone(width: 12, height: 12, radius: 2),
                        ),
                      ),
                    ),
                    // Narx
                    _bone(height: 16, width: 90, radius: 4),
                    // Tugma
                    _bone(
                      height: 34,
                      width: double.infinity,
                      radius: AppSizes.radiusSm,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Products skeleton grid — bir nechta mahsulot skeleti
class ProductsSkeletonGrid extends StatelessWidget {
  final int itemCount;
  final int crossAxisCount;

  const ProductsSkeletonGrid({
    super.key,
    this.itemCount = 6,
    this.crossAxisCount = 2,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppSizes.md),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: AppSizes.md,
        crossAxisSpacing: AppSizes.md,
        childAspectRatio: 0.62,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) => const ProductSkeleton(),
    );
  }
}

/// Category skeleton — bitta kategoriya yuklanish skeleti
class CategorySkeleton extends StatelessWidget {
  const CategorySkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
      highlightColor: isDark ? Colors.grey.shade700 : Colors.grey.shade50,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppSizes.radiusLg),
        ),
      ),
    );
  }
}

/// Subcategory chip skeleton
class SubcategoryChipSkeleton extends StatelessWidget {
  const SubcategoryChipSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
      highlightColor: isDark ? Colors.grey.shade700 : Colors.grey.shade50,
      child: Container(
        width: 80,
        height: 36,
        margin: const EdgeInsets.only(right: AppSizes.sm),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
        ),
      ),
    );
  }
}

/// Subcategory chips skeleton row
class SubcategoryChipsSkeletonRow extends StatelessWidget {
  final int itemCount;

  const SubcategoryChipsSkeletonRow({super.key, this.itemCount = 5});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
        itemCount: itemCount,
        itemBuilder: (context, index) => const SubcategoryChipSkeleton(),
      ),
    );
  }
}

/// List item skeleton — list view uchun
class ProductListSkeleton extends StatelessWidget {
  const ProductListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? Colors.grey.shade800 : Colors.grey.shade200;
    final highlightColor = isDark ? Colors.grey.shade700 : Colors.grey.shade50;

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSizes.md,
          vertical: AppSizes.xs,
        ),
        padding: const EdgeInsets.all(AppSizes.sm),
        decoration: BoxDecoration(
          color: isDark ? Colors.grey.shade900 : Colors.white,
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          border: Border.all(
            color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
            width: 0.5,
          ),
        ),
        child: Row(
          children: [
            // Rasm
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: baseColor.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(AppSizes.radiusSm),
              ),
              child: Center(
                child: Icon(
                  Icons.image_outlined,
                  size: 28,
                  color: baseColor.withValues(alpha: 0.5),
                ),
              ),
            ),
            const SizedBox(width: AppSizes.md),
            // Kontent
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _bone(height: 13, width: double.infinity),
                  const SizedBox(height: 8),
                  _bone(height: 13, width: 120),
                  const SizedBox(height: 10),
                  // Yulduzchalar
                  Row(
                    children: List.generate(
                      5,
                      (i) => Padding(
                        padding: const EdgeInsets.only(right: 2),
                        child: _bone(width: 10, height: 10, radius: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  _bone(height: 16, width: 100, radius: 4),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Products skeleton list
class ProductsSkeletonList extends StatelessWidget {
  final int itemCount;

  const ProductsSkeletonList({super.key, this.itemCount = 6});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: itemCount,
      itemBuilder: (context, index) => const ProductListSkeleton(),
    );
  }
}
