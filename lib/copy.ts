/**
 * Turns the Cloudinary caption and auto-tags into listing copy.
 *
 * project-detail.md says to use the caption as the description and the alt
 * text, and to derive a short title from the caption plus the top tags. That
 * is what happens here. No model call, just text handling, so it costs
 * nothing and cannot fail mid-demo.
 */

export type GeneratedCopy = {
  title: string;
  description: string;
  altText: string;
  tags: string[];
};

/** Marketplace titles get truncated around here, so stay under it. */
const MAX_TITLE_LENGTH = 70;

/**
 * A listing title names the thing. Captions describe a whole scene, and even
 * after the scene is cut off they can run long, so cap the words too.
 */
const MAX_TITLE_WORDS = 5;

/** How many tags to show as product tags. */
const MAX_TAGS = 12;

/**
 * Captions usually open with a count or article that does not belong in a
 * title: "Two purple sneakers...", "A brown leather bag...".
 */
const LEADING_QUANTIFIER =
  /^(?:a|an|the|one|two|three|four|five|several|some|a pair of|a set of)\s+/i;

/**
 * Where the subject ends and the scene description begins. Everything from
 * here on belongs in the description, not the title. The linking verbs matter
 * as much as the prepositions: captions often read "X is displayed on ...".
 */
const SCENE_BREAK =
  /\s+(?:with|against|on|in|next to|near|beside|and|that|which|placed|positioned|sitting|standing|displayed|set|resting|arranged|is|are|was|were|appears|sits|rests|lies|features?|featuring|shows?|showing|depicts?|depicting|contains?|includes?|displays?)\b/i;

/**
 * Subjects that name nothing. A caption like "The product is displayed on a
 * plain surface" yields one of these, and the tags describe the item better.
 */
const GENERIC_SUBJECTS = new Set([
  "product",
  "object",
  "item",
  "thing",
  "image",
  "photo",
  "picture",
  "view",
  "close-up",
  "closeup",
  "background",
]);

/**
 * Words that qualify a product rather than name it. Used to build titles that
 * read like listings, "Purple Running Shoe" rather than "Shoe Footwear".
 */
const DESCRIPTORS = new Set([
  "black", "white", "red", "blue", "green", "yellow", "purple", "pink",
  "orange", "brown", "grey", "gray", "beige", "gold", "silver", "navy",
  "maroon", "teal", "cream", "ivory",
  "leather", "cotton", "silk", "wool", "linen", "denim", "ceramic", "wooden",
  "wood", "metal", "brass", "steel", "glass", "jute", "cane", "bamboo",
  "rattan", "velvet", "satin", "khadi", "handwoven", "handmade",
]);

/** Words that stay lowercase inside a title. */
const MINOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "with",
]);

function titleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && MINOR_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function limitWords(input: string, limit: number): string {
  const words = input.split(/\s+/).filter(Boolean);
  return words.slice(0, limit).join(" ");
}

function truncate(input: string, limit: number): string {
  if (input.length <= limit) return input;
  const cut = input.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * Picks the most useful tag to name the product. Cloudinary returns tags
 * ordered by confidence, and a multi-word tag ("running shoe") says more than
 * a single word ("shoe"), so prefer the most specific of the strongest few.
 */
function mostSpecificTag(tags: string[]): string | null {
  const candidates = tags.slice(0, 8);
  if (candidates.length === 0) return null;

  const multiWord = candidates.filter((tag) => tag.includes(" "));
  return multiWord[0] ?? candidates[0];
}

/** The strongest colour or material tag, if the tags mention one. */
function descriptorTag(tags: string[]): string | null {
  return (
    tags.slice(0, 10).find((tag) => {
      const words = tag.toLowerCase().split(/\s+/);
      return words.length === 1 && DESCRIPTORS.has(words[0]);
    }) ?? null
  );
}

/**
 * Builds a title from tags alone, for when there is no usable caption.
 *
 * Reads as a listing would: a qualifier then the product, "Purple Running
 * Shoe". Joining the top tags instead would give "Shoe Footwear Sneakers",
 * which names the same thing three times.
 */
function titleFromTags(tags: string[]): string {
  const product = mostSpecificTag(tags);
  if (!product) return "";

  const descriptor = descriptorTag(tags);
  const productWords = new Set(product.toLowerCase().split(/\s+/));

  if (descriptor && !productWords.has(descriptor.toLowerCase())) {
    return titleCase(`${descriptor} ${product}`);
  }

  return titleCase(product);
}

/**
 * Pulls the subject out of a caption.
 *
 * "Two purple sneakers with white laces and soles are positioned against a
 * plain white background." becomes "Purple Sneakers".
 */
function titleFromCaption(caption: string): string {
  const firstSentence = caption.split(/(?<=[.!?])\s/)[0] ?? caption;

  const subject = firstSentence
    .replace(/[.!?]+$/, "")
    .replace(LEADING_QUANTIFIER, "")
    .split(SCENE_BREAK)[0]
    .replace(/[,;:]+$/, "")
    .trim();

  // "The product is displayed on ..." leaves "product", which names nothing.
  // Returning empty hands the job to the tags.
  const words = subject.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.every((word) => GENERIC_SUBJECTS.has(word))) return "";

  return titleCase(subject);
}

/**
 * Turns a title into something safe to use as a filename, for the download
 * buttons. Falls back to a fixed name so a title of only punctuation cannot
 * produce an empty filename.
 */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");

  return slug || "product";
}

export function generateCopy(
  caption: string | null,
  tags: string[],
): GeneratedCopy {
  const trimmedCaption = caption?.trim() || null;
  const cleanTags = tags.map((tag) => tag.trim()).filter(Boolean);

  let title = trimmedCaption ? titleFromCaption(trimmedCaption) : "";

  // A one-word subject like "Sneakers" is weak on a listing. A colour or
  // material from the tags fills it out. Another product tag would not: it
  // would just name the same thing twice.
  if (title && !title.includes(" ")) {
    const descriptor = descriptorTag(cleanTags);
    if (descriptor && descriptor.toLowerCase() !== title.toLowerCase()) {
      title = titleCase(`${descriptor} ${title}`);
    }
  }

  if (!title) title = titleFromTags(cleanTags);
  if (!title) title = "Untitled product";

  return {
    title: truncate(limitWords(title, MAX_TITLE_WORDS), MAX_TITLE_LENGTH),
    description: trimmedCaption ?? "",
    altText: trimmedCaption ?? "",
    tags: cleanTags.slice(0, MAX_TAGS),
  };
}
