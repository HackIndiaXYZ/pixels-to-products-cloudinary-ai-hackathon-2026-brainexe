import Link from "next/link";
import { notFound } from "next/navigation";
import CopyPanel from "@/components/CopyPanel";
import Reveal from "@/components/Reveal";
import ResultGallery from "@/components/ResultGallery";
import SiteHeader from "@/components/SiteHeader";
import { getAsset } from "@/lib/cloudinary";
import { generateCopy, slugify } from "@/lib/copy";

type Props = {
  searchParams: Promise<{ publicId?: string }>;
};

export default async function ResultPage({ searchParams }: Props) {
  const { publicId } = await searchParams;

  if (!publicId) notFound();

  const asset = await getAsset(publicId);
  if (!asset) notFound();

  const copy = generateCopy(asset.caption, asset.tags);
  const baseName = slugify(copy.title);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 pt-14 pb-12">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
              Your catalogue
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.08] tracking-[-0.02em] text-ink sm:text-5xl">
              {copy.title}
            </h1>
          </div>
          <Link
            href="/"
            className="border border-rule px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Upload another
          </Link>
        </div>

        <div className="grid gap-12 pb-20 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
          <ResultGallery
            publicId={asset.publicId}
            caption={asset.caption}
            baseName={baseName}
          />
          {/* Sticky so the copy stays readable while scrolling the crops. */}
          <Reveal className="lg:sticky lg:top-8">
            <CopyPanel copy={copy} />
          </Reveal>
        </div>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono text-[11px] tracking-[0.14em] text-ink-faint">
          <span className="uppercase">Source asset</span>
          <span className="break-all">{asset.publicId}</span>
        </div>
      </footer>
    </>
  );
}
