import type { Metadata } from 'next';
import Link from 'next/link';
import { Apartado, Correo, Dato, Falta, Lista, PaginaLegal } from '@/components/legal/Legal';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: 'Conditions générales de vente de La Ola Import : devis, bon à tirer, prix, paiement, fabrication, livraison ou retrait à Monteux, réclamations et médiation.',
  alternates: { canonical: '/cgv' },
};

const { titular } = SITE;

export default function Cgv() {
  return (
    <PaginaLegal
      titulo="Conditions générales de vente"
      intro={
        <p>
          Ces conditions s’appliquent à toutes les commandes passées auprès de {SITE.nombre}, atelier de personnalisation de
          textiles, d’objets publicitaires et de souvenirs à Monteux (Vaucluse), par des particuliers comme par des
          professionnels.
        </p>
      }
    >
      <Apartado titulo="1. Vendeur">
        <p>
          <Dato valor={titular.nombre} />, nom commercial {SITE.nombre}, <Falta que="forme juridique et capital à confirmer" />,
          SIRET <Dato valor={titular.nif} />, siège : <Dato valor={titular.direccion} />. Email : <Correo email={SITE.email} />,
          téléphone : <Dato valor={SITE.telefonos[0]} />.
        </p>
      </Apartado>

      <Apartado titulo="2. Objet et champ d’application">
        <p>
          Les présentes conditions générales de vente (CGV) encadrent la vente de produits personnalisés (impression,
          marquage ou toute autre personnalisation) et de produits non personnalisés <Falta que="à confirmer" />. Elles
          prévalent sur tout autre document, sauf accord écrit contraire. Les clauses propres aux professionnels sont
          signalées comme telles. Le client reconnaît avoir pris connaissance des CGV avant de valider sa commande.
        </p>
      </Apartado>

      <Apartado titulo="3. Produits et visuels">
        <p>
          Les photos et les aperçus du studio de personnalisation sont indicatifs. Les couleurs à l’écran, l’emplacement et
          la taille du marquage peuvent légèrement différer du produit fini, selon la matière, la technique et l’écran
          utilisé. Les caractéristiques qui engagent {SITE.nombre} sont celles du devis et du bon à tirer validés.
        </p>
      </Apartado>

      <Apartado titulo="4. Devis et commande">
        <Lista>
          <li>
            Une demande envoyée depuis le site (panier, formulaire de <Link href="/devis">devis</Link>, WhatsApp ou email)
            n’engage pas le client : elle permet à l’atelier d’établir un devis.
          </li>
          <li>
            Le devis précise les produits, quantités, techniques, emplacements, prix et délais. Il est valable{' '}
            <Falta que="durée de validité à confirmer" />.
          </li>
          <li>
            La commande devient ferme lorsque le client accepte le devis par écrit (signature, email ou message) et, le cas
            échéant, verse l’acompte prévu <Falta que="montant ou pourcentage à confirmer" />.
          </li>
          <li>
            Quantité minimale par commande : <Falta que="à confirmer" />.
          </li>
        </Lista>
      </Apartado>

      <Apartado titulo="5. Bon à tirer (BAT)">
        <p>
          Avant toute fabrication, {SITE.nombre} envoie au client un bon à tirer : une maquette qui montre le visuel, ses
          couleurs, sa taille et son emplacement. La fabrication ne commence qu’après validation écrite du BAT par le client.
          Le client vérifie attentivement le BAT (orthographe, couleurs, dimensions) : une fois validé, il engage le client et
          aucune réclamation portant sur un élément visible sur le BAT ne pourra être retenue. Nombre de modifications
          incluses : <Falta que="à confirmer" />.
        </p>
        <p>
          Des écarts légers de teinte ou de position, inhérents aux techniques d’impression et aux supports, sont admis dans
          la limite de <Falta que="tolérance à confirmer" />.
        </p>
      </Apartado>

      <Apartado titulo="6. Fichiers et propriété intellectuelle">
        <p>
          Le client garantit qu’il détient les droits sur les logos, textes et visuels qu’il transmet (droit d’auteur,
          marques, droit à l’image) et qu’ils ne sont pas contraires à la loi. Il garantit {SITE.nombre} contre toute
          réclamation de tiers à ce sujet. {SITE.nombre} peut refuser une commande dont le contenu est illicite, injurieux ou
          porte atteinte aux droits d’un tiers. Les maquettes créées par l’atelier restent sa propriété, sauf accord contraire{' '}
          <Falta que="à confirmer" />.
        </p>
      </Apartado>

      <Apartado titulo="7. Prix">
        <p>
          Les prix sont indiqués en euros, <Falta que="HT ou TTC à confirmer" />, dans le devis. Pour les particuliers, le
          prix total toutes taxes comprises est toujours indiqué avant la commande. Les frais de livraison éventuels sont
          précisés dans le devis <Falta que="à confirmer" />. Le prix du devis accepté est ferme.
        </p>
      </Apartado>

      <Apartado titulo="8. Paiement">
        <p>
          Moyens de paiement acceptés : <Falta que="à confirmer" />. Modalités : <Falta que="acompte à la commande et solde avant retrait ou expédition, à confirmer" />.
          Voir aussi la page <Link href="/livraison-et-paiement">Livraison et paiement</Link>.
        </p>
        <p>
          <strong className="font-semibold">Clients professionnels</strong> : les factures sont payables à{' '}
          <Falta que="délai à confirmer" />. Tout retard entraîne de plein droit des pénalités au taux de{' '}
          <Falta que="taux à confirmer, au moins trois fois le taux d’intérêt légal" /> et l’indemnité forfaitaire pour
          frais de recouvrement prévue aux articles L441-10 et D441-5 du Code de commerce <Falta que="montant à confirmer" />.
        </p>
      </Apartado>

      <Apartado titulo="9. Fabrication et délais">
        <p>
          Le délai de fabrication est indiqué dans le devis <Falta que="délai à confirmer" />. Il court à partir de la
          validation du BAT et, le cas échéant, de la réception de l’acompte. Pour un particulier, si aucune date n’est
          convenue, le produit est livré ou mis à disposition au plus tard trente jours après la conclusion du contrat
          (article L216-1 du Code de la consommation). En cas de retard, le client particulier peut exercer les droits
          prévus aux articles L216-6 et suivants du même code.
        </p>
      </Apartado>

      <Apartado titulo="10. Retrait et livraison">
        <p>
          Les commandes peuvent être retirées à l’atelier de Monteux <Falta que="à confirmer" /> ou livrées{' '}
          <Falta que="zones, transporteur et frais à confirmer" />. Pour un particulier, le risque de perte ou de détérioration
          lui est transféré lorsqu’il prend possession du produit. Pour un professionnel, il est transféré à la remise au
          transporteur <Falta que="à confirmer" />. Le client vérifie le colis à réception et note toute réserve auprès du
          transporteur.
        </p>
      </Apartado>

      <Apartado titulo="11. Droit de rétractation">
        <p>
          Conformément à l’article L221-28, 3° du Code de la consommation, le droit de rétractation ne s’applique pas aux
          biens confectionnés selon les spécifications du consommateur ou nettement personnalisés. Les produits imprimés ou
          marqués à votre demande ne peuvent donc être ni repris ni échangés, sauf défaut de conformité.
        </p>
        <p>
          Pour les produits non personnalisés vendus à distance <Falta que="à confirmer si de tels produits sont vendus" />,
          le client particulier dispose de quatorze jours après réception pour se rétracter, sans avoir à se justifier, en
          nous écrivant à <Correo email={SITE.email} />. Les modalités de retour et de remboursement sont alors{' '}
          <Falta que="à confirmer" />.
        </p>
      </Apartado>

      <Apartado titulo="12. Garanties légales">
        <p>
          Le client particulier bénéficie de la garantie légale de conformité (articles L217-3 et suivants du Code de la
          consommation) pendant deux ans à compter de la délivrance du bien, et de la garantie contre les vices cachés
          (articles 1641 et suivants du Code civil). Une non-conformité due à une erreur présente sur le BAT validé par le
          client n’est pas un défaut de conformité. <Falta que="texte des garanties à faire valider" />
        </p>
      </Apartado>

      <Apartado titulo="13. Réclamations">
        <p>
          Toute réclamation (produit abîmé, erreur de quantité, défaut d’impression) est à adresser à{' '}
          <Correo email={SITE.email} /> dans un délai de <Falta que="délai à confirmer" /> après réception, avec le numéro de
          commande et des photos. Nous cherchons d’abord une solution à l’amiable : réimpression, remplacement ou
          remboursement selon le cas.
        </p>
      </Apartado>

      <Apartado titulo="14. Médiation de la consommation">
        <p>
          Si un litige avec un client particulier n’est pas résolu après une réclamation écrite auprès de nous, le client peut
          recourir gratuitement au médiateur de la consommation dont nous relevons (articles L612-1 et suivants du Code de la
          consommation) : <Falta que="nom, adresse et site web du médiateur à confirmer" />.
        </p>
      </Apartado>

      <Apartado titulo="15. Force majeure">
        <p>
          {SITE.nombre} n’est pas responsable d’un retard ou d’une inexécution causés par un événement de force majeure au
          sens de l’article 1218 du Code civil. Le client en est informé dès que possible.
        </p>
      </Apartado>

      <Apartado titulo="16. Données personnelles">
        <p>
          Les données transmises pour une commande sont traitées selon notre <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </Apartado>

      <Apartado titulo="17. Droit applicable et litiges">
        <p>
          Les présentes CGV sont soumises au droit français. Pour un client particulier, le tribunal compétent est déterminé
          selon les règles légales. Pour un client professionnel, tout litige relève du tribunal de commerce de{' '}
          <Falta que="ville à confirmer" />, sauf règle impérative contraire.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
