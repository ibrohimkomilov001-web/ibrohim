'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, ClipboardList, Trash2, RefreshCw } from 'lucide-react'
import { getLogs, clearOldLogs, type ActivityLog } from './actions'
import { toast } from 'sonner'
import { useUrlState } from '@/hooks/use-url-state'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { DataTablePagination, type PaginationMeta } from '@/components/ui/data-table-pagination'
import { useTranslation } from '@/store/locale-store';

export default function AdminLogsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [{ search: searchQuery, page }, setFilters] = useUrlState({ search: '', page: '1' })
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-logs', debouncedSearch, page],
    queryFn: () => getLogs({
      page: parseInt(page) || 1,
      search: debouncedSearch || undefined,
    }),
    staleTime: 10_000,
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false };

  const loadData = () => queryClient.invalidateQueries({ queryKey: ['admin-logs'] });

  const handleClearOld = async () => {
    if (!confirm(t('confirmClearOldLogs'))) return
    try {
      await clearOldLogs(30)
      await loadData()
      toast.success(t('oldLogsCleared'))
    } catch (error) {
      toast.error(t('deleteError'))
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    if (action.includes('login') || action.includes('auth')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('activityLog')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('trackActivity')} ({pagination.total} {t('records')})</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('refresh')}
          </Button>
          <Button variant="destructive" onClick={handleClearOld}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('clearOldLogs')}
          </Button>
        </div>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">{t('logsList')}</CardTitle>
            <Input
              placeholder={t('searchPlaceholderGeneric')}
              value={searchQuery}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="relative">
          {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {logs.length === 0 && !loading ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">{t('logsNotFound')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('noActivityRecorded')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
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
          <DataTablePagination pagination={pagination} onPageChange={(p) => setFilters({ page: String(p) })} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}