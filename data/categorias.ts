// Catégories et étiquettes du catalogue (noms publics en français ; les id restent ceux de la base). Module léger,
// à part, pour que les composants client (filtres, cartes) n'embarquent pas les 30 produits de data/catalogo.ts.

import type { Categoria, Etiqueta } from './catalogo';

export const CATEGORIAS: { id: Categoria; nombre: string }[] = [
  { id: 'camisetas-polos', nombre: 'T-shirts et polos' },
  { id: 'sudaderas', nombre: 'Sweats' },
  { id: 'gorras', nombre: 'Casquettes' },
  { id: 'bolsas', nombre: 'Sacs' },
  { id: 'goodies', nombre: 'Goodies' },
];

export const ETIQUETAS: { id: Etiqueta; nombre: string }[] = [
  { id: 'eco', nombre: 'Éco' },
  { id: 'mujer', nombre: 'Femme' },
  { id: 'tecnica', nombre: 'Technique' },
  { id: 'oversize', nombre: 'Oversize' },
  { id: 'manga-larga', nombre: 'Manches longues' },
  { id: 'calidad-superior', nombre: 'Qualité supérieure' },
];
