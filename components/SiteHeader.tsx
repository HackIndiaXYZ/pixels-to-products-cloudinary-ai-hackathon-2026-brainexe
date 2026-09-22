import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-6 px-6 py-5">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-ink transition-colors hover:text-accent"
        >
          Photo to Catalog
        </Link>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          Track 01 &mdash; AI Media Pipelines
        </p>
      </div>
    </header>
  );
}
