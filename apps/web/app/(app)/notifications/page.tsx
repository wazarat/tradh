import type { Metadata } from "next";
import { EmptyState, PageHead } from "@/components/shell/page";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <>
      <PageHead title="Notifications" />
      <EmptyState text="No notifications. Strategy signals and approval requests appear here from Milestone 4." />
    </>
  );
}
