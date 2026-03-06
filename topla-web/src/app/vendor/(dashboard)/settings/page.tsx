"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { uploadApi, resolveImageUrl } from "@/lib/api/upload";
import { toast } from "sonner";
import {
  Store,
  User,
  MapPin,
  Phone,
  Mail,
  Clock,
  Image as ImageIcon,
  Loader2,
  Save,
  Upload,
  Globe,
  Instagram,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Shop form state
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopCity, setShopCity] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("DBS");
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [freeDeliveryMin, setFreeDeliveryMin] = useState("");

  // Load shop data
  const { data: shop, isLoading } = useQuery({
    queryKey: ["vendor-shop"],
    queryFn: vendorApi.getShop,
  });

  useEffect(() => {
    if (shop) {
      setShopName(shop.name || "");
      setShopDescription(shop.description || "");
      setShopPhone(shop.phone || "");
      setShopEmail(shop.email || "");
      setShopAddress(shop.address || "");
      setShopCity(shop.city || "");
      setLogoUrl(shop.logoUrl || "");
      setBannerUrl(shop.bannerUrl || "");
      setFulfillmentType(shop.fulfillmentType || "DBS");
      setInstagram(shop.instagram || "");
      setTelegram(shop.telegram || "");
      setWebsite(shop.website || "");
      setMinOrder(shop.minOrderAmount?.toString() || "");
      setDeliveryFee(shop.deliveryFee?.toString() || "");
      setFreeDeliveryMin(shop.freeDeliveryFrom?.toString() || "");
    }
  }, [shop]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => vendorApi.updateShop(data),
    onSuccess: () => {
      toast.success("Sozlamalar saqlandi");
      queryClient.invalidateQueries({ queryKey: ["vendor-shop"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Xatolik yuz berdi");
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadApi.uploadImage(file, 'shop');
      setLogoUrl(result.url);
      toast.success("Logo yuklandi");
    } catch (err: any) {
      toast.error(err.message || "Yuklashda xatolik");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadApi.uploadImage(file, 'shop');
      setBannerUrl(result.url);
      toast.success("Banner yuklandi");
    } catch (err: any) {
      toast.error(err.message || "Yuklashda xatolik");
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!shopName.trim()) errs.shopName = "Do'kon nomini kiriting";
    if (!shopPhone.trim()) errs.shopPhone = "Telefon raqamini kiriting";
    else if (!/^\+?998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(shopPhone.trim().replace(/[\-()]/g, '')))
      errs.shopPhone = "Format: +998 XX XXX XX XX";
    if (shopEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopEmail.trim()))
      errs.shopEmail = "Email formati noto'g'ri";
    if (!shopCity) errs.shopCity = "Shaharni tanlang";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast.error("Iltimos, majburiy maydonlarni to'ldiring");
      return;
    }
    updateMutation.mutate({
      name: shopName.trim(),
      description: shopDescription.trim(),
      phone: shopPhone.trim(),
      email: shopEmail.trim(),
      address: shopAddress.trim(),
      city: shopCity,
      logoUrl,
      bannerUrl,
      fulfillmentType,
      instagram: instagram.trim(),
      telegram: telegram.trim(),
      website: website.trim(),
      minOrderAmount: minOrder ? Number(minOrder) : undefined,
      deliveryFee: deliveryFee ? Number(deliveryFee) : undefined,
      freeDeliveryFrom: freeDeliveryMin ? Number(freeDeliveryMin) : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sozlamalar</h1>
          <p className="text-muted-foreground">Do&apos;kon ma&apos;lumotlarini boshqarish</p>
        </div>
        <Button
          className="rounded-full"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Saqlash
            </>
          )}
        </Button>
      </div>

      {/* Branding */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Branding
            </CardTitle>
            <CardDescription>Logo va banner rasmlarini yuklang</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Logo */}
              <div>
                <Label className="mb-2 block">Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={resolveImageUrl(logoUrl)} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {shopName?.charAt(0) || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <label>
                    <Button variant="outline" className="rounded-full" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Yuklash
                      </span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>

              {/* Banner */}
              <div>
                <Label className="mb-2 block">Banner</Label>
                <label className="block cursor-pointer">
                  <div className="aspect-[3/1] rounded-xl border-2 border-dashed border-muted-foreground/30 overflow-hidden hover:border-primary/50 transition-colors relative">
                    {bannerUrl ? (
                      <Image src={resolveImageUrl(bannerUrl)} alt="Banner" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Upload className="h-6 w-6 mr-2" />
                        <span className="text-sm">Banner yuklash</span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shop Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Do&apos;kon ma&apos;lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Do&apos;kon nomi <span className="text-destructive">*</span></Label>
              <Input
                id="shopName"
                value={shopName}
                onChange={(e) => { setShopName(e.target.value); setErrors((p) => ({ ...p, shopName: '' })); }}
                placeholder="Do'kon nomi"
                className={errors.shopName ? 'border-destructive' : ''}
              />
              {errors.shopName && <p className="text-xs text-destructive">{errors.shopName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Shahar</Label>
              <Select value={shopCity} onValueChange={setShopCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Nukus", "Qarshi", "Jizzax", "Navoiy", "Termiz", "Urganch", "Guliston"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.shopCity && <p className="text-xs text-destructive">{errors.shopCity}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopDescription">Tavsif</Label>
            <Textarea
              id="shopDescription"
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              placeholder="Do'kon haqida..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopAddress">Manzil</Label>
            <Input
              id="shopAddress"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              placeholder="To'liq manzil"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Aloqa ma&apos;lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopPhone">Telefon <span className="text-destructive">*</span></Label>
              <Input
                id="shopPhone"
                value={shopPhone}
                onChange={(e) => { setShopPhone(e.target.value); setErrors((p) => ({ ...p, shopPhone: '' })); }}
                placeholder="+998 90 123 45 67"
                className={errors.shopPhone ? 'border-destructive' : ''}
              />
              {errors.shopPhone && <p className="text-xs text-destructive">{errors.shopPhone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopEmail">Email</Label>
              <Input
                id="shopEmail"
                type="email"
                value={shopEmail}
                onChange={(e) => { setShopEmail(e.target.value); setErrors((p) => ({ ...p, shopEmail: '' })); }}
                placeholder="shop@topla.uz"
                className={errors.shopEmail ? 'border-destructive' : ''}
              />
              {errors.shopEmail && <p className="text-xs text-destructive">{errors.shopEmail}</p>}
            </div>
          </div>

          <Separator />

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-1">
                <Instagram className="h-3 w-3" /> Instagram
              </Label>
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram" className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Telegram
              </Label>
              <Input
                id="telegram"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-1">
                <Globe className="h-3 w-3" /> Veb-sayt
              </Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Yetkazib berish sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Yetkazib berish modeli</Label>
            <Select value={fulfillmentType} onValueChange={setFulfillmentType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FBS">
                  FBS — Siz saqlaysiz, TOPLA yetkazadi
                </SelectItem>
                <SelectItem value="DBS">
                  DBS — O&apos;zingiz saqlaysiz va yetkazasiz
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              FBS: Mahsulotni o&apos;zingiz saqlaysiz, TOPLA yetkazib beradi. DBS: O&apos;zingiz saqlaysiz va yetkazasiz.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minOrder">Min. buyurtma (so&apos;m)</Label>
              <Input
                id="minOrder"
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryFee">Yetkazish narxi (so&apos;m)</Label>
              <Input
                id="deliveryFee"
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freeDeliveryMin">Bepul yetkazish (so&apos;m dan)</Label>
              <Input
                id="freeDeliveryMin"
                type="number"
                value={freeDeliveryMin}
                onChange={(e) => setFreeDeliveryMin(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Mobile) */}
      <div className="sm:hidden">
        <Button
          className="w-full rounded-full"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            "Saqlash"
          )}
        </Button>
      </div>
    </div>
  );
}
