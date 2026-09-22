/**
 * Asserts that the URL CldImage builds for each output still starts with the
 * exact transformation chain recorded in project-detail.md, and still ends
 * with f_auto and q_auto.
 *
 * Anything between those two is next-cloudinary's own sizing component, which
 * is a no-op at the width we ask for. If this check fails, the delivered image
 * is no longer the one the spec describes.
 *
 * Run with `npm run check:transforms`. It needs only the cloud name, makes no
 * network calls, and works without the API key or secret.
 */
import { getCldImageUrl } from "next-cloudinary";
import { TRANSFORMS, rawChain } from "../lib/transforms.ts";

const SAMPLE_ID = "photo-to-catalog/sample";

/** Pulls the transformation chain out of a delivery URL. */
function chainOf(url: string): string {
  const marker = "/image/upload/";
  const start = url.indexOf(marker);
  if (start === -1) throw new Error(`Not an upload URL: ${url}`);

  const rest = url.slice(start + marker.length);
  const end = rest.indexOf(SAMPLE_ID);
  if (end === -1) throw new Error(`Public id missing from URL: ${url}`);

  // Drop the version segment Cloudinary inserts, for example "v1/".
  return rest
    .slice(0, end)
    .split("/")
    .filter((part) => part !== "" && !/^v\d+$/.test(part))
    .join("/");
}

let failures = 0;

for (const spec of TRANSFORMS) {
  const url = getCldImageUrl({
    src: SAMPLE_ID,
    width: spec.width,
    height: spec.height,
    rawTransformations: [rawChain(spec)],
  });

  const actual = chainOf(url);
  const components = actual.split("/");
  const problems: string[] = [];

  if (!actual.startsWith(rawChain(spec))) {
    problems.push(`does not start with ${rawChain(spec)}`);
  }

  if (!components.includes("f_auto")) problems.push("missing f_auto");
  if (!components.includes("q_auto")) problems.push("missing q_auto");

  // Whatever next-cloudinary adds after our chain must not re-crop or move
  // the subject. next/image appends `c_limit,w_N` once per srcset width, which
  // only scales down and preserves the ratio our chain already set, so the
  // crop stays correct at every width. Anything else changes the framing.
  const extra = components.slice(rawChain(spec).split("/").length);
  for (const part of extra) {
    if (part === "f_auto" || part === "q_auto") continue;
    if (/^c_limit,w_\d+$/.test(part)) continue;
    problems.push(`unexpected added component: ${part}`);
  }

  if (problems.length === 0) {
    console.log(`ok    ${spec.id}`);
    console.log(`      ${actual}`);
  } else {
    failures++;
    console.log(`FAIL  ${spec.id}`);
    console.log(`      reference: ${spec.reference}`);
    console.log(`      actual:    ${actual}`);
    for (const p of problems) console.log(`      - ${p}`);
  }
}

if (failures > 0) {
  console.log(`\n${failures} transform(s) no longer match project-detail.md`);
  process.exit(1);
}

console.log(`\nall ${TRANSFORMS.length} transforms match project-detail.md`);
