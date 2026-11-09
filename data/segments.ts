// Contenu des pages par segment (/professionnels/[segment]). Arguments génériques et vrais ; tout ce qui engage
// La Ola Import (quantités, délais, prix, références clients) est [à confirmer]. Aucune référence client inventée.

import type { Categoria } from './catalogo';

export interface ContenuSegment {
  slug: string;
  titre: string;
  accroche: string;
  besoins: { titre: string; texte: string }[];
  categories: Categoria[];
  idees: string[];
}

export const CONTENU_SEGMENTS: ContenuSegment[] = [
  {
    slug: 'clubs-sportifs',
    titre: 'Clubs sportifs',
    accroche: 'Maillots, sweats, sacs et goodies aux couleurs du club, pour les joueurs, les bénévoles et les supporters.',
    besoins: [
      { titre: 'Tailles adultes et enfants', texte: 'Des modèles déclinés en tailles enfant pour les écoles de sport.' },
      { titre: 'Prénoms et numéros', texte: 'Personnalisation à l’unité possible [à confirmer selon la technique].' },
      { titre: 'Boutique du club', texte: 'Des produits pour financer la saison : casquettes, gourdes, tote bags.' },
    ],
    categories: ['camisetas-polos', 'sudaderas', 'bolsas'],
    idees: ['T-shirts techniques d’entraînement', 'Sweats à capuche du club', 'Sacs de sport', 'Gourdes et goodies supporters'],
  },
  {
    slug: 'campings',
    titre: 'Campings',
    accroche: 'Des tenues d’équipe reconnaissables et une boutique souvenirs qui ressemble à votre camping.',
    besoins: [
      { titre: 'Équipes visibles', texte: 'Polos et t-shirts pour l’accueil, l’animation et l’entretien.' },
      { titre: 'Boutique souvenirs', texte: 'Textiles et objets à votre nom pour vos vacanciers.' },
      { titre: 'Avant la saison', texte: 'Anticipez vos commandes : délais de fabrication [à confirmer].' },
    ],
    categories: ['camisetas-polos', 'gorras', 'goodies'],
    idees: ['Polos du personnel', 'Casquettes et bobs', 'Tote bags souvenirs', 'Porte-clés et magnets [à confirmer]'],
  },
  {
    slug: 'boutiques-souvenirs',
    titre: 'Boutiques touristiques',
    accroche: 'Des souvenirs qui donnent envie de revenir : textiles et objets aux couleurs de votre ville ou de votre région.',
    besoins: [
      { titre: 'Petites séries variées', texte: 'Plusieurs modèles et coloris pour garnir vos rayons [quantités à confirmer].' },
      { titre: 'Visuels « destination »', texte: 'On part de votre idée ou de votre visuel pour l’adapter à chaque support.' },
      { titre: 'Réassort', texte: 'Recommandez facilement les produits qui marchent.' },
    ],
    categories: ['camisetas-polos', 'bolsas', 'goodies'],
    idees: ['T-shirts et sweats « destination »', 'Tote bags', 'Objets imprimés en UV', 'Casquettes'],
  },
  {
    slug: 'entreprises',
    titre: 'Entreprises',
    accroche: 'Tenues de travail, objets publicitaires et cadeaux d’affaires qui portent votre marque.',
    besoins: [
      { titre: 'Image cohérente', texte: 'Votre logo respecté sur chaque support, couleurs comprises.' },
      { titre: 'Événements et salons', texte: 'Goodies, sacs et textiles pour vos opérations.' },
      { titre: 'Un interlocuteur', texte: 'Un suivi direct avec l’atelier, de la demande à la livraison.' },
    ],
    categories: ['camisetas-polos', 'sudaderas', 'goodies'],
    idees: ['Polos et softshells de travail', 'Goodies pour salons', 'Cadeaux clients', 'Sacs personnalisés'],
  },
];

export function getSegment(slug: string): ContenuSegment | undefined {
  return CONTENU_SEGMENTS.find((s) => s.slug === slug);
}
