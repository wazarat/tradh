import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-td" style={{ padding: "var(--space-16) 0" }}>
      <h1 className="t-h1">Page not found</h1>
      <p className="td-note"><Link href="/overview">Back to overview</Link></p>
    </div>
  );
}
