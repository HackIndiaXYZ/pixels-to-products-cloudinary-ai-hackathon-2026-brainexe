import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

/**
 * Reached when a result link has no public id, or names an asset that is not
 * in this Cloudinary account. Worth handling properly: anyone can open
 * /result by hand, and an old link stops working once the asset is deleted.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex max-w-6xl flex-col items-start px-6 py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          Not found
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[1.08] tracking-[-0.02em] text-ink sm:text-5xl">
          That catalogue is no longer here.
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
          The link may be missing its photo reference, or the image it points
          to has been removed from Cloudinary. Upload a photo to build a new
          one.
        </p>
        <Link
          href="/"
          className="mt-8 border border-rule px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Start again
        </Link>
      </main>
    </>
  );
}
