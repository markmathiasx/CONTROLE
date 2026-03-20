import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { PrintableReportPage } from "@/features/reports/printable-report-page";

export default function PrintableReportRoute() {
  return (
    <Suspense fallback={<PageSkeleton cards={2} rows={4} />}>
      <PrintableReportPage />
    </Suspense>
  );
}
