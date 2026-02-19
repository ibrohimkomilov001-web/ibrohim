"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Star,
  MessageCircle,
  Search,
  Filter,
  Loader2,
  Send,
  ThumbsUp,
} from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-reviews", { page, limit, rating: ratingFilter }],
    queryFn: () =>
      vendorApi.getReviews({
        page,
        limit,
        rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
      }),
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      vendorApi.replyToReview(reviewId, reply),
    onSuccess: () => {
      toast.success("Javob yuborildi");
      queryClient.invalidateQueries({ queryKey: ["vendor-reviews"] });
      setReplyDialogOpen(false);
      setReplyText("");
      setSelectedReview(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Xatolik yuz berdi");
    },
  });

  const reviews = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const averageRating = data?.averageRating || 0;
  const totalReviews = data?.total || 0;
  const ratingDistribution = data?.ratingDistribution || {};

  const openReplyDialog = (review: any) => {
    setSelectedReview(review);
    setReplyText(review.reply || "");
    setReplyDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Sharhlar</h1>
        <p className="text-muted-foreground">
          Mijozlar fikrlari va baholar
        </p>
      </div>

      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{averageRating.toFixed(1)}</div>
              <StarRating rating={Math.round(averageRating)} />
              <p className="text-sm text-muted-foreground mt-1">{totalReviews} ta sharh</p>
            </div>
            <div className="flex-1 w-full max-w-sm space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[star] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm w-3">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Baho bo'yicha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="5">5 yulduz</SelectItem>
            <SelectItem value="4">4 yulduz</SelectItem>
            <SelectItem value="3">3 yulduz</SelectItem>
            <SelectItem value="2">2 yulduz</SelectItem>
            <SelectItem value="1">1 yulduz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-20 mb-3" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {(review.customerName || "M").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-semibold text-sm">{review.customerName || "Mijoz"}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>

                      {review.productName && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Mahsulot: {review.productName}
                        </p>
                      )}

                      <p className="text-sm mb-3">{review.comment}</p>

                      {/* Reply */}
                      {review.reply ? (
                        <div className="bg-muted/50 rounded-xl p-3 mt-2">
                          <p className="text-xs font-semibold text-primary mb-1">Sizning javobingiz:</p>
                          <p className="text-sm text-muted-foreground">{review.reply}</p>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full mt-1"
                          onClick={() => openReplyDialog(review)}
                        >
                          <MessageCircle className="mr-1 h-3 w-3" />
                          Javob berish
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">
              {ratingFilter !== "all" ? "Bu baho bo'yicha sharhlar yo'q" : "Hali sharhlar yo'q"}
            </h3>
            <p className="text-muted-foreground">
              Mijozlar mahsulotlaringiz haqida sharh qoldirganida bu yerda ko&apos;rinadi
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-full"
          >
            Oldingi
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-full"
          >
            Keyingi
          </Button>
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sharhga javob berish</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{selectedReview.customerName}</span>
                  <StarRating rating={selectedReview.rating} />
                </div>
                <p className="text-sm text-muted-foreground">{selectedReview.comment}</p>
              </div>
              <Textarea
                placeholder="Javobingizni yozing..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplyDialogOpen(false)}
              className="rounded-full"
            >
              Bekor qilish
            </Button>
            <Button
              className="rounded-full"
              onClick={() =>
                selectedReview &&
                replyMutation.mutate({
                  reviewId: selectedReview.id,
                  reply: replyText.trim(),
                })
              }
              disabled={replyMutation.isPending || !replyText.trim()}
            >
              {replyMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Yuborish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
