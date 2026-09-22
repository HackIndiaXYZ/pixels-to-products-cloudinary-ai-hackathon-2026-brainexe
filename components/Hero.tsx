"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

const LINES = ["One rough photo in.", "A full catalogue out."];

/**
 * The headline reveals a line at a time from behind its own baseline.
 *
 * Per line, not per character. Character-by-character text is the tell of a
 * page that was decorated rather than designed, and it makes a two-line
 * headline take three times as long to read.
 */
export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(node.querySelectorAll("[data-reveal]"), { opacity: 1 });
      return;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      timeline
        .set("[data-reveal]", { opacity: 1 })
        .from("[data-hero-line] span", {
          yPercent: 115,
          duration: 0.9,
          stagger: 0.1,
        })
        .from(
          "[data-hero-sub]",
          { opacity: 0, y: 12, duration: 0.7 },
          "-=0.45",
        )
        .from(
          "[data-hero-meta]",
          { opacity: 0, y: 8, duration: 0.6 },
          "-=0.5",
        );
    }, node);

    return () => context.revert();
  }, []);

  return (
    <div ref={root} className="pt-16 pb-14 sm:pt-24 sm:pb-20">
      <h1
        data-reveal
        className="font-display text-[2.6rem] leading-[1.04] tracking-[-0.02em] text-ink sm:text-6xl lg:text-7xl"
      >
        {LINES.map((line) => (
          <span
            key={line}
            data-hero-line
            className="block overflow-hidden pb-[0.08em]"
          >
            <span className="block">{line}</span>
          </span>
        ))}
      </h1>

      <div className="mt-8 grid gap-8 sm:grid-cols-[minmax(0,32rem)_auto] sm:items-end sm:justify-between">
        <p
          data-reveal
          data-hero-sub
          className="text-lg leading-relaxed text-ink-soft"
        >
          Small sellers shoot products on a phone against a messy background.
          This turns one such photo into a clean shot, four platform crops,
          and the words to list it with.
        </p>

        <dl
          data-reveal
          data-hero-meta
          className="flex gap-8 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint"
        >
          <div>
            <dt>Images out</dt>
            <dd className="mt-1 font-display text-2xl tracking-normal text-ink">
              05
            </dd>
          </div>
          <div>
            <dt>Steps for you</dt>
            <dd className="mt-1 font-display text-2xl tracking-normal text-ink">
              01
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
