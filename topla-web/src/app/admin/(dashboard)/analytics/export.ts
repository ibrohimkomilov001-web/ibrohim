import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
  formatCurrency, formatNumber, regionLabels, statusLabels, paymentLabels,
  type RevenueData, type OrdersData, type UsersData, type CategorySales, type RegionData,
} from './actions'

export async function exportAnalyticsPDF(
  period: string,
  revenue: RevenueData | null,
  orders: OrdersData | null,
  users: UsersData | null,
  categories: CategorySales[],
  regions: RegionData[],
) {
  const doc = new jsPDF()
  const now = new Date().toLocaleDateString('uz-UZ')
  let y = 15

  // Title
  doc.setFontSize(18)
  doc.text('TOPLA Analitika Hisoboti', 14, y)
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Davr: ${period} | Sana: ${now}`, 14, y)
  doc.setTextColor(0)
  y += 12

  // KPI Summary
  doc.setFontSize(14)
  doc.text('Umumiy ko\'rsatkichlar', 14, y)
  y += 8

  autoTable(doc, {
    startY: y,
    head: [['Ko\'rsatkich', 'Qiymat']],
    body: [
      ['Jami daromad', `${formatCurrency(revenue?.summary.totalRevenue || 0)} so'm`],
      ['Buyurtmalar soni', formatNumber(revenue?.summary.totalOrders || 0)],
      ['O\'sish', `${revenue?.summary.growthPercent || 0}%`],
      ['O\'rtacha buyurtma', `${formatCurrency(revenue?.summary.avgOrderValue || 0)} so'm`],
      ['Yangi foydalanuvchilar', formatNumber(users?.summary.totalNew || 0)],
      ['Foydalanuvchilar o\'sishi', `${users?.summary.growthPercent || 0}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 12 || y + 50

  // Categories
  if (categories.length > 0) {
    doc.setFontSize(14)
    doc.text('Kategoriyalar bo\'yicha sotuvlar', 14, y)
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['Kategoriya', 'Buyurtmalar', 'Daromad']],
      body: categories.map(c => [c.name, formatNumber(c.count), `${formatCurrency(c.revenue)} so'm`]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 12 || y + 50
  }

  // Status breakdown
  if (orders?.statusBreakdown.length) {
    if (y > 230) { doc.addPage(); y = 15 }
    doc.setFontSize(14)
    doc.text('Buyurtma statuslari', 14, y)
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['Status', 'Soni']],
      body: orders.statusBreakdown.map(s => [statusLabels[s.status] || s.status, formatNumber(s.count)]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 12 || y + 50
  }

  // Payment methods
  if (orders?.paymentBreakdown.length) {
    if (y > 230) { doc.addPage(); y = 15 }
    doc.setFontSize(14)
    doc.text('To\'lov usullari', 14, y)
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['Usul', 'Summa']],
      body: orders.paymentBreakdown.map(p => [paymentLabels[p.method] || p.method, `${formatCurrency(p.total)} so'm`]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 12 || y + 50
  }

  // Regions
  if (regions.length > 0) {
    if (y > 200) { doc.addPage(); y = 15 }
    doc.setFontSize(14)
    doc.text('Hududlar bo\'yicha statistika', 14, y)
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['#', 'Hudud', 'Buyurtmalar', 'Daromad']],
      body: regions.map((r, i) => [
        String(i + 1),
        regionLabels[r.region] || r.region,
        formatNumber(r.count),
        `${formatCurrency(r.revenue)} so'm`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    })
  }

  doc.save(`TOPLA_Analitika_${period}_${now.replace(/\//g, '-')}.pdf`)
}

export async function exportAnalyticsExcel(
  period: string,
  revenue: RevenueData | null,
  orders: OrdersData | null,
  users: UsersData | null,
  categories: CategorySales[],
  regions: RegionData[],
) {
  const wb = XLSX.utils.book_new()
  const now = new Date().toLocaleDateString('uz-UZ')

  // Sheet 1 - Summary
  const summaryData = [
    ['TOPLA Analitika Hisoboti'],
    [`Davr: ${period}`, `Sana: ${now}`],
    [],
    ['Ko\'rsatkich', 'Qiymat'],
    ['Jami daromad', revenue?.summary.totalRevenue || 0],
    ['Buyurtmalar soni', revenue?.summary.totalOrders || 0],
    ['O\'sish (%)', revenue?.summary.growthPercent || 0],
    ['O\'rtacha buyurtma', revenue?.summary.avgOrderValue || 0],
    ['Yangi foydalanuvchilar', users?.summary.totalNew || 0],
    ['Foydalanuvchilar o\'sishi (%)', users?.summary.growthPercent || 0],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, ws1, 'Umumiy')

  // Sheet 2 - Revenue time series
  if (revenue?.current.length) {
    const revenueRows = [['Sana', 'Daromad', 'Buyurtmalar soni']]
    for (const r of revenue.current) {
      revenueRows.push([r.date, String(r.revenue || 0), String(r.count || 0)])
    }
    const ws2 = XLSX.utils.aoa_to_sheet(revenueRows)
    XLSX.utils.book_append_sheet(wb, ws2, 'Daromad')
  }

  // Sheet 3 - Orders
  if (orders?.timeSeries.length) {
    const orderRows = [['Sana', 'Buyurtmalar']]
    for (const o of orders.timeSeries) {
      orderRows.push([o.date, String(o.count || 0)])
    }
    const ws3 = XLSX.utils.aoa_to_sheet(orderRows)
    XLSX.utils.book_append_sheet(wb, ws3, 'Buyurtmalar')
  }

  // Sheet 4 - Categories
  if (categories.length > 0) {
    const catRows: (string | number)[][] = [['Kategoriya', 'Buyurtmalar', 'Daromad']]
    for (const c of categories) {
      catRows.push([c.name, c.count, c.revenue])
    }
    const ws4 = XLSX.utils.aoa_to_sheet(catRows)
    XLSX.utils.book_append_sheet(wb, ws4, 'Kategoriyalar')
  }

  // Sheet 5 - Regions
  if (regions.length > 0) {
    const regRows: (string | number)[][] = [['Hudud', 'Buyurtmalar', 'Daromad']]
    for (const r of regions) {
      regRows.push([regionLabels[r.region] || r.region, r.count, r.revenue])
    }
    const ws5 = XLSX.utils.aoa_to_sheet(regRows)
    XLSX.utils.book_append_sheet(wb, ws5, 'Hududlar')
  }

  // Sheet 6 - Status breakdown
  if (orders?.statusBreakdown.length) {
    const statRows: (string | number)[][] = [['Status', 'Soni']]
    for (const s of orders.statusBreakdown) {
      statRows.push([statusLabels[s.status] || s.status, s.count])
    }
    const ws6 = XLSX.utils.aoa_to_sheet(statRows)
    XLSX.utils.book_append_sheet(wb, ws6, 'Statuslar')
  }

  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `TOPLA_Analitika_${period}_${now.replace(/\//g, '-')}.xlsx`)
}
