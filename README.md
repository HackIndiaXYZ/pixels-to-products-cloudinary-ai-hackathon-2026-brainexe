# Photo to Catalog

A small seller uploads one rough phone photo of a product and gets back five
launch-ready images plus the words to list it with.

**Track 1 — AI Media Pipelines.** Media goes in, Cloudinary does the work,
useful output comes out.


## The problem

Small sellers shoot products on a phone against a messy background. To list
that product they need a clean shot, a different crop for every platform, and
written copy. Doing it by hand is slow, and paying a designer costs money most
first-time sellers do not have. So they upload the raw photo, it looks bad,
and it costs them sales.

This does the whole job from one upload, with no editing software and nothing
to configure.

## What you get from one photo

| # | Output | Ratio | For |
| --- | --- | --- | --- |
| 01 | Clean shot | 1:1 | Background removed, plain white backdrop |
| 02 | Marketplace | 1:1 | Amazon, Flipkart listing |
| 03 | Instagram feed | 4:5 | Feed post |
| 04 | Story and reel | 9:16 | Story, reel cover |
| 05 | Website banner | 16:9 | Shop header |

Plus a title, a description, alt text, and product tags, all taken from what
is actually in the photo. Every image has its own download button.

## How Cloudinary is used

Cloudinary does the work at every step. It is not storage here.

**On upload** (`app/api/process/route.ts`), one call to the Node SDK does
three things at once:

| Feature | Parameter | What it gives |
| --- | --- | --- |
| Auto-tagging | `categorization` + `auto_tagging: 0.6` | Product tags above 60% confidence |
| AI Content Analysis | `detection: "captioning"` | A sentence describing the photo |
| Upload | `folder`, `resource_type` | The stored asset |

The caption is written back onto the asset as context metadata under the
`alt` key, so the alt text travels with the image rather than living only in
one page.

**On delivery**, the result screen renders that same asset through five
transformation chains:

```text
e_background_removal/b_white,c_pad,ar_1:1,w_1600/f_auto,q_auto
c_fill,g_auto,ar_1:1,w_1600/f_auto,q_auto
e_background_removal/b_white,c_pad,ar_4:5,w_1080/f_auto,q_auto
e_background_removal/b_white,c_pad,ar_9:16,w_1080/f_auto,q_auto
c_fill,g_auto,ar_16:9,w_1600/f_auto,q_auto
```

So the Cloudinary features actually doing work are background removal,
content-aware cropping with `g_auto`, padding onto a white backdrop,
auto-tagging, AI captioning, `fl_attachment` for downloads, and `f_auto,q_auto`
on every chain so each image is delivered in the best format and quality for
the browser asking for it.

## How to test it

1. Start the app locally (see below) and open <http://localhost:3000>.
2. Drop in a product photo. A rough one against a messy background shows the
   most: the point is that it does not need to be a good photo.
3. The clean shot appears with the background removed on white. Background
   removal is prepared on first request, so a tile may say "Removing
   background" for a few seconds and fill in by itself.
4. Scroll the four crops. The product stays fully in frame in each one.
5. Read the listing copy on the right. Every field has a copy button.
6. Press Download on any image.

Images are capped at 4.5 MB.

## Running it locally

```sh
npm install
```

Copy `.env.example` to `.env.local` and fill in your own Cloudinary values:

```sh
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
# optional, defaults to google_tagging
CLOUDINARY_CATEGORIZATION=
```

`.env.local` is gitignored and no keys are committed.

```sh
npm run dev
```

Then open <http://localhost:3000>.

### Add-ons to register first

Auto-tagging and captioning are Cloudinary add-ons. Register them at
<https://console.cloudinary.com/settings/addons>:

- One auto-tagging add-on: Google, Imagga, or Rekognition. Set
  `CLOUDINARY_CATEGORIZATION` to match the one you registered.
- Cloudinary AI Content Analysis, for the caption.

If an add-on is not registered the upload still succeeds, the images still
work, and the screen says which add-on is missing. A locked add-on never
takes the whole thing down. The server remembers a missing add-on for the
life of the process, so restart after registering one.

Background removal and content-aware cropping are delivery transformations
and need no registration.

### Deploying

Works on Vercel with no extra configuration. Set the same environment
variables in the Vercel dashboard. `npm run build` must be run with the dev
server stopped, since they share the `.next` directory.

---

## Implementation notes

Everything below is for reading the code, not for using the product.

## Layout

