import ImageTile from "@/components/ImageTile";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import { CLEAN_SHOT, CROPS } from "@/lib/transforms";

type Props = {
  publicId: string;
  caption: string | null;
  /** Slug used to name downloaded files. */
  baseName: string;
};

export default function ResultGallery({ publicId, caption, baseName }: Props) {
  return (
    <div className="space-y-16">
      <section>
        <SectionLabel index="01">Clean shot</SectionLabel>
        <Reveal className="mt-8 max-w-lg">
          <ImageTile
            spec={CLEAN_SHOT}
            publicId={publicId}
            caption={caption}
            baseName={baseName}
            featured
          />
        </Reveal>
      </section>

      <section>
        <SectionLabel index="02">Platform crops</SectionLabel>
        <Reveal
          stagger
          className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4"
        >
          {CROPS.map((spec) => (
            <ImageTile
              key={spec.id}
              spec={spec}
              publicId={publicId}
              caption={caption}
              baseName={baseName}
            />
          ))}
        </Reveal>
      </section>
    </div>
  );
}
