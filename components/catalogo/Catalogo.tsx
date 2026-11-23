'use client';

// Catalogue interactif : filtres par catégorie et par étiquette, barre de catégories collante avec un indicateur qui
// glisse, et cartes qui s'effacent puis arrivent en cascade au changement de filtre (View Transitions de React). Les
// filtres vont dans l'URL (?categoria=…&etiquetas=…) pour pouvoir les partager. Le HTML initial contient les 30
// produits ; les filtres de l'URL s'appliquent à l'hydratation.

import { ViewTransition, startTransition, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Categoria } from '@/data/catalogo';
import type { DatosTarjeta } from '@/lib/catalogo';
import { CTA } from '@/lib/site';
import { FILTROS_ETIQUETA, esCategoria, esFiltroEtiqueta, filtrarProductos, type FiltroEtiqueta } from '@/lib/filtros';
import { IconoCategoria } from './IconosCategoria';
import { TarjetaProducto } from './TarjetaProducto';

interface Filtros {
  categoria: Categoria | null;
  etiquetas: FiltroEtiqueta[];
}

const SIN_FILTROS: Filtros = { categoria: null, etiquetas: [] };

function leerFiltros(search: string): Filtros {
  const p = new URLSearchParams(search);
  const categoria = p.get('categoria');
  const etiquetas = (p.get('etiquetas') ?? '').split(',').filter(esFiltroEtiqueta);
  return { categoria: esCategoria(categoria) ? categoria : null, etiquetas };
}

