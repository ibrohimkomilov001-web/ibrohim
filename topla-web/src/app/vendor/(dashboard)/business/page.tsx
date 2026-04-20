"use client";

import { useQuery } from "@tanstack/react-query";
import { vendorStaffApi } from "@/lib/api/vendor-staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Store, Users, Loader2 } from "lucide-react";

export default function VendorBusinessPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-business"],
    queryFn: vendorStaffApi.getBusiness,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="p-6 text-muted-foreground">Ma'lumot yo'q</p>;
  }

  const { shop, organization, business } = data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Biznes tuzilmasi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Do'koningiz va biznes guruhingiz ierarxiyasi
        </p>
      </div>

      {business && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Biznes: {business.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Ushbu biznesga tegishli barcha do'konlar:
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {business.children.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-lg border flex items-center gap-2 ${
                    c.id === organization?.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{c.name}</span>
                  {c.id === organization?.id && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      Bu siz
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Do'kon: {shop.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organization && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="font-medium">{organization.memberships.length}</span> faol xodim
                </span>
              </div>

              <div className="grid gap-2">
                {organization.memberships.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-md border text-sm"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{m.profileId}</span>
                    <Badge variant="secondary">{m.role.name}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
