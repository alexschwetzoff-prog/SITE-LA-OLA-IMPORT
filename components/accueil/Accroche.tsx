import Link from 'next/link';
import { BotonEnlace, Flecha } from '@/components/ui/Botones';
import Vague from '@/components/ui/Vague';
import Personnalisables from './Personnalisables';
import { CTA, SITE, TEXTOS } from '@/lib/site';

// Premier écran : accroche courte FUSIONNÉE avec la grille des catégories, pour que l'offre soit visible tout de suite
// (pas de grand visuel qui la repousse). L'élément LCP est le titre texte ; seules les deux premières vignettes sont
// chargées en priorité.

export default function Accroche() {
  return (
    <section className="fond-alt relative pt-24 lg:pt-28">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-wide text-violet-600 uppercase">Atelier de personnalisation à Monteux</p>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-marine sm:text-5xl lg:text-6xl">
              {SITE.lema}
            </h1>
            <p className="mt-3 text-lg text-ardoise">
              Textiles, objets publicitaires et souvenirs à vos couleurs, imprimés dans notre atelier du Vaucluse. Pour votre
              entreprise, votre club, votre camping, votre boutique… ou pour vous.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BotonEnlace href={CTA.href} tamano="grande">
              {CTA.etiqueta}
            </BotonEnlace>
            <BotonEnlace href="/boutique" variante="secundario" tamano="grande">
              Voir la boutique
              <Flecha />
            </BotonEnlace>
          </div>
        </div>

        <h2 className="mt-8 font-display text-2xl font-extrabold text-marine">Des produits à personnaliser avec votre logo</h2>
        <Personnalisables />
        <p className="mt-3 text-sm text-ardoise">
          Chapeaux, serviettes de plage, ponchos et le reste du catalogue : <Link href="/boutique" className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">voir toute la boutique</Link>.
        </p>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 pb-10 text-sm text-marine" aria-label="Nos engagements">
          {TEXTOS.datosCatalogo.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-400" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <Vague couleur="var(--bg-page)" degrade className="h-12 w-full" />
    </section>
  );
}
