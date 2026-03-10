"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProductReviews,
  fetchShopReviews,
  deleteProductReview,
  deleteShopReview,
} from "@/lib/api/admin";
import { toast } from "sonner";
import {
  Star,
  Search,
  Trash2,
  Package,
  Store,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { StatCard } from "@/components/charts";
import { useTranslation } from "@/store/locale-store";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminReviewsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Product reviews state
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productRating, setProductRating] = useState<string>("all");

  // Shop reviews state
  const [shopPage, setShopPage] = useState(1);
  const [shopSearch, setShopSearch] = useState("");
  const [shopRating, setShopRating] = useState<string>("all");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "product" | "shop"; id: string } | null>(null);

  // Fetch product reviews
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ["admin-product-reviews", productPage, productSearch, productRating],
    queryFn: () =>
      fetchProductReviews({
        page: productPage,
        search: productSearch || undefined,
        rating: productRating !== "all" ? Number(productRating) : undefined,
      }),
  });

  // Fetch shop reviews
  const { data: shopData, isLoading: shopLoading } = useQuery({
    queryKey: ["admin-shop-reviews", shopPage, shopSearch, shopRating],
    queryFn: () =>
      fetchShopReviews({
        page: shopPage,
        search: shopSearch || undefined,
        rating: shopRating !== "all" ? Number(shopRating) : undefined,
      }),
  });

  // Delete mutations
  const deleteProductMutation = useMutation({
    mutationFn: deleteProductReview,
    onSuccess: () => {
      toast.success("Mahsulot sharhi o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteShopMutation = useMutation({
    mutationFn: deleteShopReview,
    onSuccess: () => {
      toast.success("Do'kon sharhi o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["admin-shop-reviews"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "product") {
      deleteProductMutation.mutate(deleteTarget.id);
    } else {
      deleteShopMutation.mutate(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const productReviews = productData?.data || [];
  const productMeta = productData?.meta || {};
  const shopReviews = shopData?.data || [];
  const shopMeta = shopData?.meta || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("reviews")}</h1>
        <p className="text-muted-foreground">
          Mahsulot va do&apos;kon sharhlarini boshqaring
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Star} label="Mahsulot sharhlari" value={productMeta.totalReviews ?? "—"} color="warning" />
        <StatCard icon={Star} label="O'rtacha reyting" value={productMeta.avgRating ? Number(productMeta.avgRating).toFixed(1) : "—"} color="success" />
        <StatCard icon={Store} label="Do'kon sharhlari" value={shopMeta.total ?? "—"} color="info" />
        <StatCard icon={MessageCircle} label="Jami" value={(productMeta.totalReviews ?? 0) + (shopMeta.total ?? 0)} color="purple" />
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" /> Mahsulot sharhlari
          </TabsTrigger>
          <TabsTrigger value="shops" className="gap-2">
            <Store className="h-4 w-4" /> Do&apos;kon sharhlari
          </TabsTrigger>
        </TabsList>

        {/* Product Reviews */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mahsulot yoki foydalanuvchi nomi..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={productRating}
              onValueChange={(v) => {
                setProductRating(v);
                setProductPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Reyting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="5">5 yulduz</SelectItem>
                <SelectItem value="4">4 yulduz</SelectItem>
                <SelectItem value="3">3 yulduz</SelectItem>
                <SelectItem value="2">2 yulduz</SelectItem>
                <SelectItem value="1">1 yulduz</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {productLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : productReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageCircle className="mx-auto h-10 w-10 mb-3 opacity-40" />
                Sharhlar topilmadi
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {productReviews.map((review: any) => (
                <Card key={review.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback>
                          {review.user?.fullName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-sm">
                              {review.user?.fullName || "Noma'lum"}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive shrink-0"
                            onClick={() => setDeleteTarget({ type: "product", id: review.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <StarRating rating={review.rating} />
                        {review.comment && (
                          <p className="text-sm mt-1 text-foreground/80">
                            {review.comment}
                          </p>
                        )}
                        {review.images?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {review.images.map((img: string, i: number) => (
                              <div
                                key={i}
                                className="h-16 w-16 rounded-lg overflow-hidden bg-muted border"
                              >
                                <img
                                  src={img}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span className="truncate">
                            {review.product?.nameUz || review.product?.nameRu || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {productMeta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {productPage} / {productMeta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={productPage >= productMeta.totalPages}
                    onClick={() => setProductPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Shop Reviews */}
        <TabsContent value="shops" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Do'kon yoki foydalanuvchi nomi..."
                value={shopSearch}
                onChange={(e) => {
                  setShopSearch(e.target.value);
                  setShopPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={shopRating}
              onValueChange={(v) => {
                setShopRating(v);
                setShopPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Reyting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="5">5 yulduz</SelectItem>
                <SelectItem value="4">4 yulduz</SelectItem>
                <SelectItem value="3">3 yulduz</SelectItem>
                <SelectItem value="2">2 yulduz</SelectItem>
                <SelectItem value="1">1 yulduz</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shopLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : shopReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageCircle className="mx-auto h-10 w-10 mb-3 opacity-40" />
                Sharhlar topilmadi
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {shopReviews.map((review: any) => (
                <Card key={review.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback>
                          {review.user?.fullName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-sm">
                              {review.user?.fullName || "Noma'lum"}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive shrink-0"
                            onClick={() => setDeleteTarget({ type: "shop", id: review.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <StarRating rating={review.rating} />
                        {review.comment && (
                          <p className="text-sm mt-1 text-foreground/80">
                            {review.comment}
                          </p>
                        )}
                        {review.vendorReply && (
                          <div className="mt-2 p-2 bg-muted rounded-lg text-sm">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Sotuvchi javobi:</p>
                            {review.vendorReply}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Store className="h-3 w-3" />
                          <span className="truncate">
                            {review.shop?.name || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {shopMeta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={shopPage <= 1}
                    onClick={() => setShopPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {shopPage} / {shopMeta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={shopPage >= shopMeta.totalPages}
                    onClick={() => setShopPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sharhni o&apos;chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu sharhni o&apos;chirishni xohlaysizmi? Bu amalni qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
