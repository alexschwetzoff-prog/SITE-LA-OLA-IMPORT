'use client';

// Boutique : tous les produits actifs, avec des onglets par catégorie (générés depuis data/categorias.ts). L'onglet vit
// dans l'URL (?cat=couteaux) : on peut le partager et le bouton Précédent revient à l'onglet d'avant. Onglets accessibles :
// role="tablist", flèches, Début et Fin au clavier. Le HTML initial contient l'onglet « Tout » ; l'onglet de l'URL
// s'applique à l'hydratation.

import { startTransition, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import type { DatosTarjeta } from '@/lib/catalogo';
import { CONTACTO } from '@/lib/site';
import { TarjetaProducto } from '@/components/catalogo/TarjetaProducto';

export interface PestanaDatos {
  slug: string;
  nombre: string;
  /** Ids de los productos de la pestaña (en el orden del catálogo). */
  slugs: string[];
}

const TODO = 'tout';

function leerPestana(search: string, validas: Set<string>): string {
  const cat = new URLSearchParams(search).get('cat');
  return cat && validas.has(cat) ? cat : TODO;
}

export default function Boutique({ productos, pestanas }: { productos: DatosTarjeta[]; pestanas: PestanaDatos[] }) {
  const todas: PestanaDatos[] = [{ slug: TODO, nombre: 'Tout', slugs: productos.map((p) => p.slug) }, ...pestanas];
  const validas = new Set(todas.map((t) => t.slug));
  const [activa, setActiva] = useState(TODO);
  const id = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const porSlug = new Map(productos.map((p) => [p.slug, p]));

  // Pestaña de la URL al llegar y al ir atrás o adelante.
  useEffect(() => {
    const aplicar = () => startTransition(() => setActiva(leerPestana(window.location.search, validas)));
    aplicar();
    window.addEventListener('popstate', aplicar);
    return () => window.removeEventListener('popstate', aplicar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elegir = (slug: string, enfocar = false) => {
    if (slug !== activa) {
      const url = slug === TODO ? window.location.pathname : `${window.location.pathname}?cat=${slug}`;
      window.history.pushState(window.history.state, '', url); // pushState: el botón Atrás vuelve a la pestaña anterior
      startTransition(() => setActiva(slug));
    }
    if (enfocar) refs.current[slug]?.focus();
  };

  const alTeclado = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = todas.length;
    const destino = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (destino < 0) return;
    e.preventDefault();
    elegir(todas[destino].slug, true);
  };

  const pestana = todas.find((t) => t.slug === activa) ?? todas[0];
  const visibles = pestana.slugs.map((s) => porSlug.get(s)).filter((p): p is DatosTarjeta => Boolean(p));

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-y border-marine/10 bg-fond/80 backdrop-blur-md sm:-mx-6 lg:top-20 lg:-mx-8">
        <div role="tablist" aria-label="Catégories de la boutique" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8 [scrollbar-width:none]">
          {todas.map((t, i) => {
            const seleccionada = t.slug === pestana.slug;
            return (
              <button
                key={t.slug}
                ref={(el) => {
                  refs.current[t.slug] = el;
                }}
                role="tab"
                type="button"
                id={`${id}-tab-${t.slug}`}
                aria-selected={seleccionada}
                aria-controls={`${id}-panel`}
                tabIndex={seleccionada ? 0 : -1}
                onClick={() => elegir(t.slug)}
                onKeyDown={(e) => alTeclado(e, i)}
                className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap text-ardoise transition-colors hover:text-marine focus-visible:ring-2 focus-visible:ring-bleu-600 aria-selected:bg-white aria-selected:font-semibold aria-selected:text-marine aria-selected:shadow-carte aria-selected:ring-2 aria-selected:ring-marine"
              >
                {t.nombre}
                <span className="text-xs text-ardoise">{t.slugs.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${pestana.slug}`} tabIndex={0} className="mt-6 focus-visible:outline-none">
        <p role="status" aria-live="polite" className="text-sm text-ardoise">
          {visibles.length} {visibles.length > 1 ? 'produits' : 'produit'}
          {pestana.slug !== TODO ? ` · ${pestana.nombre}` : ''}
        </p>
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((p, i) => (
            <li key={p.slug} className="min-w-0">
              <TarjetaProducto datos={p} prioridad={i === 0 ? 'alta' : i < 3} />
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-ardoise">
          Vous ne trouvez pas ce qu’il vous faut ?{' '}
          <Link href={CONTACTO.href} className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
            Demandez-nous
          </Link>
          , nous regardons ce qu’il est possible de faire.
        </p>
      </div>
    </div>
  );
}
