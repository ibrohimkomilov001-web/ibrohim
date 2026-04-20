'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  admin2FAStatus,
  admin2FASetupBegin,
  admin2FASetupVerify,
  admin2FADisable,
} from '@/lib/api/admin';

export function Admin2FACard() {
  const qc = useQueryClient();
  const statusQuery = useQuery({ queryKey: ['admin-2fa-status'], queryFn: admin2FAStatus });

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [otpauth, setOtpauth] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupOpen, setBackupOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    if (otpauth) QRCode.toDataURL(otpauth, { width: 240 }).then(setQrDataUrl).catch(() => {});
  }, [otpauth]);

  const startSetup = async () => {
    try {
      const data = await admin2FASetupBegin();
      setSetupSecret(data.secret);
      setOtpauth(data.otpauth);
      setSetupOpen(true);
    } catch (err: any) {
      toast.error(err?.message || '2FA setup boshlanmadi');
    }
  };

  const verifySetup = async () => {
    if (verifyCode.length !== 6) return;
    setVerifying(true);
    try {
      const { backupCodes } = await admin2FASetupVerify(verifyCode.trim());
      setBackupCodes(backupCodes);
      setSetupOpen(false);
      setBackupOpen(true);
      setVerifyCode('');
      toast.success('2FA yoqildi');
      qc.invalidateQueries({ queryKey: ['admin-2fa-status'] });
    } catch (err: any) {
      toast.error(err?.message || 'Kod noto\'g\'ri');
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    try {
      await admin2FADisable(disableCode.trim());
      toast.success('2FA o\'chirildi');
      setDisableOpen(false);
      setDisableCode('');
      qc.invalidateQueries({ queryKey: ['admin-2fa-status'] });
    } catch (err: any) {
      toast.error(err?.message || 'Kod noto\'g\'ri');
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Backup kodlar nusxalandi');
  };

  const enabled = statusQuery.data?.enabled || false;
  const backupRemaining = statusQuery.data?.backupCodesRemaining || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                2FA (Authenticator)
              </CardTitle>
              <CardDescription>
                Google Authenticator, Authy yoki 1Password orqali ikki bosqichli tasdiqlash
              </CardDescription>
            </div>
            {enabled ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Yoqilgan</Badge>
            ) : (
              <Badge variant="outline">O'chirilgan</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {statusQuery.isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : enabled ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Backup kodlardan qolgan: <span className="font-mono font-semibold">{backupRemaining}</span>/8
              </p>
              <Button variant="outline" onClick={() => setDisableOpen(true)} className="text-destructive">
                <ShieldOff className="w-4 h-4 mr-1.5" />
                2FA ni o'chirish
              </Button>
            </div>
          ) : (
            <Button onClick={startSetup}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              2FA ni yoqish
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>2FA sozlash</DialogTitle>
            <DialogDescription>
              QR kodni Google Authenticator yoki shunga o'xshash ilovada skaner qiling
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrDataUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="2FA QR" className="rounded border" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Yoki secret kodni qo'lda kiriting:</Label>
              <code className="block bg-muted p-2 rounded text-xs break-all font-mono">{setupSecret}</code>
            </div>
            <div className="space-y-2">
              <Label>Ilova ko'rsatgan 6 xonali kodni kiriting</Label>
              <Input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                className="text-center tracking-widest font-mono text-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSetupOpen(false)}>Bekor</Button>
            <Button onClick={verifySetup} disabled={verifyCode.length !== 6 || verifying}>
              {verifying && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={backupOpen} onOpenChange={setBackupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Backup kodlar</DialogTitle>
            <DialogDescription>
              Telefonni yo'qotsangiz shu kodlar bilan kirasiz. <b>Xavfsiz joyda saqlang!</b>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 my-4 font-mono">
            {backupCodes.map((c, i) => (
              <code key={i} className="bg-muted p-2 rounded text-center text-sm">{c}</code>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copyBackupCodes}>
              {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? 'Nusxalandi' : 'Nusxalash'}
            </Button>
            <Button onClick={() => setBackupOpen(false)}>Saqladim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>2FA ni o'chirish</DialogTitle>
            <DialogDescription>
              Hozirgi 6 xonali kodni kiriting
            </DialogDescription>
          </DialogHeader>
          <Input
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            className="text-center tracking-widest font-mono"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDisableOpen(false)}>Bekor</Button>
            <Button variant="destructive" onClick={disable2FA} disabled={disableCode.length !== 6}>
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
