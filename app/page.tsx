import Hero from "@/components/Hero";
import OutputSpec from "@/components/OutputSpec";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import SiteHeader from "@/components/SiteHeader";
import UploadCard from "@/components/UploadCard";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6">
        <Hero />

        <section id="upload" className="pb-20">
          <SectionLabel index="01">Upload a photo</SectionLabel>
          <Reveal className="mt-8">
            <UploadCard />
          </Reveal>
        </section>

        <section className="pb-24">
          <SectionLabel index="02">What comes back</SectionLabel>
          <Reveal>
            <OutputSpec />
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          <span>Built on Cloudinary</span>
          <span>Background removal, auto-tagging, captioning, crops</span>
        </div>
      </footer>
    </>
  );
}
