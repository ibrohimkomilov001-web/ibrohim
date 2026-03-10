"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { useUrlState } from '@/hooks/use-url-state';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Filter,
  ArrowUpDown,
  ImageIcon,
} from "lucide-react";
import { useTranslation } from '@/store/locale-store';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [{ search, status, page: pageStr }, setFilters] = useUrlState({ search: '', status: 'all', page: '1' });
  const debouncedSearch = useDebounce(search);
  const page = parseInt(pageStr) || 1;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { t } = useTranslation();
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-products", { page, limit, search: debouncedSearch, status }],
    queryFn: () =>
      vendorApi.getProducts({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApi.deleteProduct(id),
    onSuccess: () => {
      toast.success(t('deleted'));
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t('errorOccurred'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      vendorApi.toggleProductActive(id, active),
    onSuccess: () => {
      toast.success(t('updated'));
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('errorOccurred'));
    },
  });

  const products = data?.data || (data as any)?.products || [];
  const pagination = (data as any)?.pagination || {};
  const totalPages = pagination?.totalPages || data?.totalPages || 1;
  const totalCount = pagination?.total || data?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('vendorProducts')}</h1>
          <p className="text-muted-foreground">
            Jami {totalCount} ta mahsulot
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/vendor/products/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('addProduct')}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholderGeneric')}
                value={search}
                onChange={(e) => setFilters({ search: e.target.value, page: '1' })}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(v) => setFilters({ status: v, page: '1' })}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
                <SelectItem value="out_of_stock">Tugagan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="aspect-square rounded-xl mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <div key={product.id}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow group">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative aspect-square bg-muted">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Actions */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/vendor/products/${product.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('edit')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleMutation.mutate({
                                id: product.id,
                                active: !product.isActive,
                              })
                            }
                          >
                            {product.isActive ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Nofaol qilish
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Faol qilish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Status badge */}
                    {!product.isActive && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary">{t('inactive')}</Badge>
                      </div>
                    )}
                    {(product as any).status === 'has_errors' && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive">{t('error')}</Badge>
                      </div>
                    )}
                    {(product as any).status === 'blocked' && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive">Bloklangan</Badge>
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive">Tugagan</Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t('stock')}: {product.stock ?? 0}</span>
                      <span>{product.soldCount ?? 0} sotildi</span>
                    </div>
                    {/* Quality Score */}
                    {(product as any).qualityScore !== undefined && (
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-muted-foreground">Sifat balli</span>
                          <span className={`font-medium ${(product as any).qualityScore >= 70 ? 'text-green-600' : (product as any).qualityScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {(product as any).qualityScore}/100
                          </span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${(product as any).qualityScore >= 70 ? 'bg-green-500' : (product as any).qualityScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${(product as any).qualityScore}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">
              {search ? t('noItems') : t('noData')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {search
                ? "Boshqa kalit so'z bilan qidiring"
                : "Birinchi mahsulotingizni qo'shing va sotishni boshlang"
              }
            </p>
            {!search && (
              <Button asChild className="rounded-full">
                <Link href="/vendor/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addProduct')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setFilters({ page: String(page - 1) })}
            className="rounded-full"
          >
            {t('previous')}
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setFilters({ page: String(page + 1) })}
            className="rounded-full"
          >
            {t('next')}
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
