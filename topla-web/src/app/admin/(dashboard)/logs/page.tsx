'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, ClipboardList, Trash2, RefreshCw } from 'lucide-react'
import { getActivityLogs, getLogStats, clearOldLogs, type ActivityLog } from './actions'
import { useToast } from '@/components/ui/use-toast'

export default function AdminLogsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<{ total: number; today: number; topActions: { action: string; count: number }[] }>({ 
    total: 0, 
    today: 0, 
    topActions: [] 
  })
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [logsData, statsData] = await Promise.all([
        getActivityLogs(200),
        getLogStats()
      ])
      setLogs(logsData)
      setStats(statsData)
    } catch (error) {
      console.error(error)
      toast({ title: "Xatolik", description: "Ma'lumotlarni yuklashda xatolik", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleClearOld = async () => {
    if (!confirm("30 kundan eski loglarni o'chirishni xohlaysizmi?")) return
    try {
      await clearOldLogs(30)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Eski loglar o'chirildi" })
    } catch (error) {
      toast({ title: "Xatolik", description: "O'chirishda xatolik", variant: "destructive" })
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'bg-green-100 text-green-800'
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-800'
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 text-red-800'
    if (action.includes('login') || action.includes('auth')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Faoliyat jurnali</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Tizim faoliyatini kuzatish</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yangilash
          </Button>
          <Button variant="destructive" onClick={handleClearOld}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eski loglarni tozalash
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Jami</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Bugun</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.today}</div>
          </CardContent>
        </Card>
        {stats.topActions.slice(0, 2).map((item, i) => (
          <Card key={i}>
            <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">{item.action}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{item.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Loglar ro'yxati</CardTitle>
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Loglar topilmadi</p>
              <p className="text-sm text-muted-foreground mt-1">Tizimda hech qanday faoliyat yozilmagan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getActionColor(log.action)} variant="outline">
                        {log.action}
                      </Badge>
                      {log.entity_type && (
                        <span className="text-xs text-muted-foreground">
                          {log.entity_type}
                          {log.entity_id && `: ${log.entity_id.slice(0, 8)}...`}
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {JSON.stringify(log.details).slice(0, 100)}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('uz-UZ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