function escribirFiltros(f: Filtros) {
  const p = new URLSearchParams();
  if (f.categoria) p.set('categoria', f.categoria);
  if (f.etiquetas.length) p.set('etiquetas', f.etiquetas.join(','));
  const query = p.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

function igual(a: Filtros, b: Filtros) {
  return a.categoria === b.categoria && a.etiquetas.length === b.etiquetas.length && a.etiquetas.every((e) => b.etiquetas.includes(e));
}

interface Props {
  productos: DatosTarjeta[]; // calculados en el servidor: el catálogo no carga data/catalogo.ts en el navegador
  categorias: { id: Categoria; nombre: string }[];
  conteo: Record<Categoria, number>;
}

export default function Catalogo({ productos, categorias, conteo }: Props) {
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);
  const barraRef = useRef<HTMLDivElement>(null);
  const indicadorRef = useRef<HTMLSpanElement>(null);
  const idResultados = useId();

  // Filtros de la URL al llegar (enlaces desde la home o compartidos) y al ir atrás o adelante.
  useEffect(() => {
    const aplicar = () => {
      const f = leerFiltros(window.location.search);
      startTransition(() => setFiltros((actual) => (igual(actual, f) ? actual : f)));
    };
    aplicar();
    window.addEventListener('popstate', aplicar);
    return () => window.removeEventListener('popstate', aplicar);
  }, []);

  const cambiar = (f: Filtros) => {
    escribirFiltros(f);
    startTransition(() => setFiltros(f));
  };

  const elegirCategoria = (categoria: Categoria | null) => cambiar({ ...filtros, categoria });
  const alternarEtiqueta = (e: FiltroEtiqueta) =>
    cambiar({ ...filtros, etiquetas: filtros.etiquetas.includes(e) ? filtros.etiquetas.filter((x) => x !== e) : [...filtros.etiquetas, e] });

  // El indicador de la barra de categorías se desliza hasta el botón activo (se mide en el DOM, sin estado).
  useLayoutEffect(() => {
    const barra = barraRef.current;
    const indicador = indicadorRef.current;
    if (!barra || !indicador) return;
    const mover = () => {
      const activo = barra.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!activo) return;
      indicador.style.transform = `translateX(${activo.offsetLeft}px)`;
      indicador.style.width = `${activo.offsetWidth}px`;
      indicador.style.opacity = '1';
      activo.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    };
    mover();
    const observador = new ResizeObserver(mover);
    observador.observe(barra);
    return () => observador.disconnect();
  }, [filtros.categoria]);

  const visibles = filtrarProductos(productos, filtros.categoria, filtros.etiquetas);
  const hayFiltros = filtros.categoria !== null || filtros.etiquetas.length > 0;
  const total = productos.length;

  return (
    <div>
      <h2 className="sr-only">Produits</h2>
      {/* Barre de catégories, collante sous l'en-tête */}
      <div className="sticky top-16 z-30 -mx-4 border-y border-marine/10 bg-fond/80 backdrop-blur-md sm:-mx-6 lg:top-20 lg:-mx-8">
        <div ref={barraRef} role="group" aria-label="Catégorie" className="relative mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8 [scrollbar-width:none]">
          <span
            ref={indicadorRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-2 bottom-2 left-0 w-0 rounded-full bg-white opacity-0 shadow-carte ring-2 ring-marine motion-safe:transition-[transform,width] motion-safe:duration-300 motion-safe:ease-[var(--ease-douce)]"
          />
          <BotonCategoria activo={filtros.categoria === null} onClick={() => elegirCategoria(null)} nombre="Tout" cantidad={total} />
          {categorias.map((c) => (
            <BotonCategoria key={c.id} activo={filtros.categoria === c.id} onClick={() => elegirCategoria(c.id)} nombre={c.nombre} cantidad={conteo[c.id]} categoria={c.id} />
          ))}
        </div>
      </div>

      {/* Étiquettes */}
      <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Étiquettes">
        <span className="mr-1 text-xs font-medium text-ardoise">Filtrer :</span>
        {FILTROS_ETIQUETA.map((e) => {
          const activo = filtros.etiquetas.includes(e.id);
          return (
            <button
              key={e.id}
              type="button"
              aria-pressed={activo}
              onClick={() => alternarEtiqueta(e.id)}
              className="min-h-8 rounded-full border border-marine/20 bg-white px-3 py-1 text-xs font-medium text-ardoise transition-colors hover:border-marine/40 hover:text-marine aria-pressed:border-marine aria-pressed:bg-marine aria-pressed:text-white"
            >
              {e.nombre}
            </button>
          );
        })}
      </div>

      <p id={idResultados} role="status" aria-live="polite" className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ardoise">
        <span>
          {visibles.length === total ? `${total} produits` : `${visibles.length} sur ${total} produits`}
          {filtros.categoria ? ` · ${categorias.find((c) => c.id === filtros.categoria)?.nombre}` : ''}
          {filtros.etiquetas.length ? ` · ${filtros.etiquetas.map((e) => FILTROS_ETIQUETA.find((x) => x.id === e)?.nombre).join(' + ')}` : ''}
        </span>
        {hayFiltros && (
          <button type="button" onClick={() => cambiar(SIN_FILTROS)} className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
            Effacer les filtres
          </button>
        )}
      </p>

      {visibles.length ? (
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-describedby={idResultados}>
          {visibles.map((p, i) => (
            <ViewTransition key={p.slug} name={`tarjeta-${p.slug}`} enter={`tarjeta-llega-${Math.min(i, 5)}`} exit="tarjeta-sale" update="tarjeta-mueve" default="tarjeta-mueve">
              <li className="min-w-0">
                <TarjetaProducto datos={p} prioridad={i === 0 ? 'alta' : i < 3} />
              </li>
            </ViewTransition>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-marine/20 bg-perle p-10 text-center">
          <p className="text-lg text-marine">Aucun produit ne correspond à ces filtres.</p>
          <button type="button" onClick={() => cambiar(SIN_FILTROS)} className="mt-3 font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
            Voir tout le catalogue
          </button>
          <p className="mt-4 text-sm text-ardoise">
            Vous cherchez autre chose ?{' '}
            <Link href={CTA.href} className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
              Demandez-nous
            </Link>
            , nous regardons ce qu’il est possible de faire.
          </p>
        </div>
      )}
    </div>
  );
}

function BotonCategoria({ activo, onClick, nombre, cantidad, categoria }: { activo: boolean; onClick: () => void; nombre: string; cantidad: number; categoria?: Categoria }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className="relative z-10 flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap text-ardoise transition-colors hover:text-marine aria-pressed:font-semibold aria-pressed:text-marine"
    >
      {categoria && <IconoCategoria categoria={categoria} className="h-4 w-4 text-bleu-600" />}
      {nombre}
      <span className="text-xs text-ardoise">{cantidad}</span>
    </button>
  );
}
