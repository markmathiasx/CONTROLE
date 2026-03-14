import { CreditCard, Landmark, Smartphone, UtensilsCrossed, WalletCards } from "lucide-react";

import { paymentMethodLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/domain";

const methodIconMap = {
  cash: Landmark,
  pix: Smartphone,
  debit: WalletCards,
  credit: CreditCard,
  vr: UtensilsCrossed,
} satisfies Record<PaymentMethod, typeof CreditCard>;

export function PaymentBadge({
  method,
  className,
}: {
  method: PaymentMethod;
  className?: string;
}) {
  const Icon = methodIconMap[method];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-medium text-zinc-300",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {paymentMethodLabels[method]}
    </span>
  );
}
