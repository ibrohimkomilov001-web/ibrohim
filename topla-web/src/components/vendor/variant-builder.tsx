"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { uploadApi, resolveImageUrl } from "@/lib/api/upload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  X,
  Upload,
  Palette,
  Star,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";

// ============================================
// Types
// ============================================

export interface OptionType {
  id: string;
  slug: string;
  nameUz: string;
  nameRu: string;
  displayType: "color" | "text" | "image";
  unit?: string | null;
  values: OptionValue[];
}

export interface OptionValue {
  id: string;
  slug: string;
  valueUz: string;
  valueRu: string;
  hexCode?: string | null;
  imageUrl?: string | null;
}

export interface VariantRow {
  values: { optionTypeId: string; optionValueId: string }[];
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  images: string[];
  isActive: boolean;
  isDefault: boolean;
}

export interface VariantBuilderProps {
  hasVariants: boolean;
  onHasVariantsChange: (v: boolean) => void;
  /** Parent narx (default qiymat) */
  defaultPrice: string;
  /** Tanlangan option type idlari va qiymatlar */
  selectedOptions: { optionTypeId: string; valueIds: string[] }[];
  onSelectedOptionsChange: (opts: { optionTypeId: string; valueIds: string[] }[]) => void;
  /** Variant qatorlari */
  variantRows: VariantRow[];
  onVariantRowsChange: (rows: VariantRow[]) => void;
}

// ============================================
// Component
// ============================================

