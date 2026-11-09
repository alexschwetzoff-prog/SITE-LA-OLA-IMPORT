import type { Metadata } from 'next';
import BandeauFinal from '@/components/accueil/BandeauFinal';
import PhotoAFournir from '@/components/ui/PhotoAFournir';
import { Seccion } from '@/components/ui/Seccion';
import { ETAPES } from '@/data/equipe';
import { TEXTOS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Comment nous travaillons',
  description:
    'De votre idée à la pièce finie, tout se passe dans notre atelier de Monteux : conseil, bon à tirer, impression DTF et UV, contrôle et retrait ou livraison.',
  alternates: { canonical: '/comment-nous-travaillons' },
};

export const ensureStatic = 'navigation';

// FAQ : uniquement des réponses vraies aujourd'hui ; ce qui dépend des règles commerciales est [à confirmer].
const FAQ = [
  { q: 'Quels fichiers faut-il pour mon logo ?', r: 'Idéalement un fichier vectoriel (SVG, PDF, AI) ou un PNG de bonne qualité. Si vous n’avez qu’une photo ou un croquis, envoyez-le quand même : on regarde ensemble.' },
  { q: 'Est-ce que je vois le résultat avant l’impression ?', r: 'Oui. Vous recevez un BAT (bon à tirer) et rien n’est imprimé sans votre accord.' },
  { q: 'Y a-t-il une quantité minimale ?', r: TEXTOS.pedidoMinimo },
  { q: 'Quels sont les délais ?', r: TEXTOS.plazoEntrega },
  { q: 'Puis-je venir à l’atelier ?', r: 'Notre showroom est à Monteux. Horaires et modalités de visite : [à confirmer].' },
];

export default function CommentNousTravaillons() {
  return (
    <>
      <section className="bg-perle pt-28 pb-12 lg:pt-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-wide text-violet-600 uppercase">Comment nous travaillons</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">
            De votre idée à la pièce finie, tout se passe ici, à Monteux.
          </h1>
        </div>
      </section>

      <Seccion id="histoire" etiqueta="Notre histoire" titulo="Un atelier né d’une envie de couleurs">
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4 text-lg text-ardoise">
            <p>[Histoire de La Ola Import à fournir : date de création, le déclic, ce qui vous anime.]</p>
            <p>[Deuxième paragraphe à fournir : vos valeurs, votre façon de travailler avec les clients d’ici et d’ailleurs.]</p>
          </div>
          <PhotoAFournir sujet="L’atelier de Monteux, vue d’ensemble" dimensions="1600 × 1000" ratio="16 / 10" />
        </div>
      </Seccion>

      <Seccion id="etapes" etiqueta="Les étapes" titulo="Cinq étapes, zéro mauvaise surprise" fond="perle">
        <ol className="mt-8 grid gap-4 md:grid-cols-5">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="rounded-2xl bg-white p-5 shadow-carte ring-1 ring-marine/5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marine font-display text-lg font-extrabold text-white">{i + 1}</span>
              <h3 className="mt-3 font-display text-lg font-extrabold text-marine">{e.titre}</h3>
              <p className="mt-1 text-sm text-ardoise">{e.texte}</p>
            </li>
          ))}
        </ol>
      </Seccion>

      <Seccion id="machines" etiqueta="Nos machines en action" titulo="DTF pour le textile, UV pour les objets">
        <p className="mt-3 max-w-3xl text-ardoise">
          Des vidéos courtes, muettes et en boucle, tournées dans notre atelier. Elles ne se lancent que lorsqu’elles sont à l’écran et
          s’arrêtent si vous avez demandé à réduire les animations.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <figure>
            <PhotoAFournir type="vidéo" sujet="Impression DTF sur textile (B-roll)" dimensions="1920 × 1080 et 1080 × 1350, 8 à 12 s, < 2 Mo" ratio="16 / 10" />
            <figcaption className="mt-2 text-sm text-ardoise">Impression DTF : transfert sur t-shirts, sweats, sacs.</figcaption>
          </figure>
          <figure>
            <PhotoAFournir type="vidéo" sujet="Impression UV sur objet (B-roll)" dimensions="1920 × 1080 et 1080 × 1350, 8 à 12 s, < 2 Mo" ratio="16 / 10" />
            <figcaption className="mt-2 text-sm text-ardoise">Impression UV : directement sur les objets.</figcaption>
          </figure>
        </div>
      </Seccion>

      <Seccion id="galerie" etiqueta="Galerie" titulo="L’atelier en images" fond="perle">
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {['Les presses', 'Le showroom', 'Les encres', 'Le contrôle qualité', 'Les finitions', 'Une commande prête'].map((s) => (
            <li key={s}>
              <PhotoAFournir sujet={s} dimensions="1200 × 1200" ratio="1 / 1" />
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion id="faq" etiqueta="Questions fréquentes" titulo="Vous vous demandez peut-être…">
        <div className="mt-6 max-w-3xl divide-y divide-marine/10 rounded-2xl ring-1 ring-marine/10">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-display text-lg font-extrabold text-marine marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <span aria-hidden="true" className="text-violet-600 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-ardoise">{f.r}</p>
            </details>
          ))}
        </div>
      </Seccion>

      <BandeauFinal />
    </>
  );
}
