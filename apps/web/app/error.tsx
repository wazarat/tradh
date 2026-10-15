"use client";

import { Button } from "@/components/td";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-td" style={{ padding: "var(--space-16) 0" }}>
      <h1 className="t-h1">Something went wrong</h1>
      <p className="td-note">{error.digest ? `Reference ${error.digest}` : "The page failed to render."}</p>
      <Button variant="secondary" onClick={reset}>Try again</Button>
    </div>
  );
}
