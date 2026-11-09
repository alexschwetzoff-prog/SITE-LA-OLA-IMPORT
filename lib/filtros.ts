// Filtres du catalogue par catégorie et étiquette. Module léger : le catalogue interactif l'utilise dans le navigateur
// sans charger les produits.

import { CATEGORIAS, ETIQUETAS } from '@/data/categorias';
import type { Categoria, Etiqueta } from '@/data/catalogo';

/** Filtre d'étiquettes du catalogue : « Incontournables » (produits phares) puis les étiquettes des produits. */
export type FiltroEtiqueta = Etiqueta | 'destacado';
export const FILTROS_ETIQUETA: { id: FiltroEtiqueta; nombre: string }[] = [{ id: 'destacado', nombre: 'Incontournables' }, ...ETIQUETAS];

export function esCategoria(valor: string | null | undefined): valor is Categoria {
  return Boolean(valor) && CATEGORIAS.some((c) => c.id === valor);
}

export function esFiltroEtiqueta(valor: string): valor is FiltroEtiqueta {
  return FILTROS_ETIQUETA.some((e) => e.id === valor);
}

export interface Filtrable {
  activo: boolean;
  categoria: Categoria;
  destacado: boolean;
  etiquetas: Etiqueta[];
}

export function tieneEtiqueta(p: Filtrable, etiqueta: FiltroEtiqueta): boolean {
  return etiqueta === 'destacado' ? p.destacado : p.etiquetas.includes(etiqueta);
}

/** Produits actifs de la catégorie choisie qui portent toutes les étiquettes choisies. */
export function filtrarProductos<T extends Filtrable>(productos: T[], categoria: Categoria | null, etiquetas: FiltroEtiqueta[]): T[] {
  return productos.filter((p) => p.activo && (!categoria || p.categoria === categoria) && etiquetas.every((e) => tieneEtiqueta(p, e)));
}
