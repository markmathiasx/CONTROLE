"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/use-auth-store";

export default function LogoutPage() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);

  React.useEffect(() => {
    void (async () => {
      await signOut();
      router.replace("/login");
      router.refresh();
    })();
  }, [router, signOut]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-xl items-center justify-center px-4 py-10 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="size-5" />
            Encerrando a sessão
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-zinc-400">
          <LoaderCircle className="size-4 animate-spin text-zinc-200" />
          Limpando a sessão local e voltando para o login.
        </CardContent>
      </Card>
    </div>
  );
}
