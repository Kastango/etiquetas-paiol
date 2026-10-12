import type { Metadata } from "next";
import { HoursTool } from "@/components/hours/hours-tool";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Horários" };

export default function HoursPage() {
  return (
    <div className="px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <PageHeader title="Horários">
        Edite os dias e horários e baixe o cartaz para imprimir ou postar. Para feriados, use o aviso.
      </PageHeader>
      <HoursTool />
    </div>
  );
}
