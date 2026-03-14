import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto inline-flex rounded-2xl border border-white/10 bg-white/6 p-4">
            <Compass className="size-6 text-zinc-100" />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold text-zinc-50">Tela não encontrada</h1>
            <p className="text-sm text-zinc-400">
              Essa rota não existe aqui. Volte para o resumo e continue lançando seu mês.
            </p>
          </div>
          <Button asChild>
            <Link href="/">Ir para o dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
