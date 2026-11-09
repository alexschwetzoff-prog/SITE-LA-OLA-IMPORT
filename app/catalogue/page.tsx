import type { Metadata } from 'next';
import Link from 'next/link';
import Catalogo from '@/components/catalogo/Catalogo';
import { NoLoVes } from '@/components/catalogo/NoLoVes';
import { NotaPrecios } from '@/components/catalogo/NotaPrecios';
import { CATEGORIAS } from '@/data/categorias';
import { PRODUCTOS_ACTIVOS, conteoPorCategoria, datosTarjeta } from '@/lib/catalogo';

export const metadata: Metadata = {
  title: 'Catalogue : textiles et objets personnalisés avec votre logo',
  description:
    'T-shirts, polos, sweats, casquettes, sacs et goodies personnalisés avec votre logo dans notre atelier de Monteux (Vaucluse). Prix sur devis, selon la quantité et la technique.',
  alternates: { canonical: '/catalogue' },
};

// Page statique : les 30 produits sont dans le HTML et les filtres s'appliquent dans le navigateur.
export const ensureStatic = 'navigation';

export default function PaginaCatalogo() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36">
      <nav aria-label="Fil d’Ariane" className="mb-4 text-sm text-ardoise">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="underline-offset-4 hover:text-marine hover:underline">
              Accueil
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-marine">
            Catalogue
          </li>
        </ol>
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">Catalogue</h1>
          <p className="mt-3 text-lg text-ardoise">
            Textiles et objets à personnaliser avec votre logo dans notre atelier de Monteux. Choisissez un article : nous vous
            préparons un devis sur mesure.
          </p>
        </div>
        <NotaPrecios className="max-w-md" />
      </div>
      <Catalogo productos={PRODUCTOS_ACTIVOS.map(datosTarjeta)} categorias={CATEGORIAS} conteo={conteoPorCategoria()} />
      <NoLoVes />
    </section>
  );
}
