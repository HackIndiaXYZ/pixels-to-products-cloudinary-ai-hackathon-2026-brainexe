"use client";

import { animate, stagger } from "animejs";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GeneratedCopy } from "@/lib/copy";

type Props = {
  copy: GeneratedCopy;
};

type FieldProps = {
  label: string;
  /** What lands on the clipboard. Empty means there is nothing to copy. */
  value: string;
  hint?: string;
  children: React.ReactNode;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      const node = ref.current;
      if (node && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        animate(node, {
          scale: [1, 0.94, 1],
          duration: 320,
          ease: "out(3)",
        });
      }

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be refused, for example on an insecure origin.
      // Nothing to recover, the text is on screen to select by hand.
    }
  }, [value]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={copy}
      disabled={!value}
      aria-label={`Copy ${label.toLowerCase()}`}
      className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Field({ label, value, hint, children }: FieldProps) {
  return (
    <div className="border-t border-rule-soft py-4 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          {label}
        </h3>
        <CopyButton value={value} label={label} />
      </div>
      {hint && <p className="mt-1 text-[11px] text-ink-faint">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Missing({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-accent bg-accent-soft px-3 py-2 text-xs text-ink">
      {children}
    </p>
  );
}

export default function CopyPanel({ copy }: Props) {
  const tagLine = copy.tags.join(", ");
  const tagList = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const node = tagList.current;
    if (!node || copy.tags.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    animate(node.children, {
      opacity: [0, 1],
      y: [6, 0],
      duration: 420,
      delay: stagger(35, { start: 260 }),
      ease: "out(3)",
    });
  }, [copy.tags]);

  return (
    <section
      aria-labelledby="copy-heading"
      className="border border-rule bg-raised p-6"
    >
      <h2
        id="copy-heading"
        className="font-display text-xl tracking-tight text-ink"
      >
        Listing copy
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Written from the caption and tags Cloudinary returned for this photo.
      </p>

      <div className="mt-6">
        <Field
          label="Title"
          value={copy.title}
          hint="The caption subject, filled out by the strongest tag"
        >
          <p className="font-display text-xl tracking-tight text-ink">
            {copy.title}
          </p>
        </Field>

        <Field label="Description" value={copy.description}>
          {copy.description ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              {copy.description}
            </p>
          ) : (
            <Missing>
              No caption came back from Cloudinary for this image.
            </Missing>
          )}
        </Field>

        <Field
          label="Alt text"
          value={copy.altText}
          hint="Also stored on the Cloudinary asset under the alt key"
        >
          {copy.altText ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              {copy.altText}
            </p>
          ) : (
            <Missing>Nothing to show without a caption.</Missing>
          )}
        </Field>

        <Field label="Tags" value={tagLine}>
          {copy.tags.length > 0 ? (
            <ul ref={tagList} className="flex flex-wrap gap-1.5">
              {copy.tags.map((tag) => (
                <li
                  key={tag}
                  className="border border-rule-soft px-2 py-1 font-mono text-[10px] tracking-widest text-ink-soft"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : (
            <Missing>
              No tags came back. Check that an auto-tagging add-on is
              registered.
            </Missing>
          )}
        </Field>
      </div>
    </section>
  );
}
