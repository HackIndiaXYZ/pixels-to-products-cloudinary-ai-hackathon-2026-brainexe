"use client";

import { animate, stagger } from "animejs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCEPT_ATTRIBUTE,
  ACCEPTED_TYPES,
  MAX_UPLOAD_BYTES,
  formatBytes,
  type ProcessResponse,
} from "@/lib/upload";

type Status = "idle" | "uploading" | "done" | "error";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function UploadCard() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // Nested dragenter and dragleave events fire for every child, so count them
  // instead of toggling, or the highlight flickers as the pointer moves.
  const dragDepth = useRef(0);

  // Object URLs hold on to the file until they are revoked.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const node = previewRef.current;
    if (!node || !previewUrl || prefersReducedMotion()) return;

    animate(node.querySelectorAll("[data-preview-item]"), {
      opacity: [0, 1],
      y: [10, 0],
      duration: 520,
      delay: stagger(70),
      ease: "out(3)",
    });
  }, [previewUrl]);

  const selectFile = useCallback((next: File | null) => {
    setError(null);
    setStatus("idle");

    if (!next) {
      setFile(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(next.type)) {
      setFile(null);
      setStatus("error");
      setError("Unsupported file type. Use a JPEG, PNG, WebP, or AVIF image.");
      return;
    }

    if (next.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setStatus("error");
      setError(`That image is ${formatBytes(next.size)}. The limit is 4.5 MB.`);
      return;
    }

    setFile(next);
  }, []);

  async function upload() {
    if (!file) return;

    setStatus("uploading");
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/process", { method: "POST", body });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setError(data?.error ?? "Upload failed.");
        return;
      }

      const result = data as ProcessResponse;
      setStatus("done");

      // A beat on the success state, so the upload visibly finishes rather
      // than the page appearing to jump on its own.
      setTimeout(
        () =>
          router.push(`/result?publicId=${encodeURIComponent(result.publicId)}`),
        550,
      );
    } catch {
      setStatus("error");
      setError("Could not reach the server. Is the dev server running?");
    }
  }

  function reset() {
    setFile(null);
    setError(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  const busy = status === "uploading" || status === "done";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div>
        <label
          htmlFor="product-photo"
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepth.current += 1;
            if (!busy) setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            if (busy) return;
            selectFile(event.dataTransfer.files?.[0] ?? null);
          }}
          className={`block cursor-pointer rounded-sm border border-dashed p-8 transition-colors sm:p-12 ${
            dragging
              ? "border-accent bg-accent-soft"
              : "border-rule bg-raised hover:border-ink-faint"
          } ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          {previewUrl ? (
            <div ref={previewRef} className="flex flex-col items-center gap-4">
              {/* Local blob URL, so next/image cannot optimize it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-preview-item
                src={previewUrl}
                alt="The photo you selected"
                className="max-h-72 w-auto rounded-sm"
              />
              {file && (
                <p
                  data-preview-item
                  className="font-mono text-[11px] tracking-[0.14em] text-ink-faint"
                >
                  {file.name} &middot; {formatBytes(file.size)}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="font-display text-2xl tracking-tight text-ink">
                Drop a product photo here
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                or click to choose one
              </p>
              <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                JPEG &middot; PNG &middot; WebP &middot; AVIF &middot; up to 4.5 MB
              </p>
            </div>
          )}
        </label>

        <input
          ref={inputRef}
          id="product-photo"
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          disabled={busy}
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          className="sr-only"
        />

        {error && (
          <p
            role="alert"
            className="mt-4 border-l-2 border-accent bg-accent-soft px-4 py-3 text-sm text-ink"
          >
            {error}
          </p>
        )}
      </div>

      <div className="lg:pt-2">
        <button
          type="button"
          onClick={upload}
          disabled={!file || busy}
          className="w-full rounded-sm bg-ink px-5 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-rule disabled:text-ink-faint"
        >
          {status === "uploading"
            ? "Uploading"
            : status === "done"
              ? "Opening your catalogue"
              : "Build my catalogue"}
        </button>

        {file && !busy && (
          <button
            type="button"
            onClick={reset}
            className="mt-3 w-full rounded-sm px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint transition-colors hover:text-ink"
          >
            Choose a different photo
          </button>
        )}

        {busy && (
          <div
            role="status"
            className="mt-4 h-px w-full overflow-hidden bg-rule"
          >
            <span className="block h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] bg-accent" />
          </div>
        )}

        <p className="mt-6 border-t border-rule-soft pt-4 text-sm leading-relaxed text-ink-soft">
          Cloudinary removes the background, crops for each platform, tags the
          product, and writes the caption. One upload, no editing software.
        </p>
      </div>
    </div>
  );
}
