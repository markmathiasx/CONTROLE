import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickAddPanel } from "@/components/shared/quick-add-panel";

export function QuickAddWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lançamento em segundos</CardTitle>
        <CardDescription>
          Use texto natural para registrar na rua sem abrir planilha nem navegar por mil telas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QuickAddPanel compact />
      </CardContent>
    </Card>
  );
}
