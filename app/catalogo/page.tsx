import type { Metadata } from 'next';
import Catalogo from '@/components/catalogo/Catalogo';
import { NoLoVes } from '@/components/catalogo/NoLoVes';
import { NotaPrecios } from '@/components/catalogo/NotaPrecios';
import { CATEGORIAS } from '@/data/categorias';
import { PRODUCTOS_ACTIVOS, conteoPorCategoria, datosTarjeta } from '@/lib/catalogo';

export const metadata: Metadata = {
  title: 'Catálogo 2026-2027',
  description:
    'Camisetas, polos, sudaderas, gorras, bolsas y goodies para personalizar con tu logo. Precios «desde» por unidad y pedidos desde 25 unidades. Con sede en Valencia.',
  alternates: { canonical: '/catalogo' },
};

// Página estática: los 30 productos van en el HTML y los filtros se aplican en el navegador.
export const ensureStatic = 'navigation';

export default function PaginaCatalogo() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div data-cielo-evitar>
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-nova-400 uppercase">Catálogo 2026-2027</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-moon-50 sm:text-5xl">Todo lo que personalizamos, con tu logo.</h1>
        </div>
        <NotaPrecios className="max-w-md" />
      </div>
      <Catalogo productos={PRODUCTOS_ACTIVOS.map(datosTarjeta)} categorias={CATEGORIAS} conteo={conteoPorCategoria()} />
      <NotaPrecios className="mt-10" />
      <NoLoVes />
    </section>
  );
}