export function VariantBuilder({
  hasVariants,
  onHasVariantsChange,
  defaultPrice,
  selectedOptions,
  onSelectedOptionsChange,
  variantRows,
  onVariantRowsChange,
}: VariantBuilderProps) {
  const queryClient = useQueryClient();
  const [showAddType, setShowAddType] = useState(false);
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");

  // Fetch option types
  const { data: optionTypesData } = useQuery({
    queryKey: ["option-types"],
    queryFn: vendorApi.getOptionTypes,
  });
  const allOptionTypes: OptionType[] = (optionTypesData as any)?.data || optionTypesData || [];

  // Create new option value mutation
  const createValueMut = useMutation({
    mutationFn: ({ optionTypeId, data }: { optionTypeId: string; data: { valueUz: string; valueRu: string; hexCode?: string } }) =>
      vendorApi.createOptionValue(optionTypeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["option-types"] });
    },
  });

  // Currently selected option type objects
  const activeOptionTypes = useMemo(() => {
    return selectedOptions
      .map((so) => allOptionTypes.find((t) => t.id === so.optionTypeId))
      .filter(Boolean) as OptionType[];
  }, [selectedOptions, allOptionTypes]);

  // Available types to add (not yet selected)
  const availableTypes = useMemo(() => {
    const usedIds = new Set(selectedOptions.map((so) => so.optionTypeId));
    return allOptionTypes.filter((t) => !usedIds.has(t.id));
  }, [allOptionTypes, selectedOptions]);

  // ============================================
  // Cartesian product → variant matrix
  // ============================================
  const generateVariantMatrix = useCallback(
    (opts: { optionTypeId: string; valueIds: string[] }[]) => {
      const activeOpts = opts.filter((o) => o.valueIds.length > 0);
      if (activeOpts.length === 0) return [];

      // Build cartesian product
      const axes = activeOpts.map((o) =>
        o.valueIds.map((vid) => ({ optionTypeId: o.optionTypeId, optionValueId: vid }))
      );

      let combos: { optionTypeId: string; optionValueId: string }[][] = [[]];
      for (const axis of axes) {
        const newCombos: typeof combos = [];
        for (const combo of combos) {
          for (const val of axis) {
            newCombos.push([...combo, val]);
          }
        }
        combos = newCombos;
      }

      return combos;
    },
    []
  );

  // Regenerate variant rows when selection changes
  const regenerateRows = useCallback(
    (newOpts: { optionTypeId: string; valueIds: string[] }[]) => {
      const combos = generateVariantMatrix(newOpts);

      // Try to preserve existing row data by matching values
      const existingMap = new Map<string, VariantRow>();
      for (const row of variantRows) {
        const key = row.values
          .map((v) => `${v.optionTypeId}:${v.optionValueId}`)
          .sort()
          .join("|");
        existingMap.set(key, row);
      }

      const newRows: VariantRow[] = combos.map((combo, idx) => {
        const key = combo
          .map((v) => `${v.optionTypeId}:${v.optionValueId}`)
          .sort()
          .join("|");
        const existing = existingMap.get(key);
        if (existing) return { ...existing, values: combo };
        return {
          values: combo,
          price: defaultPrice || "",
          compareAtPrice: "",
          stock: "0",
          sku: "",
          images: [],
          isActive: true,
          isDefault: idx === 0,
        };
      });

      // Ensure exactly one default
      if (newRows.length > 0 && !newRows.some((r) => r.isDefault)) {
        newRows[0].isDefault = true;
      }

      onVariantRowsChange(newRows);
    },
    [variantRows, defaultPrice, generateVariantMatrix, onVariantRowsChange]
  );

  // ============================================
  // Handlers
  // ============================================

  const addOptionType = (typeId: string) => {
    const newOpts = [...selectedOptions, { optionTypeId: typeId, valueIds: [] }];
    onSelectedOptionsChange(newOpts);
    setShowAddType(false);
  };

  const removeOptionType = (typeId: string) => {
    const newOpts = selectedOptions.filter((o) => o.optionTypeId !== typeId);
    onSelectedOptionsChange(newOpts);
    regenerateRows(newOpts);
  };

  const toggleValue = (optionTypeId: string, valueId: string) => {
    const newOpts = selectedOptions.map((o) => {
      if (o.optionTypeId !== optionTypeId) return o;
      const has = o.valueIds.includes(valueId);
      return {
        ...o,
        valueIds: has
          ? o.valueIds.filter((v) => v !== valueId)
          : [...o.valueIds, valueId],
      };
    });
    onSelectedOptionsChange(newOpts);
    regenerateRows(newOpts);
  };

  const handleAddNewValue = async (optionTypeId: string) => {
    const text = (newValueInputs[optionTypeId] || "").trim();
    if (!text) return;

    try {
      const result = await createValueMut.mutateAsync({
        optionTypeId,
        data: { valueUz: text, valueRu: text },
      });
      const newValue = (result as any)?.data || result;
      if (newValue?.id) {
        // Auto-select
        const newOpts = selectedOptions.map((o) => {
          if (o.optionTypeId !== optionTypeId) return o;
          return { ...o, valueIds: [...o.valueIds, newValue.id] };
        });
        onSelectedOptionsChange(newOpts);
        regenerateRows(newOpts);
      }
      setNewValueInputs((prev) => ({ ...prev, [optionTypeId]: "" }));
      toast.success(`"${text}" qo'shildi`);
    } catch (err: any) {
      toast.error(err.message || "Xato");
    }
  };

  const updateRow = (idx: number, field: keyof VariantRow, value: any) => {
    const newRows = [...variantRows];
    newRows[idx] = { ...newRows[idx], [field]: value };
    onVariantRowsChange(newRows);
  };

  const setDefaultVariant = (idx: number) => {
    const newRows = variantRows.map((r, i) => ({
      ...r,
      isDefault: i === idx,
    }));
    onVariantRowsChange(newRows);
  };

  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    const newRows = variantRows.map((r) => ({ ...r, price: bulkPrice }));
    onVariantRowsChange(newRows);
    toast.success("Narx qo'llanildi");
  };

  const applyBulkStock = () => {
    if (!bulkStock) return;
    const newRows = variantRows.map((r) => ({ ...r, stock: bulkStock }));
    onVariantRowsChange(newRows);
    toast.success("Ombor soni qo'llanildi");
  };

  const handleVariantImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const fileArray = Array.from(files);
      const result = await uploadApi.uploadImages(fileArray);
      const urls = result.urls || result.files?.map((f: any) => f.url) || [];
      if (urls.length > 0) {
        const newRows = [...variantRows];
        newRows[idx] = {
          ...newRows[idx],
          images: [...(newRows[idx].images || []), ...urls],
        };
        onVariantRowsChange(newRows);
        toast.success(`${urls.length} ta rasm yuklandi`);
      }
    } catch (error: any) {
      toast.error(error.message || "Rasm yuklashda xato");
    } finally {
      e.target.value = "";
    }
  };

  const removeVariantImage = (rowIdx: number, imgIdx: number) => {
    const newRows = [...variantRows];
    newRows[rowIdx] = {
      ...newRows[rowIdx],
      images: newRows[rowIdx].images.filter((_, i) => i !== imgIdx),
    };
    onVariantRowsChange(newRows);
  };

  // Get display label for a variant value
  const getValueLabel = (optionTypeId: string, optionValueId: string): string => {
    const type = allOptionTypes.find((t) => t.id === optionTypeId);
    const val = type?.values?.find((v) => v.id === optionValueId);
    return val?.valueUz || "—";
  };

  const getValueObj = (optionTypeId: string, optionValueId: string): OptionValue | undefined => {
    const type = allOptionTypes.find((t) => t.id === optionTypeId);
    return type?.values?.find((v) => v.id === optionValueId);
  };

  const getTypeObj = (optionTypeId: string): OptionType | undefined => {
    return allOptionTypes.find((t) => t.id === optionTypeId);
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Variantlar
        </CardTitle>
        <CardDescription>
          Rang, xotira, o&apos;lcham kabi turli xil variantlar qo&apos;shing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Variantli mahsulot</Label>
            <p className="text-xs text-muted-foreground">
              Mahsulotning turli xil variantlari bormi?
            </p>
          </div>
          <Switch checked={hasVariants} onCheckedChange={onHasVariantsChange} />
        </div>

        {hasVariants && (
          <>
            {/* ============================================ */}
            {/* Attribute Cards */}
            {/* ============================================ */}
            <div className="space-y-3">
              {selectedOptions.map((selOpt) => {
                const type = getTypeObj(selOpt.optionTypeId);
                if (!type) return null;

                return (
                  <div
                    key={selOpt.optionTypeId}
                    className="border rounded-lg p-3 space-y-2 bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {type.displayType === "color" && (
                          <Palette className="h-4 w-4 text-primary" />
                        )}
                        <span className="font-medium text-sm">{type.nameUz}</span>
                        {type.unit && (
                          <span className="text-xs text-muted-foreground">({type.unit})</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOptionType(selOpt.optionTypeId)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Value chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {type.values.map((val) => {
                        const isSelected = selOpt.valueIds.includes(val.id);
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => toggleValue(selOpt.optionTypeId, val.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-muted hover:border-primary/50"
                            }`}
                          >
                            {type.displayType === "color" && val.hexCode && (
                              <span
                                className="inline-block w-3 h-3 rounded-full border border-black/10"
                                style={{ backgroundColor: val.hexCode }}
                              />
                            )}
                            {val.valueUz}
                          </button>
                        );
                      })}

                      {/* Inline "yangi qiymat qo'shish" */}
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder="Yangi..."
                          value={newValueInputs[selOpt.optionTypeId] || ""}
                          onChange={(e) =>
                            setNewValueInputs((prev) => ({
                              ...prev,
                              [selOpt.optionTypeId]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddNewValue(selOpt.optionTypeId);
                            }
                          }}
                          className="h-7 w-24 text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddNewValue(selOpt.optionTypeId)}
                          disabled={!newValueInputs[selOpt.optionTypeId]?.trim()}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      {selOpt.valueIds.length} ta tanlangan
                    </p>
                  </div>
                );
              })}

              {/* "+ Atribut qo'shish" button */}
              {availableTypes.length > 0 && selectedOptions.length < 4 && (
                <div>
                  {showAddType ? (
                    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                      <Label className="text-xs">Atribut tanlang</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => addOptionType(type.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-muted hover:border-primary/50 text-xs transition-colors"
                          >
                            {type.displayType === "color" && (
                              <Palette className="h-3 w-3" />
                            )}
                            {type.nameUz}
                          </button>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddType(false)}
                        className="text-xs"
                      >
                        Bekor qilish
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddType(true)}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Atribut qo&apos;shish ({selectedOptions.length}/4)
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* ============================================ */}
            {/* Bulk actions */}
            {/* ============================================ */}
            {variantRows.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <span className="text-xs text-muted-foreground font-medium">Hammasiga:</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    placeholder="Narx"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    className="h-7 w-24 text-xs"
                    min={0}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={applyBulkPrice}
                    disabled={!bulkPrice}
                    className="h-7 text-xs"
                  >
                    Narx
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    placeholder="Soni"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    className="h-7 w-20 text-xs"
                    min={0}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={applyBulkStock}
                    disabled={!bulkStock}
                    className="h-7 text-xs"
                  >
                    Ombor
                  </Button>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* Variant Matrix Table */}
            {/* ============================================ */}
            {variantRows.length > 0 && (
              <div className="space-y-2">
                <Label>
                  Variantlar jadvali ({variantRows.length} ta)
                </Label>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium w-8"></th>
                        {activeOptionTypes.map((type) => (
                          <th
                            key={type.id}
                            className="text-left px-3 py-2 font-medium whitespace-nowrap"
                          >
                            {type.nameUz}
                          </th>
                        ))}
                        <th className="text-left px-3 py-2 font-medium">Narx *</th>
                        <th className="text-left px-3 py-2 font-medium">Eski narx</th>
                        <th className="text-left px-3 py-2 font-medium">Ombor</th>
                        <th className="text-left px-3 py-2 font-medium">SKU</th>
                        <th className="text-left px-3 py-2 font-medium">Rasm</th>
                        <th className="text-left px-3 py-2 font-medium w-10">Holat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b last:border-0 ${
                            row.isDefault ? "bg-primary/5" : ""
                          } ${!row.isActive ? "opacity-50" : ""}`}
                        >
                          {/* Default star */}
                          <td className="px-2 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => setDefaultVariant(idx)}
                              title={row.isDefault ? "Asosiy variant" : "Asosiy qilish"}
                              className={`${
                                row.isDefault
                                  ? "text-amber-500"
                                  : "text-muted-foreground/30 hover:text-amber-300"
                              }`}
                            >
                              <Star
                                className="h-4 w-4"
                                fill={row.isDefault ? "currentColor" : "none"}
                              />
                            </button>
                          </td>

                          {/* Value columns */}
                          {activeOptionTypes.map((type) => {
                            const valEntry = row.values.find(
                              (v) => v.optionTypeId === type.id
                            );
                            const valObj = valEntry
                              ? getValueObj(type.id, valEntry.optionValueId)
                              : undefined;
                            return (
                              <td key={type.id} className="px-3 py-1.5">
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  {type.displayType === "color" && valObj?.hexCode && (
                                    <span
                                      className="inline-block w-3 h-3 rounded-full border border-black/10"
                                      style={{ backgroundColor: valObj.hexCode }}
                                    />
                                  )}
                                  <span className="text-xs">
                                    {valObj?.valueUz || "—"}
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          {/* Price */}
                          <td className="px-3 py-1">
                            <Input
                              type="number"
                              placeholder={defaultPrice || "0"}
                              value={row.price}
                              onChange={(e) =>
                                updateRow(idx, "price", e.target.value)
                              }
                              className="h-8 w-28 text-xs"
                              min={0}
                            />
                          </td>

                          {/* Compare price */}
                          <td className="px-3 py-1">
                            <Input
                              type="number"
                              placeholder="0"
                              value={row.compareAtPrice}
                              onChange={(e) =>
                                updateRow(idx, "compareAtPrice", e.target.value)
                              }
                              className="h-8 w-24 text-xs"
                              min={0}
                            />
                          </td>

                          {/* Stock */}
                          <td className="px-3 py-1">
                            <Input
                              type="number"
                              placeholder="0"
                              value={row.stock}
                              onChange={(e) =>
                                updateRow(idx, "stock", e.target.value)
                              }
                              className="h-8 w-20 text-xs"
                              min={0}
                            />
                          </td>

                          {/* SKU */}
                          <td className="px-3 py-1">
                            <Input
                              placeholder=""
                              value={row.sku}
                              onChange={(e) =>
                                updateRow(idx, "sku", e.target.value)
                              }
                              className="h-8 w-24 text-xs"
                            />
                          </td>

                          {/* Images */}
                          <td className="px-3 py-1">
                            <div className="flex items-center gap-1">
                              {row.images?.length > 0 && (
                                <div className="flex -space-x-1">
                                  {row.images.slice(0, 2).map((img, imgIdx) => (
                                    <div
                                      key={imgIdx}
                                      className="relative w-7 h-7 rounded border overflow-hidden group"
                                    >
                                      <Image
                                        src={resolveImageUrl(img)}
                                        alt=""
                                        fill
                                        className="object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeVariantImage(idx, imgIdx)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                      >
                                        <X className="h-3 w-3 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                  {row.images.length > 2 && (
                                    <span className="text-[10px] text-muted-foreground ml-1">
                                      +{row.images.length - 2}
                                    </span>
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
                                  onChange={(e) => handleVariantImageUpload(idx, e)}
                                />
                              </label>
                            </div>
                          </td>

                          {/* Active toggle */}
                          <td className="px-2 py-1 text-center">
                            <Switch
                              checked={row.isActive}
                              onCheckedChange={(v) =>
                                updateRow(idx, "isActive", v)
                              }
                              className="scale-75"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⭐ Asosiy variant — mahsulot kartochkasida ko&apos;rinadigan narx va rasm. Bo&apos;sh narx = asosiy narx ishlatiladi.
                </p>
              </div>
            )}

            {variantRows.length === 0 && selectedOptions.length > 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                Yuqoridagi atributlardan qiymatlar tanlang
              </div>
            )}

            {selectedOptions.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                Atribut qo&apos;shish uchun yuqoridagi tugmani bosing
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
