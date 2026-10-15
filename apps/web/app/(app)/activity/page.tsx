import type { Metadata } from "next";
import { PageHead } from "@/components/shell/page";
import { ActivityPage } from "@/components/pages/activity";

export const metadata: Metadata = { title: "Activity" };

export default function Page() {
  return (
    <>
      <PageHead title="Activity">
        <p className="td-note">Executed testnet trades recorded from onchain receipts. Nothing is marked Confirmed before the receipt.</p>
      </PageHead>
      <ActivityPage />
    </>
  );
}
