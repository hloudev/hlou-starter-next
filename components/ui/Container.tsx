interface Props {
  children: React.ReactNode;
  className?: string;
}

/** Centred page container — the renderer's content width with responsive inline gutters. */
export default function Container({ children, className = "" }: Props) {
  return (
    <div className={`max-w-site-content mx-auto px-5 md:px-10 ${className}`}>
      {children}
    </div>
  );
}
