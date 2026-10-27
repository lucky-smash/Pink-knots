import Image from "next/image";

// A product photo on the violet mat (--color-mat) — the light window inside the aubergine .card-box — framed by the inset hairline of the hero's
// "made for you" card. Cut-outs (shot on white) are multiplied into the mat so the piece
// sits on the brand ground; scene photos fill the frame. Size and round it with className;
// hover effects key off a parent `group`.
export function ProductPhoto({
  src,
  alt,
  cutout,
  sizes,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  cutout: boolean;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative isolate overflow-hidden bg-mat ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`${cutout ? "object-contain p-[9%] mix-blend-multiply" : "object-cover"} transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-2.5 rounded-[calc(var(--radius-card)-0.5rem)] border transition-colors duration-[var(--duration-base)] ${
          cutout ? "border-knot/20 group-hover:border-knot/60" : "border-paper/55 group-hover:border-paper"
        }`}
      />
    </div>
  );
}
