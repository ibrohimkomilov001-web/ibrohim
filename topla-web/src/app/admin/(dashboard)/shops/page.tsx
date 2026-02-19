"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Settings,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  Store,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getShops, getShopStats, updateShopStatus, updateShopCommission, type Shop } from "./actions";
import { useToast } from "@/components/ui/use-toast";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Faol", variant: "default" },
  pending: { label: "Kutilmoqda", variant: "secondary" },
  inactive: { label: "Nofaol", variant: "destructive" },
  blocked: { label: "Bloklangan", variant: "destructive" },
};

export default function AdminShopsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, blocked: 0 });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [newCommission, setNewCommission] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shopsData, statsData] = await Promise.all([
        getShops(),
        getShopStats()
      ]);
      setShops(shopsData);
      setStats(statsData);
    } catch (error) {
      console.error(error);
      toast({ title: "Xatolik", description: "Ma'lumotlarni yuklashda xatolik", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || shop.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleStatusChange = async (shop: Shop, newStatus: "active" | "inactive" | "blocked") => {
    try {
      setActionLoading(true);
      await updateShopStatus(shop.id, newStatus);
      await loadData();
      toast({ title: "Muvaffaqiyatli", description: `Do'kon statusi "${statusConfig[newStatus].label}" ga o'zgartirildi` });
      setIsDetailOpen(false);
    } catch (error) {
      toast({ title: "Xatolik", description: "Statusni o'zgartirishda xatolik", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommissionChange = async () => {
    if (!selectedShop || !newCommission) return;
    
    try {
      setActionLoading(true);
      await updateShopCommission(selectedShop.id, parseFloat(newCommission));
      await loadData();
      toast({ title: "Muvaffaqiyatli", description: "Komissiya foizi yangilandi" });
      setIsCommissionOpen(false);
    } catch (error) {
      toast({ title: "Xatolik", description: "Komissiyani yangilashda xatolik", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Do'konlar</h2>
        <p className="text-muted-foreground">
          Barcha do'konlarni boshqarish va moderatsiya qilish
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="all">Barchasi ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Kutilmoqda ({stats.pending})</TabsTrigger>
            <TabsTrigger value="active">Faol ({stats.active})</TabsTrigger>
            <TabsTrigger value="blocked">Bloklangan ({stats.blocked})</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Qidirish..."
                className="pl-9 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredShops.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Do'konlar topilmadi</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Do'kon</TableHead>
                    <TableHead>Egasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balans</TableHead>
                    <TableHead>Komissiya</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShops.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={shop.logo_url || ""} />
                            <AvatarFallback>{shop.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{shop.name}</div>
                            <div className="text-xs text-muted-foreground">{shop.total_orders} buyurtma</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{shop.owner?.full_name || "Noma'lum"}</div>
                          <div className="text-xs text-muted-foreground">{shop.owner?.phone || shop.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[shop.status]?.variant || "secondary"}>
                          {statusConfig[shop.status]?.label || shop.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(shop.balance)}</TableCell>
                      <TableCell>{shop.commission_rate}%</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(shop.created_at).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Amallar</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedShop(shop); setIsDetailOpen(true); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ko'rish
                            </DropdownMenuItem>
                            {shop.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(shop, "active")}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Tasdiqlash
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(shop, "inactive")} className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Rad etish
                                </DropdownMenuItem>
                              </>
                            )}
                            {shop.status === "active" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(shop, "blocked")} className="text-destructive">
                                <Ban className="mr-2 h-4 w-4" />
                                Bloklash
                              </DropdownMenuItem>
                            )}
                            {shop.status === "blocked" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(shop, "active")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Qayta faollashtirish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedShop(shop); setNewCommission(shop.commission_rate.toString()); setIsCommissionOpen(true); }}>
                              <Settings className="mr-2 h-4 w-4" />
                              Komissiya o'zgartirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Shop Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Do'kon ma'lumotlari</DialogTitle>
          </DialogHeader>
          {selectedShop && (
            <div className="space-y-6">
              {/* Shop Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedShop.logo_url || ""} />
                  <AvatarFallback className="text-lg">
                    {selectedShop.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{selectedShop.name}</h3>
                    <Badge variant={statusConfig[selectedShop.status]?.variant || "secondary"}>
                      {statusConfig[selectedShop.status]?.label || selectedShop.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">@{selectedShop.slug}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <DollarSign className="h-5 w-5 text-muted-foreground mb-1" />
                    <div className="text-lg font-semibold">{formatPrice(selectedShop.balance)}</div>
                    <div className="text-xs text-muted-foreground">Balans</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground mb-1" />
                    <div className="text-lg font-semibold">{selectedShop.total_orders}</div>
                    <div className="text-xs text-muted-foreground">Buyurtmalar</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <Store className="h-5 w-5 text-muted-foreground mb-1" />
                    <div className="text-lg font-semibold">{selectedShop.total_products}</div>
                    <div className="text-xs text-muted-foreground">Mahsulotlar</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <Settings className="h-5 w-5 text-muted-foreground mb-1" />
                    <div className="text-lg font-semibold">{selectedShop.commission_rate}%</div>
                    <div className="text-xs text-muted-foreground">Komissiya</div>
                  </CardContent>
                </Card>
              </div>

              {/* Owner Info */}
              <div className="space-y-2">
                <h4 className="font-medium">Egasi ma'lumotlari</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Ism:</span>
                    <span>{selectedShop.owner?.full_name || "Noma'lum"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedShop.owner?.phone || selectedShop.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{(selectedShop.owner as any)?.email || selectedShop.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedShop.address || selectedShop.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Ro'yxatdan o'tgan: {new Date(selectedShop.created_at).toLocaleDateString("uz-UZ")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedShop?.status === "pending" && (
              <>
                <Button variant="destructive" onClick={() => handleStatusChange(selectedShop, "inactive")} disabled={actionLoading}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rad etish
                </Button>
                <Button onClick={() => handleStatusChange(selectedShop, "active")} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Tasdiqlash
                </Button>
              </>
            )}
            {selectedShop?.status === "active" && (
              <Button variant="destructive" onClick={() => handleStatusChange(selectedShop, "blocked")} disabled={actionLoading}>
                <Ban className="mr-2 h-4 w-4" />
                Bloklash
              </Button>
            )}
            {selectedShop?.status === "blocked" && (
              <Button onClick={() => handleStatusChange(selectedShop, "active")} disabled={actionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Qayta faollashtirish
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Dialog */}
      <Dialog open={isCommissionOpen} onOpenChange={setIsCommissionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Komissiyani o'zgartirish</DialogTitle>
            <DialogDescription>
              {selectedShop?.name} uchun yangi komissiya foizini kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Komissiya (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newCommission}
                onChange={(e) => setNewCommission(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommissionOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCommissionChange} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
