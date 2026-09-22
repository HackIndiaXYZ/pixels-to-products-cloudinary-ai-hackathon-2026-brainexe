"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Catches anything the result screen throws that is not a missing asset:
 * Cloudinary being unreachable, rate limiting, a bad API key in production.
 *
 * Without this a judge opening the live demo would get a raw stack trace.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col items-start px-6 py-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
        Something broke
      </p>
      <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[1.08] tracking-[-0.02em] text-ink sm:text-5xl">
        Cloudinary did not answer.
      </h1>
      <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
        This is usually a network hiccup or a Cloudinary rate limit. Trying
        again normally works.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-accent"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-rule px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Start over
        </Link>
      </div>

      {error.digest && (
        <p className="mt-10 font-mono text-[11px] tracking-[0.14em] text-ink-faint">
          Reference {error.digest}
        </p>
      )}
    </main>
  );
}
