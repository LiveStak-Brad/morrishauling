"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastItem = { id: number; message: string; type: "success" | "error" | "info" };

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastItem["type"] }>)
        .detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    };
    window.addEventListener("morris:toast", handler);
    return () => window.removeEventListener("morris:toast", handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[100] flex max-w-sm flex-col gap-2 md:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur",
            t.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
            t.type === "error" && "border-red-200 bg-red-50 text-red-900",
            t.type === "info" && "border-gray-200 bg-white text-foreground"
          )}
        >
          {t.type === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {t.type === "error" && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {t.type === "info" && <Info className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
