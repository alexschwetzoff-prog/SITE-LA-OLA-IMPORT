import type { SVGProps } from 'react';

// Iconos de línea de la home (datos del hero, qué hacemos, para quién). Dibujo propio.

type Props = SVGProps<SVGSVGElement>;
const comun = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export function IconoSede(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M12 21s6-5.2 6-10a6 6 0 0 0-12 0c0 4.8 6 10 6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

export function IconoReloj(props: Props) {
  return (
    <svg {...comun} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconoEntrega(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.7" />
      <circle cx="17" cy="17.5" r="1.7" />
    </svg>
  );
}

export function IconoPrensa(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M5 4h14v5H5zM7 9v3m10-3v3M4 12h16v8H4z" />
      <path d="M8 16h8" />
    </svg>
  );
}

export function IconoMerch(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M9 3h6l1 4H8zM8 7h8v13H8z" />
      <path d="M10 11h4" />
      <circle cx="18.5" cy="17.5" r="2.5" />
    </svg>
  );
}

export function IconoAcompanar(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M4 6h12a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-5l-4 3v-3H4z" />
      <path d="M8 10h7M8 13h4" />
    </svg>
  );
}

export function IconoLocal(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M4 9l1.5-4h13L20 9M4 9h16v2a2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0z" />
      <path d="M6 12v8h12v-8M10 20v-4h4v4" />
    </svg>
  );
}

export function IconoPack(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M3 8h18v4H3zM5 12v8h14v-8M12 8v12" />
      <path d="M12 8c-3 0-4-1.5-4-3s3-1 4 3c1-4 4-4 4-3s-1 3-4 3z" />
    </svg>
  );
}

export function IconoEquipo(props: Props) {
  return (
    <svg {...comun} {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 18a4 4 0 0 1 6 0" />
    </svg>
  );
}

export function IconoSubir(props: Props) {
  return (
    <svg {...comun} {...props}>
      <path d="M12 16V5m0 0-4 4m4-4 4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
