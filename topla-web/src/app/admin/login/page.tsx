"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ShoppingBag, Loader2, MapPin, MapPinOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminLogin, adminGoogleLogin } from "@/lib/api/admin";

// ── Geolocation helpers ──────────────────────────────────────────────────────

const TRUSTED_LOCATION_KEY = "admin_trusted_location";
const GEO_RADIUS_METERS = 200;

interface LatLng { lat: number; lng: number }

/** Haversine distance in metres between two coordinates */
function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sin2 = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(sin2));
}

function getTrustedLocation(): LatLng | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TRUSTED_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveTrustedLocation(loc: LatLng): void {
  localStorage.setItem(TRUSTED_LOCATION_KEY, JSON.stringify(loc));
}

/** Returns current position or null on error/timeout */
function getCurrentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { timeout: 6000, maximumAge: 30_000 }
    );
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    handleGoogleCredential?: (response: { credential: string }) => void;
  }
}

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // geo states
  const [geoStatus, setGeoStatus] = useState<"idle" | "checking" | "ok" | "warn" | "denied">("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [currentPos, setCurrentPos] = useState<LatLng | null>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Check geolocation once on mount
  useEffect(() => {
    (async () => {
      setGeoStatus("checking");
      const pos = await getCurrentPosition();
      if (!pos) {
        setGeoStatus("denied");
        setGeoMessage("Joylashuv aniqlanmadi — login davom ettiriladi.");
        return;
      }
      const loc: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentPos(loc);
      const trusted = getTrustedLocation();
      if (!trusted) {
        // First visit — no trusted location yet, will be saved after login
        setGeoStatus("ok");
      } else {
        const dist = haversineDistance(loc, trusted);
        if (dist <= GEO_RADIUS_METERS) {
          setGeoStatus("ok");
        } else {
          setGeoStatus("warn");
          setGeoMessage(
            `Siz ishonchli joydan ${Math.round(dist)} m uzoqdasiz. Kirish davom ettiriladi, lekin ehtiyot bo'ling.`
          );
        }
      }
    })();
  }, []);

  const onSuccess = useCallback(() => {
    // After any successful login, save current location as trusted (if we have it)
    if (currentPos && !getTrustedLocation()) {
      saveTrustedLocation(currentPos);
    }
    window.location.href = "/admin/dashboard";
  }, [currentPos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await adminLogin(email, password);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Identity Services callback — registered on window so the GSI script can call it
  useEffect(() => {
    window.handleGoogleCredential = async ({ credential }) => {
      setIsLoading(true);
      setError(null);
      try {
        await adminGoogleLogin(credential);
        onSuccess();
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Google orqali kirishda xatolik");
      } finally {
        setIsLoading(false);
      }
    };
    return () => { delete window.handleGoogleCredential; };
  }, [onSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      {/* Load Google Identity Services (only if client ID is configured) */}
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Panel</CardTitle>
          <CardDescription>TOPLA.UZ boshqaruv paneli</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Geo status banner */}
          {geoStatus === "warn" && geoMessage && (
            <Alert variant="destructive" className="mb-4">
              <MapPinOff className="h-4 w-4" />
              <AlertDescription>{geoMessage}</AlertDescription>
            </Alert>
          )}
          {geoStatus === "ok" && !getTrustedLocation() && currentPos && (
            <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Joylashuvingiz muvaffaqiyatli kirishdan so'ng saqlanadi.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email manzilingiz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kirish...
                </>
              ) : (
                "Kirish"
              )}
            </Button>
          </form>

          {/* Google Sign-In button — rendered by GSI library */}
          {googleClientId && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">yoki</span>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                {/* Google Identity Services rendered button */}
                <div
                  id="g_id_onload"
                  data-client_id={googleClientId}
                  data-callback="handleGoogleCredential"
                  data-auto_prompt="false"
                />
                <div
                  className="g_id_signin"
                  data-type="standard"
                  data-shape="rectangular"
                  data-theme="outline"
                  data-text="signin_with"
                  data-size="large"
                  data-logo_alignment="left"
                  data-width="320"
                />
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              ← Bosh sahifaga qaytish
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

