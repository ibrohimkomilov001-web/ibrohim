"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import { courierCompanyApi } from "@/lib/api/courier-company";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AcceptCourierCompanyInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const token = params.get("token");

  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setState("error");
      setMessage("Taklif tokeni topilmadi");
      return;
    }
    if (!isAuthenticated) {
      const next = encodeURIComponent(`/courier-company/staff/accept?token=${token}`);
      router.push(`/vendor/login?next=${next}`);
      return;
    }
  }, [authLoading, isAuthenticated, token, router]);

  const handleAccept = async () => {
    if (!token) return;
    setState("loading");
    try {
      const data = await courierCompanyApi.acceptInvite(token);
      setResult(data);
      setState("success");
      toast.success("Taklif qabul qilindi!");
    } catch (e: any) {
      setState("error");
      setMessage(e?.response?.data?.error?.message || e.message || "Xatolik");
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Kuryerlik kompaniyasi taklifi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "idle" && (
            <>
              <p className="text-sm text-muted-foreground">
                Siz kuryerlik kompaniyasiga xodim sifatida taklif qilindingiz.
              </p>
              <Button className="w-full" onClick={handleAccept}>
                Taklifni qabul qilish
              </Button>
            </>
          )}

          {state === "loading" && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {state === "success" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
                <p className="font-medium">Muvaffaqiyatli qo'shildingiz!</p>
              </div>
              {result?.organization && (
                <p className="text-sm text-muted-foreground">
                  Siz <span className="font-medium">{result.organization.name}</span> kompaniyasiga{" "}
                  <span className="font-medium">{result.role.name}</span> sifatida qo'shildingiz.
                </p>
              )}
              <Button className="w-full" onClick={() => router.push("/courier-company")}>
                Kompaniya sahifasiga o'tish
              </Button>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <XCircle className="h-6 w-6" />
                <p className="font-medium">Xatolik</p>
              </div>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
                Bosh sahifa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
