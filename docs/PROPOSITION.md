# La Ola Import : proposition de structure (étape 1, à valider)

> Document de travail. **Aucun fichier de la base n'a été modifié.** Tout ce qui est marqué **[à confirmer]** ou
> **[photo à fournir]** attend une réponse de La Ola Import. Les couleurs du logo sont **relevées à la pipette** sur
> le fichier reçu ; celles de Surfi restent des estimations.

## 0. État des lieux (lecture de CLAUDE.md, BASE-TECNICA.md, PENDIENTE-DE-SUSTITUIR.md)

| Constat | Conséquence |
|---|---|
| Logo reçu : `Logo la Ola classique.jpeg` (1600 × 901, JPEG sur fond `#F7F7F7`), déjà dans le dépôt GitHub | Couleurs relevées (§4.1). Reste à obtenir une **version transparente, idéalement vectorielle**, avec le nom **« La Ola Import »** (le fichier actuel porte « La Ola Impression »). |
| `SURFI/` contient 2 images : « Surfi de face » et « Surfi complet » (planche de 5 vues), fond blanc, JPEG | Détourage possible. Écarts avec le brief : voir §5.1. |
| Le connecteur Drive est en **lecture seule** sur ces fichiers (`canEdit: false`), et on ne peut pas exécuter `git` dans Google Drive | Impossible de « travailler directement dans le dossier » ou d'y faire `git init` depuis cette session. **Décidé : le dossier sera poussé dans un dépôt GitHub de La Ola Import**, que j'attacherai à la session. |
| `CLAUDE.md` impose « espagnol d'Espagne », le brief impose le français | **Décidé : français, URL en français.** |
| Nom : « La Ola Import » (CLAUDE.md, brief) / « La Ola Impression » (logo) | **Décidé : « La Ola Import ».** Le logo actuel porte « Impression » : il doit être refait (ou son texte corrigé) avant toute mise en ligne. |
| « Espace client » demandé dans l'en-tête, mais aucune base de données ni authentification en V1 | **Décidé : « Mon projet » local en V1** (§3). |
| `.env.example` : variables vides, sauf `CORREO_TRANSPORTE=gmail` (valeur de configuration, pas un secret) | Je la viderai aussi pour respecter « sans valeurs ». `.gitignore` exclut bien `.env*` (sauf `.env.example`) et les originaux du fournisseur. |
| Base hébergée sur Netlify (`netlify.toml`) | Netlify ou Vercel restent possibles. Le choix d'hébergeur reste ouvert (§8). |

---

## 1. Arborescence et description des pages

URL en français : elles servent le SEO local (« t-shirt personnalisé Monteux ») et la lisibilité d'un lien partagé
sur WhatsApp. Les routes espagnoles de la base sont renommées (le code reste le même).

| URL | Ex-route de la base | Rôle | Cible | Indexée |
|---|---|---|---|---|
| `/` | `/` | Accueil : accroche, catégories et produits phares dès le 1er écran, puis atelier, équipe, avis | B2B + B2C | oui |
| `/catalogue` | `/catalogo` | Grille filtrable (catégorie, sous-genre, usage, technique) ; filtres en paramètres d'URL (`?categorie=textile&type=t-shirts`) | B2B + B2C | oui (canonique sans filtres) |
| `/catalogue/[slug]` | `/catalogo/[slug]` | Fiche produit : photos par couleur, Surfi, tailles, zones de marquage, double CTA | B2B + B2C | oui |
| `/personnaliser/[slug]` | `/disena/[slug]` | Studio 2D (canvas) : poser son logo devant/derrière | surtout B2C, petits clubs | oui |
| `/projet` | `/proyecto` | Panier (localStorage) et formulaire en étapes, envoi par action serveur | B2C | non |
| `/devis` | **nouvelle** (même moteur que `/projet`) | Demande de devis B2B : type, quantités, technique, logo, délai, coordonnées. Pré-remplie depuis une fiche (`?produit=slug`) | B2B | oui |
| `/merci` | `/gracias` | Confirmation, prochaines étapes, lien WhatsApp | tous | non |
| `/avis` | `/opiniones` | Avis réels et autorisés (Google Sheets). Masquée du menu tant qu'il n'y a aucun avis | tous | oui |
| `/donner-mon-avis` | `/tu-opinion` | Formulaire d'avis client (consentement à la publication) | clients | non |
| `/comment-nous-travaillons` | section de l'accueil | Histoire, étapes, B-roll des machines DTF et UV, galerie de l'atelier, FAQ | tous | oui |
| `/qui-sommes-nous` | nouvelle | Fiches de l'équipe (Stéphane, Arthur…), showroom, présentation de Surfi | tous | oui |
| `/professionnels/clubs-sportifs` | nouvelle | Page segment : maillots, survêtements, sacs ; arguments clubs | B2B | oui |
| `/professionnels/campings` | nouvelle | Tenues du personnel, boutique du camping, souvenirs | B2B | oui |
| `/professionnels/boutiques-souvenirs` | nouvelle | Souvenirs, magnets, textiles « destination » [gamme à confirmer] | B2B | oui |
| `/professionnels/entreprises` | nouvelle | Tenues de travail, objets publicitaires, événements | B2B | oui |
| `/espace-client` | nouvelle | V1 : « Mon projet » (panier local et reprise de la demande), voir §3 | tous | non |
| `/livraison-et-paiement` | nouvelle | Retrait à l'atelier, livraison, moyens de paiement : **tout [à confirmer]** | tous | oui |
| `/mentions-legales` | `/aviso-legal` | Mentions LCEN : éditeur, SIRET, hébergeur, directeur de publication | — | oui |
| `/confidentialite` | `/privacidad` | Politique RGPD | — | oui |
| `/cookies` | `/cookies` | Politique cookies et gestion du consentement | — | oui |
| `/cgv` | nouvelle | **Obligatoires dès qu'on vend en ligne à des particuliers** : à rédiger par le conseil juridique [à confirmer] | — | oui |
| 404 | — | « Cette vague n'existe pas » avec Surfi vu de dessus, et liens vers le catalogue et le devis | — | non |

