import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "paper";

const variants: Record<Variant, string> = {
  primary:
    "bg-site-accent text-site-on-accent border border-site-accent hover:opacity-90",
  ghost:
    "bg-transparent text-site-ink border border-site-hairline-strong hover:border-site-ink",
  paper:
    "bg-site-paper text-site-ink border border-site-paper hover:opacity-90",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

/** A button on the site's tokens, for the starter's own chrome (rendered blocks use `.hl-btn`). */
export default function Button({
  variant = "primary",
  fullWidth = false,
  type = "button",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`rounded-site-pill inline-flex min-h-11 items-center justify-center px-6 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
