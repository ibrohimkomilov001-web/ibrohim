"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Phone,
  Mail,
  Send,
} from "lucide-react";
import { useTranslation } from '@/store/locale-store';
import { useSupportPhone, useSupportEmail, useTelegramLink, useTelegramHandle } from '@/hooks/useSettings';

export default function HelpPage() {
  const { t } = useTranslation();
  const supportPhone = useSupportPhone();
  const phoneDigits = supportPhone.replace(/\D/g, '');
  const telegramLink = useTelegramLink();
  const telegramHandle = useTelegramHandle();
  const email = useSupportEmail();

  const contactChannels = [
    {
      icon: Send,
      label: "telegramLabel",
      value: telegramHandle,
      href: telegramLink,
      descKey: "telegramDesc",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      icon: Phone,
      label: "phoneLabel",
      value: supportPhone,
      href: `tel:+${phoneDigits}`,
      descKey: "phoneDesc",
      color: "bg-green-500/10 text-green-600",
    },
    {
      icon: Mail,
      label: "emailLabel",
      value: email,
      href: `mailto:${email}`,
      descKey: "emailDesc",
      color: "bg-orange-500/10 text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('helpCenter')}</h1>
        <p className="text-muted-foreground">{t('helpDesc')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {contactChannels.map((channel) => (
          <div key={channel.label}>
            <a href={channel.href} target="_blank" rel="noopener noreferrer">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className={`inline-flex rounded-xl p-2.5 mb-3 ${channel.color}`}>
                    <channel.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{t(channel.label)}</h3>
                  <p className="text-sm font-medium text-primary">{channel.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t(channel.descKey)}</p>
                </CardContent>
              </Card>
            </a>
          </div>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-1">{t('cantFindAnswer')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('supportTeamReady')}
          </p>
          <a href={telegramLink} target="_blank" rel="noopener noreferrer">
            <Button className="rounded-full">
              <Send className="mr-2 h-4 w-4" />
              {t('writeViaTelegram')}
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
