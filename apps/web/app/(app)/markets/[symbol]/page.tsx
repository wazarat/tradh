import type { Metadata } from "next";
import { AssetDetailPage } from "@/components/pages/asset-detail";

export async function generateMetadata(props: PageProps<"/markets/[symbol]">): Promise<Metadata> {
  const { symbol } = await props.params;
  return { title: symbol };
}

export default async function Page(props: PageProps<"/markets/[symbol]">) {
  const { symbol } = await props.params;
  return <AssetDetailPage symbol={symbol} />;
}
