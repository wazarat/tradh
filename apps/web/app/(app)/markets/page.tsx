import type { Metadata } from "next";
import { PageHead } from "@/components/shell/page";
import { MarketsPage } from "@/components/pages/markets";

export const metadata: Metadata = { title: "Markets" };

export default function Page() {
  return (
    <>
      <PageHead title="Markets" />
      <MarketsPage />
    </>
  );
}
