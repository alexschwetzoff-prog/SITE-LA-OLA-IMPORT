import type { Metadata } from 'next';
import Link from 'next/link';
import { Apartado, Correo, Dato, Falta, Lista, PaginaLegal } from '@/components/legal/Legal';
import { SITE, enlaceTelefono } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site de La Ola Import, atelier de personnalisation à Monteux (Vaucluse) : éditeur, directeur de la publication, hébergeur et propriété intellectuelle.',
  alternates: { canonical: '/mentions-legales' },
};

const { titular, direccion } = SITE;

export default function MentionsLegales() {
  return (
    <PaginaLegal
      titulo="Mentions légales"
      intro={<p>Conformément à l’article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN), voici les informations sur l’éditeur et l’hébergeur de ce site.</p>}
    >
      <Apartado titulo="Éditeur du site">
        <p>
          Le site <Falta que="nom de domaine à confirmer" /> est édité par :
        </p>
        <Lista>
          <li>
            Raison sociale : <Dato valor={titular.nombre} />, exerçant sous le nom commercial « {SITE.nombre} »
          </li>
          <li>
            Forme juridique et capital social : <Falta que="forme juridique à confirmer" /> au capital de <Falta que="montant à confirmer" />
          </li>
          <li>
            Immatriculation : RCS <Falta que="ville du greffe à confirmer" />, SIRET <Dato valor={titular.nif} />
          </li>
          <li>
            Numéro de TVA intracommunautaire : <Falta que="à confirmer" />
          </li>
          <li>
            Siège social : <Dato valor={titular.direccion} />
          </li>
          <li>
            Atelier :{' '}
            <a href={direccion.mapaUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-bleu-600 underline underline-offset-4">
              {direccion.calle}, {direccion.cp} {direccion.ciudad}
            </a>
          </li>
          <li>
            Téléphone :{' '}
            <a href={enlaceTelefono(SITE.telefonos[0])} className="font-semibold text-bleu-600 underline underline-offset-4">
              {SITE.telefonos[0]}
            </a>
          </li>
          <li>
            Email : <Correo email={SITE.email} />
          </li>
        </Lista>
      </Apartado>

      <Apartado titulo="Directeur de la publication">
        <p>
          <Dato valor={titular.directeurPublication} />, en qualité de <Falta que="fonction à confirmer" />.
        </p>
      </Apartado>

      <Apartado titulo="Hébergeur">
        <p>
          Le site est hébergé par <Falta que="à confirmer : Netlify, Inc. ou Vercel Inc." />, <Falta que="adresse de l’hébergeur à confirmer" />,{' '}
          <Falta que="téléphone ou site web de l’hébergeur à confirmer" />.
        </p>
      </Apartado>

      <Apartado titulo="Objet du site">
        <p>
          Ce site présente l’atelier, le catalogue et les services de personnalisation de {SITE.nombre} (textiles, objets
          publicitaires, souvenirs). Il permet de demander un devis, de préparer un projet et de prévisualiser un logo sur un
          produit. Les conditions de vente sont détaillées dans nos <Link href="/cgv">conditions générales de vente</Link>.
        </p>
      </Apartado>

      <Apartado titulo="Aperçus du studio de personnalisation">
        <p>
          Les aperçus sont indicatifs : la couleur, la taille et la position du marquage sur le produit fini peuvent
          différer de l’écran. Vous validez toujours un bon à tirer (BAT) avant impression. En déposant un logo ou un visuel,
          vous déclarez avoir le droit de l’utiliser et vous autorisez {SITE.nombre} à s’en servir uniquement pour préparer
          l’aperçu, le devis et, le cas échéant, la fabrication de votre commande.
        </p>
      </Apartado>

      <Apartado titulo="Avis clients">
        <p>
          Les avis publiés sur la page <Link href="/avis">Avis</Link> viennent de clients qui ont passé commande et qui ont
          accepté leur publication. Nous ne modifions pas leur contenu. Nous retirons seulement les avis qui contiennent du
          spam, des propos injurieux ou des données personnelles de tiers. Les avis ne font l’objet d’aucune
          contrepartie <Falta que="à confirmer" />.
        </p>
      </Apartado>

      <Apartado titulo="Propriété intellectuelle">
        <p>
          Sauf mention contraire, les textes, photographies, vidéos, illustrations, logos, la mascotte, la mise en page et le
          code de ce site appartiennent à {SITE.nombre} ou à leurs titulaires respectifs. Toute reproduction, représentation
          ou adaptation, totale ou partielle, sans autorisation écrite préalable est interdite, sauf dans les cas prévus par
          le Code de la propriété intellectuelle. Les marques de tiers citées appartiennent à leurs propriétaires.
        </p>
      </Apartado>

      <Apartado titulo="Liens externes">
        <p>
          Le site contient des liens vers d’autres services (WhatsApp, Instagram, Facebook, Google Maps). {SITE.nombre} ne
          contrôle pas ces sites et n’est pas responsable de leur contenu ni de leurs pratiques en matière de données
          personnelles.
        </p>
      </Apartado>

      <Apartado titulo="Responsabilité">
        <p>
          Nous faisons de notre mieux pour que les informations du site soient exactes et à jour, sans pouvoir garantir
          l’absence d’erreur ou d’interruption. Les informations publiées sont générales et peuvent évoluer sans préavis.
        </p>
      </Apartado>

      <Apartado titulo="Données personnelles et cookies">
        <p>
          Pour savoir comment nous traitons vos données, consultez notre <Link href="/confidentialite">politique de confidentialité</Link> et
          notre <Link href="/cookies">politique cookies</Link>.
        </p>
      </Apartado>

      <Apartado titulo="Droit applicable">
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige, et à défaut d’accord amiable,
          les tribunaux français compétents seront saisis.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
