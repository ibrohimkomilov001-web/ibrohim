"use client";

import { useState, useEffect } from "react";
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
  HelpCircle, Plus, Pencil, Trash2, Search, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchFaqEntries, createFaqEntry, updateFaqEntry, deleteFaqEntry } from "@/lib/api/admin";

export default function FaqPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  // Form
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    try {
      setLoading(true);
      const data = await fetchFaqEntries();
      setEntries(Array.isArray(data) ? data : []);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  function resetForm() {
    setQuestion(""); setAnswer(""); setKeywords(""); setCategory("");
  }

  async function handleCreate() {
    if (!question || !answer) {
      toast.error("Savol va javob majburiy");
      return;
    }
    try {
      await createFaqEntry({
        question,
        answer,
        keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
        category: category || undefined,
      });
      toast.success("FAQ yozuvi qo'shildi");
      setShowCreate(false);
      resetForm();
      loadEntries();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleUpdate() {
    if (!editEntry || !question || !answer) return;
    try {
      await updateFaqEntry(editEntry.id, {
        question,
        answer,
        keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
        category: category || undefined,
      });
      toast.success("FAQ yangilandi");
      setEditEntry(null);
      resetForm();
      loadEntries();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu FAQ yozuvini o'chirishni xohlaysizmi?")) return;
    try {
      await deleteFaqEntry(id);
      toast.success("FAQ o'chirildi");
      loadEntries();
    } catch (e: any) { toast.error(e.message); }
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
    const cat = e.category || "Umumiy";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(e);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-primary" />
            FAQ Boshqaruvi
          </h1>
          <p className="text-muted-foreground mt-1">
            Chat bot uchun savol-javoblar bazasi
          </p>
        </div>

        <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> FAQ Qo&apos;shish</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi FAQ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Savol</Label>
                <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Buyurtmani qanday bekor qilaman?" />
              </div>
              <div>
                <Label>Javob</Label>
                <Textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4} placeholder="Buyurtmani bekor qilish uchun..." />
              </div>
              <div>
                <Label>Kalit so&apos;zlar (vergul bilan)</Label>
                <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="bekor, cancel, buyurtma" />
              </div>
              <div>
                <Label>Kategoriya</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Buyurtma, Yetkazib berish, To'lov..." />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Saqlash</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(v) => { if (!v) { setEditEntry(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>FAQ Tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Savol</Label>
              <Input value={question} onChange={e => setQuestion(e.target.value)} />
            </div>
            <div>
              <Label>Javob</Label>
              <Textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4} />
            </div>
            <div>
              <Label>Kalit so&apos;zlar (vergul bilan)</Label>
              <Input value={keywords} onChange={e => setKeywords(e.target.value)} />
            </div>
            <div>
              <Label>Kategoriya</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate}><Pencil className="w-4 h-4 mr-2" /> Yangilash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Savol, javob yoki kalit so'z bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-muted-foreground">Jami FAQ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{Object.keys(grouped).length}</p>
            <p className="text-xs text-muted-foreground">Kategoriyalar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{entries.reduce((s, e) => s + (e.keywords?.length || 0), 0)}</p>
            <p className="text-xs text-muted-foreground">Kalit so&apos;zlar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs text-muted-foreground">Topildi</p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ List */}
      {loading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Yuklanmoqda...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search ? "Hech narsa topilmadi" : "Hozircha FAQ yozuvlari yo'q"}
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
