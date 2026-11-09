import type { ComponentProps, ReactNode } from 'react';
import Link from 'next/link';

// Boutons du site, tous en pilule : « principal » (fuchsia, réservé aux actions : devis, panier, envoi),
// « secundario » (contour violet), « claro » (contour marine, sur cartes et panneaux clairs) et « enlace ».

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-[background-color,box-shadow,color,transform] duration-200 motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const ESTILO_BOTON = {
  principal: `${base} bg-fuchsia-700 text-white shadow-md shadow-fuchsia-700/25 hover:bg-fuchsia-800`,
  secundario: `${base} border-2 border-violet-600 text-violet-600 hover:bg-violet-600/8`,
  claro: `${base} border-2 border-marine/80 text-marine hover:bg-marine/5`,
  enlace: 'inline-flex items-center gap-1.5 text-sm font-semibold text-bleu-600 underline-offset-4 hover:text-indigo-700 hover:underline',
} as const;

type Variante = keyof typeof ESTILO_BOTON;
type Tamano = 'normal' | 'grande';

const TAMANO: Record<Tamano, string> = { normal: '', grande: 'px-6 py-3 text-base' };

interface PropsEnlace extends Omit<ComponentProps<typeof Link>, 'className'> {
  variante?: Variante;
  tamano?: Tamano;
  className?: string;
  children: ReactNode;
}

export function BotonEnlace({ variante = 'principal', tamano = 'normal', className = '', children, ...props }: PropsEnlace) {
  return (
    <Link className={`${ESTILO_BOTON[variante]} ${TAMANO[tamano]} ${className}`} {...props}>
      {children}
    </Link>
  );
}

interface PropsBoton extends Omit<ComponentProps<'button'>, 'className'> {
  variante?: Variante;
  tamano?: Tamano;
  className?: string;
}

export function Boton({ variante = 'principal', tamano = 'normal', className = '', type = 'button', children, ...props }: PropsBoton) {
  return (
    <button type={type} className={`${ESTILO_BOTON[variante]} ${TAMANO[tamano]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/** Flecha pequeña para los botones y enlaces «Ver …». */
export function Flecha({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M4 10h12m-5-5 5 5-5 5" />
    </svg>
  );
}
