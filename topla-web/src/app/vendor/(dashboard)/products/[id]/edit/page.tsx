'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { vendorApi, type ProductVariant } from '@/lib/api/vendor';
import { uploadApi } from '@/lib/api/upload';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X, Loader2, ImageIcon, Save, Palette } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [langTab, setLangTab] = useState<'uz' | 'ru'>('uz');

  // Form state
  const [name, setName] = useState('');
  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionUz, setDescriptionUz] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [weight, setWeight] = useState('');
  const [warranty, setWarranty] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [colorId, setColorId] = useState('');
  const [brandId, setBrandId] = useState('');

  // Variant state
  interface VariantRow {
    colorId: string | null;
    sizeId: string | null;
    price: string;
    compareAtPrice: string;
    stock: string;
    sku: string;
    images: string[];
  }
  const [hasVariants, setHasVariants] = useState(false);
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [variantRows, setVariantRows] = useState<Record<string, VariantRow>>({});

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ['vendor-product', id],
    queryFn: () => vendorApi.getProduct(id),
    enabled: !!id,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['vendor-categories'],
    queryFn: () => vendorApi.getCategories(),
  });
  const categories = (categoriesData as any)?.data || categoriesData || [];

  // Fetch colors
  const { data: colorsRes } = useQuery({
    queryKey: ['vendor-colors'],
    queryFn: () => vendorApi.getColors(),
  });
  const colors = (colorsRes as any)?.data || colorsRes || [];

  // Fetch brands
  const { data: brandsRes } = useQuery({
    queryKey: ['vendor-brands'],
    queryFn: () => vendorApi.getBrands(),
  });
  const brands = (brandsRes as any)?.data || brandsRes || [];

  // Fetch sizes
  const { data: sizesRes } = useQuery({
    queryKey: ['vendor-sizes'],
    queryFn: () => vendorApi.getSizes(),
  });
  const sizes = (sizesRes as any)?.data || sizesRes || [];

  // Tanlangan kategoriyaning subkategoriyalari
  const selectedCategory = categories?.find((c: any) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories || [];

  // Variant matrix keys
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
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const getVariantRow = (key: string, colorId: string | null, sizeId: string | null): VariantRow => {
    return variantRows[key] || {
      colorId, sizeId,
      price: price || '', compareAtPrice: originalPrice || '',
      stock: stock || '0', sku: '', images: [],
    };
  };

  const toggleColorSelection = (cid: string) => {
    setSelectedColorIds(prev => prev.includes(cid) ? prev.filter(c => c !== cid) : [...prev, cid]);
  };

  const toggleSizeSelection = (sid: string) => {
    setSelectedSizeIds(prev => prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]);
  };

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setNameUz(product.nameUz || '');
      setNameRu(product.nameRu || '');
      setDescription(product.description || '');
      setDescriptionUz(product.descriptionUz || '');
      setDescriptionRu(product.descriptionRu || '');
      setPrice(String(product.price || ''));
      setOriginalPrice(String(product.originalPrice || product.compareAtPrice || ''));
      setCategoryId(product.categoryId || '');
      setSubcategoryId(product.subcategoryId || '');
      setStock(String(product.stock || ''));
      setSku(product.sku || '');
      setWeight(String(product.weight || ''));
      setWarranty((product as any).warranty || '');
      setIsActive(product.isActive);
      setImages(product.images || []);
      setColorId((product as any).colorId || '');
      setBrandId((product as any).brandId || '');

      // Load existing variants
      const variants = (product as any).variants as ProductVariant[] | undefined;
      if ((product as any).hasVariants && variants && variants.length > 0) {
        setHasVariants(true);
        const cIds = Array.from(new Set(variants.filter(v => v.colorId).map(v => v.colorId!)));
        const sIds = Array.from(new Set(variants.filter(v => v.sizeId).map(v => v.sizeId!)));
        setSelectedColorIds(cIds);
        setSelectedSizeIds(sIds);

        const rows: Record<string, VariantRow> = {};
        for (const v of variants) {
          const key = `${v.colorId || 'none'}_${v.sizeId || 'none'}`;
          rows[key] = {
            colorId: v.colorId || null,
            sizeId: v.sizeId || null,
            price: String(v.price || ''),
            compareAtPrice: String(v.compareAtPrice || ''),
            stock: String(v.stock || '0'),
            sku: v.sku || '',
            images: v.images || [],
          };
        }
        setVariantRows(rows);
      }
    }
  }, [product]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => vendorApi.updateProduct(id, data),
    onSuccess: () => {
      toast.success('Mahsulot yangilandi!');
      router.push('/vendor/products');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Xatolik yuz berdi');
    },
  });

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await uploadApi.uploadImage(file);
        setImages((prev) => [...prev, result.url]);
      }
      toast.success('Rasm yuklandi');
    } catch {
      toast.error('Rasm yuklashda xatolik');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!nameUz) {
      toast.error("Mahsulot nomi (O'zbekcha) kiritilishi shart");
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error("Narx kiritilishi shart");
      return;
    }

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
    }

    updateMutation.mutate({
      name: nameUz,
      nameUz,
      nameRu,
      description: descriptionUz,
      descriptionUz,
      descriptionRu,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      colorId: colorId || undefined,
      brandId: brandId || undefined,
      stock: Number(stock) || 0,
      sku: sku || undefined,
      weight: weight ? Number(weight) : undefined,
      warranty: warranty || undefined,
      isActive,
      images,
      hasVariants: !!hasVariants,
      variants: variantsPayload,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Mahsulotni tahrirlash</h1>
          <p className="text-sm text-muted-foreground">SKU: {product?.sku || '-'}</p>
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setLangTab('uz')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            langTab === 'uz' ? 'bg-primary text-white' : 'bg-muted'
          }`}
        >
          🇺🇿 O&apos;zbekcha
        </button>
        <button
          onClick={() => setLangTab('ru')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            langTab === 'ru' ? 'bg-primary text-white' : 'bg-muted'
          }`}
        >
          🇷🇺 Русский
        </button>
      </div>

      {/* Name & Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asosiy ma&apos;lumotlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {langTab === 'uz' ? (
            <>
              <div>
                <Label>Nomi (O&apos;zbekcha) *</Label>
                <Input value={nameUz} onChange={(e) => setNameUz(e.target.value)} placeholder="Mahsulot nomi" />
              </div>
              <div>
                <Label>Tavsif (O&apos;zbekcha)</Label>
                <Textarea
                  value={descriptionUz}
                  onChange={(e) => setDescriptionUz(e.target.value)}
                  placeholder="Mahsulot haqida batafsil..."
                  rows={4}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>Название (Русский)</Label>
                <Input value={nameRu} onChange={(e) => setNameRu(e.target.value)} placeholder="Название товара" />
              </div>
              <div>
                <Label>Описание (Русский)</Label>
                <Textarea
                  value={descriptionRu}
                  onChange={(e) => setDescriptionRu(e.target.value)}
                  placeholder="Подробное описание..."
                  rows={4}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rasmlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
                <Image src={img} alt="" fill className="object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground">Yuklash</span>
                </>
              )}
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Narx va zaxira</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Narx (so&apos;m) *</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Eski narx</Label>
            <Input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Zaxira</Label>
            <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-001" />
          </div>
          <div>
            <Label>Og&apos;irlik (g)</Label>
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Kafolat muddati</Label>
            <Select value={warranty} onValueChange={setWarranty}>
              <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
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
          <div>
            <Label>Kategoriya</Label>
            <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setSubcategoryId(''); }}>
              <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.nameUz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {subcategories.length > 0 && (
            <div>
              <Label>Subkategoriya</Label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                <SelectTrigger><SelectValue placeholder="Subkategoriya tanlang" /></SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.nameUz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!hasVariants && Array.isArray(colors) && colors.length > 0 && (
            <div>
              <Label>Rang</Label>
              <Select value={colorId} onValueChange={setColorId}>
                <SelectTrigger><SelectValue placeholder="Rang tanlang" /></SelectTrigger>
                <SelectContent>
                  {colors.map((color: any) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 rounded-full border" style={{ backgroundColor: color.hexCode }} />
                        {color.nameUz}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {Array.isArray(brands) && brands.length > 0 && (
            <div>
              <Label>Brend</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue placeholder="Brend tanlang" /></SelectTrigger>
                <SelectContent>
                  {brands.map((brand: any) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Variantlar (Rang × O&apos;lcham)
          </CardTitle>
          <CardDescription>
            Bir mahsulotning turli rang va o&apos;lchamlari uchun alohida narx/ombor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Variantli mahsulot</Label>
              <p className="text-xs text-muted-foreground">
                Rang yoki o&apos;lcham bo&apos;yicha farq qiladimi?
              </p>
            </div>
            <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
          </div>

          {hasVariants && (
            <>
              {/* Color Selection */}
              {Array.isArray(colors) && colors.length > 0 && (
                <div className="space-y-2">
                  <Label>Ranglarni tanlang</Label>
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
                  <Label>O&apos;lchamlarni tanlang</Label>
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
                  <Label>Variant jadvali ({variantKeys.length} ta variant)</Label>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {selectedColorIds.length > 0 && <th className="text-left px-3 py-2 font-medium">Rang</th>}
                          {selectedSizeIds.length > 0 && <th className="text-left px-3 py-2 font-medium">O&apos;lcham</th>}
                          <th className="text-left px-3 py-2 font-medium">Narx *</th>
                          <th className="text-left px-3 py-2 font-medium">Eski narx</th>
                          <th className="text-left px-3 py-2 font-medium">Miqdor</th>
                          <th className="text-left px-3 py-2 font-medium">SKU</th>
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
                                  placeholder={price || '0'}
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
                    Bo&apos;sh qoldirilgan narx → asosiy narx ishlatiladi
                  </p>
                </div>
              )}

              {variantKeys.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  Yuqoridan rang yoki o&apos;lcham tanlang
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Active toggle */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <Label>Faol holat</Label>
            <p className="text-xs text-muted-foreground">Mahsulot sotuvda ko&apos;rinadi</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/vendor/products" className="flex-1">
          <Button variant="outline" className="w-full">Bekor qilish</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="flex-1"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Saqlash
        </Button>
      </div>
    </div>
  );
}
