interface Props {
  children: React.ReactNode;
  /** Use the light variant on ink backgrounds. */
  tone?: "default" | "onInk";
  className?: string;
}

/** Small uppercase label with a leading accent dash, used above headings. */
export default function Eyebrow({
  children,
  tone = "default",
  className = "",
}: Props) {
  return (
    <p
      className={`text-site-xs flex items-center gap-2.5 font-medium tracking-[0.14em] uppercase ${
        tone === "onInk" ? "text-site-on-ink-muted" : "text-site-ink-soft"
      } ${className}`}
    >
      <span
        className="bg-site-accent inline-block h-px w-[18px]"
        aria-hidden="true"
      />
      {children}
    </p>
  );
}
