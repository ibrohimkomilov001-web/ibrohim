"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatDateLong } from "@/lib/utils";
import { uploadApi } from "@/lib/api/upload";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Loader2,
  Shield,
  File,
} from "lucide-react";

const documentTypes = [
  {
    type: "passport",
    title: "Pasport nusxasi",
    description: "Shaxsni tasdiqlash uchun pasportning birinchi sahifasi",
    icon: FileText,
  },
  {
    type: "inn",
    title: "INN guvohnomasi",
    description: "Soliq to'lovchi identifikatsiya raqami",
    icon: File,
  },
  {
    type: "license",
    title: "Litsenziya / Guvohnoma",
    description: "Tadbirkorlik faoliyati uchun guvohnoma",
    icon: Shield,
  },
  {
    type: "certificate",
    title: "Sertifikat",
    description: "Mahsulot sifat sertifikati (ixtiyoriy)",
    icon: CheckCircle,
  },
];

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["vendor-documents"],
    queryFn: vendorApi.getDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ type, file }: { type: string; file: File }) => {
      const uploadResult = await uploadApi.uploadImage(file);
      const formData = new FormData();
      formData.append("type", type);
      formData.append("fileUrl", uploadResult.url);
      formData.append("fileName", file.name);
      return vendorApi.uploadDocument(formData);
    },
    onSuccess: () => {
      toast.success("Hujjat yuklandi");
      queryClient.invalidateQueries({ queryKey: ["vendor-documents"] });
      setUploadingType(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Yuklashda xatolik");
      setUploadingType(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApi.deleteDocument(id),
    onSuccess: () => {
      toast.success("Hujjat o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["vendor-documents"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "O'chirishda xatolik");
    },
  });

  const handleUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingType(type);
    uploadMutation.mutate({ type, file });
  };

  const getDocumentStatus = (type: string) => {
    if (!documents) return null;
    return documents.find((d: any) => d.type === type);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Hujjatlar</h1>
        <p className="text-muted-foreground">
          Verifikatsiya uchun kerakli hujjatlarni yuklang
        </p>
      </div>

      {/* Verification Status */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Verifikatsiya holati</h3>
            <p className="text-sm text-muted-foreground">
              Barcha kerakli hujjatlarni yuklang. Tekshiruv 1-2 ish kunini oladi.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {documentTypes.map((docType) => {
            const doc = getDocumentStatus(docType.type);
            const Icon = docType.icon;
            const isUploading = uploadingType === docType.type;

            return (
              <div key={docType.type}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        doc?.status === "approved"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : doc?.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30"
                          : doc?.status === "rejected"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-muted"
                      }`}>
                        {doc?.status === "approved" ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : doc?.status === "pending" ? (
                          <Clock className="h-6 w-6 text-yellow-600" />
                        ) : doc?.status === "rejected" ? (
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        ) : (
                          <Icon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold">{docType.title}</h3>
                          {doc?.status && (
                            <Badge variant={
                              doc.status === "approved" ? "default" :
                              doc.status === "pending" ? "secondary" :
                              "destructive"
                            }>
                              {doc.status === "approved" ? "Tasdiqlangan" :
                               doc.status === "pending" ? "Tekshirilmoqda" :
                               "Rad etildi"
                              }
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{docType.description}</p>
                        {doc?.createdAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Yuklangan: {formatDateLong(doc.createdAt)}
                          </p>
                        )}
                        {doc?.status === "rejected" && (doc?.note || (doc as any)?.rejectedReason) && (
                          <p className="text-xs text-red-600 mt-1">
                            Sabab: {(doc as any).rejectedReason || doc.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {doc?.status === "rejected" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              deleteMutation.mutate(doc.id);
                            }}
                          >
                            O'chirish
                          </Button>
                        )}
                        <label>
                          <Button
                            variant={doc ? "outline" : "default"}
                            className="rounded-full"
                            disabled={isUploading}
                            asChild
                          >
                            <span>
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Yuklanmoqda
                                </>
                              ) : doc ? (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Qayta yuklash
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Yuklash
                                </>
                              )}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleUpload(docType.type, e)}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Qabul qilinadigan formatlar: JPG, PNG, PDF</p>
              <p>Maksimal hajm: 10 MB</p>
              <p>Hujjatlar xavfsiz saqlanadi va faqat tekshiruv uchun ishlatiladi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
