// Séparateur de section en vague, inspiré de la vague du logo : une crête qui monte de gauche à droite et retombe en
// rouleau, avec un liseré d'écume. SVG inline (< 1 Ko), décoratif, aucune animation.

interface Props {
  /** Couleur de la section qui suit (le séparateur « coule » dans cette section). */
  couleur?: string;
  /** Liseré dégradé cyan → fuchsia (la vague du logo) au-dessus de la crête. */
  degrade?: boolean;
  className?: string;
  retourne?: boolean;
}

export default function Vague({ couleur = 'var(--color-perle)', degrade = false, className = 'h-10 w-full', retourne = false }: Props) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none block ${retourne ? 'rotate-180' : ''} ${className}`}
    >
      {degrade && (
        <defs>
          <linearGradient id="vague-degrade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#10e9fb" />
            <stop offset="0.38" stopColor="#0363e9" />
            <stop offset="0.68" stopColor="#6106e2" />
            <stop offset="1" stopColor="#f613ea" />
          </linearGradient>
        </defs>
      )}
      {degrade && (
        <path
          d="M0 62 C 220 62 380 30 620 26 C 860 22 1000 52 1160 38 C 1270 28 1330 6 1400 10 C 1430 12 1440 22 1440 22"
          fill="none"
          stroke="url(#vague-degrade)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      <path
        d="M0 70 C 220 70 380 38 620 34 C 860 30 1000 60 1160 46 C 1270 36 1330 14 1400 18 C 1430 20 1440 30 1440 30 L 1440 80 L 0 80 Z"
        fill={couleur}
      />
    </svg>
  );
}
