import type { Metadata } from 'next';
import Link from 'next/link';
import { Dato, Falta } from '@/components/legal/Legal';
import { BotonEnlace, ESTILO_BOTON, Flecha } from '@/components/ui/Botones';
import { Pagina } from '@/components/ui/Pagina';
import { CTA, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Livraison et paiement',
  description: 'Retrait à l’atelier de La Ola Import à Monteux, livraison et moyens de paiement : tout ce qu’il faut savoir avant de commander vos textiles et objets personnalisés.',
  alternates: { canonical: '/livraison-et-paiement' },
};

const { direccion } = SITE;

const carte = 'rounded-2xl bg-white p-6 shadow-carte ring-1 ring-marine/5 sm:p-8';
const titreCarte = 'font-display text-xl font-bold text-marine sm:text-2xl';

export default function LivraisonEtPaiement() {
  return (
    <Pagina titulo="Livraison et paiement">
      <p className="mt-6 max-w-2xl text-lg text-ardoise">
        Pas de surprise : chaque devis indique le mode de retrait ou de livraison, les frais éventuels et les modalités de
        paiement. Vous ne payez rien avant d’avoir accepté le devis.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className={carte} aria-labelledby="retrait">
          <h2 id="retrait" className={titreCarte}>
            Retrait à l’atelier
          </h2>
          <div className="mt-4 space-y-3 text-ardoise">
            <p>
              Venez chercher votre commande à notre atelier de {direccion.ciudad} <Falta />.
            </p>
            <p>
              <Dato valor={direccion.calle} />, {direccion.cp} {direccion.ciudad}
              <br />
              Horaires : <Dato valor={SITE.horario} />
            </p>
            <p>
              Frais de retrait : <Falta />. Nous vous prévenons dès que votre commande est prête.
            </p>
            <a href={direccion.mapaUrl} target="_blank" rel="noopener noreferrer" className={ESTILO_BOTON.enlace}>
              Voir sur la carte <span className="sr-only">(nouvel onglet)</span>
              <Flecha />
            </a>
          </div>
        </section>

        <section className={carte} aria-labelledby="livraison">
          <h2 id="livraison" className={titreCarte}>
            Livraison
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ardoise marker:text-violet-600">
            <li>
              Zones desservies : <Falta />
            </li>
            <li>
              Transporteur : <Falta />
            </li>
            <li>
              Frais de livraison : <Falta />
            </li>
            <li>
              Délai : <Falta /> après validation du bon à tirer
            </li>
          </ul>
          <p className="mt-4 text-ardoise">À réception, vérifiez votre colis et signalez-nous tout problème rapidement.</p>
        </section>

        <section className={carte} aria-labelledby="paiement">
          <h2 id="paiement" className={titreCarte}>
            Paiement
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ardoise marker:text-violet-600">
            <li>
              Moyens acceptés : <Falta que="à confirmer : virement, carte bancaire, chèque, espèces à l’atelier" />
            </li>
            <li>
              Acompte à la commande : <Falta />
            </li>
            <li>
              Solde : <Falta que="avant retrait ou expédition, à confirmer" />
            </li>
            <li>
              Facture : remise avec chaque commande <Falta />
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-10 max-w-3xl rounded-2xl bg-perle p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-marine">Et avant tout ça ?</h2>
        <p className="mt-3 text-ardoise">
          Vous recevez un devis clair, puis un bon à tirer (BAT) à valider. Nous ne lançons l’impression qu’avec votre
          accord. Tous les détails sont dans nos{' '}
          <Link href="/cgv" className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
            conditions générales de vente
          </Link>
          .
        </p>
        <div className="mt-6">
          <BotonEnlace href={CTA.href} tamano="grande">
            {CTA.etiqueta}
          </BotonEnlace>
        </div>
      </div>
    </Pagina>
  );
}
