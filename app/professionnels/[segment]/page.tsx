import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BandeauFinal from '@/components/accueil/BandeauFinal';
import { TarjetaProducto } from '@/components/catalogo/TarjetaProducto';
import { BotonEnlace, Flecha } from '@/components/ui/Botones';
import { Seccion } from '@/components/ui/Seccion';
import { CONTENU_SEGMENTS, getSegment } from '@/data/segments';
import { PRODUCTOS_ACTIVOS, datosTarjeta } from '@/lib/catalogo';

// Pages segment B2B, statiques : une par cible (clubs, campings, boutiques, entreprises). Ici, le bouton principal
// (fuchsia) est « Demander un devis » : c'est l'intention dominante d'un acheteur professionnel.
export const ensureStatic = 'navigation';

export function generateStaticParams() {
  return CONTENU_SEGMENTS.map((s) => ({ segment: s.slug }));
}

export async function generateMetadata({ params }: PageProps<'/professionnels/[segment]'>): Promise<Metadata> {
  const { segment } = await params;
  const s = getSegment(segment);
  if (!s) return {};
  return {
    title: `${s.titre} : textiles et objets personnalisés`,
    description: `${s.accroche} Atelier de personnalisation à Monteux (Vaucluse).`,
    alternates: { canonical: `/professionnels/${s.slug}` },
  };
}

export default async function PageSegment({ params }: PageProps<'/professionnels/[segment]'>) {
  const { segment } = await params;
  const s = getSegment(segment);
  if (!s) notFound();
  const produits = PRODUCTOS_ACTIVOS.filter((p) => s.categories.includes(p.categoria))
    .sort((a, b) => Number(b.destacado) - Number(a.destacado))
    .slice(0, 6);

  return (
    <>
      <section className="bg-perle pt-28 pb-12 lg:pt-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-wide text-violet-600 uppercase">Professionnels · {s.titre}</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">{s.accroche}</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <BotonEnlace href={`/devis?segment=${s.slug}`} tamano="grande">
              Demander un devis
            </BotonEnlace>
            <BotonEnlace href="/catalogue" variante="secundario" tamano="grande">
              Voir le catalogue
              <Flecha />
            </BotonEnlace>
          </div>
        </div>
      </section>

      <Seccion id="besoins" etiqueta="Ce qu’on fait pour vous" titulo="Pensé pour vos besoins">
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {s.besoins.map((b) => (
            <li key={b.titre} className="rounded-2xl bg-white p-5 shadow-carte ring-1 ring-marine/5">
              <h3 className="font-display text-lg font-extrabold text-marine">{b.titre}</h3>
              <p className="mt-1 text-ardoise">{b.texte}</p>
            </li>
          ))}
        </ul>
        <h3 className="mt-10 font-display text-xl font-extrabold text-marine">Quelques idées</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {s.idees.map((i) => (
            <li key={i} className="rounded-full bg-cyan-300/20 px-4 py-2 text-sm font-semibold text-marine">
              {i}
            </li>
          ))}
        </ul>
      </Seccion>

      {produits.length > 0 && (
        <Seccion id="produits" etiqueta="Dans le catalogue" titulo="Des produits pour commencer" fond="perle">
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {produits.map((p) => (
              <li key={p.slug}>
                <TarjetaProducto datos={datosTarjeta(p)} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" />
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <BandeauFinal />
    </>
  );
}
