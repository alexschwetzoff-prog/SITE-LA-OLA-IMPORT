import Link from 'next/link';
import { IconoCategoria } from '@/components/catalogo/IconosCategoria';
import { NotaPrecios } from '@/components/catalogo/NotaPrecios';
import { TarjetaProducto } from '@/components/catalogo/TarjetaProducto';
import { BotonEnlace, Flecha } from '@/components/ui/Botones';
import { Seccion } from '@/components/ui/Seccion';
import { DESTACADOS } from '@/data/catalogo';
import { CATEGORIAS } from '@/data/categorias';
import { conteoPorCategoria, datosTarjeta } from '@/lib/catalogo';

/** Escala 4: los tres destacados y las cinco categorías (planetas) con su número de productos. */
export default function CatalogoDestacado() {
  const conteo = conteoPorCategoria();
  return (
    <Seccion id="catalogo" escala={4} nombre="Catálogo" etiqueta="Catálogo 2026-2027" titulo="30 productos elegidos pensando en los negocios a los que nos dirigimos." intro={`Camisetas y polos, sudaderas, gorras, bolsas y goodies. Los ${DESTACADOS.length} destacados, para empezar.`}>
      {/* Fase 4.4: 5 destacados (Atomic 150, Austral, Clásica, Bahrain y Zenith) */}
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DESTACADOS.map((p) => (
          <li key={p.slug}>
            <TarjetaProducto datos={datosTarjeta(p)} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" />
          </li>
        ))}
      </ul>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Categorías">
        {CATEGORIAS.map((c) => (
          <li key={c.id}>
            <Link
              href={`/catalogo?categoria=${c.id}`}
              className="group flex h-full flex-col items-center gap-2 rounded-3xl border border-moon-50/10 bg-space-900/50 px-3 py-5 text-center transition-colors hover:border-star-300/50 hover:bg-space-900/80"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(84,153,239,0.7),rgba(11,36,112,0.9)_70%)] text-moon-50 shadow-[0_0_30px_-8px_rgba(84,153,239,0.8)] transition-transform group-hover:scale-105 motion-reduce:transition-none">
                <IconoCategoria categoria={c.id} className="h-7 w-7" />
              </span>
              <span className="font-display text-sm font-semibold text-moon-50">{c.nombre}</span>
              <span className="text-xs text-mist-300">
                {conteo[c.id]} {conteo[c.id] === 1 ? 'producto' : 'productos'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <NotaPrecios className="max-w-xl" />
        <BotonEnlace href="/catalogo" variante="secundario" className="shrink-0">
          Ver catálogo completo
          <Flecha />
        </BotonEnlace>
      </div>
    </Seccion>
  );
}
