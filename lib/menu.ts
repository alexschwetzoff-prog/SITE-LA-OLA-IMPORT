// Menu « Catalogue » hiérarchisé (méga-menu en bureau, accordéon en mobile). Les sous-genres suivent les catégories de
// data/categorias.ts ; ceux qui n'existent pas encore dans le catalogue sont [à confirmer] avec La Ola Import et ne sont
// pas affichés tant qu'ils n'ont pas de produits.

import { SEGMENTS } from './site';

export interface LienMenu {
  href: string;
  etiqueta: string;
}

export interface ColonneMenu {
  titre: string;
  liens: LienMenu[];
  tout?: LienMenu;
}

export const MENU_CATALOGUE: ColonneMenu[] = [
  {
    titre: 'Textile',
    liens: [
      { href: '/catalogue?categoria=camisetas-polos', etiqueta: 'T-shirts et polos' },
      { href: '/catalogue?categoria=sudaderas', etiqueta: 'Sweats et vestes' },
      { href: '/catalogue?categoria=gorras', etiqueta: 'Casquettes' },
      { href: '/catalogue?etiquetas=mujer', etiqueta: 'Coupes femme' },
    ],
    tout: { href: '/catalogue', etiqueta: 'Tout le catalogue' },
  },
  {
    titre: 'Objets publicitaires',
    liens: [
      { href: '/catalogue?categoria=bolsas', etiqueta: 'Sacs et tote bags' },
      { href: '/catalogue?categoria=goodies', etiqueta: 'Goodies et objets' },
    ],
  },
  {
    titre: 'Souvenirs',
    liens: [{ href: '/professionnels/boutiques-souvenirs', etiqueta: 'Souvenirs pour boutiques' }],
  },
  {
    titre: 'Vous êtes…',
    liens: [
      ...SEGMENTS.map((s) => ({ href: `/professionnels/${s.slug}`, etiqueta: s.court })),
      { href: '/catalogue', etiqueta: 'Particulier' },
    ],
  },
];
