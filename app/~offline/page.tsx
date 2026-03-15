import Link from "next/link";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-[32px] border border-white/10 bg-zinc-950/90 p-8 text-center shadow-[0_28px_120px_-40px_rgba(0,0,0,1)]">
        <div className="mx-auto mb-4 inline-flex rounded-2xl border border-white/10 bg-white/6 p-4">
          <WifiOff className="size-7 text-zinc-100" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-zinc-50">Sem conexão agora</h1>
        <p className="mt-2 text-sm text-zinc-400">
          O app continua funcionando com o último snapshot salvo localmente. Você ainda consegue consultar dados, registrar mudanças e continuar usando o app no celular.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Quando a conexão voltar, o cache local volta a falar com a nuvem automaticamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Voltar ao app</Link>
        </Button>
      </div>
    </div>
  );
}
