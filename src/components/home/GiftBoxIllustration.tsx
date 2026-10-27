// Static gift box used before WebGL is ready, when WebGL is unavailable,
// and on low-power devices. Same palette and proportions as the 3D box.

// The logo's infinity knot on the lid, the same lemniscate as giftBoxScene's infinityKnotGeometry.
// It's drawn as two halves that meet at the loop tips: the over half (magenta, running "\" through
// the centre) is laid on top of the under half (green, running "/").
const KNOT = { cx: 210, cy: 118, w: 150, h: 58 };
function knotHalf(over: boolean) {
  const pts: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = (over ? 0 : Math.PI) + (i / 64) * Math.PI;
    const s = Math.sin(t);
    const c = Math.cos(t);
    const den = 1 + s * s;
    pts.push(`${(KNOT.cx + ((KNOT.w / 2) * c) / den).toFixed(1)} ${(KNOT.cy + (KNOT.h * 1.42 * s * c) / den).toFixed(1)}`);
  }
  return `M${pts.join("L")}`;
}
const KNOT_UNDER_HALF = knotHalf(false);
const KNOT_OVER_HALF = knotHalf(true);

export function GiftBoxIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 400" className={className} role="img" aria-label="An aubergine Pink Knots gift box tied with a magenta satin ribbon and the Pink Knots infinity knot">
      <defs>
        <radialGradient id="gbi-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#210f31" stopOpacity="0.32" />
          <stop offset="1" stopColor="#210f31" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gbi-front" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#33203f" />
          <stop offset="1" stopColor="#210f31" />
        </linearGradient>
        <linearGradient id="gbi-side" x1="0" x2="1">
          <stop offset="0" stopColor="#1a0c27" />
          <stop offset="1" stopColor="#2a1838" />
        </linearGradient>
        <linearGradient id="gbi-ribbon" x1="0" x2="1">
          <stop offset="0" stopColor="#8a1586" />
          <stop offset="0.5" stopColor="#c42aa8" />
          <stop offset="1" stopColor="#8a1586" />
        </linearGradient>
        {/* The logo ribbon, left to right: indigo tips, green under strand, magenta over strand */}
        <linearGradient id="gbi-knot-under" gradientUnits="userSpaceOnUse" x1="135" x2="285" y1="0" y2="0">
          <stop offset="0" stopColor="#13106d" />
          <stop offset="0.22" stopColor="#4aa538" />
          <stop offset="0.5" stopColor="#80e63e" />
          <stop offset="0.75" stopColor="#e9ff79" />
          <stop offset="1" stopColor="#13106d" />
        </linearGradient>
        <linearGradient id="gbi-knot-over" gradientUnits="userSpaceOnUse" x1="135" x2="285" y1="0" y2="0">
          <stop offset="0" stopColor="#13106d" />
          <stop offset="0.2" stopColor="#58167d" />
          <stop offset="0.5" stopColor="#e73ac6" />
          <stop offset="0.78" stopColor="#b2209a" />
          <stop offset="1" stopColor="#58167d" />
        </linearGradient>
      </defs>
      <ellipse cx="210" cy="352" rx="170" ry="26" fill="url(#gbi-shadow)" />
      {/* base */}
      <path d="M70 190 L210 240 L210 350 L70 300 Z" fill="url(#gbi-front)" />
      <path d="M210 240 L350 190 L350 300 L210 350 Z" fill="url(#gbi-side)" />
      {/* lid */}
      <path d="M58 150 L210 204 L210 246 L58 192 Z" fill="#33203f" />
      <path d="M210 204 L362 150 L362 192 L210 246 Z" fill="#231230" />
      <path d="M58 150 L210 96 L362 150 L210 204 Z" fill="#3a2647" />
      {/* ribbon over lid and down both faces */}
      <path d="M134 123 L286 177 L262 185.5 L110 131.5 Z" fill="url(#gbi-ribbon)" />
      <path d="M286 123 L134 177 L158 185.5 L310 131.5 Z" fill="url(#gbi-ribbon)" />
      <path d="M134 177 L158 185.5 L158 227.5 L134 219 Z M158 280 L158 330 L134 321.5 L134 271 Z" fill="#a41d8e" />
      <path d="M262 185.5 L286 177 L286 219 L262 227.5 Z M262 280 L286 271 L286 321.5 L262 330 Z" fill="#8a1586" />
      <path d="M134 219 L158 227.5 L158 280 L134 271 Z" fill="#a41d8e" />
      <path d="M262 227.5 L286 219 L286 271 L262 280 Z" fill="#8a1586" />
      {/* bow: the logo's infinity knot, standing on the ribbon crossing */}
      <g fill="none" strokeWidth="11">
        <path d={KNOT_UNDER_HALF} stroke="url(#gbi-knot-under)" />
        {/* a soft shadow where the over strand crosses */}
        <path d={KNOT_OVER_HALF} stroke="#210f31" strokeOpacity="0.3" strokeWidth="15" pathLength={100} strokeDasharray="0 41 18 100" />
        <path d={KNOT_OVER_HALF} stroke="url(#gbi-knot-over)" />
      </g>
    </svg>
  );
}
