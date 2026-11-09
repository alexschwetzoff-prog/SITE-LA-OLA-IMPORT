import type { Metadata } from 'next';
import Link from 'next/link';
import { TarjetaOpinion } from '@/components/opiniones/TarjetaOpinion';
import { BotonEnlace } from '@/components/ui/Botones';
import { Pagina } from '@/components/ui/Pagina';
import { obtenerOpiniones } from '@/lib/opiniones/obtener';

const BASE: Metadata = {
  title: 'Avis clients',
  description: 'Les avis des clients de La Ola Import, atelier de personnalisation à Monteux : publiés avec leur accord, sans retouche.',
  alternates: { canonical: '/avis' },
};

// Tant qu'aucun avis n'est publié, la page reste accessible mais n'est pas indexée (pas de page vide dans Google).
export async function generateMetadata(): Promise<Metadata> {
  const opiniones = await obtenerOpiniones();
  return opiniones.length ? BASE : { ...BASE, robots: { index: false, follow: true } };
}

// Les avis viennent de la feuille de réponses (onglet « Web », CSV publié ; lib/opiniones/obtener.ts) : seulement ceux
// dont le client a accepté la publication. Sans avis, un message simple : jamais de faux témoignage.
export default async function Avis() {
  const opiniones = await obtenerOpiniones();
  return (
    <Pagina titulo="Avis clients">
      <p className="mt-6 max-w-2xl text-lg text-ardoise">
        Ici, nous publions les avis de nos clients tels qu’ils les écrivent : nous ne les modifions pas, et nous ne les
        publions qu’avec leur accord.
      </p>
      {opiniones.length ? (
        <>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {opiniones.map((o, i) => (
              <TarjetaOpinion key={`${o.fecha ?? ''}-${i}`} opinion={o} />
            ))}
          </ul>
          <p className="mt-10 text-ardoise">
            Vous avez commandé chez nous ?{' '}
            <Link href="/donner-mon-avis" className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
              Donnez votre avis
            </Link>
            .
          </p>
        </>
      ) : (
        <div className="mt-10 max-w-2xl rounded-2xl bg-perle p-6 shadow-carte sm:p-8">
          <h2 className="font-display text-2xl font-bold text-marine">Les premiers avis arrivent bientôt.</h2>
          <p className="mt-3 text-ardoise">
            Nous demandons son avis à chaque client après sa commande, et nous le publions seulement s’il est d’accord. Vous
            avez déjà travaillé avec nous ? Votre retour nous aide beaucoup.
          </p>
          <div className="mt-6">
            <BotonEnlace href="/donner-mon-avis">Donner mon avis</BotonEnlace>
          </div>
        </div>
      )}
    </Pagina>
  );
}
