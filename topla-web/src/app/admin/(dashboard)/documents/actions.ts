import { fetchDocuments, fetchDocumentStats, reviewDocument as apiReviewDocument } from "@/lib/api/admin";

export type Document = {
  id: string;
  shop?: { id: string; name: string };
  type: string;
  name: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectedReason?: string;
  createdAt: string;
  [key: string]: any;
};

export async function getDocuments(status?: string): Promise<Document[]> {
  try {
    const data = await fetchDocuments({ status });
    const items = data.items || data.documents || data || [];
    return items.map((d: any) => ({
      id: d.id,
      shop: d.shop ? { id: d.shop.id, name: d.shop.name } : undefined,
      type: d.type,
      name: d.name || d.fileName,
      fileUrl: d.fileUrl,
      status: d.status,
      rejectedReason: d.rejectedReason,
      createdAt: d.createdAt || d.created_at,
    }));
  } catch {
    return [];
  }
}

export async function getDocumentStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
  try {
    const data = await fetchDocumentStats();
    return {
      total: data.total || 0,
      pending: data.pending || 0,
      approved: data.approved || 0,
      rejected: data.rejected || 0,
    };
  } catch {
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
}

export async function approveDocument(id: string): Promise<void> {
  await apiReviewDocument(id, { status: 'approved' });
}

export async function rejectDocument(id: string, reason: string): Promise<void> {
  await apiReviewDocument(id, { status: 'rejected', rejectedReason: reason });
}
