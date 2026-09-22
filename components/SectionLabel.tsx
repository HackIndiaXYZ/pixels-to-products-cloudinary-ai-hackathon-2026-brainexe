type Props = {
  /** Two-digit step number, for example "01". */
  index: string;
  children: React.ReactNode;
};

/** The numbered rule that opens each section, like a spec sheet. */
export default function SectionLabel({ index, children }: Props) {
  return (
    <div className="flex items-baseline gap-4 border-t border-rule pt-4">
      <span className="font-mono text-[11px] tracking-[0.18em] text-accent">
        {index}
      </span>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
        {children}
      </h2>
    </div>
  );
}
