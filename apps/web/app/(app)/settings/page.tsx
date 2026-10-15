import type { Metadata } from "next";
import { PageHead } from "@/components/shell/page";
import { SettingsPage } from "@/components/pages/settings";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <>
      <PageHead title="Settings" />
      <SettingsPage />
    </>
  );
}
