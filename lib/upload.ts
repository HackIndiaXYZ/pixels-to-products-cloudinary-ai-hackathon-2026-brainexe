// Shared between the upload route and the browser. Nothing here imports the
// Cloudinary SDK, so the client bundle stays free of server code.

// Vercel caps a serverless request body at 4.5 MB. Checking the same limit in
// the browser and on the server means a file that would fail in production
// also fails locally.
export const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(",");

/**
 * Result of one add-on.
 *
 * ok          the add-on ran and returned something
 * empty       the add-on ran and returned nothing for this image
 * unavailable the account has no active subscription for the add-on
 */
export type EnrichmentStatus = "ok" | "empty" | "unavailable";

/** What POST /api/process returns on success. */
export type ProcessResponse = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  tags: string[];
  caption: string | null;
  enrichment: {
    tagging: EnrichmentStatus;
    captioning: EnrichmentStatus;
  };
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
