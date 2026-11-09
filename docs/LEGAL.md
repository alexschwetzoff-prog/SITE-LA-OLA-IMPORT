# Textes légaux · La Ola Import

> **Texte provisoire, à faire valider par le conseil juridique de La Ola Import.** Rédigé le 09/11/2026 pour le droit
> français (LCEN, RGPD, loi Informatique et Libertés, Code de la consommation, Code de commerce). Tout ce qui est entre
> crochets est à fournir ou à confirmer ; `scripts/revisar-web.mjs` bloque la mise en ligne tant qu'il reste des
> crochets visibles. Les pages du site affichent aussi un encadré « Texte provisoire » (composant `AvisProvisoire`
> dans `components/legal/Legal.tsx`) : à retirer une fois les textes validés.

## Où sont les textes

| Page | Fichier | Données utilisées |
| --- | --- | --- |
| `/mentions-legales` | `app/mentions-legales/page.tsx` | `SITE.titular` (raison sociale, SIRET, adresse du siège, directeur de la publication), `SITE.email`, `SITE.telefonos`, `SITE.direccion` |
| `/confidentialite` | `app/confidentialite/page.tsx` | `SITE.titular`, `SITE.email` ; Resend n'apparaît que si `CORREO_TRANSPORTE=resend` |
| `/cookies` | `app/cookies/page.tsx` | `SITE.email` |
| `/cgv` | `app/cgv/page.tsx` | `SITE.titular`, `SITE.email`, `SITE.telefonos` |
| `/livraison-et-paiement` | `app/livraison-et-paiement/page.tsx` | `SITE.direccion`, `SITE.horario` |

Les valeurs de `SITE` (dans `lib/site.ts`) encore entre crochets s'affichent comme des manques (composant `Dato`). Les
autres manques sont écrits directement dans les pages avec le composant `Falta`. Ce document reprend le fond des textes ;
en cas d'écart, la page fait foi et ce document doit être mis à jour.

## À fournir ou à valider avant la mise en ligne

**Identité de l'éditeur** (dans `lib/site.ts` puis les pages)

