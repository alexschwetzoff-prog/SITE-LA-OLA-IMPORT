import type { Metadata } from 'next';
import Link from 'next/link';
import Boutique, { type PestanaDatos } from '@/components/boutique/Boutique';
import { NotaPrecios } from '@/components/catalogo/NotaPrecios';
import { pestanasBoutique } from '@/data/categorias';
import { PRODUCTOS_ACTIVOS, datosTarjeta, sePersonaliza } from '@/lib/catalogo';

export const metadata: Metadata = {
  title: 'Boutique : tous nos produits',
  description:
    'Tous les produits de La Ola Import, à Monteux (Vaucluse) : vêtements, casquettes et chapeaux, sacs, serviettes et ponchos, couteaux et goodies. Prix réservés aux professionnels.',
  alternates: { canonical: '/boutique' },
};

// Page statique : tous les produits sont dans le HTML (onglet « Tout ») ; l'onglet de l'URL s'applique dans le navigateur.
export const ensureStatic = 'navigation';

export default function PaginaBoutique() {
  const productos = PRODUCTOS_ACTIVOS;
  // Onglets générés depuis data/categorias.ts ; ceux sans produit sont masqués.
  const pestanas: PestanaDatos[] = pestanasBoutique()
    .map((t) => ({
      slug: t.slug,
      nombre: t.nombre,
      slugs: productos
        .filter((p) =>
          t.personalizable !== undefined ? sePersonaliza(p) === t.personalizable : t.etiqueta ? p.etiquetas.includes(t.etiqueta) : t.categorias.includes(p.categoria),
        )
        .map((p) => p.slug),
    }))
    .filter((t) => t.slugs.length > 0);
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
            Boutique
          </li>
        </ol>
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">Boutique</h1>
          <p className="mt-3 text-lg text-ardoise">Tous nos produits au même endroit. Les articles « Personnalisable » peuvent recevoir votre logo ; les « Articles boutique » sont proposés sans personnalisation. Choisissez un article : nous vous préparons un devis sur mesure.</p>
        </div>
        <NotaPrecios className="max-w-md" />
      </div>
      <Boutique productos={productos.map(datosTarjeta)} pestanas={pestanas} />
    </section>
  );
}
