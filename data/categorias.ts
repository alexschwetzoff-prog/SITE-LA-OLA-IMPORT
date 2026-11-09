// Categorías y etiquetas del catálogo (sección 6 de docs/SPEC.md), en un módulo aparte y ligero para que los
// componentes de cliente (filtros, tarjetas) no arrastren los 30 productos de data/catalogo.ts al JS de la página.

import type { Categoria, Etiqueta } from './catalogo';

export const CATEGORIAS: { id: Categoria; nombre: string }[] = [
  { id: 'camisetas-polos', nombre: 'Camisetas y polos' },
  { id: 'sudaderas', nombre: 'Sudaderas' },
  { id: 'gorras', nombre: 'Gorras' },
  { id: 'bolsas', nombre: 'Bolsas' },
  { id: 'goodies', nombre: 'Goodies' },
];

export const ETIQUETAS: { id: Etiqueta; nombre: string }[] = [
  { id: 'eco', nombre: 'Eco' },
  { id: 'mujer', nombre: 'Mujer' },
  { id: 'tecnica', nombre: 'Técnica' },
  { id: 'oversize', nombre: 'Oversize' },
  { id: 'manga-larga', nombre: 'Manga larga' },
  { id: 'calidad-superior', nombre: 'Calidad superior' },
];
