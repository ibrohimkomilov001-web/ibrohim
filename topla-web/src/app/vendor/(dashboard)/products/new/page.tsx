"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { vendorApi, type ColorOption, type SizeOption } from "@/lib/api/vendor";
import { uploadApi } from "@/lib/api/upload";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  ImageIcon,
  Package,
  DollarSign,
  Info,
  GripVertical,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/store/locale-store";

export default function NewProductPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionUz, setDescriptionUz] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [weight, setWeight] = useState("");
  const [warranty, setWarranty] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [colorId, setColorId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [langTab, setLangTab] = useState<"uz" | "ru">("uz");

  // Variant state
  const [hasVariants, setHasVariants] = useState(false);
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);

  // Variant matrix: key = `${colorId}_${sizeId}`, value = variant data
  interface VariantRow {
    colorId: string | null;
    sizeId: string | null;
    price: string;
    compareAtPrice: string;
    stock: string;
    sku: string;
    images: string[];
  }
  const [variantRows, setVariantRows] = useState<Record<string, VariantRow>>({});

  // Fetch categories
  const { data: categoriesRes } = useQuery({
    queryKey: ["vendor-categories"],
    queryFn: vendorApi.getCategories,
  });
  const categories = (categoriesRes as any)?.data || categoriesRes || [];

  // Tanlangan kategoriyaning subkategoriyalari
  const selectedCategory = categories?.find((c: any) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories || [];

  // Fetch colors
  const { data: colorsRes } = useQuery({
    queryKey: ["vendor-colors"],
    queryFn: vendorApi.getColors,
  });
  const colors = (colorsRes as any)?.data || colorsRes || [];

  // Fetch brands
  const { data: brandsRes } = useQuery({
    queryKey: ["vendor-brands"],
    queryFn: vendorApi.getBrands,
  });
  const brands = (brandsRes as any)?.data || brandsRes || [];

  // Fetch sizes
  const { data: sizesRes } = useQuery({
    queryKey: ["vendor-sizes"],
    queryFn: vendorApi.getSizes,
  });
  const sizes = (sizesRes as any)?.data || sizesRes || [];

  // Build variant matrix when colors/sizes selection changes
  const variantKeys = useMemo(() => {
    if (!hasVariants) return [];
    const keys: { key: string; colorId: string | null; sizeId: string | null }[] = [];
    const colorList = selectedColorIds.length > 0 ? selectedColorIds : [null];
    const sizeList = selectedSizeIds.length > 0 ? selectedSizeIds : [null];
    for (const c of colorList) {
      for (const s of sizeList) {
        keys.push({ key: `${c || 'none'}_${s || 'none'}`, colorId: c, sizeId: s });
      }
    }
    return keys;
  }, [hasVariants, selectedColorIds, selectedSizeIds]);

  const updateVariantRow = (key: string, field: keyof VariantRow, value: any) => {
    setVariantRows(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const getVariantRow = (key: string, colorId: string | null, sizeId: string | null): VariantRow => {
    return variantRows[key] || {
      colorId,
      sizeId,
      price: price || '',
      compareAtPrice: originalPrice || '',
      stock: stock || '0',
      sku: '',
      images: [],
    };
  };

  const toggleColorSelection = (id: string) => {
    setSelectedColorIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleSizeSelection = (id: string) => {
    setSelectedSizeIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const createMutation = useMutation({
    mutationFn: vendorApi.createProduct,
    onSuccess: () => {
      toast.success(t('productCreated'));
      router.push("/vendor/products");
    },
    onError: (error: any) => {
      toast.error(error.message || t('errorOccurred'));
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      const result = await uploadApi.uploadImages(fileArray);
      const urls = result.urls || result.files?.map((f: any) => f.url) || [];
      if (urls.length === 0) throw new Error('Rasmlar yuklanmadi');
      setImages((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} ${t('imageUploaded')}`);
    } catch (error: any) {
      toast.error(error.message || t('imageUploadError'));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) { toast.error(t('nameRequired')); return; }
    if (!price || Number(price) <= 0) { toast.error(t('priceRequired')); return; }
    if (!categoryId) { toast.error(t('selectCategory')); return; }

    // Build variants array
    let variantsPayload: any[] | undefined;
    if (hasVariants && variantKeys.length > 0) {
      variantsPayload = variantKeys.map((vk, idx) => {
        const row = getVariantRow(vk.key, vk.colorId, vk.sizeId);
        return {
          colorId: vk.colorId || null,
          sizeId: vk.sizeId || null,
          price: Number(row.price) || Number(price),
          compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
          stock: Number(row.stock) || 0,
          sku: row.sku?.trim() || null,
          images: row.images || [],
          isActive: true,
          sortOrder: idx,
        };
      });
      
      // Validate at least one variant has price
      if (variantsPayload.some(v => !v.price || v.price <= 0)) {
        toast.error("Har bir variant uchun narx kiriting");
        return;
      }
    }

    createMutation.mutate({
      name: nameUz.trim() || name.trim(),
      nameUz: nameUz.trim() || name.trim(),
      nameRu: nameRu.trim() || undefined,
      description: descriptionUz.trim() || description.trim(),
      descriptionUz: descriptionUz.trim() || description.trim(),
      descriptionRu: descriptionRu.trim() || undefined,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      colorId: colorId || undefined,
      brandId: brandId || undefined,
      stock: stock ? Number(stock) : 0,
      sku: sku.trim() || undefined,
      weight: weight ? Number(weight) : undefined,
      warranty: warranty.trim() || undefined,
      isActive,
      images,
      hasVariants: !!hasVariants,
      variants: variantsPayload,
    } as any);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/vendor/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('newProduct')}</h1>
          <p className="text-muted-foreground">{t('productDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {t('basicInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Language tabs */}
                  <div className="flex gap-2 border-b pb-2">
                    <button
                      type="button"
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${langTab === 'uz' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                      onClick={() => setLangTab('uz')}
                    >
                      🇺🇿 {t('uzbek')}
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${langTab === 'ru' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                      onClick={() => setLangTab('ru')}
                    >
                      🇷🇺 {t('russian')}
                    </button>
                  </div>

                  {langTab === 'uz' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="nameUz">{t('nameUz')} *</Label>
                        <Input
                          id="nameUz"
                          placeholder="Masalan: Samsung Galaxy S24"
                          value={nameUz || name}
                          onChange={(e) => { setNameUz(e.target.value); if (!name) setName(e.target.value); }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descriptionUz">{t('descriptionUz')}</Label>
                        <Textarea
                          id="descriptionUz"
                          placeholder="Mahsulot haqida batafsil (kamida 20 belgi)..."
                          value={descriptionUz || description}
                          onChange={(e) => { setDescriptionUz(e.target.value); if (!description) setDescription(e.target.value); }}
                          rows={5}
                        />
                        <p className="text-xs text-muted-foreground">
                          Sifat balli uchun kamida 20 ta belgi kiriting
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="nameRu">{t('nameRu')}</Label>
                        <Input
                          id="nameRu"
                          placeholder="Например: Samsung Galaxy S24"
                          value={nameRu}
                          onChange={(e) => setNameRu(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descriptionRu">{t('descriptionRu')}</Label>
                        <Textarea
                          id="descriptionRu"
                          placeholder="Подробное описание товара..."
                          value={descriptionRu}
                          onChange={(e) => setDescriptionRu(e.target.value)}
                          rows={5}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>{t('category')} *</Label>
                    <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setSubcategoryId(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nameUz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {subcategories.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t('subcategory')}</Label>
                      <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectSubcategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.map((sub: any) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.nameUz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t('subcategoryHelp')}</p>
                    </div>
                  )}

                  {/* Rang tanlash (faqat variant yo'q bo'lganda) */}
                  {!hasVariants && Array.isArray(colors) && colors.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t('color')}</Label>
                      <Select value={colorId} onValueChange={setColorId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectColor')} />
                        </SelectTrigger>
                        <SelectContent>
                          {colors.map((color: any) => (
                            <SelectItem key={color.id} value={color.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block w-4 h-4 rounded-full border"
                                  style={{ backgroundColor: color.hexCode }}
                                />
                                {color.nameUz}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('colorHelpText')}
                      </p>
                    </div>
                  )}

                  {/* Brend tanlash */}
                  {Array.isArray(brands) && brands.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t('brand')}</Label>
                      <Select value={brandId} onValueChange={setBrandId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectBrand')} />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand: any) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  {t('images')}
                </CardTitle>
                <CardDescription>
                  {t('uploadImages')} ({t('maxImages')})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border bg-muted group">
                      <Image src={url} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                          {t('mainImage')}
                        </div>
                      )}
                    </div>
                  ))}

                  {images.length < 10 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">{t('upload')}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Variant Toggle & Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  {t('variantsTitle')}
                </CardTitle>
                <CardDescription>
                  {t('variantsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('variantProduct')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('variantQuestion')}
                    </p>
                  </div>
                  <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
                </div>

                {hasVariants && (
                  <>
                    {/* Color Selection */}
                    {Array.isArray(colors) && colors.length > 0 && (
                      <div className="space-y-2">
                        <Label>{t('selectColors')}</Label>
                        <div className="flex flex-wrap gap-2">
                          {colors.map((color: any) => (
                            <button
                              key={color.id}
                              type="button"
                              onClick={() => toggleColorSelection(color.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                                selectedColorIds.includes(color.id)
                                  ? 'border-primary bg-primary/10 text-primary font-medium'
                                  : 'border-muted hover:border-primary/50'
                              }`}
                            >
                              <span
                                className="inline-block w-3.5 h-3.5 rounded-full border"
                                style={{ backgroundColor: color.hexCode }}
                              />
                              {color.nameUz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size Selection */}
                    {Array.isArray(sizes) && sizes.length > 0 && (
                      <div className="space-y-2">
                        <Label>{t('selectSizes')}</Label>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size: any) => (
                            <button
                              key={size.id}
                              type="button"
                              onClick={() => toggleSizeSelection(size.id)}
                              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                                selectedSizeIds.includes(size.id)
                                  ? 'border-primary bg-primary/10 text-primary font-medium'
                                  : 'border-muted hover:border-primary/50'
                              }`}
                            >
                              {size.nameUz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Variant Matrix Table */}
                    {variantKeys.length > 0 && (
                      <div className="space-y-2">
                        <Label>{t('variantTable')} ({variantKeys.length} {t('variantCount')})</Label>
                        <div className="border rounded-lg overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                {selectedColorIds.length > 0 && <th className="text-left px-3 py-2 font-medium">{t('color')}</th>}
                                {selectedSizeIds.length > 0 && <th className="text-left px-3 py-2 font-medium">{t('size')}</th>}
                                <th className="text-left px-3 py-2 font-medium">{t('price')} *</th>
                                <th className="text-left px-3 py-2 font-medium">{t('originalPrice')}</th>
                                <th className="text-left px-3 py-2 font-medium">{t('quantity')}</th>
                                <th className="text-left px-3 py-2 font-medium">{t('sku')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {variantKeys.map(vk => {
                                const row = getVariantRow(vk.key, vk.colorId, vk.sizeId);
                                const colorObj = colors.find((c: any) => c.id === vk.colorId);
                                const sizeObj = sizes.find((s: any) => s.id === vk.sizeId);
                                return (
                                  <tr key={vk.key} className="border-b last:border-0">
                                    {selectedColorIds.length > 0 && (
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-1.5">
                                          {colorObj && (
                                            <span
                                              className="inline-block w-3 h-3 rounded-full border"
                                              style={{ backgroundColor: colorObj.hexCode }}
                                            />
                                          )}
                                          <span className="whitespace-nowrap">{colorObj?.nameUz || '—'}</span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedSizeIds.length > 0 && (
                                      <td className="px-3 py-2 whitespace-nowrap">{sizeObj?.nameUz || '—'}</td>
                                    )}
                                    <td className="px-3 py-1">
                                      <Input
                                        type="number"
                                        placeholder={price || "0"}
                                        value={row.price}
                                        onChange={e => updateVariantRow(vk.key, 'price', e.target.value)}
                                        className="h-8 w-28"
                                        min={0}
                                      />
                                    </td>
                                    <td className="px-3 py-1">
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={row.compareAtPrice}
                                        onChange={e => updateVariantRow(vk.key, 'compareAtPrice', e.target.value)}
                                        className="h-8 w-28"
                                        min={0}
                                      />
                                    </td>
                                    <td className="px-3 py-1">
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={row.stock}
                                        onChange={e => updateVariantRow(vk.key, 'stock', e.target.value)}
                                        className="h-8 w-20"
                                        min={0}
                                      />
                                    </td>
                                    <td className="px-3 py-1">
                                      <Input
                                        placeholder=""
                                        value={row.sku}
                                        onChange={e => updateVariantRow(vk.key, 'sku', e.target.value)}
                                        className="h-8 w-28"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('emptyPriceHint')}
                        </p>
                      </div>
                    )}

                    {variantKeys.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                        {t('selectFromAbove')}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Price & Settings */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {t('pricing')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t('priceLabel')} *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">{t('originalPrice')} (so'm)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    placeholder="Chegirma uchun"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('discountHint')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stock */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('stockAndWarehouse')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">{t('quantity')}</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">{t('sku')}</Label>
                  <Input
                    id="sku"
                    placeholder={t('optional')}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">{t('weight')}</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty">{t('warranty')}</Label>
                  <Select value={warranty} onValueChange={setWarranty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tanlang (ixtiyoriy)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 oy">1 oy</SelectItem>
                      <SelectItem value="3 oy">3 oy</SelectItem>
                      <SelectItem value="6 oy">6 oy</SelectItem>
                      <SelectItem value="1 yil">1 yil</SelectItem>
                      <SelectItem value="2 yil">2 yil</SelectItem>
                      <SelectItem value="3 yil">3 yil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('settingsLabel')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('activeStatus')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('productVisibleInStore')}
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            {/* Auto-moderation info */}
            <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('autoModeration')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('autoModerationDesc')}
                      {' '}{t('highScoreDesc')}
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 mt-2">
                      <li>✅ Nom UZ va RU (3+ belgi)</li>
                      <li>✅ Tavsif UZ (20+ belgi)</li>
                      <li>✅ Kamida 1 ta rasm</li>
                      <li>✅ Narx va kategoriya</li>
                      <li>✅ Rang (+3 ball) va brend (+5 ball)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => router.back()}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('save')
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
