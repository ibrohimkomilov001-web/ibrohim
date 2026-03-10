'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { toast } from 'sonner'
import { IconPicker, CategoryIcon } from '@/components/ui/icon-picker'
import { useTranslation } from '@/store/locale-store'

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
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

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

  const invalidateCategories = () =>
    queryClient.invalidateQueries({ queryKey: ['categories'] })

  const toggleExpand = (id: string) =>
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  // ─── Category CRUD ─────────────────────────

  const addMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      invalidateCategories()
      setAddDialogOpen(false)
      setFormData({ ...defaultCategoryForm })
      toast.success(t('categoryAdded'))
    },
    onError: () => toast.error(t('categoryAddError')),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, data),
    onSuccess: () => {
      invalidateCategories()
      setEditDialogOpen(false)
      setSelectedCategory(null)
      toast.success(t('categoryUpdated'))
    },
    onError: () => toast.error(t('categoryUpdateError')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      invalidateCategories()
      toast.success(t('categoryDeleted'))
    },
    onError: () => toast.error(t('categoryDeleteError')),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCategoryStatus(id, isActive),
    onSuccess: () => invalidateCategories(),
    onError: () => toast.error(t('statusChangeError')),
  })

  const handleAdd = () => {
    if (!formData.nameUz.trim()) {
      toast.error(t('categoryNameRequired'))
      return
    }
    addMutation.mutate({
      nameUz: formData.nameUz.trim(),
      nameRu: formData.nameRu.trim(),
      icon: formData.icon || undefined,
      sortOrder: formData.sortOrder || 0,
    })
  }

  const handleEdit = () => {
    if (!selectedCategory) return
    editMutation.mutate({
      id: selectedCategory.id,
      data: {
        nameUz: formData.nameUz.trim(),
        nameRu: formData.nameRu.trim(),
        icon: formData.icon || undefined,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      },
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('confirmDeleteCategoryWithSubs'))) return
    deleteMutation.mutate(id)
  }

  const handleToggleStatus = (cat: Category) => {
    toggleStatusMutation.mutate({ id: cat.id, isActive: !cat.is_active })
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

  const addSubMutation = useMutation({
    mutationFn: createSubcategory,
    onSuccess: () => {
      invalidateCategories()
      setAddSubDialogOpen(false)
      if (!expandedCategories.includes(subParentId)) {
        setExpandedCategories((prev) => [...prev, subParentId])
      }
      toast.success(t('subcategoryAdded'))
    },
    onError: () => toast.error(t('subcategoryAddError')),
  })

  const handleAddSub = () => {
    if (!subFormData.nameUz.trim()) {
      toast.error(t('subcategoryNameRequired'))
      return
    }
    addSubMutation.mutate({
      categoryId: subParentId,
      nameUz: subFormData.nameUz.trim(),
      nameRu: subFormData.nameRu.trim(),
      sortOrder: subFormData.sortOrder || 0,
    })
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

  const editSubMutation = useMutation({
    mutationFn: ({ parentId, subId, data }: { parentId: string; subId: string; data: Parameters<typeof updateSubcategory>[2] }) =>
      updateSubcategory(parentId, subId, data),
    onSuccess: () => {
      invalidateCategories()
      setEditSubDialogOpen(false)
      setSelectedSub(null)
      toast.success(t('subcategoryUpdated'))
    },
    onError: () => toast.error(t('subcategoryUpdateError')),
  })

  const deleteSubMutation = useMutation({
    mutationFn: ({ parentId, subId }: { parentId: string; subId: string }) =>
      deleteSubcategoryAction(parentId, subId),
    onSuccess: () => {
      invalidateCategories()
      toast.success(t('subcategoryDeleted'))
    },
    onError: () => toast.error(t('subcategoryDeleteError')),
  })

  const handleEditSub = () => {
    if (!selectedSub) return
    editSubMutation.mutate({
      parentId: selectedSub.parentId,
      subId: selectedSub.sub.id,
      data: {
        nameUz: subFormData.nameUz.trim(),
        nameRu: subFormData.nameRu.trim(),
        sortOrder: subFormData.sortOrder,
      },
    })
  }

  const handleDeleteSub = (parentId: string, subId: string) => {
    if (!confirm(t('confirmDeleteSubcategory'))) return
    deleteSubMutation.mutate({ parentId, subId })
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('categories')}</h1>
          <p className="text-muted-foreground">
            {t('manageCategories')} — {categories.length} {t('categoryCount')}
          </p>
        </div>

        {/* Add Category Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t('addCategory')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('newCategory')}</DialogTitle>
              <DialogDescription>{t('addNewCategoryDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('nameUz')} *</Label>
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
                <Label>{t('sortOrder')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('iconLabel')}</Label>
                <IconPicker
                  value={formData.icon}
                  onChange={(v) => setFormData({ ...formData, icon: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleAdd} disabled={addMutation.isPending}>
                {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('noCategoriesExist')}
            </CardContent>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CategoryIcon iconName={category.icon} size={20} />
                    <span className="font-medium">{category.name_uz}</span>
                  </div>
                  <Badge
                    variant={category.is_active ? 'default' : 'secondary'}
                    className={category.is_active ? 'bg-green-500' : 'bg-gray-400'}
                  >
                    {category.is_active ? t('active') : t('inactive')}
                  </Badge>
                </div>
                {category.name_ru && (
                  <p className="text-sm text-muted-foreground mb-2">{category.name_ru}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {category.children?.length || 0} {t('subcategoryWord')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{category.sort_order}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600" onClick={() => openAddSubDialog(category.id)}>
                      <FolderPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggleStatus(category)}>
                      <Power className={`h-4 w-4 ${category.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Subcategories */}
                {category.children && category.children.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {category.children.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between pl-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">↳</span>
                          <span className="text-sm">{sub.name_uz}</span>
                          <Badge variant="outline" className={`text-[10px] ${sub.is_active ? 'border-green-500 text-green-500' : 'border-gray-400 text-gray-400'}`}>
                            {sub.is_active ? t('active') : t('inactive')}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditSubDialog(category.id, sub)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteSub(category.id, sub.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Table (Desktop) */}
      <Card className="hidden sm:block">
        <CardHeader>
          <CardTitle>{t('categoriesList')}</CardTitle>
          <CardDescription>
            {t('total')} {categories.length} {t('mainCategoriesCount')},{' '}
            {categories.reduce((acc, c) => acc + (c.children?.length || 0), 0)} {t('subcategoryWord')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>{t('nameUz')}</TableHead>
                <TableHead>{t('nameRu')}</TableHead>
                <TableHead className="w-24">{t('subcategory')}</TableHead>
                <TableHead className="w-20">{t('sortOrder')}</TableHead>
                <TableHead className="w-24">{t('status')}</TableHead>
                <TableHead className="text-right w-44">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('noCategoriesExist')}
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
                          {category.is_active ? t('active') : t('inactive')}
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
                        <TableRow key={sub.id} className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900">
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
                              {sub.is_active ? t('active') : t('inactive')}
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
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('editCategory')}</DialogTitle>
            <DialogDescription>
              &quot;{selectedCategory?.name_uz}&quot; kategoriyasini tahrirlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('nameUz')}</Label>
                <Input
                  value={formData.nameUz}
                  onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('nameRu')}</Label>
                <Input
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('sortOrder')}</Label>
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
                <Label>{formData.isActive ? t('active') : t('inactive')}</Label>
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
              {t('cancel')}
            </Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending}>
              {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subcategory Dialog */}
      <Dialog open={addSubDialogOpen} onOpenChange={setAddSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('newSubcategory')}</DialogTitle>
            <DialogDescription>
              &quot;{categories.find((c) => c.id === subParentId)?.name_uz}&quot; kategoriyasiga
              subcategoriya qo&apos;shing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('nameUz')} *</Label>
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
              <Label>{t('sortOrder')}</Label>
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
              {t('cancel')}
            </Button>
            <Button onClick={handleAddSub} disabled={addSubMutation.isPending}>
              {addSubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={editSubDialogOpen} onOpenChange={setEditSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editSubcategory')}</DialogTitle>
            <DialogDescription>
              &quot;{selectedSub?.sub.name_uz}&quot; subcategoriyasini tahrirlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('nameUz')}</Label>
                <Input
                  value={subFormData.nameUz}
                  onChange={(e) => setSubFormData({ ...subFormData, nameUz: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('nameRu')}</Label>
                <Input
                  value={subFormData.nameRu}
                  onChange={(e) => setSubFormData({ ...subFormData, nameRu: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('sortOrder')}</Label>
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
              {t('cancel')}
            </Button>
            <Button onClick={handleEditSub} disabled={editSubMutation.isPending}>
              {editSubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
