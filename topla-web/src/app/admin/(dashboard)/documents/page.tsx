'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileCheck, FileX, Clock, Eye, Check, X, ExternalLink, Search, FileText, CheckCircle, XCircle } from "lucide-react"
import { StatCard } from "@/components/charts"
import { getDocuments, getDocumentStats, approveDocument, rejectDocument, type Document } from './actions'
import { useTranslation } from '@/store/locale-store'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const statusLabels: Record<string, string> = {
  pending: 'Kutilmoqda',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
}

const typeLabels: Record<string, string> = {
  passport: 'Pasport',
  inn: 'INN',
  license: 'Litsenziya',
  certificate: 'Sertifikat',
  other: 'Boshqa',
}

export default function DocumentsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['admin-documents', activeTab],
    queryFn: () => getDocuments(activeTab === 'all' ? undefined : activeTab),
  })

  const { data: stats = { total: 0, pending: 0, approved: 0, rejected: 0 } } = useQuery({
    queryKey: ['admin-document-stats'],
    queryFn: () => getDocumentStats(),
  })

  const approveMutation = useMutation({
    mutationFn: (docId: string) => approveDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      queryClient.invalidateQueries({ queryKey: ['admin-document-stats'] })
    },
    onError: (err: any) => {
      alert(err.message || 'Xatolik yuz berdi')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ docId, reason }: { docId: string; reason: string }) => rejectDocument(docId, reason),
    onSuccess: () => {
      setRejectDialogOpen(false)
      setRejectReason('')
      setSelectedDoc(null)
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      queryClient.invalidateQueries({ queryKey: ['admin-document-stats'] })
    },
    onError: (err: any) => {
      alert(err.message || 'Xatolik yuz berdi')
    },
  })

  const handleApprove = (doc: Document) => {
    approveMutation.mutate(doc.id)
  }

  const handleReject = () => {
    if (!selectedDoc || !rejectReason) return
    rejectMutation.mutate({ docId: selectedDoc.id, reason: rejectReason })
  }

  const filteredDocs = documents.filter(d =>
    !searchQuery || d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{t('vendorDocuments')}</h1>
        <p className="text-muted-foreground text-sm">{t('reviewAndApproveDocuments')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={FileText} label={t('total')} value={stats.total} color="primary" />
        <StatCard icon={Clock} label={t('pending')} value={stats.pending} color="warning" />
        <StatCard icon={CheckCircle} label={t('approved')} value={stats.approved} color="success" />
        <StatCard icon={XCircle} label={t('rejected')} value={stats.rejected} color="destructive" />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              {t('pending')} {stats.pending > 0 && <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs sm:text-sm">{t('approved')}</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm">{t('rejected')}</TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm">{t('all')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholderGeneric')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Documents List */}
      {docsLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileCheck className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">{t('documentsNotFound')}</p>
            <p className="text-sm">{t('noDocumentsInSection')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
                {/* Icon */}
                <div className={`p-3 rounded-lg ${doc.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950' : doc.status === 'approved' ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                  {doc.status === 'pending' ? <Clock className="h-6 w-6 text-yellow-600" /> :
                   doc.status === 'approved' ? <FileCheck className="h-6 w-6 text-green-600" /> :
                   <FileX className="h-6 w-6 text-red-600" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{doc.name}</h3>
                    <Badge variant="outline" className="text-xs">{typeLabels[doc.type] || doc.type}</Badge>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[doc.status]}`}>
                      {statusLabels[doc.status]}
                    </span>
                  </div>
                  {doc.shop && (
                    <p className="text-sm text-muted-foreground mt-0.5">Do'kon: {doc.shop.name}</p>
                  )}
                  {doc.rejectedReason && (
                    <p className="text-sm text-red-600 mt-1">Sabab: {doc.rejectedReason}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('uz-UZ') : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {doc.fileUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewUrl(doc.fileUrl)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('view')}
                    </Button>
                  )}
                  {doc.status === 'pending' && (
                    <>
                      <Button size="sm" variant="default" onClick={() => handleApprove(doc)}>
                        <Check className="h-4 w-4 mr-1" />
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { setSelectedDoc(doc); setRejectDialogOpen(true) }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('reject')}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectDocument')}</DialogTitle>
            <DialogDescription>{t('selectRejectReason')}</DialogDescription>
          </DialogHeader>
          <Select value={rejectReason} onValueChange={setRejectReason}>
            <SelectTrigger>
              <SelectValue placeholder="Sabab tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hujjat noto'g'ri">Hujjat noto'g'ri</SelectItem>
              <SelectItem value="Sifati past, o'qib bo'lmaydi">Sifati past</SelectItem>
              <SelectItem value="Muddati o'tgan">Muddati o'tgan</SelectItem>
              <SelectItem value="Boshqa hujjat kerak">Boshqa hujjat kerak</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Yoki boshqa sabab yozing..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>{t('reject')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('viewDocument')}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="space-y-3">
              {previewUrl.endsWith('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-[500px] rounded border" />
              ) : (
                <img src={previewUrl} alt="Document" className="w-full max-h-[500px] object-contain rounded" />
              )}
              <div className="flex justify-end">
                <Button variant="outline" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" /> {t('openInNewWindow')}
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
