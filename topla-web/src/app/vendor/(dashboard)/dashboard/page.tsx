"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/vendor/statistika");
  }, [router]);
  return null;
}
