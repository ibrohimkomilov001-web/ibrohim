import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../../widgets/skeleton_widgets.dart';
import '../../widgets/empty_states.dart';
import '../../widgets/product_card.dart';
import '../main/main_screen.dart';
import '../product/product_detail_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  @override
  void initState() {
    super.initState();
    // Sevimlilarni yuklash
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductsProvider>().loadFavorites();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,
              color: Colors.black87, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        centerTitle: true,
        title: Text(
          context.l10n.favorites,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          Consumer<ProductsProvider>(
            builder: (context, provider, _) {
              if (provider.favorites.isEmpty) return const SizedBox();
              return TextButton(
                onPressed: _clearAll,
                child: Text(
                  context.l10n.clear,
                  style: TextStyle(color: AppColors.error),
                ),
              );
            },
          ),
        ],
      ),
      body: Consumer<ProductsProvider>(
        builder: (context, provider, _) {
          if (provider.isFavoritesLoading) {
            return GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 0.62,
              ),
              itemCount: 4,
              itemBuilder: (_, __) => const ProductCardSkeleton(),
            );
          }

          if (provider.favorites.isEmpty) {
            return EmptyFavoritesWidget(
              onExplore: () => MainScreenState.switchToTab(0),
            );
          }

          return _buildFavoritesGrid(provider, provider.favorites);
        },
      ),
    );
  }

  Widget _buildFavoritesGrid(
      ProductsProvider provider, List<ProductModel> favorites) {
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 0.62,
      ),
      itemCount: favorites.length,
      itemBuilder: (context, index) {
        final product = favorites[index];
        return ProductCard(
          name: product.nameUz,
          price: product.price.toInt(),
          oldPrice: product.oldPrice?.toInt(),
          discount: product.discountPercent,
          rating: product.rating,
          sold: product.soldCount,
          imageUrl: product.firstImage,
          isFavorite: true,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ProductDetailScreen(product: product.toMap()),
              ),
            );
          },
          onAddToCart: () => _addToCart(product),
          onFavoriteToggle: () => _removeFromFavorites(product.id),
        );
      },
    );
  }

  void _removeFromFavorites(String productId) {
    context.read<ProductsProvider>().toggleFavorite(productId);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.l10n.removedFromFavorites),
        backgroundColor: Colors.grey.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _addToCart(ProductModel product) {
    context.read<CartProvider>().addToCart(product.id).then((_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Text(context.l10n.addedToCart),
            ],
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }).catchError((e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${context.l10n.error}: $e'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    });
  }

  void _clearAll() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(context.l10n.clearFavorites),
        content: Text(context.l10n.clearFavoritesConfirm),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(context.l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () {
              // Remove all favorites
              final provider = context.read<ProductsProvider>();
              for (var product in provider.favorites.toList()) {
                provider.toggleFavorite(product.id);
              }
              Navigator.pop(dialogContext);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: Text(context.l10n.delete),
          ),
        ],
      ),
    );
  }
}
