/**
 * Every output the pipeline produces, defined once.
 *
 * `reference` is the exact Cloudinary transformation chain from
 * project-detail.md and is the only source of truth here. The chain passed to
 * CldImage is derived from it by `rawChain`, so the two cannot drift apart.
 *
 * Why raw chains instead of the CldImage props:
 *
 * The props build a different chain. Given `removeBackground`, `crop="pad"`
 * and `background="white"`, next-cloudinary emits
 * `e_background_removal/b_white/c_pad,...`, putting `b_white` in its own
 * component. project-detail.md says not to do that because the result gets
 * unpredictable. Passing the chain directly keeps `b_white,c_pad` paired.
 *
 * Why most ratios pad instead of fill:
 *
 * project-detail.md specifies `c_fill,g_auto` for all four platform crops,
 * but `c_fill` fills the frame and cuts whatever does not fit. On a source
 * near 1:1, going to 4:5 or 9:16 cuts the product badly at the edges, which
 * breaks the PRD rule that the product stays fully inside every crop. Those
 * two pad onto white instead, the same treatment as the clean shot.
 *
 * 1:1 and 16:9 keep `c_fill,g_auto`. Both frame a near-square source without
 * meaningful loss, and padding 1:1 onto white would make it byte-identical to
 * the clean shot, so the seller would download the same file twice.
 *
 * `npm run check:transforms` asserts the generated URL still starts with the
 * reference chain.
 */

export type TransformId =
  | "clean"
  | "marketplace"
  | "instagram"
  | "story"
  | "banner";

export type TransformSpec = {
  id: TransformId;
  /** Short name shown on the tile. */
  label: string;
  /** Where the seller would use this image. */
  useCase: string;
  aspectRatio: string;
  width: number;
  height: number;
  /** The exact chain from project-detail.md. */
  reference: string;
};

export const TRANSFORMS: TransformSpec[] = [
  {
    id: "clean",
    label: "Clean shot",
    useCase: "Background removed, plain white backdrop",
    aspectRatio: "1:1",
    width: 1600,
    height: 1600,
    reference: "e_background_removal/b_white,c_pad,ar_1:1,w_1600/f_auto,q_auto",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    useCase: "Amazon, Flipkart listing",
    aspectRatio: "1:1",
    width: 1600,
    height: 1600,
    reference: "c_fill,g_auto,ar_1:1,w_1600/f_auto,q_auto",
  },
  {
    id: "instagram",
    label: "Instagram feed",
    useCase: "Feed post",
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
    reference: "e_background_removal/b_white,c_pad,ar_4:5,w_1080/f_auto,q_auto",
  },
  {
    id: "story",
    label: "Story and reel",
    useCase: "Instagram story, reel cover",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    reference: "e_background_removal/b_white,c_pad,ar_9:16,w_1080/f_auto,q_auto",
  },
  {
    id: "banner",
    label: "Website banner",
    useCase: "Shop header",
    aspectRatio: "16:9",
    width: 1600,
    height: 900,
    reference: "c_fill,g_auto,ar_16:9,w_1600/f_auto,q_auto",
  },
];

/**
 * The reference chain without its trailing `f_auto,q_auto`. next-cloudinary
 * appends format and quality itself, so passing them again would duplicate
 * them.
 */
export function rawChain(spec: TransformSpec): string {
  return spec.reference.replace(/\/f_auto,q_auto$/, "");
}

/**
 * Aspect ratio as a CSS value, so a tile can reserve the right space before
 * the image arrives and the grid does not jump.
 */
export function cssAspectRatio(spec: TransformSpec): string {
  return spec.aspectRatio.replace(":", " / ");
}

/** The clean shot is shown on its own, the rest are the platform crops. */
export const CLEAN_SHOT = TRANSFORMS[0];
export const CROPS = TRANSFORMS.slice(1);

/**
 * A URL that downloads one output instead of displaying it.
 *
 * `fl_attachment` makes Cloudinary send `Content-Disposition: attachment`, and
 * `fl_attachment:<name>` sets the filename. Cloudinary appends whichever
 * extension `f_auto` settled on, so no extension is given here.
 *
 * The flag goes after the full reference chain as its own component, which
 * leaves the chain itself untouched. Built as a plain string rather than
 * through next-cloudinary so nothing gets inserted between the chain and the
 * flag.
 */
export function downloadUrl(
  publicId: string,
  spec: TransformSpec,
  baseName: string,
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const fileName = `${baseName}-${spec.id}`;

  return `https://res.cloudinary.com/${cloudName}/image/upload/${spec.reference}/fl_attachment:${fileName}/${publicId}`;
}
