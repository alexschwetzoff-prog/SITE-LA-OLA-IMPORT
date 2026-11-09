// Filtros del catálogo por categoría y etiqueta (sección 4). Módulo ligero: lo usa el catálogo interactivo en el
// navegador sin cargar los productos.

import { CATEGORIAS, ETIQUETAS } from '@/data/categorias';
import type { Categoria, Etiqueta } from '@/data/catalogo';

/** Filtro de etiquetas del catálogo: «Destacado» más las etiquetas de los productos. */
export type FiltroEtiqueta = Etiqueta | 'destacado';
export const FILTROS_ETIQUETA: { id: FiltroEtiqueta; nombre: string }[] = [{ id: 'destacado', nombre: 'Destacado' }, ...ETIQUETAS];

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

/** Productos activos que cumplen la categoría y todas las etiquetas elegidas. */
export function filtrarProductos<T extends Filtrable>(productos: T[], categoria: Categoria | null, etiquetas: FiltroEtiqueta[]): T[] {
  return productos.filter((p) => p.activo && (!categoria || p.categoria === categoria) && etiquetas.every((e) => tieneEtiqueta(p, e)));
}
