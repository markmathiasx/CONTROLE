"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function UnlockPage() {
  const router = useRouter();
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 inline-flex rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
            <ShieldCheck className="size-5 text-emerald-300" />
          </div>
          <CardTitle>Área protegida</CardTitle>
          <CardDescription>
            Este deploy está com trava por PIN para proteger seus dados financeiros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Digite o PIN"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
          />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError("");

              const response = await fetch("/api/unlock", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ pin }),
              });

              if (!response.ok) {
                setError("PIN inválido.");
                setLoading(false);
                return;
              }

              router.push("/");
              router.refresh();
            }}
          >
            {loading ? "Validando..." : "Entrar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