**Pourquoi `/devis` est séparé de `/projet`.** L'acheteur B2B ne raisonne pas en panier : il a une quantité, une
échéance et un logo. Un formulaire dédié et court réduit l'abandon. Le moteur (zod, antispam, pièces jointes de 4 Mo
maximum, repli WhatsApp) reste celui de `lib/solicitud/`.

---

## 2. Structures détaillées

### 2.1 Accueil

Ordre conçu pour que l'offre soit visible **dès le premier écran** (390 × 844) : le visiteur voit en moins de 3 s ce
qu'on vend, et l'élément LCP est le titre texte, pas une image lourde.

| # | Bloc | Contenu | Enjeu |
|---|---|---|---|
| 1 | **Accroche + grille fusionnées** | H1 « Donnez des couleurs à vos idées ! », une phrase de sous-titre, CTA fuchsia « Demander un devis » et lien « Voir le catalogue », puis immédiatement la grille de 6 catégories (2 colonnes en mobile, 3 à 6 en desktop) | Pas de héros plein écran qui repousse l'offre ; LCP texte < 2,5 s |
| 2 | **Produits phares** | 4 à 8 cartes (photo, nom, « Consulter le prix », pastilles couleurs) | Raccourci vers la fiche, preuve de la gamme |
| 3 | **Vous êtes…** | 4 cartes segment et 1 lien « particulier » | Aiguillage B2B dès le haut de page |
| 4 | Séparateur vague (SVG) | Dégradé cyan → bleu → violet → fuchsia | Rythme visuel, signature de marque |
| 5 | **Comment nous travaillons** (teaser) | 4 étapes illustrées, une vidéo B-roll en boucle (muette, avec bouton pause), lien vers la page | Rassure sur le process (BAT, fabrication sur place) |
| 6 | **Qui sommes-nous** (teaser) | Fiches de Stéphane et Arthur [photos à fournir], lien vers la page | Chaleur humaine et transparence : on sait qui imprime |
| 7 | **Essayez avec votre logo** | Dépôt du logo, puis le studio (`lib/logo-pendiente.ts`) | Micro-engagement, projection |
| 8 | **Avis** | Affiché **uniquement** s'il existe des avis réels publiables | Preuve sociale honnête |
| 9 | **Bandeau final** | « Un projet ? On en parle. », boutons devis, WhatsApp et téléphone | Dernière chance de conversion |
| 10 | Footer | Voir §3.3 | |

Éléments de la base retirés : fond spatial (`StarField`, `cielo*`), ojo de buey, constellations, transitions « nave »
et « travesía ».

### 2.2 Catalogue (`/catalogue`)

1. Fil d'Ariane et H1 « Catalogue » avec une phrase de contexte.
2. **Puces de catégories** défilantes (Textile, Objets publicitaires, Souvenirs, Enfants…) : un accès en un tap sur mobile.
3. Barre de filtres : sur mobile, un bouton « Filtrer (n) » ouvre un tiroir ; sur desktop, une colonne latérale.
   Filtres : sous-genre, usage (club, camping, boutique, entreprise), technique (DTF, UV… [à confirmer]), couleur.
