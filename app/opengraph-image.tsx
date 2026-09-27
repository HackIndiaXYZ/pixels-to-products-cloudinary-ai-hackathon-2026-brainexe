import { ImageResponse } from "next/og";

/**
 * The card that shows when a link to the site is pasted into a chat or a
 * submission form.
 *
 * Deliberately built from layout and colour only, with no web font fetch.
 * A font request that fails at render time would take the whole card down.
 */

export const alt =
  "Photo to Catalog. One product photo becomes five launch-ready images plus listing copy.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f6f3ed";
const INK = "#17140f";
const INK_SOFT = "#554e44";
const RULE = "#ddd5c8";
const ACCENT = "#a8431c";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${RULE}`,
            paddingBottom: 24,
            fontSize: 20,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: INK_SOFT,
          }}
        >
          <span>Photo to Catalog</span>
          <span style={{ color: ACCENT }}>Track 01</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 78, lineHeight: 1.05, letterSpacing: -2 }}>
            One rough photo in.
          </div>
          <div style={{ fontSize: 78, lineHeight: 1.05, letterSpacing: -2 }}>
            A full catalogue out.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.4,
              color: INK_SOFT,
              maxWidth: 820,
            }}
          >
            Background removed, four platform crops, and the listing copy.
            Built on Cloudinary.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 20,
            borderTop: `1px solid ${RULE}`,
            paddingTop: 24,
            fontSize: 22,
            letterSpacing: 2,
            color: INK_SOFT,
          }}
        >
          {["1:1", "4:5", "9:16", "16:9"].map((ratio) => (
            <span
              key={ratio}
              style={{ border: `1px solid ${RULE}`, padding: "8px 16px" }}
            >
              {ratio}
            </span>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
