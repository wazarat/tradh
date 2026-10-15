import type { Metadata } from "next";
import { PageHead } from "@/components/shell/page";
import { OverviewPage } from "@/components/pages/overview";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return (
    <>
      <PageHead title="Overview" />
      <OverviewPage />
    </>
  );
}
