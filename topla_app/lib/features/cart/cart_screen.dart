import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../../widgets/skeleton_widgets.dart';
import '../../widgets/empty_states.dart';
import '../../widgets/topla_refresh_indicator.dart';
import '../checkout/checkout_screen.dart';
import '../main/main_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen>
    with AutomaticKeepAliveClientMixin {
  String _promoCode = '';
  double _discount = 0;
  // ignore: unused_field
  String? _promoCodeId;
  bool _isPromoLoading = false;
  final Set<String> _selectedItems = {};
  bool _allSelected = true;
  bool _isSelectionInitialized = false;
  final Set<String> _knownItemIds = {}; // Bilgan item ID'lar

  @override
  void initState() {
    super.initState();
    // Savatni yuklash (faqat autentifikatsiya bo'lsa)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cartProvider = context.read<CartProvider>();
      if (cartProvider.isAuthenticated) {
        cartProvider.loadCart();
      }
    });
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Consumer<CartProvider>(
          builder: (context, cart, _) {
            // Autentifikatsiya tekshirish
            if (!cart.isAuthenticated) {
              return _buildLoginRequiredState();
            }

            if (cart.isLoading) {
              // Shimmer skeleton loading
              return ListView.separated(
                padding: const EdgeInsets.all(AppSizes.lg),
                itemCount: 4,
                separatorBuilder: (_, __) =>
                    const SizedBox(height: AppSizes.md),
                itemBuilder: (_, __) => const CartItemSkeleton(),
              );
            }

            if (cart.error != null) {
              return _buildErrorState(cart.error!);
            }

            if (cart.isEmpty) {
              return EmptyCartWidget(
                onShopNow: () => MainScreenState.switchToTab(0),
              );
            }

            // Sync selected items with current cart
            final cartIds = cart.items.map((e) => e.id).toSet();
            _selectedItems.removeWhere((id) => !cartIds.contains(id));

            // Auto-select items: faqat birinchi yuklashda hammasi va yangi qo'shilgan mahsulotlar
            if (!_isSelectionInitialized && cart.items.isNotEmpty) {
              _selectedItems.addAll(cartIds);
              _knownItemIds.addAll(cartIds);
              _isSelectionInitialized = true;
            } else {
              // Faqat haqiqatan yangi qo'shilgan mahsulotlarni belgilash
              for (final id in cartIds) {
                if (!_knownItemIds.contains(id)) {
                  _selectedItems.add(id);
                  _knownItemIds.add(id);
                }
              }
              // O'chirilgan mahsulotlarni known ro'yxatdan ham olib tashlash
              _knownItemIds.removeWhere((id) => !cartIds.contains(id));
            }

            _allSelected = _selectedItems.length == cart.items.length &&
                cart.items.isNotEmpty;

            return Column(
              children: [
                // Header with select all and clear button
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      // Select all checkbox
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            if (_allSelected) {
                              _selectedItems.clear();
                              _allSelected = false;
                            } else {
                              for (final item in cart.items) {
                                _selectedItems.add(item.id);
                              }
                              _allSelected = true;
                            }
                          });
                        },
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: _allSelected
                                ? AppColors.primary
                                : Colors.transparent,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _allSelected
                                  ? AppColors.primary
                                  : Colors.grey.shade400,
                              width: 2,
                            ),
                          ),
                          child: _allSelected
                              ? const Icon(Icons.check,
                                  color: Colors.white, size: 14)
                              : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        '${cart.itemCount} ${context.l10n.translate('items_count_suffix')}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      if (cart.items.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            _selectedItems.clear();
                            _allSelected = false;
                            context.read<CartProvider>().clearCart();
                          },
                          child: Text(
                            context.l10n.translate('clear'),
                            style: TextStyle(
                              color: Colors.red.shade400,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                // Scrollable cart items only
                Expanded(child: _buildCartContent(cart)),
                // Fixed bottom section — faqat tanlangan mahsulot bo'lganda ko'rsatish
                if (_selectedItems.isNotEmpty) _buildBottomSection(cart),
              ],
            );
          },
        ),
      ),
    );
  }

  // ignore: unused_element
  void _showClearCartDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n.translate('clear_cart')),
        content: Text(context.l10n.translate('clear_all_confirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<CartProvider>().clearCart();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: Text(context.l10n.translate('clear')),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginRequiredState() {
    return EmptyCartWidget(
      onShopNow: () => MainScreenState.switchToTab(0),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Iconsax.warning_2,
            size: 64,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: AppSizes.lg),
          Text(
            context.l10n.translate('error_occurred'),
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: AppSizes.sm),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey.shade500,
              ),
            ),
          ),
          const SizedBox(height: AppSizes.xl),
          ElevatedButton.icon(
            onPressed: () => context.read<CartProvider>().loadCart(),
            icon: const Icon(Iconsax.refresh),
            label: Text(context.l10n.translate('reload')),
          ),
        ],
      ),
    );
  }

  Widget _buildCartContent(CartProvider cart) {
    return ToplaRefreshIndicator(
      onRefresh: () => context.read<CartProvider>().loadCart(),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        padding: const EdgeInsets.only(bottom: 16),
        children: [
          // Cart items
          ...cart.items.map((item) => Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSizes.lg, vertical: AppSizes.sm),
                child: Dismissible(
                  key: Key('cart_item_${item.id}'),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 24),
                    margin: const EdgeInsets.symmetric(vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    ),
                    child: Icon(
                      Iconsax.trash,
                      color: Colors.red.shade400,
                      size: 24,
                    ),
                  ),
                  confirmDismiss: (_) async {
                    return true;
                  },
                  onDismissed: (_) {
                    context.read<CartProvider>().removeFromCart(item.productId);
                  },
                  child: _buildCartItem(item),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildCartItem(CartItemModel item) {
    final product = item.product;

    return Container(
      padding: const EdgeInsets.all(AppSizes.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Checkbox - circular, toggleable
          Padding(
            padding: const EdgeInsets.only(top: 20, right: 8),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  if (_selectedItems.contains(item.id)) {
                    _selectedItems.remove(item.id);
                  } else {
                    _selectedItems.add(item.id);
                  }
                  _allSelected = _selectedItems.length ==
                      context.read<CartProvider>().items.length;
                });
              },
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: _selectedItems.contains(item.id)
                      ? AppColors.primary
                      : Colors.transparent,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _selectedItems.contains(item.id)
                        ? AppColors.primary
                        : Colors.grey.shade400,
                    width: 2,
                  ),
                ),
                child: _selectedItems.contains(item.id)
                    ? const Icon(Icons.check, color: Colors.white, size: 14)
                    : null,
              ),
            ),
          ),

          // Product image
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(AppSizes.radiusSm),
            ),
            child: product?.firstImage != null &&
                    product!.firstImage!.startsWith('http')
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    child: CachedNetworkImage(
                      imageUrl: product.firstImage!,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => _buildCartImagePlaceholder(),
                    ),
                  )
                : _buildCartImagePlaceholder(),
          ),

          const SizedBox(width: AppSizes.md),

          // Product info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product name
                Text(
                  product?.nameUz ?? context.l10n.translate('product'),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),

                const SizedBox(height: AppSizes.xs),

                // Stock info
                if (product != null)
                  Text(
                    product.stock > 0
                        ? '${context.l10n.translate('available_stock')}: ${product.stock} ${context.l10n.translate('pieces_short')}'
                        : context.l10n.translate('out_of_stock'),
                    style: TextStyle(
                      fontSize: 12,
                      color: product.stock > 0
                          ? Colors.grey.shade500
                          : AppColors.error,
                    ),
                  ),

                const SizedBox(height: AppSizes.sm),

                // Price and quantity
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Price
                    Flexible(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (product?.oldPrice != null)
                            Text(
                              '${_formatPrice(product!.oldPrice!)} ${context.l10n.translate('currency')}',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade500,
                                decoration: TextDecoration.lineThrough,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          Text(
                            '${_formatPrice(product?.price ?? 0)} ${context.l10n.translate('currency')}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 8),

                    // Quantity selector
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                      ),
                      child: Row(
                        children: [
                          _buildQuantityButton(
                            icon: Icons.remove,
                            onPressed: () {
                              if (item.quantity > 1) {
                                context.read<CartProvider>().updateQuantity(
                                      item.productId,
                                      item.quantity - 1,
                                    );
                              }
                            },
                          ),
                          Container(
                            width: 40,
                            alignment: Alignment.center,
                            child: Text(
                              '${item.quantity}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          _buildQuantityButton(
                            icon: Icons.add,
                            onPressed: () {
                              context.read<CartProvider>().updateQuantity(
                                    item.productId,
                                    item.quantity + 1,
                                  );
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ignore: unused_element
  void _showDeleteDialog(CartItemModel item) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n.translate('delete')),
        content: Text(
          '${item.product?.nameUz ?? ''} ${context.l10n.translate('remove_from_cart_confirm')}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<CartProvider>().removeFromCart(item.productId);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: Text(context.l10n.translate('delete')),
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        width: 32,
        height: 32,
        alignment: Alignment.center,
        child: Icon(
          icon,
          size: 18,
          color: Colors.grey.shade700,
        ),
      ),
    );
  }

  Widget _buildCartImagePlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Iconsax.image,
            size: 24,
            color: Colors.grey.shade300,
          ),
          const SizedBox(height: 2),
          Text(
            context.l10n.translate('no_image'),
            style: TextStyle(
              fontSize: 8,
              color: Colors.grey.shade400,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomSection(CartProvider cart) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(AppSizes.lg),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Promo code
            Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    ),
                    child: TextField(
                      onChanged: (value) {
                        setState(() {
                          _promoCode = value;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: context.l10n.promoCode,
                        hintStyle: TextStyle(color: Colors.grey.shade500),
                        prefixIcon: Icon(
                          Iconsax.discount_shape,
                          color: Colors.grey.shade500,
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: AppSizes.lg,
                          vertical: AppSizes.md,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _promoCode.isNotEmpty && !_isPromoLoading
                      ? () => _applyPromoCode()
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(80, 48),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    ),
                    elevation: 0,
                  ),
                  child: _isPromoLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(context.l10n.apply),
                ),
              ],
            ),

            const SizedBox(height: AppSizes.lg),

            // Price breakdown
            if (_discount > 0) ...[
              _buildPriceRow(context.l10n.discount, -_discount,
                  isDiscount: true),
              const SizedBox(height: AppSizes.sm),
            ],
            _buildPriceRow(
              context.l10n.shipping,
              cart.deliveryFee,
              isFree: cart.deliveryFee == 0,
            ),

            const Padding(
              padding: EdgeInsets.symmetric(vertical: AppSizes.md),
              child: Divider(),
            ),

            // Total
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  context.l10n.total,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '${_formatPrice(cart.total - _discount)} ${context.l10n.translate('currency')}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSizes.lg),

            // Checkout button
            SizedBox(
              width: double.infinity,
              height: AppSizes.buttonHeightLg,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CheckoutScreen(
                        promoDiscount: _discount,
                        promoCodeId: _promoCodeId,
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Iconsax.shopping_bag, size: 20),
                    const SizedBox(width: AppSizes.sm),
                    Flexible(
                      child: Text(
                        '${context.l10n.checkout} • ${_formatPrice(cart.total - _discount)} ${context.l10n.translate('currency')}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
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

  Future<void> _applyPromoCode() async {
    if (_promoCode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.translate('enter_promo')),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isPromoLoading = true);

    try {
      final cart = context.read<CartProvider>();
      final promo = await cart.validatePromoCode(_promoCode);

      if (promo == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Iconsax.close_circle, color: Colors.white),
                  const SizedBox(width: 12),
                  Text(context.l10n.translate('invalid_promo')),
                ],
              ),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }

      // Minimal summa tekshirish
      final minAmount = promo['min_order_amount'];
      if (minAmount != null && cart.subtotal < minAmount) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  '${context.l10n.translate('min_order_sum')}: ${_formatPrice(minAmount.toDouble())} ${context.l10n.translate('currency')}'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      // Chegirmani hisoblash
      double discountAmount = 0;
      if (promo['discount_type'] == 'percent') {
        discountAmount = cart.subtotal * (promo['discount_value'] / 100);
        // Maksimal chegirma
        final maxDiscount = promo['max_discount'];
        if (maxDiscount != null && discountAmount > maxDiscount) {
          discountAmount = maxDiscount.toDouble();
        }
      } else {
        discountAmount = promo['discount_value'].toDouble();
      }

      setState(() {
        _discount = discountAmount;
        _promoCodeId = promo['id'];
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Iconsax.tick_circle, color: Colors.white),
                const SizedBox(width: 12),
                Text(
                    '${context.l10n.translate('promo_applied')} ${_formatPrice(discountAmount)} ${context.l10n.translate('currency')}'),
              ],
            ),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${context.l10n.translate('error')}: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPromoLoading = false);
      }
    }
  }

  Widget _buildPriceRow(
    String label,
    double amount, {
    bool isDiscount = false,
    bool isFree = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 14,
          ),
        ),
        Text(
          isFree
              ? context.l10n.translate('free_label')
              : '${isDiscount ? "-" : ""}${_formatPrice(amount.abs())} ${context.l10n.translate('currency')}',
          style: TextStyle(
            color: isDiscount || isFree
                ? AppColors.success
                : AppColors.textPrimaryLight,
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]} ',
        );
  }
}
