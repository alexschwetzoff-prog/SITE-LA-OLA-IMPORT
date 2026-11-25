import 'server-only';

// Datos mínimos de producto para el espacio cliente (nombre, tipo, foto por variante). Son datos públicos del catálogo:
// no llevan ningún precio.
import { getProducto } from '@/data/catalogo';
import { PRODUCTOS_ACTIVOS, fotosDe } from '@/lib/catalogo';

export interface ProductoLigero {
  slug: string;
  nombre: string;
  tipo: string;
  /** Si el producto tiene tallas, hay que elegirlas en la ficha (desde favoritos no se añade directo). */
  requiereTalla: boolean;
  foto: string | null;
  fotoPorVariante: Record<string, string>;
}

function ligero(slug: string): ProductoLigero | null {
  const p = getProducto(slug);
  if (!p) return null;
  const fotoPorVariante: Record<string, string> = {};
  for (const c of p.colores) {
    const f = fotosDe(p, c);
    if (f) fotoPorVariante[c.nombre] = f.delante;
  }
  const principal = fotosDe(p);
  return { slug: p.slug, nombre: p.nombre, tipo: p.tipo, requiereTalla: Boolean(p.tallas?.length || p.tallasInfantiles?.length), foto: principal?.delante ?? null, fotoPorVariante };
}

export function productoLigero(slug: string): ProductoLigero | null {
  return ligero(slug);
}

export function productosLigeros(): Record<string, ProductoLigero> {
  const r: Record<string, ProductoLigero> = {};
  for (const p of PRODUCTOS_ACTIVOS) {
    const l = ligero(p.slug);
    if (l) r[p.slug] = l;
  }
  return r;
}