1. Raison sociale `[RAISON SOCIALE]`, forme juridique et capital social `[à confirmer]`.
2. SIRET `[SIRET]`, ville du greffe (RCS) `[à confirmer]`, numéro de TVA intracommunautaire `[à confirmer]`.
3. Adresse du siège `[ADRESSE DU SIÈGE]` et de l'atelier `[ADRESSE]` (84170 Monteux), téléphone `[TÉLÉPHONE]`, email
   de contact (aujourd'hui `email-pendiente@example.com`), nom de domaine.
4. Directeur de la publication `[DIRECTEUR DE LA PUBLICATION]` et sa fonction.
5. Hébergeur : `[Netlify, Inc. ou Vercel Inc.]`, avec son adresse et son contact.

**Confidentialité**

6. Liste des sous-traitants : hébergeur, messagerie (réception des demandes et envoi des emails : Gmail / Google
   Workspace, Resend ?), Google Sheets pour les avis. Encadrement des transferts hors UE pour chacun.
7. Durées de conservation : demandes de devis sans suite, avis non publiés, journaux techniques ; archivage comptable
   (10 ans, article L123-22 du Code de commerce, à confirmer).

**Cookies**

8. Outil de mesure d'audience éventuel. Aujourd'hui aucun. S'il en arrive un qui dépose des cookies non exemptés, il
   faut un bandeau de consentement (refuser aussi simple qu'accepter) et la mise à jour de la page.

**CGV et livraison**

9. Validité des devis, acompte, quantité minimale, nombre de modifications du BAT, tolérances d'impression.
10. Prix HT ou TTC, frais de livraison, moyens de paiement, délai de paiement et pénalités (clients professionnels).
11. Délais de fabrication, retrait à l'atelier (horaires, frais), zones et transporteur de livraison.
12. Vente éventuelle de produits non personnalisés (et donc droit de rétractation de 14 jours pour ceux-là).
13. Délai de réclamation, médiateur de la consommation (nom, adresse, site), tribunal compétent pour les professionnels.
14. Propriété des maquettes créées par l'atelier.

**Avis**

15. Feuille Google Sheets des avis propre à La Ola Import et variable `OPINIONES_CSV_URL`. Confirmer que les avis ne
    font l'objet d'aucune contrepartie.

## Mentions légales

En application de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).

**Éditeur du site.** Le site [nom de domaine à confirmer] est édité par [RAISON SOCIALE], nom commercial
« La Ola Import », [forme juridique à confirmer] au capital de [montant à confirmer], RCS [ville du greffe à
confirmer], SIRET [SIRET], TVA intracommunautaire [à confirmer]. Siège social : [ADRESSE DU SIÈGE]. Atelier :
[ADRESSE], 84170 Monteux. Téléphone : [TÉLÉPHONE]. Email : [email à confirmer].

**Directeur de la publication.** [DIRECTEUR DE LA PUBLICATION], en qualité de [fonction à confirmer].

**Hébergeur.** [Netlify, Inc. ou Vercel Inc., à confirmer], [adresse de l'hébergeur à confirmer], [téléphone ou site
web de l'hébergeur à confirmer].

**Objet du site.** Présenter l'atelier, le catalogue et les services de personnalisation (textiles, objets
publicitaires, souvenirs) ; demander un devis ; préparer un projet ; prévisualiser un logo sur un produit. Les
conditions de vente sont dans les CGV.

**Aperçus du studio de personnalisation.** Indicatifs : couleur, taille et position peuvent différer de l'écran. Le
client valide toujours un bon à tirer (BAT) avant impression. En déposant un logo, il déclare avoir le droit de
l'utiliser et autorise La Ola Import à s'en servir uniquement pour l'aperçu, le devis et la fabrication.

**Avis clients.** Publiés seulement avec l'accord du client, sans modification ; retrait des avis contenant du spam,
des propos injurieux ou des données de tiers. Aucune contrepartie [à confirmer].

**Propriété intellectuelle, liens externes, responsabilité.** Contenus protégés (Code de la propriété intellectuelle) ;
pas de responsabilité sur les sites tiers (WhatsApp, Instagram, Facebook, Google Maps) ; informations générales
susceptibles d'évoluer.

**Droit applicable.** Droit français ; à défaut d'accord amiable, tribunaux français compétents.

## Politique de confidentialité

**Responsable du traitement.** [RAISON SOCIALE] (La Ola Import), SIRET [SIRET], [ADRESSE DU SIÈGE]. Contact : [email].

**Données traitées.**

- Demande de devis et panier : nom, structure (si professionnel ou association), email, téléphone (facultatif), code
  postal, préférence de contact, produits, quantités, délai souhaité, message, fichiers joints (logo, visuels).
- Studio de personnalisation : le logo est traité dans le navigateur et reste sur l'appareil ; il n'est transmis
  qu'avec la demande.
- Formulaire d'avis : prénom, structure (facultatif), email (jamais publié), produit (facultatif), texte de l'avis,
  choix de publication.
- Données techniques : adresse IP, navigateur, date et heure (sécurité, anti-spam).

**Finalités, base légale et durées.**

| Finalité | Base légale | Durée |
| --- | --- | --- |
| Répondre aux demandes de devis et de contact | Mesures précontractuelles (art. 6.1.b RGPD) | [durée à confirmer] après le dernier contact |
| Gérer les commandes, la facturation, le suivi | Contrat (6.1.b) et obligation légale (6.1.c) | Relation commerciale, puis archivage comptable [10 ans, à confirmer] |
| Recueillir l'avis du client | Intérêt légitime (6.1.f) | [durée à confirmer] |
| Publier l'avis, avec le prénom si accepté | Consentement (6.1.a), retirable à tout moment | Jusqu'au retrait du consentement |
| Sécurité et anti-spam | Intérêt légitime (6.1.f) | [durée à confirmer] |

Pas de prospection, pas de revente.

**Destinataires et sous-traitants** [liste à confirmer]. Équipe de La Ola Import ; hébergement [Netlify, Inc. ou
Vercel Inc.] ; messagerie [Google (Gmail / Google Workspace)], et Resend si `CORREO_TRANSPORTE=resend` ; Google
Sheets pour les avis [à confirmer] ; autorités sur obligation légale.

**Transferts hors UE.** Prestataires établis aux États-Unis : décision d'adéquation (cadre UE–États-Unis, pour les
prestataires certifiés) ou clauses contractuelles types [à confirmer pour chaque prestataire].

**Droits.** Accès, rectification, effacement, limitation, opposition, portabilité, directives post-mortem ; retrait du
consentement. Par email ou courrier au siège ; réponse sous un mois.

**Réclamation.** CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, cnil.fr.

**Mineurs.** Moins de 15 ans : demande faite par un parent (article 45 de la loi Informatique et Libertés).

## Politique cookies

