'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  createSubcategory,
  updateSubcategory,
  deleteSubcategoryAction,
  type Category,
} from './actions'
import { Loader2, Plus, Edit, Trash2, ChevronDown, ChevronRight, Power, FolderPlus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { IconPicker, CategoryIcon } from '@/components/ui/icon-picker'

// ─── Types ───────────────────────────────────
interface CategoryFormData {
  nameUz: string
  nameRu: string
  icon: string
  sortOrder: number
  isActive: boolean
}

interface SubcategoryFormData {
  nameUz: string
  nameRu: string
  sortOrder: number
}

const defaultCategoryForm: CategoryFormData = {
  nameUz: '',
  nameRu: '',
  icon: '',
  sortOrder: 0,
  isActive: true,
}

const defaultSubForm: SubcategoryFormData = {
  nameUz: '',
  nameRu: '',
  sortOrder: 0,
}

// ─── Page ────────────────────────────────────
export default function AdminCategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addSubDialogOpen, setAddSubDialogOpen] = useState(false)
  const [editSubDialogOpen, setEditSubDialogOpen] = useState(false)

  // Selections
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSub, setSelectedSub] = useState<{ parentId: string; sub: Category } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  // Forms
  const [formData, setFormData] = useState<CategoryFormData>({ ...defaultCategoryForm })
  const [subFormData, setSubFormData] = useState<SubcategoryFormData>({ ...defaultSubForm })

  // Parent for new subcategory
  const [subParentId, setSubParentId] = useState('')

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error(error)
      toast({ title: 'Xatolik', description: 'Kategoriyalarni yuklashda xatolik', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const toggleExpand = (id: string) =>
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  // ─── Category CRUD ─────────────────────────

  const handleAdd = async () => {
    if (!formData.nameUz.trim()) {
      toast({ title: 'Xatolik', description: "Kategoriya nomi (O'zbek) kiritilishi shart", variant: 'destructive' })
      return
    }
    try {
      setActionLoading(true)
      await createCategory({
        nameUz: formData.nameUz.trim(),
        nameRu: formData.nameRu.trim(),
        icon: formData.icon || undefined,
        sortOrder: formData.sortOrder || 0,
      })
      await loadCategories()
      setAddDialogOpen(false)
      setFormData({ ...defaultCategoryForm })
      toast({ title: 'Muvaffaqiyatli', description: "Kategoriya qo'shildi" })
    } catch {
      toast({ title: 'Xatolik', description: "Kategoriya qo'shishda xatolik", variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedCategory) return
    try {
      setActionLoading(true)
      await updateCategory(selectedCategory.id, {
        nameUz: formData.nameUz.trim(),
        nameRu: formData.nameRu.trim(),
        icon: formData.icon || undefined,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      })
      await loadCategories()
      setEditDialogOpen(false)
      setSelectedCategory(null)
      toast({ title: 'Muvaffaqiyatli', description: 'Kategoriya yangilandi' })
    } catch {
      toast({ title: 'Xatolik', description: 'Kategoriya yangilashda xatolik', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham o'chirmoqchimisiz? Barcha subcategoriyalar ham o'chiriladi!")) return
    try {
      await deleteCategory(id)
      await loadCategories()
      toast({ title: 'Muvaffaqiyatli', description: "Kategoriya o'chirildi" })
    } catch {
      toast({ title: 'Xatolik', description: "Kategoriya o'chirishda xatolik", variant: 'destructive' })
    }
  }

  const handleToggleStatus = async (cat: Category) => {
    try {
      await toggleCategoryStatus(cat.id, !cat.is_active)
      await loadCategories()
    } catch {
      toast({ title: 'Xatolik', description: "Status o'zgartirishda xatolik", variant: 'destructive' })
    }
  }

  const openEditDialog = (cat: Category) => {
    setSelectedCategory(cat)
    setFormData({
      nameUz: cat.name_uz || '',
      nameRu: cat.name_ru || '',
      icon: cat.icon || '',
      sortOrder: cat.sort_order || 0,
      isActive: cat.is_active ?? true,
    })
    setEditDialogOpen(true)
  }

  // ─── Subcategory CRUD ──────────────────────

  const openAddSubDialog = (parentId: string) => {
    setSubParentId(parentId)
    setSubFormData({ ...defaultSubForm })
    setAddSubDialogOpen(true)
  }

  const handleAddSub = async () => {
    if (!subFormData.nameUz.trim()) {
      toast({ title: 'Xatolik', description: "Subcategoriya nomi kiritilishi shart", variant: 'destructive' })
      return
    }
    try {
      setActionLoading(true)
      await createSubcategory({
        categoryId: subParentId,
        nameUz: subFormData.nameUz.trim(),
        nameRu: subFormData.nameRu.trim(),
        sortOrder: subFormData.sortOrder || 0,
      })
      await loadCategories()
      setAddSubDialogOpen(false)
      if (!expandedCategories.includes(subParentId)) {
        setExpandedCategories((prev) => [...prev, subParentId])
      }
      toast({ title: 'Muvaffaqiyatli', description: "Subcategoriya qo'shildi" })
    } catch {
      toast({ title: 'Xatolik', description: "Subcategoriya qo'shishda xatolik", variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const openEditSubDialog = (parentId: string, sub: Category) => {
    setSelectedSub({ parentId, sub })
    setSubFormData({
      nameUz: sub.name_uz || '',
      nameRu: sub.name_ru || '',
      sortOrder: sub.sort_order || 0,
    })
    setEditSubDialogOpen(true)
  }

  const handleEditSub = async () => {
    if (!selectedSub) return
    try {
      setActionLoading(true)
      await updateSubcategory(selectedSub.parentId, selectedSub.sub.id, {
        nameUz: subFormData.nameUz.trim(),
        nameRu: subFormData.nameRu.trim(),
        sortOrder: subFormData.sortOrder,
      })
      await loadCategories()
      setEditSubDialogOpen(false)
      setSelectedSub(null)
      toast({ title: 'Muvaffaqiyatli', description: 'Subcategoriya yangilandi' })
    } catch {
      toast({ title: 'Xatolik', description: 'Subcategoriya yangilashda xatolik', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSub = async (parentId: string, subId: string) => {
    if (!confirm("Subcategoriyani o'chirmoqchimisiz?")) return
    try {
      await deleteSubcategoryAction(parentId, subId)
      await loadCategories()
      toast({ title: 'Muvaffaqiyatli', description: "Subcategoriya o'chirildi" })
    } catch {
      toast({ title: 'Xatolik', description: "Subcategoriya o'chirishda xatolik", variant: 'destructive' })
    }
  }

  // ─── Render ────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategoriyalar</h1>
          <p className="text-muted-foreground">
            Mahsulot kategoriyalarini boshqaring — {categories.length} ta kategoriya
          </p>
        </div>

        {/* Add Category Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Kategoriya qo&apos;shish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi kategoriya</DialogTitle>
              <DialogDescription>Yangi asosiy kategoriya qo&apos;shing</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomi (O&apos;zbek) *</Label>
                  <Input
                    value={formData.nameUz}
                    onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                    placeholder="Elektronika"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomi (Rus)</Label>
                  <Input
                    value={formData.nameRu}
                    onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                    placeholder="Электроника"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tartib raqami</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon (ilovadagi kabi)</Label>
                <IconPicker
                  value={formData.icon}
                  onChange={(v) => setFormData({ ...formData, icon: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleAdd} disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Qo&apos;shish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kategoriyalar ro&apos;yxati</CardTitle>
          <CardDescription>
            Jami {categories.length} ta asosiy kategoriya,{' '}
            {categories.reduce((acc, c) => acc + (c.children?.length || 0), 0)} ta subcategoriya
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nomi (UZ)</TableHead>
                <TableHead>Nomi (RU)</TableHead>
                <TableHead className="w-24">Sub</TableHead>
                <TableHead className="w-20">Tartib</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="text-right w-44">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Kategoriyalar mavjud emas
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <>
                    {/* Main category row */}
                    <TableRow key={category.id} className="bg-muted/30">
                      <TableCell>
                        {category.children && category.children.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(category.id)}
                            className="h-8 w-8 p-0"
                          >
                            {expandedCategories.includes(category.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <div className="h-8 w-8" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CategoryIcon iconName={category.icon} size={22} />
                          <span>{category.name_uz}</span>
                        </div>
                      </TableCell>
                      <TableCell>{category.name_ru}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.children?.length || 0} ta</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.sort_order}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.is_active ? 'default' : 'secondary'}
                          className={
                            category.is_active
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-gray-400 hover:bg-gray-500'
                          }
                        >
                          {category.is_active ? 'Faol' : 'Nofaol'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAddSubDialog(category.id)}
                            title="Subcategoriya qo'shish"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <FolderPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                            title="Tahrirlash"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(category)}
                            title={category.is_active ? "O'chirish (Status)" : 'Yoqish'}
                          >
                            <Power
                              className={`h-4 w-4 ${
                                category.is_active ? 'text-green-500' : 'text-gray-400'
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Butunlay o'chirish"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Subcategory rows */}
                    {expandedCategories.includes(category.id) &&
                      category.children?.map((sub) => (
                        <TableRow key={sub.id} className="bg-white hover:bg-gray-50">
                          <TableCell></TableCell>
                          <TableCell className="pl-12 text-sm">↳ {sub.name_uz}</TableCell>
                          <TableCell className="text-sm">{sub.name_ru}</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.sort_order}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                sub.is_active
                                  ? 'border-green-500 text-green-500'
                                  : 'border-gray-400 text-gray-400'
                              }
                            >
                              {sub.is_active ? 'Faol' : 'Nofaol'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditSubDialog(category.id, sub)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSub(category.id, sub.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kategoriyani tahrirlash</DialogTitle>
            <DialogDescription>
              &quot;{selectedCategory?.name_uz}&quot; kategoriyasini tahrirlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomi (O&apos;zbek)</Label>
                <Input
                  value={formData.nameUz}
                  onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nomi (Rus)</Label>
                <Input
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tartib raqami</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                />
                <Label>{formData.isActive ? 'Faol' : 'Nofaol'}</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Icon (ilovadagi kabi)</Label>
              <IconPicker
                value={formData.icon}
                onChange={(v) => setFormData({ ...formData, icon: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleEdit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subcategory Dialog */}
      <Dialog open={addSubDialogOpen} onOpenChange={setAddSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi subcategoriya</DialogTitle>
            <DialogDescription>
              &quot;{categories.find((c) => c.id === subParentId)?.name_uz}&quot; kategoriyasiga
              subcategoriya qo&apos;shing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomi (O&apos;zbek) *</Label>
                <Input
                  value={subFormData.nameUz}
                  onChange={(e) => setSubFormData({ ...subFormData, nameUz: e.target.value })}
                  placeholder="Smartfonlar"
                />
              </div>
              <div className="space-y-2">
                <Label>Nomi (Rus)</Label>
                <Input
                  value={subFormData.nameRu}
                  onChange={(e) => setSubFormData({ ...subFormData, nameRu: e.target.value })}
                  placeholder="Смартфоны"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tartib raqami</Label>
              <Input
                type="number"
                min={0}
                value={subFormData.sortOrder}
                onChange={(e) =>
                  setSubFormData({ ...subFormData, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSubDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleAddSub} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Qo&apos;shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={editSubDialogOpen} onOpenChange={setEditSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subcategoriyani tahrirlash</DialogTitle>
            <DialogDescription>
              &quot;{selectedSub?.sub.name_uz}&quot; subcategoriyasini tahrirlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomi (O&apos;zbek)</Label>
                <Input
                  value={subFormData.nameUz}
                  onChange={(e) => setSubFormData({ ...subFormData, nameUz: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nomi (Rus)</Label>
                <Input
                  value={subFormData.nameRu}
                  onChange={(e) => setSubFormData({ ...subFormData, nameRu: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tartib raqami</Label>
              <Input
                type="number"
                min={0}
                value={subFormData.sortOrder}
                onChange={(e) =>
                  setSubFormData({ ...subFormData, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSubDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleEditSub} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
