import {
  Banknote,
  Building2,
  CreditCard,
  FileText,
  Landmark,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { PaymentMethodOption } from "@/types/payment";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  card: CreditCard,
  apple: Smartphone,
  google: Smartphone,
  paypal: Wallet,
  cash: Banknote,
  invoice: FileText,
  financing: Landmark,
  check: Building2,
};

export function PaymentMethodIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = ICON_MAP[icon] ?? CreditCard;
  return <Icon className={className} />;
}

export function TrustBadgeRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 text-xs text-emerald-800">
      <span className="flex items-center gap-1.5 font-medium">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        256-bit encryption
      </span>
      <span className="hidden h-3 w-px bg-emerald-300 sm:block" />
      <span className="font-medium">PCI-ready architecture</span>
      <span className="hidden h-3 w-px bg-emerald-300 sm:block" />
      <span className="font-medium">No card data stored locally</span>
    </div>
  );
}

export function getMethodBrandColor(id: PaymentMethodOption["id"]) {
  const colors: Partial<Record<PaymentMethodOption["id"], string>> = {
    card: "from-slate-800 to-slate-900",
    apple_pay: "from-gray-900 to-black",
    google_pay: "from-blue-600 to-blue-800",
    paypal: "from-blue-500 to-blue-700",
    cash_on_arrival: "from-emerald-600 to-emerald-800",
    financing: "from-brand-primary to-[#6B0F1F]",
  };
  return colors[id] ?? "from-gray-700 to-gray-900";
}
