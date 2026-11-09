'use client';

// Catálogo interactivo (sección 4 y 7): filtros por categoría y etiqueta, barra de categorías fija tipo panel de
// navegación con indicador que se desliza, y las tarjetas que se alejan y llegan en cascada al cambiar de filtro
// (View Transitions de React). Los filtros van en la URL (?categoria=…&etiquetas=…) para poder compartirlos.
// El HTML inicial lleva los 30 productos; los filtros de la URL se aplican al hidratar.

import { ViewTransition, startTransition, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { Categoria } from '@/data/catalogo';
import type { DatosTarjeta } from '@/lib/catalogo';
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
      <h2 className="sr-only">Productos</h2>
      {/* Barra de categorías: panel de navegación fijo bajo la cabecera */}
      <div className="sticky top-16 z-30 -mx-4 border-y border-moon-50/10 bg-space-950/80 backdrop-blur-md sm:-mx-6 lg:top-20 lg:-mx-8">
        <div ref={barraRef} role="group" aria-label="Categoría" className="relative mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8 [scrollbar-width:none]">
          <span
            ref={indicadorRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-2 bottom-2 left-0 w-0 rounded-full bg-moon-50/12 opacity-0 ring-1 ring-star-300/60 motion-safe:transition-[transform,width] motion-safe:duration-300 motion-safe:ease-[var(--ease-nave)]"
          />
          <BotonCategoria activo={filtros.categoria === null} onClick={() => elegirCategoria(null)} nombre="Todo" cantidad={total} />
          {categorias.map((c) => (
            <BotonCategoria key={c.id} activo={filtros.categoria === c.id} onClick={() => elegirCategoria(c.id)} nombre={c.nombre} cantidad={conteo[c.id]} categoria={c.id} />
          ))}
        </div>
      </div>

      {/* Etiquetas */}
      <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Etiquetas">
        <span className="mr-1 text-xs font-medium text-mist-300">Filtrar por</span>
        {FILTROS_ETIQUETA.map((e) => {
          const activo = filtros.etiquetas.includes(e.id);
          return (
            <button
              key={e.id}
              type="button"
              aria-pressed={activo}
              onClick={() => alternarEtiqueta(e.id)}
              className="rounded-full border border-moon-50/20 px-3 py-1 text-xs font-medium text-mist-300 transition-colors hover:border-moon-50/40 hover:text-moon-50 aria-pressed:border-star-300 aria-pressed:bg-star-300/15 aria-pressed:text-moon-50"
            >
              {e.nombre}
            </button>
          );
        })}
      </div>

      <p id={idResultados} role="status" aria-live="polite" className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist-300">
        <span>
          {visibles.length === total ? `${total} productos` : `${visibles.length} de ${total} productos`}
          {filtros.categoria ? ` · ${categorias.find((c) => c.id === filtros.categoria)?.nombre}` : ''}
          {filtros.etiquetas.length ? ` · ${filtros.etiquetas.map((e) => FILTROS_ETIQUETA.find((x) => x.id === e)?.nombre).join(' + ')}` : ''}
        </span>
        {hayFiltros && (
          <button type="button" onClick={() => cambiar(SIN_FILTROS)} className="font-semibold text-nova-400 underline-offset-4 hover:text-star-300 hover:underline">
            Quitar filtros
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
        <div className="mt-8 rounded-3xl border border-dashed border-moon-50/20 p-10 text-center">
          <p className="text-lg text-moon-50">Ningún producto cumple esos filtros.</p>
          <button type="button" onClick={() => cambiar(SIN_FILTROS)} className="mt-3 font-semibold text-nova-400 underline-offset-4 hover:text-star-300 hover:underline">
            Ver todo el catálogo
          </button>
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
      className="relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap text-mist-300 transition-colors hover:text-moon-50 aria-pressed:text-moon-50"
    >
      {categoria && <IconoCategoria categoria={categoria} className="h-4 w-4 text-star-300/90" />}
      {nombre}
      <span className="text-xs text-mist-300/70">{cantidad}</span>
    </button>
  );
}
