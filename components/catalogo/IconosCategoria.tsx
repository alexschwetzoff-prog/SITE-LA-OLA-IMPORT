import type { SVGProps } from 'react';
import type { Categoria } from '@/data/catalogo';

// Icônes au trait des catégories du catalogue. Dessin maison, sans marque de tiers.

type Props = SVGProps<SVGSVGElement>;
const comun = { viewBox: '0 0 32 32', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

function Camiseta(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M11 6l5 2 5-2 6 4-3 5-2-1v14H10V14l-2 1-3-5z" />
    </svg>
  );
}

function Sudadera(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M12 7c0-2 8-2 8 0M12 7l-7 4 2 5 3-1v13h12V15l3 1 2-5-7-4" />
      <path d="M12 7c1 3 7 3 8 0M13 28v-4h6v4" />
    </svg>
  );
}

function Gorra(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M6 19a10 10 0 0 1 20 0v2H6z" />
      <path d="M4 21h22c3 0 4 1 4 2s-2 2-5 2H6" />
      <path d="M16 9V7" />
    </svg>
  );
}

function Bolsa(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M8 13h16l1 15H7z" />
      <path d="M11 13V9a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function Goodies(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M12 6h5a5 5 0 0 1 0 10h-1" />
      <path d="M11 6v22M9 28h6" />
      <circle cx="22" cy="23" r="4" />
      <path d="M22 17v2" />
    </svg>
  );
}

function Sombrero(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M10 18c0-6 2-10 6-10s6 4 6 10" />
      <path d="M3 21c0-2 6-3 13-3s13 1 13 3-6 4-13 4S3 23 3 21z" />
      <path d="M10 18c4 1 8 1 12 0" />
    </svg>
  );
}

function Toalla(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M6 8h20v17H6z" />
      <path d="M6 12h20M6 21h20" />
      <path d="M9 25v3M13 25v3M19 25v3M23 25v3" />
    </svg>
  );
}

function Couteau(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M6 22l15-15c2-2 5 0 4 2l-3 6-6 4-7 4z" />
      <path d="M8 24l-2 2" />
    </svg>
  );
}

export const ICONO_CATEGORIA: Record<Categoria, (p: Props) => React.JSX.Element> = {
  'camisetas-polos': Camiseta,
  sudaderas: Sudadera,
  gorras: Gorra,
  bolsas: Bolsa,
  goodies: Goodies,
  sombreros: Sombrero,
  couteaux: Couteau,
  'toallas-ponchos': Toalla,
};

export function IconoCategoria({ categoria, ...props }: Props & { categoria: Categoria }) {
  const Icono = ICONO_CATEGORIA[categoria];
  return <Icono {...props} />;
}
