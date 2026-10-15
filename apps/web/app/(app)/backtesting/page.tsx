import type { Metadata } from "next";
import { Badge } from "@/components/td";
import { PageHead } from "@/components/shell/page";

export const metadata: Metadata = { title: "Backtesting" };

export default function Page() {
  return (
    <>
      <PageHead title="Backtesting" actions={<Badge tone="neutral">Planned</Badge>}>
        <p className="td-note">Historical backtesting and stress testing are on the roadmap (Next). They are not available yet, and no historical results are shown anywhere in the app.</p>
      </PageHead>
    </>
  );
}
