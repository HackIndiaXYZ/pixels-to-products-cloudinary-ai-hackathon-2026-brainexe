import { TRANSFORMS } from "@/lib/transforms";

/**
 * The five outputs listed as a spec sheet, so a seller can see what they get
 * before uploading anything. The transformation chains stay out of the
 * interface: they belong in the code and the README, not in front of someone
 * trying to list a product.
 */
export default function OutputSpec() {
  return (
    <ul className="mt-8 border-t border-rule-soft">
      {TRANSFORMS.map((spec, index) => (
        <li
          key={spec.id}
          className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-rule-soft py-5 sm:grid-cols-[2.5rem_14rem_5rem_1fr] sm:items-baseline"
        >
          <span className="font-mono text-[11px] tracking-[0.14em] text-ink-faint">
            {String(index + 1).padStart(2, "0")}
          </span>

          <span className="font-display text-xl tracking-tight text-ink">
            {spec.label}
          </span>

          <span className="col-start-2 font-mono text-[11px] tracking-[0.14em] text-accent sm:col-start-3">
            {spec.aspectRatio}
          </span>

          <span className="col-start-2 mt-1 text-sm text-ink-soft sm:col-start-4 sm:mt-0">
            {spec.useCase}
          </span>
        </li>
      ))}
    </ul>
  );
}