```text
app/
  page.tsx                upload screen
  result/page.tsx         result screen
  not-found.tsx           bad or expired result link
  error.tsx               Cloudinary unreachable
  opengraph-image.tsx     link preview card
  api/process/route.ts    upload, tagging, caption
components/
  UploadCard.tsx          drag and drop, preview, upload
  ResultGallery.tsx       clean shot plus the four crops
  ImageTile.tsx           one image, its download, the 423 retry
  CopyPanel.tsx           title, description, alt text, tags
  Hero.tsx                headline reveal
  SmoothScroll.tsx        Lenis on the GSAP ticker
  Reveal.tsx              scroll-triggered reveal
  OutputSpec.tsx          the five outputs as a spec sheet
  SiteHeader.tsx          shared chrome
  SectionLabel.tsx        numbered section rule
lib/
  cloudinary.ts           server SDK config, add-on settings, asset lookup
  transforms.ts           the five outputs and their exact chains
  copy.ts                 caption and tags into listing copy
  upload.ts               limits and types shared with the browser
scripts/
  check-transforms.ts     asserts the chains still match the spec
```

## Transformation chains

`lib/transforms.ts` holds the five outputs. Each records its exact chain, and
that chain is what gets sent, through the `rawTransformations` prop on
`CldImage`.

The chain is passed directly rather than built from the CldImage props,
because the props build a different chain. For the crops the difference is
only parameter order. For the clean shot it is not: given `removeBackground`,
`crop="pad"` and `background="white"`, next-cloudinary emits
`e_background_removal/b_white/c_pad,...`, putting `b_white` in its own
component, which makes the result unpredictable.

`npm run check:transforms` asserts the generated URL still starts with the
recorded chain. Run it after touching `lib/transforms.ts`.

### Why two ratios pad instead of fill

`c_fill` fills the target frame and cuts whatever does not fit, so it cannot
keep a whole product in frame when the target ratio is far from the source
ratio. Measured on a near-square source it clipped the product at 4:5 and
clipped it badly at 9:16, which breaks the rule that the product stays fully
inside every crop.

Those two pad onto white instead, the same treatment as the clean shot. 1:1
and 16:9 keep `c_fill,g_auto`: both frame a near-square source without
meaningful loss, and padding 1:1 onto white would make it byte-identical to
the clean shot, so the seller would download the same file twice.

## Listing copy

`lib/copy.ts` turns the caption and tags into a title, description, alt text
and tags. It is plain text handling, no model call, so it costs nothing and
cannot fail mid-demo. The caption itself comes from Cloudinary's AI.

The description and alt text are the caption. The title is the caption's
subject with the scene stripped off and a five-word cap, so "An isometric
digital illustration features various small shops and a house in the
foreground..." becomes "Isometric Digital Illustration". When the caption
names nothing useful, for example "The product is displayed on a plain
surface", the title falls back to the strongest colour or material tag plus
the most specific product tag, giving "Ceramic Coffee Cup" rather than
"Product Is".

## Downloads

Each tile links to its image with `fl_attachment:<name>` appended after the
chain as its own component. Cloudinary then sends
`Content-Disposition: attachment`, names the file, and appends whichever
extension `f_auto` settled on. The filename comes from the generated title,
so the story crop for "Purple Sneakers" downloads as
`purple-sneakers-story.jpg`.

The URL is built as a plain string rather than through next-cloudinary, so
nothing gets inserted between the chain and the flag.

## Interface

Warm paper and ink with hairline rules, set in Fraunces, IBM Plex Sans and
IBM Plex Mono. Sections are numbered and the outputs are listed as a spec
sheet rather than a landing page. The transformation chains stay out of the
interface: they belong in the code and in this file, not in front of a seller
trying to list a product.

Motion is three libraries, each doing one job:

- Lenis for smooth scrolling, driven off GSAP's ticker. Two independent loops
  would leave ScrollTrigger a frame behind the scroll.
- GSAP for the headline reveal and the scroll-triggered section reveals.
- anime.js for interface feedback: the preview stagger, the copy button
  press, the tag chips.

All of it checks `prefers-reduced-motion` and does nothing when it is set.
Elements that animate in start hidden in CSS, with a `<noscript>` override so
they are never permanently invisible if scripting fails.

## Handling the parts that fail

- **Locked add-on.** Cloudinary rejects the whole upload if any requested
  add-on is unsubscribed, not just that add-on. The route reads the error,
  drops the add-on it names, and retries. At most three attempts, and the
  plain upload always succeeds.
- **423 on background removal.** Cloudinary answers 423 while preparing a
  derived image. Each tile retries at 1.5s, 3s, 5s and 8s before showing a
  manual button.
- **Missing or deleted asset.** `/result` with an unknown public id shows a
  not-found screen, not a crash.
- **Cloudinary unreachable.** An error boundary catches it with a retry,
  rather than showing a stack trace.

## Limits

Uploads are capped at 4.5 MB, the Vercel serverless request body limit.
Larger files would need a signed direct-to-Cloudinary upload, which is not in
this build.

## Not in this build

Video, bulk upload, user accounts, saved history, payments, and generative
background scenes beyond a plain white backdrop.
