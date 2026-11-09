import type { ComponentProps, ReactNode } from 'react';
import Link from 'next/link';

// Botones de toda la web (sección 7): el principal en nova-600 con brillo al pasar, el secundario con borde fino
// sobre fondo oscuro y la variante clara para las tarjetas y fichas (texto ink-900 sobre moon-50).

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-[background-color,box-shadow,color,transform] duration-200 motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const ESTILO_BOTON = {
  principal: `${base} bg-nova-600 text-white shadow-lg shadow-nova-600/30 hover:bg-nova-400 hover:shadow-nova-400/40`,
  secundario: `${base} border border-moon-50/25 text-moon-50 hover:border-moon-50/40 hover:bg-moon-50/10`,
  claro: `${base} border border-ink-900/15 text-ink-900 hover:border-ink-900/30 hover:bg-ink-900/5`,
  enlace: 'inline-flex items-center gap-1.5 text-sm font-semibold text-nova-400 underline-offset-4 hover:text-star-300 hover:underline',
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
