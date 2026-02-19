'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ICON_MAP, ICON_BY_VALUE, ICON_GROUPS, DefaultIcon, type IconOption } from '@/lib/iconsax-map'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = ICON_MAP
    if (activeGroup) {
      list = list.filter((i) => i.group === activeGroup)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.value.toLowerCase().includes(q) ||
          i.group.toLowerCase().includes(q)
      )
    }
    return list
  }, [search, activeGroup])

  const selectedOption = value ? ICON_BY_VALUE[value] : null

  return (
    <div className={cn('space-y-3', className)}>
      {/* Current selection */}
      {selectedOption && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
          <selectedOption.Icon size={20} variant="Bold" />
          <span className="text-sm font-medium">{selectedOption.label}</span>
          <code className="text-xs text-muted-foreground ml-auto">{selectedOption.value}</code>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Icon qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Group filter tabs */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={activeGroup === null ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => setActiveGroup(null)}
        >
          Barchasi
        </Badge>
        {ICON_GROUPS.map((group) => (
          <Badge
            key={group}
            variant={activeGroup === group ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => setActiveGroup(activeGroup === group ? null : group)}
          >
            {group}
          </Badge>
        ))}
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-5 gap-1.5 max-h-[240px] overflow-y-auto p-1 rounded-md border bg-background">
        {filtered.length === 0 ? (
          <div className="col-span-5 py-6 text-center text-sm text-muted-foreground">
            Icon topilmadi
          </div>
        ) : (
          filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={`${opt.label} (${opt.value})`}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors text-center',
                'hover:bg-accent hover:text-accent-foreground',
                value === opt.value
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                  : 'bg-muted/30'
              )}
            >
              <opt.Icon size={22} variant={value === opt.value ? 'Bold' : 'Linear'} />
              <span className="text-[10px] leading-tight truncate w-full">
                {opt.label}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

/** Inline icon renderer — shows proper Iconsax icon for a DB value */
export function CategoryIcon({
  iconName,
  size = 20,
  className,
}: {
  iconName?: string | null
  size?: number
  className?: string
}) {
  const opt = iconName ? ICON_BY_VALUE[iconName] : null
  if (opt) {
    return <span className={className}><opt.Icon size={size} variant="Bold" /></span>
  }
  return <span className={className}><DefaultIcon size={size} /></span>
}
