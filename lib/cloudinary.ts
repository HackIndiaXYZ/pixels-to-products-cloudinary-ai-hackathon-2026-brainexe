import { v2 as cloudinary } from "cloudinary";

// Server-only Cloudinary config. The API secret must never reach the client,
// so this file is imported from route handlers and server components only.

let configured = false;

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Add it to .env.local and restart the dev server.`,
    );
  }
  return value;
}

/**
 * Returns the configured Cloudinary SDK.
 *
 * Config happens on first call rather than at import time. If it ran at import
 * time, a missing key would break `next build` instead of returning a readable
 * error from the request that needed it.
 */
export function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: readEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
      api_key: readEnv("CLOUDINARY_API_KEY"),
      api_secret: readEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

// Every asset from this app lands in one folder so the Cloudinary media
// library stays readable during the demo.
export const UPLOAD_FOLDER = "photo-to-catalog";

/**
 * Which auto-tagging add-on to use. Valid values are the ones Cloudinary
 * accepts for the upload `categorization` parameter: google_tagging,
 * imagga_tagging, aws_rek_tagging.
 *
 * This is an env var because the add-on has to be registered in the
 * Cloudinary dashboard first, and which one has free quota varies by account.
 */
export const CATEGORIZATION =
  process.env.CLOUDINARY_CATEGORIZATION ?? "google_tagging";

// Confidence threshold for auto_tagging. Tags below this score are dropped.
export const AUTO_TAGGING_THRESHOLD = 0.6;

/** What the result screen needs about one already-uploaded asset. */
export type StoredAsset = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  tags: string[];
  /** The caption, read back from context metadata under the `alt` key. */
  caption: string | null;
};

type ResourceContext = {
  custom?: Record<string, string>;
} & Record<string, unknown>;

/**
 * Looks up an asset by public id.
 *
 * The result screen takes only the public id in its URL, so it reads the tags
 * and caption back from Cloudinary rather than having them passed along. That
 * keeps a result link shareable and re-openable.
 *
 * Returns null when the asset does not exist, so the page can show a not
 * found state instead of failing.
 */
export async function getAsset(publicId: string): Promise<StoredAsset | null> {
  try {
    const resource = await getCloudinary().api.resource(publicId, {
      context: true,
      tags: true,
    });

    const context = (resource.context ?? {}) as ResourceContext;
    // Context set through the Admin API lands under `custom`. Context set at
    // upload time sits at the top level. Read either.
    const alt =
      context.custom?.alt ??
      (typeof context.alt === "string" ? context.alt : undefined);

    return {
      publicId: resource.public_id,
      url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      tags: resource.tags ?? [],
      caption: alt?.trim() || null,
    };
  } catch (error) {
    const httpCode = (error as { error?: { http_code?: number } })?.error
      ?.http_code;
    if (httpCode === 404) return null;
    throw error;
  }
}

/**
 * Cloudinary context metadata is sent as `key=value|key2=value2`, so any `=`,
 * `|` or backslash inside a value has to be escaped.
 */
export function encodeContextValue(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|");
}
