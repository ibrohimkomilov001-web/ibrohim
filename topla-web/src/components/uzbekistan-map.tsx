'use client'

import { useState } from 'react'

type RegionDataItem = { region: string; count: number; revenue: number }

interface UzbekistanMapProps {
  data: RegionDataItem[]
  labels: Record<string, string>
  formatRevenue: (n: number) => string
}

// Simplified SVG paths for Uzbekistan regions (approximate boundaries)
const regionPaths: Record<string, { d: string; cx: number; cy: number }> = {
  karakalpakstan: {
    d: 'M40,20 L120,15 L140,40 L155,80 L140,120 L120,150 L80,160 L50,150 L30,120 L25,80 L30,50 Z',
    cx: 85, cy: 85,
  },
  khorezm: {
    d: 'M140,120 L170,110 L185,125 L180,150 L160,155 L140,145 Z',
    cx: 160, cy: 133,
  },
  bukhara: {
    d: 'M120,150 L160,155 L185,160 L210,180 L220,220 L200,260 L170,270 L140,255 L110,230 L100,200 L105,170 Z',
    cx: 160, cy: 210,
  },
  navoiy: {
    d: 'M140,40 L200,35 L250,50 L280,80 L285,120 L270,150 L240,160 L210,180 L185,160 L170,110 L155,80 Z',
    cx: 220, cy: 110,
  },
  samarkand: {
    d: 'M240,160 L270,150 L300,165 L310,190 L300,215 L270,225 L240,215 L220,220 L210,180 Z',
    cx: 265, cy: 190,
  },
  qashqadaryo: {
    d: 'M220,220 L240,215 L270,225 L290,250 L280,280 L250,290 L220,280 L200,260 Z',
    cx: 250, cy: 255,
  },
  surxondaryo: {
    d: 'M280,280 L310,275 L330,300 L325,335 L300,345 L275,330 L270,300 Z',
    cx: 300, cy: 310,
  },
  jizzax: {
    d: 'M300,165 L330,150 L360,155 L370,175 L355,195 L330,200 L310,190 Z',
    cx: 335, cy: 175,
  },
  sirdaryo: {
    d: 'M355,130 L380,120 L400,130 L405,150 L390,160 L370,155 L360,155 L355,140 Z',
    cx: 380, cy: 142,
  },
  tashkent: {
    d: 'M330,80 L360,70 L390,75 L400,95 L405,120 L400,130 L380,120 L355,130 L340,120 L330,100 Z',
    cx: 365, cy: 100,
  },
  tashkent_city: {
    d: 'M365,95 L380,90 L388,100 L385,112 L372,115 L362,108 Z',
    cx: 375, cy: 103,
  },
  namangan: {
    d: 'M400,95 L430,80 L460,85 L470,105 L455,120 L430,125 L410,115 L405,100 Z',
    cx: 435, cy: 102,
  },
  fergana: {
    d: 'M410,115 L430,125 L455,120 L470,135 L465,160 L440,170 L415,165 L400,150 L400,130 Z',
    cx: 435, cy: 143,
  },
  andijon: {
    d: 'M455,120 L480,115 L500,130 L495,155 L475,165 L465,160 L470,135 Z',
    cx: 480, cy: 140,
  },
}

function getColor(value: number, max: number): string {
  if (max === 0) return '#e2e8f0'
  const intensity = Math.min(value / max, 1)
  // From light blue to deep blue
  const r = Math.round(219 - intensity * 180)
  const g = Math.round(234 - intensity * 170)
  const b = Math.round(254 - intensity * 30)
  return `rgb(${r},${g},${b})`
}

export default function UzbekistanMap({ data, labels, formatRevenue }: UzbekistanMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const dataMap = new Map(data.map(d => [d.region, d]))
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  const handleMouseMove = (e: React.MouseEvent, region: string) => {
    const rect = e.currentTarget.closest('svg')?.getBoundingClientRect()
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 })
    }
    setHovered(region)
  }

  return (
    <div className="relative">
      <svg viewBox="10 5 510 360" className="w-full h-auto" style={{ maxHeight: 400 }}>
        {/* Background */}
        <rect x="10" y="5" width="510" height="360" fill="transparent" />
        
        {Object.entries(regionPaths).map(([region, { d, cx, cy }]) => {
          const regionData = dataMap.get(region)
          const revenue = regionData?.revenue || 0
          const fillColor = getColor(revenue, maxRevenue)
          const isHovered = hovered === region

          return (
            <g key={region}>
              <path
                d={d}
                fill={fillColor}
                stroke={isHovered ? '#1e40af' : '#94a3b8'}
                strokeWidth={isHovered ? 2.5 : 1}
                className="transition-all duration-200 cursor-pointer"
                onMouseMove={(e) => handleMouseMove(e, region)}
                onMouseLeave={() => setHovered(null)}
                style={{ filter: isHovered ? 'brightness(0.9)' : 'none' }}
              />
              {/* Region label for larger regions */}
              {['karakalpakstan', 'navoiy', 'bukhara', 'samarkand', 'qashqadaryo', 'tashkent'].includes(region) && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="9"
                  fontWeight="500"
                  pointerEvents="none"
                  className="select-none"
                >
                  {(labels[region] || region).slice(0, 10)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-3 py-2 border text-sm"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold text-foreground">{labels[hovered] || hovered}</div>
          <div className="text-muted-foreground">
            Buyurtmalar: <span className="font-medium text-foreground">{dataMap.get(hovered)?.count || 0}</span>
          </div>
          <div className="text-muted-foreground">
            Daromad: <span className="font-medium text-foreground">{formatRevenue(dataMap.get(hovered)?.revenue || 0)} so&apos;m</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>Kam</span>
        <div className="flex h-3">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
            <div key={v} className="w-6 h-full" style={{ backgroundColor: getColor(v * maxRevenue, maxRevenue) }} />
          ))}
        </div>
        <span>Ko&apos;p</span>
      </div>
    </div>
  )
}
