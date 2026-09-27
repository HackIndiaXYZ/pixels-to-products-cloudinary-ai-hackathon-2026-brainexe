# PRD: Photo to Catalog

Working title. Rename if you want a real brand name later.

## One line

A seller uploads one rough phone photo of a product and gets back a full set of launch-ready images plus a written title, description, alt text, and tags.

## The problem

Small sellers shoot products on a phone against a messy background. To actually list a product they need a clean shot, correct crops for each platform (Amazon square, Instagram feed, story, website banner), and written copy like a title and tags. Doing this by hand or paying a designer is slow and costs money. Most of them just upload the raw photo and it looks bad, which hurts sales.

## The user

A small or first-time online seller. Think handloom sellers, home-run D2C brands, someone starting on Amazon or Instagram. They can take a photo but they are not designers and they do not have editing software.

## What the product does

The seller uploads one image. The product runs it through a fixed pipeline and returns:

1. A clean product shot with the background removed and a plain white backdrop.
2. Crops for four targets, each keeping the product fully in frame:
   - 1:1 for marketplace listings (Amazon, Flipkart)
   - 4:5 for Instagram feed
   - 9:16 for story and reel
   - 16:9 for a website banner
3. A generated title, a short description, alt text, and a list of tags, all based on what is actually in the photo.
4. Every image delivered in an optimized format and quality.

The seller reviews the results on one screen and downloads what they need.

## Why this can place top 3

- It solves a real workflow, not a generic demo. Judges see a painful task get done in one step.
- It uses several of Cloudinary's own image features together (background removal, content-aware crop, generative fill, captioning, auto-tagging), which is exactly what the Cloudinary judging team rewards.
- The demo reads in ten seconds: bad photo in, full catalog out.
- The India angle is real. Small sellers are a large and relatable market.

## Goals

- A working app where anyone can upload a photo and see the full output.
- Cloudinary doing real work at every step, not just storing a file.
- A build that one person can finish and polish in the time available.

## Scope for this build

In scope:

- Single image upload
- Background removal and white backdrop
- The four platform crops listed above
- Generated title, description, alt text, tags
- Optimized delivery
- One clean results screen with download

Out of scope for now (mention as future ideas in the README, do not build):

- Video support
- Bulk upload of many products at once
- User accounts and saved history
- Payment or any subscription
- Generative background scenes beyond plain white (keep as an optional stretch, see project-detail.md)

## Success criteria

- Upload to full result works end to end without manual steps.
- The product stays fully inside every crop, never cut off.
- Title, description, and tags match the actual product in the photo.
- Page loads fast and images are optimized.
- Repo has a clear README and a two to four minute demo video.

## Submission checklist (from the hackathon rules)

- [ ] Public GitHub repo with setup instructions
- [ ] README covering the track, the problem, how Cloudinary is used, and how to test
- [ ] Two to four minute demo video showing the product and the Cloudinary workflow
- [ ] Cloudinary feedback survey completed (mandatory, no survey means no prize)
- [ ] No API keys or credentials committed to the repo

## Track

Track 1: AI Media Pipelines. Media goes in, Cloudinary's features do the work, useful output comes out.
