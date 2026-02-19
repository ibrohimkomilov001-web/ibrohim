'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { vendorApi } from '@/lib/api/vendor';
import { uploadApi } from '@/lib/api/upload';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X, Loader2, ImageIcon, Save } from 'lucide-react';
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
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);

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

  // Tanlangan kategoriyaning subkategoriyalari
  const selectedCategory = categories?.find((c: any) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories || [];

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
      setIsActive(product.isActive);
      setImages(product.images || []);
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
      stock: Number(stock) || 0,
      sku: sku || undefined,
      weight: weight ? Number(weight) : undefined,
      isActive,
      images,
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
                  className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
