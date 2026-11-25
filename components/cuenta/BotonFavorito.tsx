'use client';

import { useCuenta } from './almacen';

/** Corazón de favoritos: accesible (aria-pressed y etiqueta que cambia). Sin sesión se guarda en este navegador. */
export default function BotonFavorito({ slug, variante = '', nombre, className = '' }: { slug: string; variante?: string; nombre: string; className?: string }) {
  const activo = useCuenta((s) => s.favoritos.some((f) => f.producto_slug === slug && f.variante === variante));
  const alternar = useCuenta((s) => s.alternarFavorito);
  return (
    <button
      type="button"
      aria-pressed={activo}
      aria-label={`${activo ? 'Retirer des favoris' : 'Ajouter aux favoris'} : ${nombre}${variante ? ` (${variante})` : ''}`}
      title={activo ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void alternar(slug, variante);
      }}
      className={`relative z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ardoise shadow-carte ring-1 ring-marine/10 transition-colors hover:text-fuchsia-700 focus-visible:ring-2 focus-visible:ring-bleu-600 ${activo ? 'text-fuchsia-700' : ''} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.8 8 3.6 5 6.6 5c1.9 0 3.5 1 5.4 3 1.9-2 3.5-3 5.4-3 3 0 4.8 3 3.8 6.1-1.7 4.8-9.2 9.4-9.2 9.4z" />
      </svg>
    </button>
  );
}
