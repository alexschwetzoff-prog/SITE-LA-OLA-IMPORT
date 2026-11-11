import type { Metadata } from 'next';
import BandeauFinal from '@/components/accueil/BandeauFinal';
import CarteMembre from '@/components/accueil/CarteMembre';
import PhotoAFournir from '@/components/ui/PhotoAFournir';
import { Seccion } from '@/components/ui/Seccion';
import { EQUIPE } from '@/data/equipe';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Qui sommes-nous',
  description: 'Une petite équipe, de grandes envies de couleurs : rencontrez les personnes de l’atelier La Ola Import à Monteux.',
  alternates: { canonical: '/qui-sommes-nous' },
};

export const ensureStatic = 'navigation';

export default function QuiSommesNous() {
  const d = SITE.direccion;
  return (
    <>
      <section className="fond-alt-2 pt-28 pb-12 lg:pt-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold tracking-wide text-violet-600 uppercase">Qui sommes-nous</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">
            Une petite équipe, de grandes envies de couleurs.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ardoise">
            Quand vous appelez, c’est l’atelier qui répond. Voici les personnes qui préparent, impriment et contrôlent vos commandes.
          </p>
        </div>
      </section>

      <Seccion id="equipe" etiqueta="L’équipe" titulo="Les visages de l’atelier">
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EQUIPE.map((m) => (
            <li key={m.prenom}>
              <CarteMembre membre={m} detail />
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion id="showroom" etiqueta="Le showroom" titulo="Venez voir et toucher les produits" fond="perle">
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center">
          <PhotoAFournir sujet="Le showroom de Monteux" dimensions="1600 × 1000" ratio="16 / 10" />
          <div className="space-y-2 text-lg text-marine">
            <p>
              <a href={d.mapaUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
                {d.calle}, {d.cp} {d.ciudad}
              </a>
            </p>
            <p className="text-ardoise">Horaires : {SITE.horario}</p>
            <p className="text-ardoise">Visites et rendez-vous : [modalités à confirmer].</p>
          </div>
        </div>
      </Seccion>

      <Seccion id="surfi" etiqueta="Et Surfi ?" titulo="Notre mascotte (virtuelle)">
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca/surfi/surfi-face.webp" alt="Surfi, la mascotte de La Ola Import, sur sa planche" width={456} height={500} loading="lazy" className="w-40 shrink-0" />
          <p className="max-w-2xl text-lg text-ardoise">
            Surfi, c’est notre mascotte virtuelle. Il ne sait pas imprimer, mais il adore montrer nos couleurs : vous le croiserez sur les fiches
            produits quand vous changez de coloris. Pour le travail, voyez plutôt Stéphane et Arthur !
          </p>
        </div>
      </Seccion>

      <BandeauFinal />
    </>
  );
}
