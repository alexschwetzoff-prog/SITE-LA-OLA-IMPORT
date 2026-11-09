import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Apartado, Correo, Dato, Falta, Lista, PaginaLegal } from '@/components/legal/Legal';
import { configuracionCorreo } from '@/lib/correo/transporte';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Politique de confidentialité (RGPD)',
  description: 'Comment La Ola Import traite vos données personnelles : finalités, base légale, destinataires, durées de conservation et vos droits (RGPD).',
  alternates: { canonical: '/confidentialite' },
};

const { titular } = SITE;

const traitements: [string, string, ReactNode][] = [
  [
    'Répondre à vos demandes de devis et de contact',
    'Mesures précontractuelles prises à votre demande (art. 6.1.b du RGPD)',
    <>
      <Falta que="durée à confirmer" /> à compter du dernier contact, puis suppression
    </>,
  ],
  [
    'Gérer vos commandes, la facturation et le suivi client',
    'Exécution du contrat (art. 6.1.b) et obligations légales comptables (art. 6.1.c)',
    <>
      Pendant la relation commerciale, puis archivage des pièces comptables pendant la durée légale <Falta que="10 ans, à confirmer" />
    </>,
  ],
  [
    'Recueillir votre avis après une commande',
    'Intérêt légitime à améliorer nos services (art. 6.1.f)',
    <>
      <Falta que="durée à confirmer" />
    </>,
  ],
  [
    'Publier votre avis, avec votre prénom si vous l’acceptez',
    'Votre consentement (art. 6.1.a), que vous pouvez retirer à tout moment',
    'Jusqu’au retrait de votre consentement',
  ],
  [
    'Sécurité du site et prévention des abus (journaux techniques, anti-spam)',
    'Intérêt légitime à protéger le site (art. 6.1.f)',
    <>
      <Falta que="durée à confirmer" />
    </>,
  ],
];

