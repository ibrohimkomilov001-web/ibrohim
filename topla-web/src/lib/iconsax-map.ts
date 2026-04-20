// Iconsax icon mapping — 1:1 with Flutter home_screen.dart _getCategoryIcon()
// Only includes icons that are actually rendered in the Flutter app

import {
  Mobile,
  Cpu,
  MonitorMobbile,
  Monitor,
  Screenmirroring,
  Headphone,
  Watch,
  Man,
  Ruler,
  Clock,
  Woman,
  Diamonds,
  Bag2,
  Crown1,
  Happyemoji,
  Game,
  Blend2,
  LampCharge,
  Coffee,
  Home2,
  Drop,
  MagicStar,
  Brush,
  Health,
  Hospital,
  Weight,
  Activity,
  Cake,
  Cup,
  Milk,
  ShoppingBag,
  Book,
  Colorfilter,
  PenTool,
  Box1,
  Driver,
  Car,
  Pet,
  Book1,
  Gift,
  Tag,
  Lovely,
  Category,
} from 'iconsax-react'
import { type ComponentType } from 'react'

export interface IconOption {
  /** Icon string stored in DB — matches seed.ts and Flutter switch case */
  value: string
  /** Uzbek label */
  label: string
  /** Category group for filtering */
  group: string
  /** React component from iconsax-react */
  Icon: ComponentType<{ size?: number | string; color?: string; variant?: 'Linear' | 'Outline' | 'Bulk' | 'Bold' | 'Broken' | 'TwoTone' }>
}

// ──────────────────────────────────────────────
// All 40 icons Flutter can render (seed + extras)
// ──────────────────────────────────────────────
export const ICON_MAP: IconOption[] = [
  // Elektronika
  { value: 'mobile',           label: 'Mobil telefon',          group: 'Elektronika',       Icon: Mobile },
  { value: 'cpu',              label: 'Protsessor / Planshet',  group: 'Elektronika',       Icon: Cpu },
  { value: 'monitor_mobbile',  label: 'Noutbuk',                group: 'Elektronika',       Icon: MonitorMobbile },
  { value: 'monitor',          label: 'Monitor',                group: 'Elektronika',       Icon: Monitor },
  { value: 'screenmirroring',  label: 'TV / Ekran',             group: 'Elektronika',       Icon: Screenmirroring },
  { value: 'headphone',        label: 'Quloqchin',              group: 'Elektronika',       Icon: Headphone },
  { value: 'watch',            label: 'Smart soat',             group: 'Elektronika',       Icon: Watch },

  // Kiyim & Aksessuarlar
  { value: 'shirt',            label: 'Kiyim',                  group: 'Kiyim',             Icon: ShoppingBag },
  { value: 'man',              label: 'Erkaklar',               group: 'Kiyim',             Icon: Man },
  { value: 'woman',            label: 'Ayollar',                group: 'Kiyim',             Icon: Woman },
  { value: 'bag_2',            label: 'Sumka',                  group: 'Kiyim',             Icon: Bag2 },
  { value: 'crown_1',          label: 'Toj / Premium',          group: 'Kiyim',             Icon: Crown1 },

  // Go'zallik & Parfyumeriya
  { value: 'magic_star',       label: "Go'zallik",              group: "Go'zallik",         Icon: MagicStar },
  { value: 'drop',             label: 'Parfyumeriya',           group: "Go'zallik",         Icon: Drop },
  { value: 'brush_1',          label: 'Gigiena / Cho\'tka',     group: "Go'zallik",         Icon: Brush },

  // Zargarlik
  { value: 'diamonds',         label: 'Zargarlik',              group: 'Zargarlik',         Icon: Diamonds },

  // Salomatlik
  { value: 'health',           label: 'Dorixona / Salomatlik',  group: 'Salomatlik',        Icon: Health },
  { value: 'hospital',         label: 'Kasalxona',              group: 'Salomatlik',        Icon: Hospital },

  // Uy-ro'zg'or
  { value: 'home_2',           label: 'Uy',                     group: 'Uy',                Icon: Home2 },
  { value: 'blend_2',          label: 'Maishiy texnika',        group: 'Uy',                Icon: Blend2 },
  { value: 'lamp_charge',      label: 'Mebel / Chiroq',        group: 'Uy',                Icon: LampCharge },
  { value: 'box_1',            label: 'Uy kimyoviy',            group: 'Uy',                Icon: Box1 },
  { value: 'coffee',           label: 'Qahva / Kofe',          group: 'Uy',                Icon: Coffee },
  { value: 'ruler',            label: "Qurilish / Ta'mirlash",  group: 'Uy',                Icon: Ruler },

  // Bolalar
  { value: 'happyemoji',       label: 'Bolalar',                group: 'Bolalar',           Icon: Happyemoji },
  { value: 'game',             label: "O'yinchoqlar",           group: 'Bolalar',           Icon: Game },

  // Sport
  { value: 'weight_1',         label: 'Sport',                  group: 'Sport',             Icon: Weight },
  { value: 'weight',           label: 'Sport / Dam olish',      group: 'Sport',             Icon: Weight },
  { value: 'activity',         label: 'Aktivlik',               group: 'Sport',             Icon: Activity },

  // Oziq-ovqat
  { value: 'milk',             label: 'Oziq-ovqat',             group: 'Oziq-ovqat',        Icon: Milk },
  { value: 'cake',             label: 'Shirinliklar',           group: 'Oziq-ovqat',        Icon: Cake },
  { value: 'cup',              label: 'Ichimliklar',            group: 'Oziq-ovqat',        Icon: Cup },

  // Transport
  { value: 'car',              label: 'Avtomobil',              group: 'Transport',         Icon: Car },

  // O'yin & Konsol
  { value: 'driver',           label: "O'yin konsol",           group: "O'yin",             Icon: Driver },

  // Kitob & Ta'lim
  { value: 'book',             label: 'Kitoblar',               group: "Ta'lim",            Icon: Book },
  { value: 'book_1',           label: "Darslik / Qo'llanma",   group: "Ta'lim",            Icon: Book1 },
  { value: 'pen_tool',         label: 'Maktab / Ofis',         group: "Ta'lim",            Icon: PenTool },

  // Xobbi
  { value: 'colorfilter',      label: 'Xobbi / Ijod',          group: 'Xobbi',             Icon: Colorfilter },

  // Hayvonlar & Gullar
  { value: 'pet',              label: 'Uy hayvonlari',          group: 'Boshqalar',         Icon: Pet },
  { value: 'lovely',           label: 'Gullar',                 group: 'Boshqalar',         Icon: Lovely },
  { value: 'gift',             label: "Sovg'alar",              group: 'Boshqalar',         Icon: Gift },
  { value: 'tag',              label: 'Teg / Aksiya',           group: 'Boshqalar',         Icon: Tag },
  { value: 'clock',            label: 'Soat',                   group: 'Boshqalar',         Icon: Clock },
]

// Quick lookup: value → IconOption
export const ICON_BY_VALUE: Record<string, IconOption> = Object.fromEntries(
  ICON_MAP.map((opt) => [opt.value, opt])
)

// Unique groups for filter tabs
export const ICON_GROUPS: string[] = ICON_MAP.reduce<string[]>((acc, i) => {
  if (!acc.includes(i.group)) acc.push(i.group)
  return acc
}, [])

// Default/fallback icon
export const DefaultIcon = Category
