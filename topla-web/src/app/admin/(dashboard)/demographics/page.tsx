"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, MapPin, Calendar, TrendingUp } from "lucide-react";
import { fetchUserDemographics } from "@/lib/api/admin";

interface DemographicsData {
  gender: { gender: string; count: number }[];
  regions: { region: string; count: number }[];
  ageGroups: { range: string; count: number }[];
  monthlyGrowth: { month: string; count: number }[];
}

const GENDER_LABELS: Record<string, string> = {
  male: "Erkak",
  female: "Ayol",
  unspecified: "Noma'lum",
};

const GENDER_COLORS: Record<string, string> = {
  male: "#3B82F6",
  female: "#EC4899",
  unspecified: "#9CA3AF",
};

function DonutChart({ data, colors }: { data: { label: string; count: number; color: string }[]; colors?: Record<string, string> }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>;

  let cumulative = 0;
  const size = 120;
  const r = 45;
  const cx = size / 2;
  const cy = size / 2;

  const slices = data.map((d) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += d.count;
    const endAngle = (cumulative / total) * 360;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return { ...d, path: `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z` };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="text-xs" fontSize="10" fontWeight="bold" fill="#374151">
          {total.toLocaleString()}
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-semibold ml-auto pl-4">{d.count.toLocaleString()}</span>
            <span className="text-muted-foreground text-xs">({total ? Math.round((d.count / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function BarChart({ data, color = "#3B82F6" }: { data: { label: string; count: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{d.label}</span>
          <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${(d.count / max) * 100}%`, background: color }}
            />
          </div>
          <span className="text-xs font-semibold w-10 text-right">{d.count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function MonthlyChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[9px] text-muted-foreground font-medium">{d.count}</span>
          <div
            className="w-full rounded-t bg-primary/70 transition-all"
            style={{ height: `${(d.count / max) * 80}px`, minHeight: d.count > 0 ? "2px" : "0" }}
          />
          <span className="text-[9px] text-muted-foreground rotate-45 origin-top-left mt-1 whitespace-nowrap">
            {d.month.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DemographicsPage() {
  const { data, isLoading, error } = useQuery<DemographicsData>({
    queryKey: ["admin-demographics"],
    queryFn: async () => {
      const res = await fetchUserDemographics();
      return res;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive text-sm">Ma'lumot yuklanmadi</p>
      </div>
    );
  }

  const genderChartData = data.gender.map((g) => ({
    label: GENDER_LABELS[g.gender] ?? g.gender,
    count: g.count,
    color: GENDER_COLORS[g.gender] ?? "#9CA3AF",
  }));

  const ageChartData = data.ageGroups.map((a) => ({
    label: a.range,
    count: a.count,
  }));

  const regionChartData = data.regions.slice(0, 14).map((r) => ({
    label: r.region,
    count: r.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demografiya</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Foydalanuvchilar haqida statistik ma'lumotlar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Jins bo'yicha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={genderChartData} />
          </CardContent>
        </Card>

        {/* Age Groups */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Yosh guruhlari
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.ageGroups.every(a => a.count === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">Tug'ilgan sana ma'lumotlari hali to'ldirilmagan</p>
            ) : (
              <BarChart data={ageChartData} color="#8B5CF6" />
            )}
          </CardContent>
        </Card>

        {/* Regions */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Viloyatlar bo'yicha
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.regions.every(r => !r.region || r.region === "Noma'lum") ? (
              <p className="text-sm text-muted-foreground text-center py-8">Viloyat ma'lumotlari hali to'ldirilmagan</p>
            ) : (
              <BarChart data={regionChartData} color="#10B981" />
            )}
          </CardContent>
        </Card>

        {/* Monthly Growth */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Oylik o'sish (so'nggi 12 oy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={data.monthlyGrowth} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