- Aucun cookie publicitaire, aucune mesure d'audience pour l'instant [outil d'analytics à confirmer].
- Stockage strictement nécessaire, exempté de consentement (article 82 de la loi Informatique et Libertés) :
  - `localStorage` : le panier (produits, couleurs, tailles, quantités) d'une visite à l'autre ;
  - `IndexedDB` : le fichier du logo déposé dans le studio, pour l'aperçu et l'envoi avec la demande ;
  - `sessionStorage` : le visuel en cours dans le studio, effacé à la fermeture de l'onglet.
- Polices servies par le site ; Google Maps ouvert seulement par lien (aucune carte chargée) ; WhatsApp, Instagram et
  Facebook appliquent leurs propres cookies une fois ouverts.
- Effacement possible depuis les réglages du navigateur (le panier et le logo sont alors perdus).

## Conditions générales de vente (structure)

1. Vendeur : identité complète (voir mentions légales).
2. Objet et champ d'application : produits personnalisés et non personnalisés [à confirmer] ; clients particuliers et
   professionnels ; acceptation des CGV.
3. Produits et visuels : photos et aperçus indicatifs ; seuls le devis et le BAT validés engagent.
4. Devis et commande : la demande n'engage pas ; devis valable [durée à confirmer] ; commande ferme à l'acceptation
   écrite du devis et au versement de l'acompte [à confirmer] ; quantité minimale [à confirmer].
5. BAT : obligatoire avant fabrication, validation écrite ; modifications incluses [à confirmer] ; tolérances
   [à confirmer].
6. Fichiers et propriété intellectuelle : le client garantit ses droits ; refus des contenus illicites ; maquettes
   [à confirmer].
7. Prix : en euros, [HT ou TTC à confirmer] ; prix TTC toujours indiqué aux particuliers ; frais de livraison
   [à confirmer].
8. Paiement : moyens [à confirmer], acompte et solde [à confirmer] ; professionnels : délai [à confirmer], pénalités
   [au moins trois fois le taux d'intérêt légal, à confirmer] et indemnité forfaitaire de recouvrement (articles
   L441-10 et D441-5 du Code de commerce) [montant à confirmer].
9. Fabrication et délais : [délai à confirmer] à compter du BAT validé et de l'acompte ; à défaut de date, 30 jours
   pour un particulier (article L216-1 du Code de la consommation).
10. Retrait à l'atelier de Monteux [à confirmer] ou livraison [zones, transporteur, frais à confirmer] ; transfert des
    risques à la prise de possession (particulier) ou à la remise au transporteur (professionnel) [à confirmer].
11. Droit de rétractation : exclu pour les biens personnalisés (article L221-28, 3° du Code de la consommation) ;
    14 jours pour les produits non personnalisés vendus à distance [si de tels produits sont vendus].
12. Garanties légales : conformité (articles L217-3 et suivants du Code de la consommation, deux ans) et vices cachés
    (articles 1641 et suivants du Code civil) [texte à faire valider].
13. Réclamations : par email, sous [délai à confirmer], avec photos ; solution amiable.
14. Médiation de la consommation (articles L612-1 et suivants) : [nom, adresse et site du médiateur à confirmer].
15. Force majeure (article 1218 du Code civil).
16. Données personnelles : renvoi à la politique de confidentialité.
17. Droit français ; professionnels : tribunal de commerce de [ville à confirmer].

## Livraison et paiement

Page courte et rassurante : retrait à l'atelier de Monteux (adresse, horaires, frais [à confirmer]) ; livraison
(zones, transporteur, frais, délai [à confirmer]) ; paiement (moyens [à confirmer : virement, carte bancaire, chèque,
espèces à l'atelier], acompte et solde [à confirmer], facture [à confirmer]). Liens vers `/devis` et `/cgv`.

## Avis clients : circuit et consentements

1. Le client remplit `/donner-mon-avis` (page non indexée). Trois cases distinctes, jamais pré-cochées : publication de
   l'avis ; affichage du prénom ; affichage de la structure (si elle est indiquée). Une case obligatoire autorise le
   traitement de l'avis.
2. L'avis arrive par email à l'équipe (`app/donner-mon-avis/acciones.ts`), avec la ligne à recopier dans la feuille
   Google Sheets (onglet « Web ») : `empresa` (seulement ce que le client a accepté d'afficher), `opinion`,
   `mostrar_nombre`, `publicar`, `fecha`. Rien n'est publié automatiquement.
3. Le site lit le CSV publié de cet onglet (`OPINIONES_CSV_URL`, `lib/opiniones/`) : seules les lignes avec
   `publicar = SI` (ou `OUI`) apparaissent ; sans accord d'affichage, l'avis est signé « Client de La Ola Import ».
4. Tant qu'aucun avis n'est publié, `/avis` affiche « Les premiers avis arrivent bientôt » et n'est pas indexée.
   Aucun faux témoignage.
5. Un client peut demander le retrait de son avis à tout moment : passer `publicar` à `NO` dans la feuille.
