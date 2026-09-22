import { NextResponse } from "next/server";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import {
  getCloudinary,
  CATEGORIZATION,
  UPLOAD_FOLDER,
  AUTO_TAGGING_THRESHOLD,
  encodeContextValue,
} from "@/lib/cloudinary";
import {
  ACCEPTED_TYPES,
  MAX_UPLOAD_BYTES,
  type EnrichmentStatus,
  type ProcessResponse,
} from "@/lib/upload";

// The Cloudinary Node SDK needs Node APIs, so this route cannot run on edge.
export const runtime = "nodejs";

/**
 * Auto-tagging and captioning are paid add-ons. If one is not registered on
 * the account, Cloudinary rejects the whole upload rather than skipping that
 * add-on, so a single combined call is all or nothing.
 *
 * These flags remember which add-ons the account does not have, so later
 * requests in the same server instance skip them on the first try instead of
 * failing and retrying every time. They only ever move from available to
 * unavailable, so registering an add-on needs a restart to take effect.
 */
const unavailable = { tagging: false, captioning: false };

function isMissingSubscription(error: unknown): string | null {
  const message =
    (error as { error?: { message?: string } })?.error?.message ??
    (error as { message?: string })?.message ??
    "";
  return message.includes("active subscription") ? message : null;
}

function uploadBuffer(
  buffer: Buffer,
  options: UploadApiOptions,
): Promise<UploadApiResponse> {
  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Cloudinary returned no result"));
      resolve(result);
    });

    stream.end(buffer);
  });
}

/**
 * Uploads once with every add-on the account is believed to have. If the call
 * is rejected for a missing subscription, the named add-on is dropped and the
 * upload is retried. At most three attempts, and the plain upload always
 * works, so a locked add-on never blocks the demo.
 */
async function uploadWithEnrichment(buffer: Buffer) {
  let wantTagging = !unavailable.tagging;
  let wantCaptioning = !unavailable.captioning;

  for (let attempt = 0; attempt < 3; attempt++) {
    const options: UploadApiOptions = {
      folder: UPLOAD_FOLDER,
      resource_type: "image",
    };

    if (wantTagging) {
      options.categorization = CATEGORIZATION;
      options.auto_tagging = AUTO_TAGGING_THRESHOLD;
    }

    if (wantCaptioning) {
      options.detection = "captioning";
    }

    try {
      const result = await uploadBuffer(buffer, options);
      return { result, usedTagging: wantTagging, usedCaptioning: wantCaptioning };
    } catch (error) {
      const message = isMissingSubscription(error);
      if (!message) throw error;

      // The message names the add-on, for example
      // "You don't have an active subscription for Google Auto Tagging".
      if (/tagging/i.test(message) && wantTagging) {
        unavailable.tagging = true;
        wantTagging = false;
      } else if (/content analysis/i.test(message) && wantCaptioning) {
        unavailable.captioning = true;
        wantCaptioning = false;
      } else {
        // The message did not name an add-on we can drop. Give up on both
        // rather than loop.
        unavailable.tagging = wantTagging || unavailable.tagging;
        unavailable.captioning = wantCaptioning || unavailable.captioning;
        wantTagging = false;
        wantCaptioning = false;
      }

      console.warn(`Cloudinary add-on unavailable, retrying without it: ${message}`);
    }
  }

  const result = await uploadBuffer(buffer, {
    folder: UPLOAD_FOLDER,
    resource_type: "image",
  });
  return { result, usedTagging: false, usedCaptioning: false };
}

/**
 * Stores the caption on the asset as context metadata under the `alt` key, so
 * the alt text travels with the asset rather than living only in this
 * response. Failure here is not worth failing the request over.
 */
async function storeCaptionAsAlt(publicId: string, caption: string) {
  try {
    await getCloudinary().api.update(publicId, {
      context: `alt=${encodeContextValue(caption)}`,
    });
  } catch (error) {
    console.warn("Could not store the caption as context alt:", error);
  }
}

/** The shape of the captioning add-on's slice of the upload response. */
type DetectionInfo = {
  detection?: {
    captioning?: {
      status?: string;
      data?: { caption?: string };
    };
  };
};

export async function POST(request: Request) {
  let file: File | null = null;

  try {
    const form = await request.formData();
    const entry = form.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    return NextResponse.json(
      { error: "Could not read the uploaded form data." },
      { status: 400 },
    );
  }

  if (!file) {
    return NextResponse.json(
      { error: "No file was sent. Pick an image and try again." },
      { status: 400 },
    );
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use a JPEG, PNG, WebP, or AVIF image." },
      { status: 415 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "That image is over 4.5 MB. Use a smaller one." },
      { status: 413 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { result, usedTagging, usedCaptioning } =
      await uploadWithEnrichment(buffer);

    const tags = result.tags ?? [];
    const info = result.info as DetectionInfo | undefined;
    const caption = info?.detection?.captioning?.data?.caption?.trim() || null;

    if (caption) {
      await storeCaptionAsAlt(result.public_id, caption);
    }

    const taggingStatus: EnrichmentStatus = !usedTagging
      ? "unavailable"
      : tags.length > 0
        ? "ok"
        : "empty";

    const captioningStatus: EnrichmentStatus = !usedCaptioning
      ? "unavailable"
      : caption
        ? "ok"
        : "empty";

    const payload: ProcessResponse = {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      tags,
      caption,
      enrichment: { tagging: taggingStatus, captioning: captioningStatus },
    };

    // Chunk 2 asks for the response to be logged so the tags and caption can
    // be eyeballed against the photo.
    console.log("Cloudinary upload:", {
      publicId: payload.publicId,
      tagging: taggingStatus,
      captioning: captioningStatus,
      tags,
      caption,
    });

    return NextResponse.json(payload);
  } catch (error) {
    // Logged server side only. The client gets a short message with no keys
    // or Cloudinary internals in it.
    console.error("Upload to Cloudinary failed:", error);

    const message =
      error instanceof Error && error.message.startsWith("Missing environment")
        ? error.message
        : "Upload to Cloudinary failed. Check the server logs.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
