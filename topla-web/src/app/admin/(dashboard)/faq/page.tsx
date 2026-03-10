"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  HelpCircle, Plus, Pencil, Trash2, Search, MessageCircle, FolderOpen, Tag,
} from "lucide-react";
import { StatCard } from "@/components/charts";
import { toast } from "sonner";
import { fetchFaqEntries, createFaqEntry, updateFaqEntry, deleteFaqEntry } from "@/lib/api/admin";
import { useTranslation } from '@/store/locale-store';

export default function FaqPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["faq-entries"],
    queryFn: async () => {
      const data = await fetchFaqEntries();
      return Array.isArray(data) ? data : [];
    },
  });

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  // Form
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("");

  function resetForm() {
    setQuestion(""); setAnswer(""); setKeywords(""); setCategory("");
  }

  const createMutation = useMutation({
    mutationFn: (payload: { question: string; answer: string; keywords: string[]; category?: string }) =>
      createFaqEntry(payload),
    onSuccess: () => {
      toast.success(t('faqAdded'));
      setShowCreate(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["faq-entries"] });
    },
    onError: (e: any) => { toast.error(e.message); },
  });

  function handleCreate() {
    if (!question || !answer) {
      toast.error(t('questionAndAnswerRequired'));
      return;
    }
    createMutation.mutate({
      question,
      answer,
      keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
      category: category || undefined,
    });
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateFaqEntry(id, payload),
    onSuccess: () => {
      toast.success(t('faqUpdated'));
      setEditEntry(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["faq-entries"] });
    },
    onError: (e: any) => { toast.error(e.message); },
  });

  function handleUpdate() {
    if (!editEntry || !question || !answer) return;
    updateMutation.mutate({
      id: editEntry.id,
      payload: {
        question,
        answer,
        keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
        category: category || undefined,
      },
    });
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFaqEntry(id),
    onSuccess: () => {
      toast.success(t('faqDeleted'));
      queryClient.invalidateQueries({ queryKey: ["faq-entries"] });
    },
    onError: (e: any) => { toast.error(e.message); },
  });

  function handleDelete(id: string) {
    if (!confirm(t('confirmDeleteFaq'))) return;
    deleteMutation.mutate(id);
  }

  function openEdit(entry: any) {
    setEditEntry(entry);
    setQuestion(entry.question);
    setAnswer(entry.answer);
    setKeywords((entry.keywords || []).join(", "));
    setCategory(entry.category || "");
  }

  const filtered = entries.filter(e =>
    !search ||
    e.question?.toLowerCase().includes(search.toLowerCase()) ||
    e.answer?.toLowerCase().includes(search.toLowerCase()) ||
    (e.keywords || []).some((k: string) => k.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by category
  const grouped: Record<string, any[]> = {};
  filtered.forEach(e => {
    const cat = e.category || t('general');
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(e);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-primary" />
            {t('faqManagement')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('chatBotQA')}
          </p>
        </div>

        <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> {t('addFaq')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('newFaq')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('questionLabel')}</Label>
              </div>
              <div>
                <Label>{t('answerLabel')}</Label>
                <Textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4} />
              </div>
              <div>
                <Label>{t('keywordsWithComma')}</Label>
              </div>
              <div>
                <Label>{t('categoryLabel')}</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> {t('save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(v) => { if (!v) { setEditEntry(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('editFaq')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('questionLabel')}</Label>
              <Input value={question} onChange={e => setQuestion(e.target.value)} />
            </div>
            <div>
              <Label>{t('answerLabel')}</Label>
              <Textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4} />
            </div>
            <div>
              <Label>{t('keywordsWithComma')}</Label>
            </div>
            <div>
              <Label>{t('categoryLabel')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate}><Pencil className="w-4 h-4 mr-2" /> {t('update')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('searchFaqPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={HelpCircle} label={t('totalFaq')} value={entries.length} color="primary" />
        <StatCard icon={FolderOpen} label={t('categories')} value={Object.keys(grouped).length} color="info" />
        <StatCard icon={Tag} label={t('keywordsLabel')} value={entries.reduce((s, e) => s + (e.keywords?.length || 0), 0)} color="purple" />
        <StatCard icon={Search} label={t('found')} value={filtered.length} color="success" />
      </div>

      {/* FAQ List */}
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{t('loading')}</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search ? t('noItems') : t('noFaqEntries')}
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="outline">{cat}</Badge>
              <span className="text-sm text-muted-foreground font-normal">({items.length})</span>
            </h2>
            {items.map((entry: any) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base">{entry.question}</h3>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{entry.answer}</p>
                      {entry.keywords && entry.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.keywords.map((kw: string) => (
                            <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(entry)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
