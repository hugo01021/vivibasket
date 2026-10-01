/**
 * Illustration originale de l'accueil : demi-terrain vu de dessus, trajectoire
 * du ballon et jauge de probabilité. 100 % SVG, couleurs de la charte.
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 300" className={className} role="img" aria-labelledby="hero-art-title">
      <title id="hero-art-title">Demi-terrain de basket avec trajectoire de tir et jauge de probabilité</title>
      <defs>
        <linearGradient id="court" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1b21" />
          <stop offset="1" stopColor="#111115" />
        </linearGradient>
        <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff7a1a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* parquet */}
      <rect x="20" y="40" width="320" height="230" rx="18" fill="url(#court)" stroke="#34343f" />
      {Array.from({ length: 11 }).map((_, i) => (
        <line key={i} x1={20} y1={60 + i * 20} x2={340} y2={60 + i * 20} stroke="#f4f1ec" strokeOpacity="0.03" />
      ))}

      {/* tracés du terrain */}
      <g stroke="#9a9aa6" strokeOpacity="0.55" strokeWidth="2" fill="none">
        <path d="M60 270 V 140 a120 120 0 0 1 240 0 V 270" />
        <rect x="130" y="180" width="100" height="90" />
        <circle cx="180" cy="180" r="30" />
        <path d="M150 270 a30 30 0 0 1 60 0" />
      </g>
      <circle cx="180" cy="252" r="7" stroke="#ff7a1a" strokeWidth="2.5" fill="none" />
      <line x1="160" y1="266" x2="200" y2="266" stroke="#ff7a1a" strokeWidth="3" strokeLinecap="round" />

      {/* trajectoire du tir */}
      <path d="M82 118 C 120 20, 200 20, 180 246" stroke="#ff7a1a" strokeWidth="2.2" strokeDasharray="4 6" fill="none" strokeLinecap="round" />
      <circle cx="82" cy="118" r="22" fill="url(#halo)" />
      <circle cx="82" cy="118" r="11" fill="#ff7a1a" />
      <path d="M71 118h22M82 107v22M74.5 110.5c4.2 4.2 4.2 10.8 0 15M89.5 110.5c-4.2 4.2-4.2 10.8 0 15" stroke="#1a0d04" strokeWidth="1.2" fill="none" />

      {/* jauge de probabilité */}
      <g transform="translate(206 56)">
        <rect width="124" height="64" rx="12" fill="#141418" stroke="#34343f" />
        <text x="12" y="20" fill="#9a9aa6" fontSize="9" fontFamily="ui-sans-serif, system-ui" letterSpacing="1">
          PROBABILITÉ
        </text>
        <rect x="12" y="30" width="100" height="10" rx="5" fill="#23232b" />
        <rect x="12" y="30" width="63" height="10" rx="5" fill="#ff7a1a" />
        <text x="12" y="56" fill="#f4f1ec" fontSize="12" fontWeight="700" fontFamily="ui-sans-serif, system-ui">
          63 %
        </text>
        <text x="112" y="56" fill="#9a9aa6" fontSize="12" fontWeight="700" textAnchor="end" fontFamily="ui-sans-serif, system-ui">
          37 %
        </text>
      </g>

      {/* étiquette score projeté */}
      <g transform="translate(30 56)">
        <rect width="104" height="40" rx="10" fill="#141418" stroke="#34343f" />
        <text x="10" y="16" fill="#9a9aa6" fontSize="8.5" fontFamily="ui-sans-serif, system-ui" letterSpacing="1">
          SCORE PROJETÉ
        </text>
        <text x="10" y="32" fill="#f4f1ec" fontSize="13" fontWeight="700" fontFamily="ui-sans-serif, system-ui">
          112 – 108
        </text>
      </g>
    </svg>
  );
}