export default function Confidentialite() {
  // Le prestataire d'envoi des emails n'apparaît que s'il est réellement utilisé (CORREO_TRANSPORTE=resend) : le texte
  // suit la configuration du déploiement sans toucher au code.
  const conResend = configuracionCorreo().transporte === 'resend';
  return (
    <PaginaLegal
      titulo="Politique de confidentialité"
      intro={
        <p>
          Nous collectons le minimum de données nécessaire pour répondre à vos demandes et réaliser vos commandes. Cette page
          explique quelles données nous traitons, pourquoi, combien de temps, et comment exercer vos droits, conformément au
          Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés.
        </p>
      }
    >
      <Apartado titulo="Responsable du traitement">
        <p>
          <Dato valor={titular.nombre} /> ({SITE.nombre}), SIRET <Dato valor={titular.nif} />, <Dato valor={titular.direccion} />.
          Contact pour toute question sur vos données : <Correo email={SITE.email} />.
        </p>
      </Apartado>

      <Apartado titulo="Les données que nous traitons">
        <Lista>
          <li>
            <strong className="font-semibold">Demande de devis et panier</strong> : nom, structure (entreprise, club,
            camping, boutique, association) le cas échéant, email, téléphone (facultatif), code postal, préférence de
            contact, produits, quantités, délai souhaité, message et fichiers joints (logo, visuels).
          </li>
          <li>
            <strong className="font-semibold">Studio de personnalisation</strong> : votre logo est traité dans votre
            navigateur et conservé sur votre appareil. Il ne nous parvient que si vous envoyez votre demande.
          </li>
          <li>
            <strong className="font-semibold">Formulaire d’avis</strong> : prénom, nom de votre structure (facultatif),
            email (jamais publié), produit commandé (facultatif), texte de l’avis et vos choix de publication.
          </li>
          <li>
            <strong className="font-semibold">Données techniques</strong> : adresse IP, type de navigateur, date et heure de
            connexion, utilisées pour la sécurité et le bon fonctionnement du site.
          </li>
        </Lista>
        <p>Les champs obligatoires sont signalés dans chaque formulaire. Sans eux, nous ne pouvons pas traiter votre demande.</p>
      </Apartado>

      <Apartado titulo="Finalités, base légale et durées de conservation">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <caption className="sr-only">Finalités du traitement, base légale et durée de conservation</caption>
            <thead>
              <tr className="border-b border-marine/20 text-left text-marine">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Finalité
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Base légale
                </th>
                <th scope="col" className="py-2 font-semibold">
                  Durée de conservation
                </th>
              </tr>
            </thead>
            <tbody>
              {traitements.map(([finalite, base, duree]) => (
                <tr key={finalite} className="border-b border-marine/10 align-top">
                  <td className="py-2 pr-4">{finalite}</td>
                  <td className="py-2 pr-4">{base}</td>
                  <td className="py-2">{duree}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Nous ne faisons pas de prospection commerciale à partir de ces données et nous ne les vendons jamais.</p>
      </Apartado>

      <Apartado titulo="Destinataires et sous-traitants">
        <p>
          Vos données sont destinées à l’équipe de {SITE.nombre}. Elles sont aussi traitées, pour notre compte, par les
          prestataires techniques qui font fonctionner le site <Falta que="liste à confirmer" /> :
        </p>
        <Lista>
          <li>
            Hébergement du site : <Falta que="à confirmer : Netlify, Inc. ou Vercel Inc." />
          </li>
          <li>
            Messagerie (réception des demandes et envoi des emails) : <Falta que="à confirmer : Google (Gmail / Google Workspace)" />
            {conResend ? ' et Resend (envoi des emails du site)' : ''}
          </li>
          <li>
            Gestion des avis publiés : Google Sheets <Falta que="à confirmer" />
          </li>
        </Lista>
        <p>Elles peuvent enfin être communiquées aux autorités lorsque la loi l’exige.</p>
      </Apartado>

      <Apartado titulo="Transferts hors de l’Union européenne">
        <p>
          Certains de ces prestataires sont établis aux États-Unis. Ces transferts sont encadrés par les garanties prévues par
          le RGPD : décision d’adéquation (cadre de protection des données UE–États-Unis, pour les prestataires certifiés) ou
          clauses contractuelles types de la Commission européenne <Falta que="à confirmer pour chaque prestataire" />.
        </p>
      </Apartado>

      <Apartado titulo="Vos droits">
        <p>
          Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de
          vos données, ainsi que du droit de définir des directives sur leur sort après votre décès. Lorsque le traitement
          repose sur votre consentement (publication d’un avis par exemple), vous pouvez le retirer à tout moment.
        </p>
        <p>
          Pour exercer vos droits, écrivez-nous à <Correo email={SITE.email} /> ou par courrier à <Dato valor={titular.direccion} />.
          Nous vous répondons dans un délai d’un mois. Nous pouvons vous demander de justifier de votre identité en cas de
          doute raisonnable.
        </p>
      </Apartado>

      <Apartado titulo="Réclamation auprès de la CNIL">
        <p>
          Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une
          réclamation à la Commission nationale de l’informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715,
          75334 Paris Cedex 07, ou en ligne sur{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            cnil.fr
          </a>
          .
        </p>
      </Apartado>

      <Apartado titulo="Mineurs">
        <p>
          Nos services s’adressent aux adultes et aux professionnels. Si vous avez moins de 15 ans, demandez à un parent de
          faire la demande pour vous. Si nous apprenons que nous avons reçu les données d’un mineur sans cet accord, nous les
          supprimons.
        </p>
      </Apartado>

      <Apartado titulo="Cookies et stockage local">
        <p>
          Le site n’utilise pas de cookie publicitaire ni de mesure d’audience. Le détail du stockage utilisé par votre
          navigateur est expliqué sur la page <Link href="/cookies">Cookies</Link>.
        </p>
      </Apartado>

      <Apartado titulo="Modifications">
        <p>
          Cette politique peut évoluer, notamment si nous ajoutons un service. La version en vigueur est toujours celle
          publiée sur cette page, avec sa date de mise à jour.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
