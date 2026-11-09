import type { Metadata } from 'next';
import Link from 'next/link';
import { Apartado, Correo, Falta, Lista, PaginaLegal } from '@/components/legal/Legal';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Politique cookies',
  description: 'Le site de La Ola Import n’utilise ni cookie publicitaire ni mesure d’audience : seulement le stockage de votre navigateur pour le panier et votre logo.',
  alternates: { canonical: '/cookies' },
};

export default function Cookies() {
  return (
    <PaginaLegal
      titulo="Politique cookies"
      intro={
        <p>
          Bonne nouvelle : ce site ne dépose aucun cookie publicitaire et ne mesure pas votre audience. Il utilise seulement
          le stockage de votre navigateur pour faire fonctionner le panier et le studio de personnalisation.
        </p>
      }
    >
      <Apartado titulo="Ce que le site enregistre sur votre appareil">
        <p>
          Ces données restent dans votre navigateur. Elles ne nous sont pas transmises tant que vous n’envoyez pas une
          demande, et elles ne servent pas à vous suivre.
        </p>
        <Lista>
          <li>
            <strong className="font-semibold">Stockage local (localStorage)</strong> : le contenu de votre panier (produits,
            couleurs, tailles, quantités), pour le retrouver d’une visite à l’autre. Il reste jusqu’à ce que vous vidiez le
            panier ou les données du site.
          </li>
          <li>
            <strong className="font-semibold">Base de données du navigateur (IndexedDB)</strong> : le fichier de votre logo
            déposé dans le studio, pour l’afficher sur le produit et le joindre à votre demande sans vous le redemander.
          </li>
          <li>
            <strong className="font-semibold">Stockage de session (sessionStorage)</strong> : le visuel en cours dans le
            studio, effacé à la fermeture de l’onglet.
          </li>
        </Lista>
        <p>
          Ce stockage est strictement nécessaire au service que vous demandez (article 82 de la loi Informatique et
          Libertés) : il ne demande donc pas votre consentement.
        </p>
      </Apartado>

      <Apartado titulo="Mesure d’audience">
        <p>
          Le site n’utilise aucun outil de mesure d’audience pour l’instant. Si nous en ajoutons un, cette page sera mise à
          jour et, s’il dépose des cookies non exemptés, votre consentement vous sera demandé au préalable, avec la
          possibilité de refuser aussi simplement que d’accepter <Falta que="outil d’analytics à confirmer" />.
        </p>
      </Apartado>

      <Apartado titulo="Services externes">
        <p>
          Les polices de caractères sont servies par notre propre site. Le lien vers notre adresse ouvre Google Maps dans un
          nouvel onglet : aucune carte n’est chargée sur notre site. Les boutons WhatsApp, Instagram et Facebook vous
          emmènent sur ces plateformes, qui appliquent leurs propres cookies et politiques une fois ouvertes.
        </p>
      </Apartado>

      <Apartado titulo="Comment effacer ces données">
        <p>
          Vous pouvez à tout moment supprimer les données de ce site depuis les réglages de votre navigateur (rubrique
          « Confidentialité » ou « Données des sites »). Votre panier et votre logo seront alors effacés.
        </p>
      </Apartado>

      <Apartado titulo="En savoir plus">
        <p>
          Pour le reste de nos traitements, consultez la <Link href="/confidentialite">politique de confidentialité</Link>.
          Une question : <Correo email={SITE.email} />.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
