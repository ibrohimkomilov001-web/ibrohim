"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { Calculator, CreditCard, ChevronDown, ChevronUp } from "lucide-react";

interface InstallmentOption {
  months: number;
  monthlyPayment: number;
  totalPayment: number;
  overpayment: number;
  interestRate: number;
}

interface InstallmentCalculatorProps {
  price: number;
  className?: string;
  compact?: boolean;
}

const INSTALLMENT_PLANS = [
  { months: 3, interestRate: 0 },
  { months: 6, interestRate: 0 },
  { months: 9, interestRate: 2.5 },
  { months: 12, interestRate: 5 },
];

function calculateInstallment(
  price: number,
  months: number,
  annualRate: number,
): InstallmentOption {
  const totalPayment = annualRate === 0
    ? price
    : price * (1 + (annualRate * months) / 1200);
  const monthlyPayment = totalPayment / months;
  const overpayment = totalPayment - price;

  return {
    months,
    monthlyPayment: Math.ceil(monthlyPayment),
    totalPayment: Math.ceil(totalPayment),
    overpayment: Math.ceil(overpayment),
    interestRate: annualRate,
  };
}

/**
 * Compact badge for product cards — shows cheapest monthly installment
 */
export function InstallmentBadge({ price, className }: { price: number; className?: string }) {
  const cheapest = calculateInstallment(price, 3, 0);
  return (
    <Badge
      variant="secondary"
      className={cn("bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1", className)}
    >
      <CreditCard className="h-3 w-3" />
      {formatPrice(cheapest.monthlyPayment)} so&apos;m/oy
    </Badge>
  );
}

/**
 * Full installment calculator — for product detail pages
 */
export function InstallmentCalculator({ price, className, compact = false }: InstallmentCalculatorProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [selectedPlan, setSelectedPlan] = useState(0);

  const options = INSTALLMENT_PLANS.map((plan) =>
    calculateInstallment(price, plan.months, plan.interestRate),
  );

  if (price < 100000) return null; // Bo'lib to'lash 100,000 so'mdan boshlanadi

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader
        className={cn("p-4 cursor-pointer", compact && "pb-2")}
        onClick={() => compact && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4 text-green-600" />
            Bo&apos;lib to&apos;lash
          </CardTitle>
          {compact && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-600">
                {formatPrice(options[0].monthlyPayment)} so&apos;m/oy dan
              </span>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 pt-0">
          {/* Plan Selector */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {options.map((opt, i) => (
              <button
                key={opt.months}
                onClick={() => setSelectedPlan(i)}
                className={cn(
                  "rounded-lg border p-2 text-center transition-all text-sm",
                  selectedPlan === i
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-muted hover:border-muted-foreground/30",
                )}
              >
                <div className="font-semibold">{opt.months} oy</div>
                {opt.interestRate === 0 ? (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    0%
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    {opt.interestRate}%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Selected Plan Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm">Oylik to&apos;lov</span>
              <span className="text-lg font-bold text-green-600">
                {formatPrice(options[selectedPlan].monthlyPayment)} so&apos;m
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground px-3">
              <span>Mahsulot narxi</span>
              <span>{formatPrice(price)} so&apos;m</span>
            </div>
            {options[selectedPlan].overpayment > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground px-3">
                <span>Ortiqcha to&apos;lov</span>
                <span className="text-orange-500">
                  +{formatPrice(options[selectedPlan].overpayment)} so&apos;m
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-medium px-3 pt-1 border-t">
              <span>Jami to&apos;lov</span>
              <span>{formatPrice(options[selectedPlan].totalPayment)} so&apos;m</span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3">
            * Bo&apos;lib to&apos;lash Payme, Click yoki Uzum orqali amalga oshiriladi.
            Bankdan tasdiqlash talab qilinadi.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
