// Catégories et étiquettes du catalogue (noms publics en français ; les id restent ceux de la base). Module léger,
// à part, pour que les composants client (filtres, cartes) n'embarquent pas les 30 produits de data/catalogo.ts.

import type { Categoria, Etiqueta } from './catalogo';

export const CATEGORIAS: { id: Categoria; nombre: string }[] = [
  { id: 'camisetas-polos', nombre: 'T-shirts et polos' },
  { id: 'sudaderas', nombre: 'Sweats' },
  { id: 'gorras', nombre: 'Casquettes' },
  { id: 'bolsas', nombre: 'Sacs' },
  { id: 'goodies', nombre: 'Goodies' },
  { id: 'sombreros', nombre: 'Chapeaux' },
  { id: 'couteaux', nombre: 'Couteaux' },
  { id: 'toallas-ponchos', nombre: 'Serviettes et ponchos' },
];

export const ETIQUETAS: { id: Etiqueta; nombre: string }[] = [
  { id: 'eco', nombre: 'Éco' },
  { id: 'mujer', nombre: 'Femme' },
  { id: 'tecnica', nombre: 'Technique' },
  { id: 'oversize', nombre: 'Oversize' },
  { id: 'manga-larga', nombre: 'Manches longues' },
  { id: 'calidad-superior', nombre: 'Qualité supérieure' },
  { id: 'enfant', nombre: 'Enfant' },
];

/**
 * Pestañas de la Boutique (/boutique). Cada pestaña agrupa una o varias categorías; toda categoría que no esté en un
 * grupo recibe automáticamente su propia pestaña (así una categoría nueva sale sola). «Enfants» es transversal: filtra
 * por la etiqueta 'enfant'. Las pestañas sin productos se ocultan en la página. El `slug` va en la URL (?cat=…).
 */
export interface PestanaBoutique {
  slug: string;
  nombre: string;
  categorias: Categoria[];
  /** Pestaña transversal: productos con esta etiqueta, sea cual sea su categoría. */
  etiqueta?: Etiqueta;
  /** Pestaña transversal por personalización: true = productos personalizables, false = artículos de la boutique. */
  personalizable?: boolean;
}

const GRUPOS_BOUTIQUE: PestanaBoutique[] = [
  { slug: 'vetements', nombre: 'Vêtements', categorias: ['camisetas-polos', 'sudaderas'] },
  { slug: 'casquettes-chapeaux', nombre: 'Casquettes et chapeaux', categorias: ['gorras', 'sombreros'] },
  { slug: 'sacs', nombre: 'Sacs', categorias: ['bolsas'] },
  { slug: 'serviettes-ponchos', nombre: 'Serviettes et ponchos', categorias: ['toallas-ponchos'] },
  { slug: 'couteaux', nombre: 'Couteaux', categorias: ['couteaux'] },
  { slug: 'goodies', nombre: 'Goodies', categorias: ['goodies'] },
];

const PESTANAS_TRANSVERSALES: PestanaBoutique[] = [
  { slug: 'enfants', nombre: 'Enfants', categorias: [], etiqueta: 'enfant' },
  { slug: 'personnalisables', nombre: 'Personnalisables', categorias: [], personalizable: true },
  { slug: 'articles-boutique', nombre: 'Articles boutique', categorias: [], personalizable: false },
];

/** Pestañas en orden: los grupos, las categorías sin grupo (automáticas) y las transversales. «Tout» lo añade la página. */
export function pestanasBoutique(): PestanaBoutique[] {
  const agrupadas = new Set(GRUPOS_BOUTIQUE.flatMap((g) => g.categorias));
  const sueltas = CATEGORIAS.filter((c) => !agrupadas.has(c.id)).map((c) => ({ slug: c.id, nombre: c.nombre, categorias: [c.id] }));
  return [...GRUPOS_BOUTIQUE, ...sueltas, ...PESTANAS_TRANSVERSALES];
}
