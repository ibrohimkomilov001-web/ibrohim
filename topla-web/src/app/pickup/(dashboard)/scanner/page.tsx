"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ScanBarcode,
  Camera,
  Keyboard,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { verifyPickupOrder } from "@/lib/api/pickup";

type ScanMode = "camera" | "manual";
type ResultState = {
  type: "success" | "error";
  message: string;
  order?: any;
} | null;

export default function PickupScannerPage() {
  const [mode, setMode] = useState<ScanMode>("manual");
  const [manualCode, setManualCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Ref for hidden input that catches hardware scanner input
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef("");
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ========== Hardware Scanner Support ==========
  // Hardware barcode scanners work in HID mode (keyboard emulation)
  // They type characters very fast and end with Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing in a visible input, skip
      const active = document.activeElement as HTMLElement;
      if (active?.tagName === "INPUT" && active !== hiddenInputRef.current) return;

      // Build buffer from rapid keystrokes
      if (e.key === "Enter" && scanBufferRef.current.length > 3) {
        e.preventDefault();
        const scannedData = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        handleScannedData(scannedData);
        return;
      }

      if (e.key.length === 1) {
        scanBufferRef.current += e.key;

        // Clear buffer after 100ms of no input (human typing is slower)
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanTimerRef.current = setTimeout(() => {
          scanBufferRef.current = "";
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ========== Process Scanned Data ==========
  const handleScannedData = useCallback(async (data: string) => {
    if (isVerifying) return;

    setIsVerifying(true);
    setResult(null);

    try {
      // Try to parse as JSON QR code: {"orderId":"...","token":"..."}
      let params: { pickupToken?: string; pickupCode?: string };

      try {
        const parsed = JSON.parse(data);
        if (parsed.token) {
          params = { pickupToken: parsed.token };
        } else {
          params = { pickupCode: data };
        }
      } catch {
        // Not JSON — treat as pickup code
        params = { pickupCode: data };
      }

      const res = await verifyPickupOrder(params);
      setResult({
        type: "success",
        message: "Buyurtma muvaffaqiyatli topshirildi!",
        order: res.order,
      });

      // Play success sound
      playBeep(true);
    } catch (err: any) {
      setResult({
        type: "error",
        message: err.message || "Tekshirishda xatolik yuz berdi",
      });
      playBeep(false);
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying]);

  // ========== Camera QR Scanner ==========
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }

    startCamera();
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        // Start scanning after video is ready
        videoRef.current.onloadedmetadata = () => {
          scanFrame();
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError("Kameraga ruxsat berilmadi. Brauzer sozlamalarini tekshiring.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Use BarcodeDetector API if available (Chrome 83+, Edge 83+)
    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      detector.detect(imageData).then((barcodes: any[]) => {
        if (barcodes.length > 0 && !isVerifying) {
          const data = barcodes[0].rawValue;
          handleScannedData(data);
        }
      }).catch(() => {});
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // ========== Manual Code Submit ==========
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScannedData(manualCode.trim());
    setManualCode("");
  };

  // ========== Sound Feedback ==========
  const playBeep = (success: boolean) => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = success ? 800 : 300;
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(ctx.currentTime + (success ? 0.15 : 0.4));
    } catch {}
  };

  const clearResult = () => setResult(null);

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex gap-2">
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
          className={mode === "manual" ? "bg-orange-500 hover:bg-orange-600" : ""}
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Kod kiritish
        </Button>
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          onClick={() => setMode("camera")}
          className={mode === "camera" ? "bg-orange-500 hover:bg-orange-600" : ""}
        >
          <Camera className="h-4 w-4 mr-2" />
          Kamera
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ScanBarcode className="h-4 w-4" />
          <span>Apparat skaneri avtomatik ishlaydi</span>
        </div>
      </div>

      {/* Result Banner */}
      {result && (
        <Alert
          variant={result.type === "error" ? "destructive" : "default"}
          className={
            result.type === "success"
              ? "border-green-500 bg-green-50 text-green-800"
              : ""
          }
        >
          {result.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">{result.message}</p>
              {result.order && (
                <p className="text-sm mt-1">
                  Buyurtma #{result.order.orderNumber} — {result.order.customer?.firstName || "Mijoz"}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={clearResult}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Verifying Indicator */}
      {isVerifying && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-lg">Tekshirilmoqda...</span>
        </div>
      )}

      {/* Manual Mode */}
      {mode === "manual" && !isVerifying && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-orange-500" />
              Kodni qo&apos;lda kiriting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <Input
                type="text"
                placeholder="6 raqamli kod (masalan: 482917)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="text-2xl font-mono tracking-widest text-center h-14"
                maxLength={6}
                autoFocus
              />
              <Button
                type="submit"
                className="h-14 px-8 bg-orange-500 hover:bg-orange-600"
                disabled={!manualCode.trim()}
              >
                Tekshirish
              </Button>
            </form>
            <p className="text-sm text-muted-foreground mt-3">
              Mijozning telefonidagi 6 raqamli kodni kiriting yoki QR tekshirish uchun kamerani yoqing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Camera Mode */}
      {mode === "camera" && !isVerifying && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5 text-orange-500" />
              QR kodni skanerlang
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cameraError ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            ) : (
              <div className="relative aspect-square max-w-md mx-auto overflow-hidden rounded-xl border-2 border-dashed border-orange-300">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-orange-500 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Mijozning telefonidagi QR kodni shu ramkaga yo&apos;naltiring.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ScanBarcode className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Apparat skaner</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  USB yoki Bluetooth skaner QR kodni avtomatik o&apos;qiydi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Camera className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Kamera</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Kompyuter kamerasi orqali QR kodni skanerlang
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Keyboard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Qo&apos;lda kiritish</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Mijozning 6 raqamli kodini qo&apos;lda kiriting
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden input for hardware scanner fallback */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
