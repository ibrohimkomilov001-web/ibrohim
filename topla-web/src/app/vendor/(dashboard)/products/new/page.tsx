"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { vendorApi, type ColorOption, type SizeOption, type CategoryAttribute } from "@/lib/api/vendor";
import { uploadApi, resolveImageUrl } from "@/lib/api/upload";
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
  Video,
  Tag,
  Ruler,
  Search,
  Barcode,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/store/locale-store";

export default function NewProductPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 5-step wizard state (P-FIX-05)
  const [currentStep, setCurrentStep] = useState(1);
  const STEPS = [
    { num: 1, label: "Asosiy" },
    { num: 2, label: "Media" },
    { num: 3, label: "Narx & Variant" },
    { num: 4, label: "Xususiyatlar" },
    { num: 5, label: "Ko'rib chiqish" },
  ] as const;

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

  // New extended fields (P-FIX-04, P-06, P-11)
  const [barcode, setBarcode] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Dynamic category attributes (P-FIX-02)
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});

  // Draft autosave (P-08)
  const DRAFT_KEY = 'topla_product_draft';
  const draftLoaded = useRef(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (draftLoaded.current) return;
    draftLoaded.current = true;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (draft.nameUz) setNameUz(draft.nameUz);
      if (draft.nameRu) setNameRu(draft.nameRu);
      if (draft.name) setName(draft.name);
      if (draft.descriptionUz) setDescriptionUz(draft.descriptionUz);
      if (draft.descriptionRu) setDescriptionRu(draft.descriptionRu);
      if (draft.price) setPrice(draft.price);
      if (draft.originalPrice) setOriginalPrice(draft.originalPrice);
      if (draft.categoryId) setCategoryId(draft.categoryId);
      if (draft.subcategoryId) setSubcategoryId(draft.subcategoryId);
      if (draft.stock) setStock(draft.stock);
      if (draft.sku) setSku(draft.sku);
      if (draft.weight) setWeight(draft.weight);
      if (draft.warranty) setWarranty(draft.warranty);
      if (draft.colorId) setColorId(draft.colorId);
      if (draft.brandId) setBrandId(draft.brandId);
      if (draft.barcode) setBarcode(draft.barcode);
      if (draft.videoUrl) setVideoUrl(draft.videoUrl);
      if (draft.tags) setTags(draft.tags);
      if (draft.widthCm) setWidthCm(draft.widthCm);
      if (draft.heightCm) setHeightCm(draft.heightCm);
      if (draft.lengthCm) setLengthCm(draft.lengthCm);
      if (draft.metaTitle) setMetaTitle(draft.metaTitle);
      if (draft.metaDescription) setMetaDescription(draft.metaDescription);
      if (draft.images) setImages(draft.images);
      if (draft.attributeValues) setAttributeValues(draft.attributeValues);
      toast.info("Saqlangan qoralama tiklandi");
    } catch { /* ignore */ }
  }, []);

  // Save draft every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!nameUz && !name) return; // Don't save empty drafts
      try {
        const draft = {
          nameUz, nameRu, name, descriptionUz, descriptionRu,
          price, originalPrice, categoryId, subcategoryId,
          stock, sku, weight, warranty,
          colorId, brandId, barcode, videoUrl, tags,
          widthCm, heightCm, lengthCm,
          metaTitle, metaDescription, images, attributeValues,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch { /* storage full */ }
    }, 30000);
    return () => clearInterval(timer);
  }, [
    nameUz, nameRu, name, descriptionUz, descriptionRu,
    price, originalPrice, categoryId, subcategoryId,
    stock, sku, weight, warranty,
    colorId, brandId, barcode, videoUrl, tags,
    widthCm, heightCm, lengthCm,
    metaTitle, metaDescription, images, attributeValues,
  ]);

  // Clear draft on successful submit
  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

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
  const subcategories = selectedCategory?.children || [];

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

  // Fetch category attributes dynamically (P-FIX-02)
  const effectiveCategoryId = subcategoryId || categoryId;
  const { data: categoryAttrsRes } = useQuery({
    queryKey: ["category-attributes", effectiveCategoryId],
    queryFn: () => vendorApi.getCategoryAttributes(effectiveCategoryId),
    enabled: !!effectiveCategoryId,
  });
  const categoryAttributes: CategoryAttribute[] = (categoryAttrsRes as any)?.data || categoryAttrsRes || [];

  // Tag helpers
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 20) {
      setTags(prev => [...prev, tag]);
      setTagInput("");
    }
  };
  const removeTag = (idx: number) => setTags(prev => prev.filter((_, i) => i !== idx));
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
  };

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
      clearDraft();
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

  // Variant image upload (P-FIX-03)
  const handleVariantImageUpload = async (variantKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const fileArray = Array.from(files);
      const result = await uploadApi.uploadImages(fileArray);
      const urls = result.urls || result.files?.map((f: any) => f.url) || [];
      if (urls.length > 0) {
        updateVariantRow(variantKey, 'images', [
          ...(variantRows[variantKey]?.images || []),
          ...urls,
        ]);
        toast.success(`${urls.length} ta rasm yuklandi`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Rasm yuklashda xato');
    } finally {
      e.target.value = '';
    }
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
      categoryId: subcategoryId || categoryId,
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
      // Extended fields (P-FIX-04, P-06, P-11)
      barcode: barcode.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      width: widthCm ? Number(widthCm) : undefined,
      height: heightCm ? Number(heightCm) : undefined,
      length: lengthCm ? Number(lengthCm) : undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      // Dynamic attributes
      ...(Object.keys(attributeValues).length > 0
        ? {
            attributeValues: Object.entries(attributeValues)
              .filter(([, v]) => v.trim())
              .map(([attributeId, value]) => ({ attributeId, value })),
          }
        : {}),
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

      {/* Step Indicator (P-FIX-05) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((step, idx) => (
          <div key={step.num} className="flex items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(step.num)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                currentStep === step.num
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.num
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                currentStep > step.num ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}>
                {currentStep > step.num ? '✓' : step.num}
              </span>
              {step.label}
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`w-6 h-0.5 mx-1 ${currentStep > step.num ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">

        {/* ===== STEP 1: Asosiy ma'lumot ===== */}
        <div className={currentStep === 1 ? '' : 'hidden'}>
          <div className="space-y-6">
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
                        <RichTextEditor
                          value={descriptionUz || description}
                          onChange={(val) => { setDescriptionUz(val); if (!description) setDescription(val); }}
                          placeholder="Mahsulot haqida batafsil (kamida 20 belgi)..."
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
                        <RichTextEditor
                          value={descriptionRu}
                          onChange={(val) => setDescriptionRu(val)}
                          placeholder="Подробное описание товара..."
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
          </div>
        </div>

        {/* ===== STEP 2: Tavsif va Media ===== */}
        <div className={currentStep === 2 ? '' : 'hidden'}>
          <div className="space-y-6">
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
                      <Image src={resolveImageUrl(url)} alt="" fill className="object-cover" />
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
          </div>
        </div>

        {/* ===== STEP 3: Narx, Stok, Variantlar ===== */}
        <div className={currentStep === 3 ? '' : 'hidden'}>
          <div className="space-y-6">
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
                                <th className="text-left px-3 py-2 font-medium">{t('images')}</th>
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
                                    <td className="px-3 py-1">
                                      <div className="flex items-center gap-1">
                                        {row.images?.length > 0 && (
                                          <div className="flex -space-x-1">
                                            {row.images.slice(0, 2).map((img, imgIdx) => (
                                              <div key={imgIdx} className="relative w-7 h-7 rounded border overflow-hidden">
                                                <Image src={resolveImageUrl(img)} alt="" fill className="object-cover" />
                                              </div>
                                            ))}
                                            {row.images.length > 2 && (
                                              <span className="text-[10px] text-muted-foreground ml-1">+{row.images.length - 2}</span>
                                            )}
                                          </div>
                                        )}
                                        <label className="h-7 w-7 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0">
                                          <Upload className="h-3 w-3 text-muted-foreground" />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => handleVariantImageUpload(vk.key, e)}
                                          />
                                        </label>
                                      </div>
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

            {/* Dimensions — moved from separate section into Step 3 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-primary" />
                  O&apos;lchamlari
                </CardTitle>
                <CardDescription>
                  Mahsulot yetkazish narxini hisoblashga yordam beradi (+2 ball)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="widthCm2">Kengligi (sm)</Label>
                    <Input id="widthCm2" type="number" placeholder="0" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} min={0} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="heightCm2">Balandligi (sm)</Label>
                    <Input id="heightCm2" type="number" placeholder="0" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} min={0} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lengthCm2">Uzunligi (sm)</Label>
                    <Input id="lengthCm2" type="number" placeholder="0" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} min={0} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ===== STEP 4: Xususiyatlar ===== */}
        <div className={currentStep === 4 ? '' : 'hidden'}>
          <div className="space-y-6">
            {/* Dynamic Category Attributes (P-FIX-02) */}
            {categoryAttributes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Xususiyatlar
                  </CardTitle>
                  <CardDescription>
                    Tanlangan kategoriya bo&apos;yicha mahsulot xususiyatlari
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryAttributes.map((attr) => (
                    <div key={attr.id} className="space-y-2">
                      <Label>
                        {attr.nameUz}
                        {attr.isRequired && <span className="text-red-500 ml-1">*</span>}
                        {attr.unit && <span className="text-muted-foreground ml-1">({attr.unit})</span>}
                      </Label>
                      {attr.type === 'select' || attr.type === 'multiselect' ? (
                        <Select
                          value={attributeValues[attr.id] || ''}
                          onValueChange={(val) =>
                            setAttributeValues(prev => ({ ...prev, [attr.id]: val }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`${attr.nameUz} tanlang`} />
                          </SelectTrigger>
                          <SelectContent>
                            {attr.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : attr.type === 'boolean' ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={attributeValues[attr.id] === 'true'}
                            onCheckedChange={(checked) =>
                              setAttributeValues(prev => ({ ...prev, [attr.id]: String(checked) }))
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            {attributeValues[attr.id] === 'true' ? 'Ha' : 'Yo\'q'}
                          </span>
                        </div>
                      ) : (
                        <Input
                          type={attr.type === 'number' ? 'number' : 'text'}
                          placeholder={attr.nameUz}
                          value={attributeValues[attr.id] || ''}
                          onChange={(e) =>
                            setAttributeValues(prev => ({ ...prev, [attr.id]: e.target.value }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Tags & Video (P-11) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Teglar va Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags */}
                <div className="space-y-2">
                  <Label>Teglar (max 20)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Teg kiriting va Enter bosing"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={tags.length >= 20}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            className="hover:text-red-500 transition-colors"
                            onClick={() => removeTag(idx)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Teglar mahsulotni topishda yordam beradi (+3 ball)
                  </p>
                </div>

                {/* Video URL */}
                <div className="space-y-2">
                  <Label htmlFor="videoUrl" className="flex items-center gap-1.5">
                    <Video className="h-4 w-4" />
                    Video havolasi
                  </Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    YouTube yoki boshqa video havola (+3 ball)
                  </p>
                </div>

                {/* Barcode */}
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="flex items-center gap-1.5">
                    <Barcode className="h-4 w-4" />
                    Shtrix-kod (EAN/UPC)
                  </Label>
                  <Input
                    id="barcode"
                    placeholder="4607000000000"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Shtrix-kod qo&apos;shish (+2 ball)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ===== STEP 5: Ko'rib chiqish va nashr ===== */}
        <div className={currentStep === 5 ? '' : 'hidden'}>
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

            {/* SEO (P-06) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  SEO
                </CardTitle>
                <CardDescription>Qidiruv tizimlari uchun</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta sarlavha</Label>
                  <Input
                    id="metaTitle"
                    placeholder="SEO sarlavha (max 120)"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground">
                    {metaTitle.length}/120 belgi
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta tavsif</Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="SEO tavsifi (max 320)"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    maxLength={320}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {metaDescription.length}/320 belgi
                  </p>
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
                      <li>✅ Rang (+3) va brend (+5)</li>
                      <li>✅ Shtrix-kod (+2)</li>
                      <li>✅ Video (+3)</li>
                      <li>✅ Teglar (+3)</li>
                      <li>✅ O&apos;lchamlari (+2)</li>
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

        {/* Step Navigation (P-FIX-05) */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Oldingi
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentStep} / {STEPS.length}
          </span>

          {currentStep < 5 ? (
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            >
              Keyingi
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="rounded-full"
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
          )}
        </div>
        </div>
      </form>
    </div>
  );
}
