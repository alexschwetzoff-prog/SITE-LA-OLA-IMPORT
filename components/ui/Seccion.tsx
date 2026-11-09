import type { ReactNode } from 'react';
import { IconoDestello } from '@/components/layout/Iconos';

interface Props {
  id: string;
  /** Número de escala del viaje de la home (lo lee el panel de mandos). */
  escala?: number;
  /** Nombre corto para el panel de mandos (por defecto, el título). */
  nombre?: string;
  etiqueta?: string; // línea pequeña sobre el titular, en nova-400
  titulo: string;
  intro?: ReactNode;
  children: ReactNode;
  ancho?: 'normal' | 'ancho';
  className?: string;
}

/** Una escala del viaje: destello separador, etiqueta, titular literal y contenido. */
export function Seccion({ id, escala, nombre, etiqueta, titulo, intro, children, ancho = 'normal', className = '' }: Props) {
  return (
    <section
      id={id}
      data-escala={escala}
      data-nombre={nombre ?? titulo}
      className={`relative mx-auto w-full ${ancho === 'ancho' ? 'max-w-7xl' : 'max-w-6xl'} scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-24 ${className}`}
    >
      <Separador />
      <div className="max-w-3xl">
        {etiqueta && <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-nova-400 uppercase">{etiqueta}</p>}
        <h2 className="font-display text-3xl font-semibold tracking-tight text-moon-50 sm:text-4xl">{titulo}</h2>
        {intro && <div className="mt-4 text-lg text-mist-300">{intro}</div>}
      </div>
      {children}
    </section>
  );
}

/** Separador de destello: una línea fina con el destello de cuatro puntas del catálogo. */
export function Separador({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-4 top-0 flex items-center gap-3 sm:inset-x-6 lg:inset-x-8 ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-moon-50/15 to-moon-50/25" />
      <IconoDestello className="h-3.5 w-3.5 text-star-300/80" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-moon-50/15 to-moon-50/25" />
    </div>
  );
}
