import { AppHeader, TabBar } from "@/components/shell/app-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="td-shell">
      <AppHeader />
      <main className="td-main">
        <div className="container-td">{children}</div>
      </main>
      <TabBar />
    </div>
  );
}
