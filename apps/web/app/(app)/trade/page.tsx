import type { Metadata } from "next";
import { PageHead } from "@/components/shell/page";
import { TradeTicket } from "@/components/trade/trade-ticket";

export const metadata: Metadata = { title: "Trade" };

export default function Page() {
  return (
    <>
      <PageHead title="Trade">
        <p className="td-note">Buy or sell mock assets against mUSD on the testnet exchange. Every cost is shown before you sign.</p>
      </PageHead>
      <TradeTicket />
    </>
  );
}
