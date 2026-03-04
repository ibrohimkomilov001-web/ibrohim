import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:get_it/get_it.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/repositories/i_category_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/product_model.dart';
import '../../models/category_model.dart';
import '../../services/vendor_service.dart';

/// Vendor - Mahsulot qo'shish/tahrirlash
class VendorProductFormScreen extends StatefulWidget {
  final ProductModel? product;

  const VendorProductFormScreen({super.key, this.product});

  @override
  State<VendorProductFormScreen> createState() =>
      _VendorProductFormScreenState();
}

class _VendorProductFormScreenState extends State<VendorProductFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameUzController = TextEditingController();
  final _nameRuController = TextEditingController();
  final _descriptionUzController = TextEditingController();
  final _descriptionRuController = TextEditingController();
  final _priceController = TextEditingController();
  final _oldPriceController = TextEditingController();
  final _stockController = TextEditingController();
  final _cashbackController = TextEditingController();

  bool _isLoading = false;
  bool _isLoadingCategories = true;
  bool get _isEditing => widget.product != null;

  // Kategoriyalar
  List<CategoryModel> _categories = [];
  String? _selectedCategoryId;
  String? _selectedSubcategoryId;

  // Rasmlar
  final List<XFile> _newImages = [];
  List<String> _existingImages = [];
  bool _isUploadingImages = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    if (_isEditing) {
      _nameUzController.text = widget.product!.nameUz;
      _nameRuController.text = widget.product!.nameRu;
      _descriptionUzController.text = widget.product!.descriptionUz ?? '';
      _descriptionRuController.text = widget.product!.descriptionRu ?? '';
      _priceController.text = widget.product!.price.toStringAsFixed(0);
      _oldPriceController.text =
          widget.product!.oldPrice?.toStringAsFixed(0) ?? '';
      _stockController.text = widget.product!.stock.toString();
      _cashbackController.text =
          widget.product!.cashbackPercent?.toString() ?? '';
      _selectedCategoryId = widget.product!.categoryId;
      _selectedSubcategoryId = widget.product!.subcategoryId;
      _existingImages = widget.product!.images;
    }
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await GetIt.I<ICategoryRepository>().getCategories();
      if (mounted) {
        setState(() {
          _categories = categories;
          _isLoadingCategories = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingCategories = false);
      }
    }
  }

  List<CategoryModel> get _subcategories {
    if (_selectedCategoryId == null) return [];
    return _categories.where((c) => c.parentId == _selectedCategoryId).toList();
  }

  List<CategoryModel> get _mainCategories {
    return _categories.where((c) => c.parentId == null).toList();
  }

  @override
  void dispose() {
    _nameUzController.dispose();
    _nameRuController.dispose();
    _descriptionUzController.dispose();
    _descriptionRuController.dispose();
    _priceController.dispose();
    _oldPriceController.dispose();
    _stockController.dispose();
    _cashbackController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final images = await picker.pickMultiImage(
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );

    if (images.isNotEmpty && mounted) {
      setState(() {
        _newImages.addAll(images);
      });
    }
  }

  Future<List<String>> _uploadImages() async {
    if (_newImages.isEmpty) return _existingImages;

    setState(() => _isUploadingImages = true);

    final List<String> uploadedUrls = List.from(_existingImages);
    final api = ApiClient();

    for (final image in _newImages) {
      try {
        final response = await api.upload(
          '/upload/image',
          filePath: image.path,
          fieldName: 'image',
          fields: {'folder': 'products'},
        );
        final url = response.dataMap['url'] as String;
        uploadedUrls.add(url);
      } catch (e) {
        debugPrint('Image upload error: $e');
      }
    }

    setState(() => _isUploadingImages = false);
    return uploadedUrls;
  }

  void _removeImage(int index, bool isExisting) {
    setState(() {
      if (isExisting) {
        _existingImages.removeAt(index);
      } else {
        _newImages.removeAt(index - _existingImages.length);
      }
    });
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.translate('please_select_category')),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Rasmlarni yuklash
      final images = await _uploadImages();

      if (_isEditing) {
        await VendorService.updateProduct(
          productId: widget.product!.id,
          nameUz: _nameUzController.text,
          nameRu:
              _nameRuController.text.isNotEmpty ? _nameRuController.text : null,
          descriptionUz: _descriptionUzController.text.isNotEmpty
              ? _descriptionUzController.text
              : null,
          descriptionRu: _descriptionRuController.text.isNotEmpty
              ? _descriptionRuController.text
              : null,
          price: double.parse(_priceController.text),
          oldPrice: _oldPriceController.text.isNotEmpty
              ? double.parse(_oldPriceController.text)
              : null,
          stock: int.parse(_stockController.text),
          cashbackPercent: _cashbackController.text.isNotEmpty
              ? int.parse(_cashbackController.text)
              : null,
          images: images,
          categoryId: _selectedCategoryId,
        );
      } else {
        await VendorService.createProduct(
          nameUz: _nameUzController.text,
          nameRu:
              _nameRuController.text.isNotEmpty ? _nameRuController.text : '',
          descriptionUz: _descriptionUzController.text.isNotEmpty
              ? _descriptionUzController.text
              : null,
          descriptionRu: _descriptionRuController.text.isNotEmpty
              ? _descriptionRuController.text
              : null,
          price: double.parse(_priceController.text),
          oldPrice: _oldPriceController.text.isNotEmpty
              ? double.parse(_oldPriceController.text)
              : null,
          categoryId: _selectedCategoryId!,
          stock: int.parse(_stockController.text),
          cashbackPercent: _cashbackController.text.isNotEmpty
              ? int.parse(_cashbackController.text)
              : null,
          images: images,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing
                ? context.l10n.translate('product_updated')
                : context.l10n.translate('product_added')),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${context.l10n.translate('error')}: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing
            ? context.l10n.translate('edit_product')
            : context.l10n.translate('new_product')),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Image upload section
            _buildImageSection(),

            const SizedBox(height: 24),

            // Category selection
            _buildCategorySection(),

            const SizedBox(height: 24),

            // Name UZ
            TextFormField(
              controller: _nameUzController,
              decoration: InputDecoration(
                labelText: '${context.l10n.translate('name_uz')} *',
                prefixIcon: const Icon(Iconsax.text),
                border: const OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return context.l10n.translate('enter_product_name');
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Name RU
            TextFormField(
              controller: _nameRuController,
              decoration: InputDecoration(
                labelText: context.l10n.translate('name_ru'),
                prefixIcon: const Icon(Iconsax.text),
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Description UZ
            TextFormField(
              controller: _descriptionUzController,
              decoration: InputDecoration(
                labelText: context.l10n.translate('description_uz'),
                prefixIcon: const Icon(Iconsax.document_text),
                border: const OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),

            // Description RU
            TextFormField(
              controller: _descriptionRuController,
              decoration: InputDecoration(
                labelText: context.l10n.translate('description_ru'),
                prefixIcon: const Icon(Iconsax.document_text),
                border: const OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),

            // Price row
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _priceController,
                    decoration: InputDecoration(
                      labelText: '${context.l10n.translate('price_label')} *',
                      prefixIcon: const Icon(Iconsax.money),
                      suffixText: context.l10n.translate('currency'),
                      border: const OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return context.l10n.translate('enter_price');
                      }
                      if (double.tryParse(value) == null) {
                        return context.l10n.translate('invalid_format');
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _oldPriceController,
                    decoration: InputDecoration(
                      labelText: context.l10n.translate('old_price'),
                      prefixIcon: const Icon(Iconsax.money_remove),
                      suffixText: context.l10n.translate('currency'),
                      border: const OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Stock & Cashback
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _stockController,
                    decoration: InputDecoration(
                      labelText: '${context.l10n.translate('stock_count')} *',
                      prefixIcon: const Icon(Iconsax.box),
                      suffixText: context.l10n.translate('pcs'),
                      border: const OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return context.l10n.translate('enter_quantity');
                      }
                      if (int.tryParse(value) == null) {
                        return context.l10n.translate('invalid_value');
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _cashbackController,
                    decoration: const InputDecoration(
                      labelText: 'Cashback',
                      prefixIcon: Icon(Iconsax.percentage_circle),
                      suffixText: '%',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Info
            if (!_isEditing)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Iconsax.info_circle, color: Colors.blue),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        context.l10n.translate('product_moderation_info'),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed:
                    _isLoading || _isUploadingImages ? null : _saveProduct,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading || _isUploadingImages
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            _isUploadingImages
                                ? context.l10n.translate('images_uploading')
                                : context.l10n.translate('saving'),
                            style: const TextStyle(fontSize: 16),
                          ),
                        ],
                      )
                    : Text(
                        _isEditing
                            ? context.l10n.translate('save')
                            : context.l10n.translate('add'),
                        style: const TextStyle(fontSize: 16),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection() {
    final totalImages = _existingImages.length + _newImages.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              context.l10n.translate('product_images'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            Text(
              '$totalImages/5',
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              // Mavjud rasmlar
              ..._existingImages.asMap().entries.map((entry) => _buildImageItem(
                    imageUrl: entry.value,
                    index: entry.key,
                    isExisting: true,
                  )),
              // Yangi rasmlar
              ..._newImages.asMap().entries.map((entry) => _buildImageItem(
                    file: entry.value,
                    index: _existingImages.length + entry.key,
                    isExisting: false,
                  )),
              // Qo'shish tugmasi
              if (totalImages < 5)
                GestureDetector(
                  onTap: _pickImages,
                  child: Container(
                    width: 100,
                    height: 100,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Iconsax.gallery_add,
                            size: 32, color: Colors.grey.shade500),
                        const SizedBox(height: 4),
                        Text(
                          context.l10n.translate('add'),
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildImageItem({
    String? imageUrl,
    XFile? file,
    required int index,
    required bool isExisting,
  }) {
    return Stack(
      children: [
        Container(
          width: 100,
          height: 100,
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(11),
            child: isExisting
                ? CachedNetworkImage(
                    imageUrl: imageUrl!,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => Container(
                      color: Colors.grey.shade200,
                      child: const Icon(Iconsax.image),
                    ),
                  )
                : Image.file(File(file!.path), fit: BoxFit.cover),
          ),
        ),
        Positioned(
          top: 4,
          right: 12,
          child: GestureDetector(
            onTap: () => _removeImage(index, isExisting),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 14, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCategorySection() {
    if (_isLoadingCategories) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.l10n.translate('category_required'),
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 12),

        // Asosiy kategoriya
        DropdownButtonFormField<String>(
          value: _selectedCategoryId,
          decoration: InputDecoration(
            labelText: context.l10n.translate('select_category'),
            prefixIcon: const Icon(Iconsax.category),
            border: const OutlineInputBorder(),
          ),
          items: _mainCategories
              .map((cat) => DropdownMenuItem(
                    value: cat.id,
                    child: Text(cat.nameUz),
                  ))
              .toList(),
          onChanged: (value) {
            setState(() {
              _selectedCategoryId = value;
              _selectedSubcategoryId = null;
            });
          },
          validator: (value) {
            if (value == null || value.isEmpty) {
              return context.l10n.translate('select_category');
            }
            return null;
          },
        ),

        // Subkategoriya
        if (_subcategories.isNotEmpty) ...[
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _selectedSubcategoryId,
            decoration: InputDecoration(
              labelText: context.l10n.translate('subcategory_optional'),
              prefixIcon: const Icon(Iconsax.category_2),
              border: const OutlineInputBorder(),
            ),
            items: _subcategories
                .map((cat) => DropdownMenuItem(
                      value: cat.id,
                      child: Text(cat.nameUz),
                    ))
                .toList(),
            onChanged: (value) {
              setState(() {
                _selectedSubcategoryId = value;
              });
            },
          ),
        ],
      ],
    );
  }
}
