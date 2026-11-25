// Produits personnalisables de la page d'accueil, regroupés en familles (vêtements, casquettes, gourdes, couteaux, tote
// bags, accessoires). Chaque famille pointe vers son produit s'il n'y en a qu'un, sinon vers la boutique filtrée.
// Aucune famille n'est inventée : si une famille n'a pas encore de produit, la carte affiche « Bientôt » + « Consultez-nous ».
import type { Producto } from './catalogo';

export interface FamillePersonnalisable {
  id: string;
  nom: string;
  texte: string;
  /** Onglet de /boutique vers lequel pointe la carte quand la famille a plusieurs produits. */
  onglet: string;
  garde: (p: Producto) => boolean;
}

export const FAMILLES_PERSONNALISABLES: FamillePersonnalisable[] = [
  { id: 'vetements', nom: 'Vêtements', texte: 'T-shirts, polos et sweats à vos couleurs.', onglet: 'vetements', garde: (p) => p.categoria === 'camisetas-polos' || p.categoria === 'sudaderas' },
  { id: 'casquettes', nom: 'Casquettes', texte: 'Votre logo sur le devant de la casquette.', onglet: 'casquettes-chapeaux', garde: (p) => p.categoria === 'gorras' },
  { id: 'gourdes', nom: 'Gourdes', texte: 'Gourdes et mugs isothermes personnalisés.', onglet: 'goodies', garde: (p) => p.tipo.startsWith('Gourde') || p.tipo.startsWith('Mug') },
  { id: 'couteaux', nom: 'Couteaux', texte: 'Couteaux gravés ou imprimés à votre nom.', onglet: 'couteaux', garde: (p) => p.categoria === 'couteaux' },
  { id: 'totebags', nom: 'Tote bags', texte: 'Des sacs en tissu pour porter votre marque.', onglet: 'sacs', garde: (p) => p.categoria === 'bolsas' },
  {
    id: 'accessoires',
    nom: 'Accessoires',
    texte: 'Porte-clés, stylos, carnets et clés USB.',
    onglet: 'goodies',
    garde: (p) => p.categoria === 'goodies' && !p.tipo.startsWith('Gourde') && !p.tipo.startsWith('Mug') && !p.tipo.includes('Outil multifonction'),
  },
];
