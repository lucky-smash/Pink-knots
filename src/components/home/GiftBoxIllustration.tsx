// Static gift box used before WebGL is ready, when WebGL is unavailable,
// and on low-power devices. Same palette and proportions as the 3D box.
export function GiftBoxIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 400" className={className} role="img" aria-label="A charcoal Pink Knots gift box tied with a red satin bow">
      <defs>
        <radialGradient id="gbi-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#1a1613" stopOpacity="0.32" />
          <stop offset="1" stopColor="#1a1613" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gbi-front" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2b2420" />
          <stop offset="1" stopColor="#1a1613" />
        </linearGradient>
        <linearGradient id="gbi-side" x1="0" x2="1">
          <stop offset="0" stopColor="#14110f" />
          <stop offset="1" stopColor="#221c19" />
        </linearGradient>
        <linearGradient id="gbi-ribbon" x1="0" x2="1">
          <stop offset="0" stopColor="#a32109" />
          <stop offset="0.5" stopColor="#d8391c" />
          <stop offset="1" stopColor="#a32109" />
        </linearGradient>
      </defs>
      <ellipse cx="210" cy="352" rx="170" ry="26" fill="url(#gbi-shadow)" />
      {/* base */}
      <path d="M70 190 L210 240 L210 350 L70 300 Z" fill="url(#gbi-front)" />
      <path d="M210 240 L350 190 L350 300 L210 350 Z" fill="url(#gbi-side)" />
      {/* lid */}
      <path d="M58 150 L210 204 L210 246 L58 192 Z" fill="#2a2320" />
      <path d="M210 204 L362 150 L362 192 L210 246 Z" fill="#1c1714" />
      <path d="M58 150 L210 96 L362 150 L210 204 Z" fill="#2f2824" />
      {/* ribbon over lid and down both faces */}
      <path d="M134 123 L286 177 L262 185.5 L110 131.5 Z" fill="url(#gbi-ribbon)" />
      <path d="M286 123 L134 177 L158 185.5 L310 131.5 Z" fill="url(#gbi-ribbon)" />
      <path d="M134 177 L158 185.5 L158 227.5 L134 219 Z M158 280 L158 330 L134 321.5 L134 271 Z" fill="#b8270d" />
      <path d="M262 185.5 L286 177 L286 219 L262 227.5 Z M262 280 L286 271 L286 321.5 L262 330 Z" fill="#9c1f09" />
      <path d="M134 219 L158 227.5 L158 280 L134 271 Z" fill="#b8270d" />
      <path d="M262 227.5 L286 219 L286 271 L262 280 Z" fill="#9c1f09" />
      {/* bow */}
      <path d="M210 150 C170 112 120 108 126 136 C131 158 178 160 210 150 Z" fill="#c82a0f" />
      <path d="M210 150 C250 112 300 108 294 136 C289 158 242 160 210 150 Z" fill="#c82a0f" />
      <path d="M210 150 C186 132 150 128 150 138 C151 146 184 152 210 150 Z" fill="#8f1d08" opacity="0.5" />
      <path d="M210 150 C234 132 270 128 270 138 C269 146 236 152 210 150 Z" fill="#8f1d08" opacity="0.5" />
      <path d="M204 154 L176 200 L190 204 L210 162 Z" fill="#b8270d" />
      <path d="M216 154 L244 200 L230 204 L210 162 Z" fill="#a32109" />
      <rect x="196" y="138" width="28" height="22" rx="7" fill="#d4361a" />
    </svg>
  );
}