4. Grille de cartes (2 colonnes mobile, 3 tablette, 4 desktop). Carte : photo 4:5, nom, sous-genre, pastilles
   couleurs (jusqu'à 5, puis « +n »), mention « Consulter le prix ».
5. État vide : « Aucun produit ne correspond. Demandez-nous, on trouve souvent ! » avec le CTA devis.
6. Bandeau B2B intercalé après la 8e carte : « Une commande pour votre club ou votre camping ? »

### 2.3 Fiche produit textile (`/catalogue/[slug]`)

| Zone | Contenu | Détail UX |
|---|---|---|
| Fil d'Ariane | Catalogue › Textile › T-shirts | |
| Galerie | Photo par couleur, devant et derrière (`<img srcset>` 800/1200, hors `next/image`, voir BASE-TECNICA). **Scène Surfi** superposée | Ratio fixe, donc aucun CLS |
| En-tête | H1 nom [à confirmer], phrase d'usage, badge « Consulter le prix » | |
| Couleurs | Groupe radio de pastilles de 44 px, nom de la couleur affiché, `aria-live` | Le clic déclenche Surfi (§5) |
| Tailles | Puces adulte et enfant, lien « Guide des tailles » | |
| Marquage | Zones (cœur, dos, manche) avec taille max en cm ; techniques compatibles [à confirmer] | |
| **CTA** | B2C : **« Ajouter au panier »** (fuchsia) et « Personnaliser avec mon logo » (contour violet, si un studio existe). B2B : **« Demander un devis »** (bouton contour marine, toujours visible) | Un seul bouton fuchsia par écran : hiérarchie claire |
| Réassurance | « Fabriqué dans notre atelier de Monteux », « Un vrai interlocuteur, pas un robot », délai de réponse [à confirmer] | Ne promet rien de non validé |
| Accordéons | Matière et grammage, entretien, délais [à confirmer], formats de fichier acceptés | |
| Combinez avec | 4 produits (`lib/catalogue.ts`) | Panier moyen |
| Barre collante mobile | Apparaît une fois les CTA sortis de l'écran : « Ajouter au panier » et icône devis | CTA toujours à portée du pouce |

Sur une page segment B2B, le fuchsia passe au CTA « Demander un devis » : le bouton principal suit l'intention
dominante de la page.

### 2.4 Page « Comment nous travaillons »

1. **Accroche** : « De votre idée à la pièce finie, tout se passe ici, à Monteux. »
2. **Notre histoire** : 2 ou 3 paragraphes [texte à fournir : date de création, déclic, valeurs] et une photo de
   l'atelier [photo à fournir, 1600 × 1000].
3. **Les étapes**, en frise numérotée :
   1. Vous nous envoyez votre idée (logo, croquis ou simple envie).
   2. Nous vous conseillons : support, technique, emplacement.
   3. Vous validez le BAT (bon à tirer) avant toute impression.
   4. Nous fabriquons à l'atelier.
   5. Retrait au showroom ou livraison [à confirmer].
4. **Nos machines en action** : vidéos B-roll en boucle, muettes, `playsinline`, `preload="none"`, chargées à
   l'entrée dans l'écran, avec bouton pause (WCAG 2.2.2) ; arrêtées si `prefers-reduced-motion`. DTF [vidéo à
   fournir, 1080 × 1350 pour mobile et 1920 × 1080, 8 à 12 s, < 2 Mo] et UV [idem].
5. **Galerie de l'atelier** : 6 à 12 photos [photos à fournir, 1200 × 1200 ou 1200 × 1500], lightbox légère.
6. **FAQ** : formats de logo, quantités minimales [à confirmer], délais [à confirmer], retrait et livraison
   [à confirmer].
7. CTA « Parlez-nous de votre projet ».

### 2.5 Page « Qui sommes-nous »

1. Accroche : « Une petite équipe, de grandes envies de couleurs. »
2. **Fiches équipe** (grille de 2 en mobile, 3 ou 4 en desktop), chacune avec :
   - photo réelle au format 4:5 [photo à fournir, 800 × 1000, fond atelier] ;
   - prénom ;
   - rôle ;
   - une phrase personnelle [à fournir] ;
   - sa spécialité.
   Stéphane, dirigeant ; Arthur, technicien ; [autres membres à confirmer].
3. **Le showroom** : photo [à fournir, 1600 × 1000], adresse, horaires, lien vers la carte. Pas d'iframe Google Maps,
   qui dépose des cookies et pèse lourd.
4. **Et Surfi ?** Encadré qui présente la mascotte comme **personnage virtuel**, clairement distinct de l'équipe
   réelle. C'est une question de transparence.
5. CTA « Venez nous voir » ou « Demander un devis ».

### 2.6 Formulaire de devis (`/devis`), en 4 étapes

Barre de progression « Étape 2 sur 4 ». Saisie conservée entre les étapes (localStorage ; logo dans IndexedDB). Le
bouton « Retour » ne perd rien.

| Étape | Champs | Notes UX |
|---|---|---|
| 1. Votre projet | Type de produit (liste des catégories et « Autre ») ; produit précis (pré-rempli) ; **quantité** (nombre) ; technique : DTF, UV, broderie [à confirmer], **« Je ne sais pas, conseillez-moi »** ; emplacements | L'option « conseillez-moi » lève le principal frein des non-initiés |
| 2. Votre logo | Dépôt PNG, JPG, SVG ou PDF (4 Mo maximum par envoi), aperçu, case « Je n'ai pas encore de logo », commentaire | Le dépôt n'est pas obligatoire |
| 3. Votre délai | Date souhaitée **ou** « Pas de date précise » ; occasion (événement, saison, ouverture…) | Aide à prioriser |
| 4. Vos coordonnées | Vous êtes : particulier, entreprise, club, camping, boutique, association ; nom ; structure (si pro) ; email ; téléphone (facultatif) ; code postal ; préférence de contact (email, téléphone, WhatsApp) ; **case de confidentialité obligatoire** ; champ piège invisible | Le minimum pour rappeler le client |
| Récapitulatif | Résumé modifiable, puis « Envoyer ma demande de devis » | |

Côté serveur : action serveur, validation zod, antispam (champ piège, 5 s minimum, limite par IP), email interne
complet avec reply-to, confirmation au client sobre et **sans prix**. En cas d'échec, message, bouton WhatsApp
pré-rempli et saisie conservée.

---

## 3. Menu

### 3.1 En-tête sticky (desktop ≥ 1024 px)

`[Logo]  Catalogue ▾  Comment nous travaillons  Qui sommes-nous  Espace client  [🛒 n]  [Demander un devis]`

Le bouton fuchsia « Demander un devis » s'ajoute aux 5 entrées du brief. C'est l'action la plus rentable, et il doit
rester visible en permanence.

**Méga-menu « Catalogue »**, avec des sous-genres [à confirmer d'après la gamme réelle] :

| Textile | Objets publicitaires | Souvenirs | Vous êtes… |
|---|---|---|---|
| T-shirts | Sacs et tote bags | Magnets | Club sportif |
| Polos | Mugs et gourdes | Porte-clés | Camping |
| Sweats et hoodies | Stylos et goodies | Textiles « destination » | Boutique touristique |
| Casquettes et bobs | Objets imprimés en UV | [à confirmer] | Entreprise |
| Enfants | [à confirmer] | | Particulier |
| **Tout le textile →** | **Tous les objets →** | **Tous les souvenirs →** | |

Ouverture au clic ou à la touche Entrée (pas seulement au survol), fermeture par Échap, `aria-expanded`, focus
visible.

### 3.2 Mobile (< 1024 px)

- Barre de 56 px : logo à gauche (120 px de large minimum), panier avec compteur, burger à droite (cibles de 44 px).
- Le burger ouvre un **tiroir plein écran**. Mêmes entrées que le desktop ; Catalogue en **accordéon** (un seul
  niveau ouvert à la fois) ; en bas, bouton fuchsia « Demander un devis » et liens tap-to-call et WhatsApp.
- Piège du focus, fermeture par Échap ou par le bouton ✕, défilement de la page bloqué, et `main` reste en
  `overflow-x: clip` (règle héritée, 390 px).
- Pas de masquage au défilement : l'en-tête reste simple et stable (aucun CLS, menu toujours là).

**Espace client en V1 (proposition)** : sans base de données, pas de comptes. L'entrée mène à « Mon projet » (panier
local, reprise d'une demande en cours, statut « envoyée le… » stocké sur l'appareil) et à un lien « Une question sur
votre commande ? » vers WhatsApp ou l'email. Les vrais comptes arriveront en V2 avec Supabase. Décidé.

### 3.3 Footer (fond marine)

| Colonne | Contenu |
|---|---|
| Atelier | Logo (version claire), adresse à Monteux [à fournir], téléphone [à fournir], email [à fournir], horaires [à fournir], lien vers la carte |
| Catalogue | Textile, Objets publicitaires, Souvenirs, Personnaliser |
| Professionnels | Clubs, Campings, Boutiques, Entreprises, Demander un devis |
| Infos | Livraison et paiement, Comment nous travaillons, Qui sommes-nous, Avis |
| Légal | Mentions légales, Confidentialité (RGPD), Cookies, CGV, gestion des cookies |
| Réseaux | Instagram, Facebook… [comptes à fournir] |

---

## 4. Système de design

### 4.1 Couleurs (relevées à la pipette sur le logo, `Logo la Ola classique.jpeg`)

Les teintes du logo sont **électriques** : cyan néon, bleu, indigo, violet, fuchsia. Elles sont nettement plus
saturées que celles de Surfi (turquoise et rose pastel).

| Token | Hex | Source | Usage | Contrastes (WCAG) |
|---|---|---|---|---|
| `blanc` | `#FFFFFF` | brief | Fond principal (60 %) | — |
| `perle` | `#F8F9FA` | brief (le fond du logo est `#F7F7F7`) | Fonds de section alternés (60 %) | — |
| `marine-950` | `#00063D` | **contour du logo** | Texte principal, footer, contours | 19,2:1 sur blanc ✅ |
| `ardoise-600` | `#5A6785` | dérivé du marine | Texte secondaire | 5,7:1 sur blanc ; 5,4:1 sur perle ✅ |
| `cyan-300` | `#10E9FB` | **logo** (reflet de la vague) | Éclats, vagues, illustrations | ❌ texte (1,5:1) ; ✅ 12,9:1 avec texte marine |
| `cyan-400` | `#05BCF8` | **logo** | Aplats décoratifs, icônes (30 %) | ❌ texte ; ✅ 8,7:1 avec texte marine |
| `cyan-700` | `#0072A3` | dérivé du cyan | Menu actif, icônes porteuses de sens | 5,3:1 sur blanc ✅ |
| `bleu-600` | `#0363E9` | **logo** | Liens dans le texte, anneau de focus | 5,3:1 sur blanc ; 5,0:1 sur perle ✅ |
| `indigo-700` | `#0538CA` | **logo** | Titres accentués, survol des liens | 8,7:1 ✅ |
| `violet-600` | `#6106E2` | **logo** | Boutons secondaires (contour), structure (30 %) | 8,0:1 ✅ |
| `fuchsia-500` | `#F613EA` | **logo** (fin de la vague) | Décor, dégradé, jamais du texte | ❌ texte blanc 3,4:1 |
| `fuchsia-600` | `#D40BE4` | **logo** | Grands titres décoratifs uniquement (≥ 24 px) | texte blanc 4,2:1 : AA « grand texte » seulement |
| `fuchsia-700` | `#B809C6` | fuchsia du logo, assombri | **Boutons d'action uniquement** (10 %) | texte blanc 5,4:1 ✅ AA |
| `fuchsia-800` | `#9A0AA6` | idem | Survol et appui des boutons d'action | texte blanc 7,1:1 ✅ |
| `fuchsia-50` | `#FBE3FA` | dérivé | Fonds de badges et d'encarts | texte marine ✅ |
| `soleil-400` | `#FFC93C` | lettrage « SURFI » (estimation) | Badges « Nouveau » et « Fabriqué à Monteux », étoiles des avis | texte marine ✅ |
| `ola-degrade` | `#10E9FB → #0363E9 → #6106E2 → #F613EA` | vague du logo | Séparateurs en vague, filets, Open Graph | jamais sous du texte courant |

Pastilles de couleur des produits : elles reprennent le hex des produits (`data/catalogo.ts`), entourées d'un anneau
`marine-950` à 2 px quand elles sont sélectionnées. L'état ne repose pas seulement sur la couleur (WCAG 1.4.1).

**Écarts avec le brief, signalés :**

1. Le « magenta » du logo est un **fuchsia violacé** (`#F613EA`), pas un rose. Un texte blanc dessus ne passe pas
   AA : le bouton d'action utilise `#B809C6`, la même teinte assombrie (5,4:1). Le brief disait « magenta ou rose vif ».
2. **Le logo et Surfi n'ont pas la même palette** : le logo est néon (cyan, indigo, fuchsia), Surfi est pastel
   (turquoise, rose bonbon). L'interface suit le logo. Surfi reste une illustration ; son rose pastel n'entre pas dans
   les tokens, pour ne pas faire concurrence au fuchsia des boutons.
3. Le cyan du logo est trop clair pour du texte (1,5 à 2,2:1). On ajoute `cyan-700` pour les usages porteurs de sens.
4. **Le marine du contour est presque noir** (`#00063D`) : il devient la couleur de texte, ce qui est plus doux qu'un
   noir pur et cohérent avec le logo.
5. **Jaune soleil retenu**, avec un usage strict (badges, étoiles des avis). C'est le contour du lettrage « SURFI »,
   et il évoque le soleil du Vaucluse.
6. **Corail non retenu** : il n'apparaît ni dans le logo ni chez Surfi.

### 4.2 Typographies

| Rôle | Police | Graisses | Raison |
|---|---|---|---|
| Titres | **Nunito** (variable, `next/font`) | 700 et 800 | Terminaisons arrondies qui font écho à l'écume du logo : chaleureuse et joyeuse. Plus lisible que Quicksand, dont les traits fins faiblissent en petite taille et sur un écran ensoleillé |
| Texte | **Inter** (variable) | 400 et 600 | Excellente lisibilité dans les formulaires, chiffres tabulaires pour quantités et tailles. *Point à valider : la base utilisait déjà Inter. C'est une police neutre et « invisible », mais si vous voulez rompre totalement, on prend **Poppins** 400/600.* |
| Logo | Script du logo | — | **Jamais** pour du texte |

Échelle de tailles en mobile, puis en desktop : H1 32/48, H2 26/36, H3 20/24, texte 16/18, petit texte 14. Interligne
de 1,5 pour le texte et 1,15 pour les titres. Longueur de ligne de 65 caractères maximum.

### 4.3 Espacements, rayons, ombres

- Grille de 4 px. Échelle : 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Sections : 48 px en mobile, 96 px en desktop. Conteneur de 1200 px maximum, marge latérale de 16 px en mobile et
  24 px au-delà.
- Rayons : boutons `9999px` (pill) ; cartes `16px` ; champs `12px` ; badges `9999px`.
- Ombre douce des cartes : `0 4px 16px rgb(0 6 61 / 0.08)`, puis `0 8px 24px rgb(0 6 61 / 0.12)` au survol.
  Elle reprend le marine, pour rester cohérente avec le logo.

### 4.4 Composants

| Composant | Spécification |
|---|---|
| Bouton principal | Pill, fond `fuchsia-700`, texte blanc 16 px en 600, hauteur de 48 px (44 minimum), survol `fuchsia-800`, focus : anneau `bleu-600` de 3 px décalé de 2 px |
| Bouton secondaire | Pill, contour de 2 px `violet-600`, texte `violet-600` ; au survol, fond `#F2EDFB` |
| Bouton devis (B2B, sur fiche) | Pill, contour `marine-950`, icône document |
| Lien | `bleu-600`, souligné (ou `cyan-700` dans la navigation) |
| Carte produit | Rayon de 16 px, fond blanc, ombre douce, photo 4:5 sur fond clair, toute la carte cliquable avec un seul lien (pas de liens imbriqués) |
| Badge | Pill, fond `soleil-400` ou `fuchsia-50`, texte `marine-950` 12 à 14 px |
| Pastille couleur | 32 px visibles, zone tactile de 44 px, `role="radio"`, nom en infobulle et en texte |
| Séparateur vague | SVG inline (< 1 Ko), `aria-hidden`, deux couches (dégradé et écume blanche) inspirées de la vague du logo ; aucune animation, ou une ondulation lente désactivée par `prefers-reduced-motion` |
| Champ de formulaire | Hauteur de 48 px, rayon de 12 px, label toujours visible (pas de placeholder seul), erreur en texte et icône, `aria-describedby` |
| Repère [photo à fournir] | Bloc perle à bords tirets, ratio fixe, texte « [photo à fournir], 800 × 1000 » : visible en préproduction, **bloque la mise en ligne** via `revisar-web.mjs` |

Tokens dans `app/globals.css` (`@theme` Tailwind 4) : je propose de **renommer** les tokens hérités (`space-*`,
`nova-*`, `star-*`, `moon-*`, `ink-*`, `mist-*`) en `marine-*`, `cyan-*`, `violet-*`, `fuchsia-*`, `perle`… Le code
reste ainsi lisible et l'on ne garde rien de la métaphore spatiale de la base.

---

## 5. Animation Surfi

### 5.1 Ressources reçues et écarts

La planche « Surfi complet » contient 5 vues :

| # | Vue | Remarque |
|---|---|---|
| 1 | Face (trois-quarts face, regard vers nous) | La meilleure image d'ouverture |
| 2 | Trois-quarts droit, presque profil | Proche de la vue 3 |
| 3 | Trois-quarts droit, plus de face | |
| 4 | Dos (trois-quarts arrière) | Les ailerons violets sont visibles |
| 5 | **Vue de dessus** de la planche (et non « planche de profil ») | Inutile pour la rotation : réservée à la page 404 ou au loader |

**Écarts avec le brief :**

- **Pas de trois-quarts gauche** : les vues 2 et 3 regardent toutes deux vers la droite. Un miroir CSS
  (`scaleX(-1)`) inverserait le lettrage « SURFI ». Je propose une rotation face → droite → dos, sans vue gauche, ce
  qui est cohérent avec un déplacement de gauche à droite.
- **La vague n'est pas séparée** : chaque vue a sa propre vague intégrée. Deux options : (a) le graphiste fournit une
  vague seule et Surfi sans vague ; (b) au détourage, on garde Surfi et sa planche, et on extrait la vague de la vue 1
  comme élément commun. **(a) est préférable** (contours propres).
- Les rendus sont en JPEG sur fond blanc : il faut un détourage soigné (cheveux, éclaboussures). Si les fichiers 3D
  sources existent, un export PNG transparent direct serait bien meilleur.

### 5.2 Séquence et timing (1,6 s au total, < 2 s)

Ordre proposé : **1 Face, 3 Trois-quarts, 2 Profil, 4 Dos.** Le corps tourne progressivement en s'éloignant.
Alternative à tester à l'écran : 1 → 2 → 3 → 4. Je comparerai les deux sur une page de test, avec captures, avant de
choisir.

```
t (ms)   0        150         450         750         1050       1350   1600
Surfi    │ entrée │ vue 1      │ vue 3      │ vue 2      │ vue 4    │ sortie (fondu 250 ms)
         └─ translateX : -25 % ───────────────────────────────────▶ 105 % de la largeur
Wipe     │        │ clip-path inset(0 100% 0 0) ───────▶ inset(0 0 0 0)  (150 → 1350 ms)
Vague    │ légère oscillation translateY ±4 px (ease-in-out) pendant tout le trajet
```

- **Le bord du wipe suit la planche** : la nouvelle couleur est révélée « au passage » de Surfi.
- Seuls `transform`, `opacity` et `clip-path` sont animés : pas de reflow.
- Les 4 vues sont rassemblées dans **un seul sprite WebP transparent** (4 × 320 × 400 px, ≈ 60 à 90 Ko) et la vague
  dans un WebP séparé (≈ 15 Ko). Deux requêtes seulement, au premier survol ou focus d'une pastille, ou au premier
  `pointerdown`.
- Surfi est affiché à environ 40 % de la hauteur de la photo, ancré en bas.

### 5.3 Règles

| Règle | Implémentation |
|---|---|
| Ne bloque pas l'interface | Calque `pointer-events: none` et `aria-hidden="true"` ; l'état « couleur choisie » change **immédiatement** (les CTA et la taille restent utilisables) |
| Désactivable | Interrupteur « Animations » dans le pied de la fiche, mémorisé dans `localStorage` (`laola:surfi = off`) |
| 2 s maximum | 1600 ms, plus une sécurité `setTimeout` qui coupe tout à 2000 ms |
| `prefers-reduced-motion` | Simple fondu de 150 ms entre les deux photos, sans Surfi |
| Clic pendant l'animation | Annulation propre (`animation.cancel()`), puis relance avec la nouvelle couleur |
| Images pas encore prêtes | Si le sprite n'est pas décodé à t = 150 ms : fondu simple, sans attendre |
| Sans JavaScript | Les pastilles sont des liens `?couleur=…` rendus par le serveur : la page se recharge avec la bonne photo |
| Lecteurs d'écran | `aria-live="polite"` : « Couleur : Bleu marine » |

### 5.4 Code conceptuel

`lib/surfi.ts` (remplace `lib/ovni.ts`) :

```ts
// lib/surfi.ts : configuration et moteur de l'animation Surfi (sans React, testable).
// Remplace lib/ovni.ts et data/ovni-sprites.json de la base.

export const SURFI = {
  sprite: '/marca/surfi/surfi-rotation.webp', // 4 vues côte à côte, fond transparent
  vague: '/marca/surfi/vague.webp',           // vague seule, support de la planche
  vues: 4,                                    // ordre dans le sprite : face, 3/4, profil, dos
  dureeTotale: 1600,                          // ms, < 2000 (exigence du brief)
  // instants (ms) où l'on passe à la vue suivante
  changements: [150, 450, 750, 1050],
  wipe: { debut: 150, fin: 1350 },
  sortie: 250,                                // fondu final
  securite: 2000,                             // coupe-circuit absolu
  fonduReduit: 150,                           // prefers-reduced-motion
  cleDesactivation: 'laola:surfi',
} as const;

// --- Préchargement à l'intention (survol, focus ou premier appui), jamais au chargement de la page ---
let prechargement: Promise<boolean> | null = null;

export function prechargerSurfi(): Promise<boolean> {
  if (prechargement) return prechargement;
  const charger = (src: string) => {
    const img = new Image();
    img.src = src;
    // decode() garantit qu'il n'y aura aucun saut à la première image
    return img.decode().then(() => true, () => false);
  };
  prechargement = Promise.all([charger(SURFI.sprite), charger(SURFI.vague)])
    .then((ok) => ok.every(Boolean));
  return prechargement;
}

export function surfiActif(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return localStorage.getItem(SURFI.cleDesactivation) !== 'off';
}

type Scene = {
  scene: HTMLElement;       // conteneur Surfi + vague (calque au-dessus de la photo)
  bande: HTMLElement;       // bande du sprite (largeur = 4 vues), déplacée par translateX
  vague: HTMLElement;
  nouvellePhoto: HTMLElement; // photo de la nouvelle couleur, au-dessus de l'ancienne
};

/**
 * Joue l'animation. Retourne une fonction d'annulation.
 * La couleur est DÉJÀ changée dans l'état React avant l'appel : l'animation n'est qu'un habillage.
 */
export function jouerSurfi(el: Scene, pret: boolean, onFin: () => void): () => void {
  const anims: Animation[] = [];
  const minuteurs: number[] = [];
  let termine = false;
  const finir = () => {
    if (termine) return;
    termine = true;
    anims.forEach((a) => a.cancel());
    minuteurs.forEach(clearTimeout);
    el.scene.style.opacity = '0';
    el.nouvellePhoto.style.clipPath = 'none';
    onFin(); // le parent retire l'ancienne photo
  };

  // Cas 1 : mouvement réduit, désactivé ou images pas prêtes → fondu simple
  if (!surfiActif() || !pret) {
    anims.push(el.nouvellePhoto.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: SURFI.fonduReduit, easing: 'ease-out' },
    ));
    anims[0].onfinish = finir;
    return finir;
  }

  // Cas 2 : animation complète
  el.scene.style.opacity = '1';

  // a) Trajet de Surfi de gauche à droite
  anims.push(el.scene.animate(
    [
      { transform: 'translateX(-25%)', opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.09 },
      { transform: 'translateX(105%)', opacity: 1, offset: 0.84 },
      { transform: 'translateX(110%)', opacity: 0, offset: 1 },
    ],
    { duration: SURFI.dureeTotale, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' },
  ));

  // b) Wipe : la nouvelle couleur se révèle derrière la planche
  anims.push(el.nouvellePhoto.animate(
    [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
    {
      delay: SURFI.wipe.debut,
      duration: SURFI.wipe.fin - SURFI.wipe.debut,
      easing: 'cubic-bezier(.45,.05,.55,.95)', // même courbe que le trajet : le bord suit Surfi
      fill: 'both',
    },
  ));

  // c) Rotation : on change de vue en décalant la bande du sprite (pas de changement de src, donc aucun clignotement)
  SURFI.changements.forEach((t, i) => {
    minuteurs.push(window.setTimeout(() => {
      el.bande.style.transform = `translateX(${-i * (100 / SURFI.vues)}%)`;
    }, t));
  });

  // d) Oscillation de la vague
  anims.push(el.vague.animate(
    [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }],
    { duration: 800, iterations: 2, easing: 'ease-in-out' },
  ));

  anims[0].onfinish = finir;
  minuteurs.push(window.setTimeout(finir, SURFI.securite)); // coupe-circuit
  return finir;
}
```

`components/producto/Surfi.tsx` (remplace `Ovni.tsx`, chargé à la demande par `import()` : 0 octet dans le JS
initial) :

```tsx
'use client';
// Scène Surfi superposée à la galerie de la fiche. Les pastilles restent des <a href="?couleur=…">
// pour fonctionner sans JS ; avec JS, on intercepte le clic.
import { useEffect, useRef } from 'react';
import { jouerSurfi, prechargerSurfi, SURFI } from '@/lib/surfi';

type Props = {
  declencheur: number;        // s'incrémente à chaque changement de couleur
  nouvellePhoto: React.RefObject<HTMLElement>;
  onFin: () => void;
};

export default function Surfi({ declencheur, nouvellePhoto, onFin }: Props) {
  const scene = useRef<HTMLDivElement>(null);
  const bande = useRef<HTMLDivElement>(null);
  const vague = useRef<HTMLImageElement>(null);
  const annuler = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!declencheur || !scene.current || !bande.current || !vague.current || !nouvellePhoto.current) return;
    annuler.current?.();                       // un nouveau clic annule l'animation en cours
    bande.current.style.transform = 'translateX(0)';
    let actif = true;
    // on laisse 150 ms au préchargement ; au-delà, on se rabat sur le fondu
    const delai = new Promise<boolean>((r) => setTimeout(() => r(false), 150));
    Promise.race([prechargerSurfi(), delai]).then((pret) => {
      if (!actif) return;
      annuler.current = jouerSurfi(
        { scene: scene.current!, bande: bande.current!, vague: vague.current!, nouvellePhoto: nouvellePhoto.current! },
        pret,
        onFin,
      );
    });
    return () => { actif = false; };
  }, [declencheur]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => annuler.current?.(), []); // nettoyage au démontage

  return (
    <div ref={scene} aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-[40%] aspect-[4/5] opacity-0">
      <img ref={vague} src={SURFI.vague} alt="" className="absolute bottom-0 w-full" />
      <div className="relative h-full overflow-hidden">
        {/* 4 vues côte à côte : largeur de 400 % */}
        <div ref={bande} className="flex h-full w-[400%]">
          <img src={SURFI.sprite} alt="" className="h-full w-full object-contain" />
        </div>
      </div>
    </div>
  );
}
```

Côté pastilles (dans la galerie) : `onPointerEnter`, `onFocus` et `onPointerDown` appellent `prechargerSurfi()`, puis
`import('./Surfi')` une seule fois ; `onClick` fait `e.preventDefault()`, met à jour la couleur (`history.replaceState`
pour l'URL) et incrémente `declencheur`.

---

## 6. Plan d'usage du logo

**Prérequis bloquant :** le fichier source. Idéalement, le **vectoriel du graphiste** (AI, SVG ou PDF). Une
vectorisation automatique d'un dégradé avec de l'écume donne un résultat médiocre : sans source, il faut prévoir un
redessin vectoriel.

| Version | Format | Usage | Taille minimale |
|---|---|---|---|
| A. Logo complet couleur | SVG (et PNG 2× de secours) transparent | En-tête, footer, documents | 120 px de large à l'écran ; 35 mm en impression |
| B. Logo complet monochrome marine, et blanc | SVG | Marquage une couleur (textile, tampon), fonds photo | 120 px ; 30 mm |
| C. Symbole vague seule (sans texte) | SVG et PNG | Favicon, icône Apple, Open Graph, avatar des réseaux | 16 px (version simplifiée, sans gouttes) |
| D. Logo email | PNG transparent, 400 × 160 affiché en 200 × 80 | Emails (`lib/correo/logo-email.ts`) | 160 px |

- **Zone de protection** : `x` = hauteur de la crête de la vague. On laisse `0,5 x` de vide sur chaque côté (rien ne
  doit y entrer : texte, bord d'écran, autre logo).
- **Fond** : le script blanc à contour marine reste lisible sur fond clair comme sur fond foncé. Sur une photo
  chargée, on pose le logo sur un cartouche blanc arrondi.
- **Emails en mode sombre** : grâce au contour marine, le PNG transparent reste lisible. C'est la raison de ce choix
  plutôt qu'un fond blanc.
- **Interdits** : déformer ; recolorer le dégradé ; ajouter une ombre ; faire pivoter ; utiliser le script pour du
  texte.
- **Open Graph** (1200 × 630) : vague seule, comme le demande le brief. *Recommandation marketing : ajouter le nom et
  le slogan en Nunito, en texte et non en script. Un lien partagé sur WhatsApp ou Facebook sans le nom de la marque
  perd sa reconnaissance.* À valider.

Fichiers à remplacer :

| Fichier | Contenu |
|---|---|
| `public/marca/logo-marca.png` | version A en PNG 2× |
| `public/marca/logo-marca-catalogo.webp` | décision : quel motif d'exemple sur les produits ? |
| `public/og/marca.png` | version C |
| `app/favicon.ico` | 16, 32 et 48 px, version C simplifiée |
| `app/icon.png` | 512 px, vague sur fond blanc, marge de 12 % |
| `app/apple-icon.png` | 180 px, fond blanc, marge de 12 % |
| `lib/correo/logo-email.ts` | version D en base64 |

Nouveaux éléments à remplacer, que j'ajouterai à PENDIENTE-DE-SUSTITUIR.md : `public/marca/estrella-marca*.png`
(l'« étoile » n'existe plus dans la nouvelle identité : à supprimer), `public/marca/tu-logo-aqui.png` (à refaire en
Nunito : « Votre logo ici »), les fichiers Surfi (`public/marca/surfi/*`), les vidéos B-roll et les photos de l'équipe.

---

## 7. Textes en français

Ton : tutoiement exclu (vouvoiement, pour le B2B), phrases courtes, verbes d'action, aucune promesse non validée.

**Accueil**

- H1 : **Donnez des couleurs à vos idées !**
- Sous-titre : Textiles, objets publicitaires et souvenirs personnalisés, imprimés dans notre atelier de Monteux.
- CTA : **Demander un devis**. Lien : Voir le catalogue.
- Catégories : Textile · Objets publicitaires · Souvenirs · Enfants · Casquettes et bobs · Sacs [à confirmer].
- Produits phares : « Nos incontournables ». Mention de prix : « Consulter le prix ».
- Vous êtes… : « Un club, un camping, une boutique, une entreprise ? On a l'habitude. » Cartes :
  - **Clubs sportifs** : maillots, sweats et sacs aux couleurs du club.
  - **Campings** : tenues d'équipe et boutique souvenirs.
  - **Boutiques touristiques** : souvenirs qui donnent envie de revenir.
  - **Entreprises** : tenues, goodies et cadeaux qui portent votre marque.
  - Lien : « Vous êtes un particulier ? Par ici. »
- Comment nous travaillons (teaser) : « Votre idée, notre atelier, votre pièce. » Étapes : Vous nous envoyez votre
  idée · Nous vous conseillons · Vous validez le BAT · Nous imprimons à Monteux. Lien : « Découvrir notre atelier ».
- Qui sommes-nous (teaser) : « Derrière chaque impression, il y a des visages. » Stéphane, dirigeant ; Arthur,
  technicien. Lien : « Rencontrer l'équipe ».
- Essayez avec votre logo : « Voyez votre logo sur un t-shirt en quelques secondes. » Bouton : « Déposer mon logo ».
- Bandeau final : « Un projet ? On en parle. » Boutons : Demander un devis · Écrire sur WhatsApp · Appeler l'atelier.

**Fiche produit**

- Boutons : « Ajouter au panier », « Personnaliser avec mon logo », « Demander un devis ».
- Réassurance : « Imprimé dans notre atelier de Monteux » · « Vous validez le visuel avant impression » · « Réponse
  sous [délai à confirmer] ».
- Interrupteur : « Animations : activées / désactivées ».

**Devis**

- H1 : « Demandez votre devis ». Sous-titre : « 4 étapes, 2 minutes. On revient vers vous avec une proposition
  claire. »
- Option technique : « Je ne sais pas, conseillez-moi ».
- Mention de confidentialité : « J'accepte que La Ola Import utilise ces informations pour répondre à ma demande.
  [Politique de confidentialité] »
- Échec d'envoi : « Oups, votre demande n'est pas partie. Rien n'est perdu : vos informations sont conservées.
  Réessayez ou envoyez-la-nous sur WhatsApp. »
- Page merci : « Merci ! Votre demande est bien arrivée à l'atelier. Nous vous recontactons [délai à confirmer].
  Un email de confirmation vient de partir. »
- Email de confirmation : « Bonjour [prénom], nous avons bien reçu votre demande pour [produit]. Notre équipe
  l'étudie et revient vers vous rapidement avec un devis. À très vite, l'équipe de La Ola Import. » (sans prix)

**Comment nous travaillons**, **Qui sommes-nous** : voir les accroches aux §2.4 et §2.5. L'histoire et les phrases
personnelles sont [à fournir] : on ne les invente pas.

**Surfi (encadré)** : « Surfi, c'est notre mascotte virtuelle. Il ne sait pas imprimer, mais il adore montrer nos
couleurs. Pour le travail, voyez plutôt Stéphane et Arthur ! »

**404** : « Cette vague n'existe pas… mais notre catalogue, si ! »

---

## 8. Éléments à valider avec La Ola Import avant développement

| # | Sujet | Question | Bloquant ? |
|---|---|---|---|
| 1 | Nom | ✅ Décidé : « La Ola Import ». Reste à obtenir un logo qui porte ce nom | **Oui** (logo) |
| 2 | Langue | ✅ Décidé : français, URL en français (la règle de CLAUDE.md sera corrigée) | — |
| 3 | Logo | Fichier source vectoriel (AI, SVG, PDF) | **Oui** |
| 4 | Surfi | Vague séparée et Surfi sans vague (PNG transparents ou fichiers 3D) ; vue trois-quarts gauche souhaitée ? | Non (le détourage est possible) |
| 5 | Espace client | ✅ Décidé : « Mon projet » local en V1, vrais comptes en V2 | — |
| 6 | Société | Raison sociale, SIRET, adresse, téléphone, email, horaires, réseaux, directeur de publication | Oui pour la mise en ligne |
| 7 | Règles commerciales | Délais, minimum de commande, zone de livraison, retrait à l'atelier, moyens de paiement, TVA | Oui pour la mise en ligne |
| 8 | Vente en ligne | Paiement en ligne en V1 ou devis seul ? Si l'on vend : CGV et droit de rétractation | Oui |
| 9 | Techniques | Liste exacte (DTF, UV, broderie, sérigraphie, sublimation ?) et compatibilité par produit | Oui pour les filtres |
| 10 | Catalogue | Les 30 produits : à garder ? Noms, couleurs, tailles, zones ; sous-genres du menu | Oui |
| 11 | Prix | Grille tarifaire ; sinon « Consulter le prix » partout | Non |
| 12 | Typographie | Inter (déjà dans la base) ou Poppins ? | Non |
| 13 | Open Graph | Vague seule, ou vague avec nom et slogan ? | Non |
| 14 | Médias réels | Photos de l'atelier, du showroom, de l'équipe, vidéos DTF et UV (dimensions au §2) | Oui pour la mise en ligne |
| 15 | Hébergement | Netlify (config existante) ou Vercel ; domaine ; email expéditeur | Oui pour le déploiement |
| 16 | Comptes | GitHub, hébergeur, email, Google (Search Console, fiche d'établissement), analytics : tous nouveaux | Oui |
| 17 | Équipe | Liste complète des personnes, rôles, autorisation de publier photos et prénoms (droit à l'image) | Oui |
| 18 | Avis | Feuille Google Sheets propre à La Ola ; collecte d'avis réels | Non |

---

## 9. Checklist de tests

| Contrôle | Commande ou outil | Critère |
|---|---|---|
| Build | `npm run build` | 0 erreur |
| Lint | `npm run lint` | 0 erreur |
| Types | `npx tsc --noEmit` | 0 erreur |
| Tests unitaires | `npm test` | Verts (opinions, schéma zod, `surfi.ts` : timing et repli) |
| 390 px | `node scripts/comprobar-movil.mjs <url>` | Aucun débordement horizontal sur toutes les pages, menu visible |
| Revue du site | `node scripts/revisar-web.mjs <url>` | Liste de mots interdits **adaptée** : aucun placeholder (`[MARCA]`, `[photo à fournir]`…), aucune mention de la base ni du fournisseur, aucun délai ni minimum non validé |
| Performance | Lighthouse mobile (accueil, catalogue, fiche) | ≥ 90 ; LCP < 2,5 s ; JS initial de l'accueil < 200 Ko gzip |
| Accessibilité | Lighthouse et axe, clavier seul, lecteur d'écran | AA : contrastes, focus visible, menu et tiroir au clavier, `aria-live` des couleurs |
| Mouvement réduit | Émulation `prefers-reduced-motion` | Surfi devient un fondu de 150 ms ; vidéos à l'arrêt |
| Surfi | Test manuel | ≤ 2 s ; clics rapides sans blocage ; aucune requête sprite avant le premier survol ; sans JS, changement de couleur par lien |
| Formulaires | Envoi réel (transport `archivo`), échec simulé | Repli WhatsApp, saisie conservée, panier vidé seulement après succès |
| Emails | Gmail, Outlook, Apple Mail (clair et sombre) | Logo PNG lisible, pas de prix dans la confirmation |
| Secrets | `git ls-files \| grep -i '\.env'` | Seul `.env.example` (sans valeurs) |
