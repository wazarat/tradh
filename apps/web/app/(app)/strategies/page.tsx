import type { Metadata } from "next";
import { Button } from "@/components/td";
import { EmptyState, PageHead } from "@/components/shell/page";

export const metadata: Metadata = { title: "Strategies" };

export default function Page() {
  return (
    <>
      <PageHead title="Strategies" actions={<Button disabled title="Available in Milestone 3">Create strategy</Button>} />
      <EmptyState text="No strategies yet. Natural-language and MCP strategy creation arrive in Milestone 3." />
    </>
  );
}
