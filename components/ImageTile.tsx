"use client";

import { CldImage } from "next-cloudinary";
import { useCallback, useEffect, useRef, useState } from "react";
import { downloadUrl, rawChain, type TransformSpec } from "@/lib/transforms";

/**
 * Background removal answers 423 while Cloudinary prepares the derived image,
 * and the same URL works a moment later. Retry on a widening delay before
 * giving up and asking the viewer to press a button.
 */
const RETRY_DELAYS_MS = [1500, 3000, 5000, 8000];

type Props = {
  spec: TransformSpec;
  publicId: string;
  /** Caption from the upload, used as the alt text when there is one. */
  caption: string | null;
  /** Slug used to name the downloaded file. */
  baseName: string;
  /** Renders the tile larger, for the clean shot. */
  featured?: boolean;
};

export default function ImageTile({
  spec,
  publicId,
  caption,
  baseName,
  featured = false,
}: Props) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  // Bumping this remounts CldImage, which re-requests the image.
  const [attempt, setAttempt] = useState(0);
  const retriesUsed = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleError = useCallback(() => {
    const delay = RETRY_DELAYS_MS[retriesUsed.current];

    if (delay === undefined) {
      setState("error");
      return;
    }

    retriesUsed.current += 1;
    setState("loading");
    timer.current = setTimeout(() => setAttempt((n) => n + 1), delay);
  }, []);

  const retryNow = useCallback(() => {
    retriesUsed.current = 0;
    setState("loading");
    setAttempt((n) => n + 1);
  }, []);

  const alt = caption
    ? `${caption} Shown as the ${spec.label.toLowerCase()} crop.`
    : `Product photo, ${spec.label.toLowerCase()} crop at ${spec.aspectRatio}.`;

  const removesBackground = spec.reference.startsWith("e_background_removal");

  return (
    <figure className="flex h-full flex-col">
      {/* min-h keeps the rule level across the row when one label wraps to a
          second line, as "Website banner" does at narrow column widths. */}
      <figcaption className="flex min-h-14 items-baseline justify-between gap-3 border-b border-rule-soft pb-2">
        <span className="font-display text-lg leading-tight tracking-tight text-ink">
          {spec.label}
        </span>
        <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-accent">
          {spec.aspectRatio}
        </span>
      </figcaption>

      {/* One frame size for every tile, with the image letterboxed inside it.
          Sizing the frame from the ratio instead would squeeze the 16:9 tile
          to half the height of the others, because a 16:9 frame that tall
          does not fit the column.

          The frame sits on paper, not white, so the white canvas the product
          is padded onto reads as a shape and the viewer can see the crop. */}
      <div
        className={`relative mt-4 w-full overflow-hidden border border-rule bg-paper ${
          featured ? "h-105" : "h-60"
        }`}
      >
        {state === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <p className="text-xs text-ink-soft">
              Cloudinary is still preparing this one.
            </p>
            <button
              type="button"
              onClick={retryNow}
              className="rounded-sm bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {state === "loading" && (
              <div
                role="status"
                className="absolute inset-0 z-10 flex items-center justify-center bg-paper"
              >
                <span className="animate-pulse font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  {removesBackground ? "Removing background" : "Rendering"}
                </span>
              </div>
            )}
            <CldImage
              key={attempt}
              src={publicId}
              rawTransformations={[rawChain(spec)]}
              width={spec.width}
              height={spec.height}
              alt={alt}
              sizes={
                featured
                  ? "(max-width: 768px) 100vw, 560px"
                  : "(max-width: 768px) 100vw, 280px"
              }
              className="h-full w-full object-contain"
              onLoad={() => setState("loaded")}
              onError={handleError}
            />
          </>
        )}
      </div>

      {/* mt-auto pins the footer down, so tiles of different heights in one
          row still line their footers up. */}
      <div className="mt-auto pt-4">
        <p className="text-xs text-ink-soft">{spec.useCase}</p>
        <a
          href={downloadUrl(publicId, spec, baseName)}
          className="mt-3 block border border-rule px-3 py-2 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Download
        </a>
      </div>
    </figure>
  );
}
