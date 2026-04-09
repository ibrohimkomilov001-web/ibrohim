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
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import Image from "next/image";
import { useTranslation } from '@/store/locale-store';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Shop form state
  const [shopName, setShopName] = useState("");
  const [shopNameRu, setShopNameRu] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopDescriptionRu, setShopDescriptionRu] = useState("");
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

  // Business info state (V-NEW-01)
  const [businessType, setBusinessType] = useState("");
  const [inn, setInn] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [mfo, setMfo] = useState("");
  const [oked, setOked] = useState("");

  // Load shop data
  const { data: shop, isLoading } = useQuery({
    queryKey: ["vendor-shop"],
    queryFn: vendorApi.getShop,
  });

  useEffect(() => {
    if (shop) {
      setShopName(shop.name || "");
      setShopNameRu((shop as any).nameRu || "");
      setShopDescription(shop.description || "");
      setShopDescriptionRu((shop as any).descriptionRu || "");
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
      setBusinessType(shop.businessType || "");
      setInn(shop.inn || "");
      setBankName(shop.bankName || "");
      setBankAccount(shop.bankAccount || "");
      setMfo(shop.mfo || "");
      setOked(shop.oked || "");
    }
  }, [shop]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => vendorApi.updateShop(data),
    onSuccess: () => {
      toast.success(t('settingsSaved'));
      queryClient.invalidateQueries({ queryKey: ["vendor-shop"] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('errorOccurred'));
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadApi.uploadImage(file, 'shop');
      setLogoUrl(result.url);
      toast.success(t('logoUploaded'));
    } catch (err: any) {
      toast.error(err.message || t('uploadError'));
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
      toast.success(t('bannerUploaded'));
    } catch (err: any) {
      toast.error(err.message || t('uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!shopName.trim()) errs.shopName = t('enterShopName');
    if (!shopPhone.trim()) errs.shopPhone = t('enterPhone');
    else if (!/^\+?998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(shopPhone.trim().replace(/[\-()]/g, '')))
      errs.shopPhone = "Format: +998 XX XXX XX XX";
    if (shopEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopEmail.trim()))
      errs.shopEmail = t('emailFormatError');
    if (!shopCity) errs.shopCity = t('selectCity');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast.error(t('fillRequiredFields'));
      return;
    }
    updateMutation.mutate({
      name: shopName.trim(),
      nameRu: shopNameRu.trim() || undefined,
      description: shopDescription.trim(),
      descriptionRu: shopDescriptionRu.trim() || undefined,
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
      businessType: businessType.trim() || undefined,
      inn: inn.trim() || undefined,
      bankName: bankName.trim() || undefined,
      bankAccount: bankAccount.trim() || undefined,
      mfo: mfo.trim() || undefined,
      oked: oked.trim() || undefined,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('vendorSettingsTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('manageShopInfo')}</p>
        </div>
        <Button
          className="rounded-full hidden sm:inline-flex"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('saveBtn')}
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
              {t('brandingTitle')}
            </CardTitle>
            <CardDescription>{t('brandingDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Logo */}
              <div>
                <Label className="mb-2 block">{t('logoLabel')}</Label>
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
                        {t('uploadBtn2')}
                      </span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>

              {/* Banner */}
              <div>
                <Label className="mb-2 block">{t('bannerLabel')}</Label>
                <label className="block cursor-pointer">
                  <div className="aspect-[3/1] rounded-xl border-2 border-dashed border-muted-foreground/30 overflow-hidden hover:border-primary/50 transition-colors relative">
                    {bannerUrl ? (
                      <Image src={resolveImageUrl(bannerUrl)} alt="Banner" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Upload className="h-6 w-6 mr-2" />
                        <span className="text-sm">{t('bannerUploadText')}</span>
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
            {t('shopInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">{t('shopNameLabel')} (UZ) <span className="text-destructive">*</span></Label>
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
              <Label htmlFor="shopNameRu">{t('shopNameLabel')} (RU)</Label>
              <Input
                id="shopNameRu"
                value={shopNameRu}
                onChange={(e) => setShopNameRu(e.target.value)}
                placeholder="Название магазина"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('cityLabel')}</Label>
            <Select value={shopCity} onValueChange={setShopCity}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Nukus", "Qarshi", "Jizzax", "Navoiy", "Termiz", "Urganch", "Guliston"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.shopCity && <p className="text-xs text-destructive">{errors.shopCity}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopDescription">{t('descriptionLabel')} (UZ)</Label>
              <Textarea
                id="shopDescription"
                value={shopDescription}
                onChange={(e) => setShopDescription(e.target.value)}
                placeholder="Do'kon haqida..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopDescriptionRu">{t('descriptionLabel')} (RU)</Label>
              <Textarea
                id="shopDescriptionRu"
                value={shopDescriptionRu}
                onChange={(e) => setShopDescriptionRu(e.target.value)}
                placeholder="О магазине..."
                rows={3}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopAddress">{t('addressLabel')}</Label>
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
            {t('contactInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopPhone">{t('phoneLabel2')} <span className="text-destructive">*</span></Label>
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
              <Label htmlFor="shopEmail">{t('emailLabel2')}</Label>
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
                <Globe className="h-3 w-3" /> {t('websiteLabel')}
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

      {/* Business Info (V-NEW-01) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Biznes ma'lumotlari
          </CardTitle>
          <CardDescription>Yuridik shaxs yoki yakka tartibdagi tadbirkor ma'lumotlari</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Biznes turi</Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Jismoniy shaxs</SelectItem>
                  <SelectItem value="sole_proprietor">Yakka tartibdagi tadbirkor</SelectItem>
                  <SelectItem value="llc">MChJ</SelectItem>
                  <SelectItem value="other">Boshqa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inn">INN (STIR)</Label>
              <Input
                id="inn"
                value={inn}
                onChange={(e) => setInn(e.target.value)}
                placeholder="123456789"
                maxLength={15}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank nomi</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ipoteka bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Hisob raqam</Label>
              <Input
                id="bankAccount"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="20208000..."
                maxLength={25}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mfo">MFO</Label>
              <Input
                id="mfo"
                value={mfo}
                onChange={(e) => setMfo(e.target.value)}
                placeholder="00084"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oked">OKED (IFUT)</Label>
              <Input
                id="oked"
                value={oked}
                onChange={(e) => setOked(e.target.value)}
                placeholder="47111"
                maxLength={10}
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
            {t('deliverySettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('deliveryModel')}</Label>
            <Select value={fulfillmentType} onValueChange={setFulfillmentType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FBS">
                  {t('fbsOption')}
                </SelectItem>
                <SelectItem value="DBS">
                  {t('dbsOption')}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {t('deliveryModelDesc')}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minOrder">{t('minOrderLabel')}</Label>
              <Input
                id="minOrder"
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryFee">{t('deliveryFeeLabel')}</Label>
              <Input
                id="deliveryFee"
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freeDeliveryMin">{t('freeDeliveryLabel')}</Label>
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

      {/* Theme / Mavzu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            Mavzu (Tema)
          </CardTitle>
          <CardDescription>Yorug' yoki qorong'u rejimni tanlang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'light', label: "Yorug'", icon: Sun },
              { value: 'dark', label: "Qorong'u", icon: Moon },
              { value: 'system', label: 'Tizim', icon: Monitor },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  theme === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
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
              {t('saving')}
            </>
          ) : (
            t('saveBtn')
          )}
        </Button>
      </div>
    </div>
  );
}
