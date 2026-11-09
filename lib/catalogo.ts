// Ayudas del catálogo para el servidor (fase 4): fotos por color, la colocación del diseño de ejemplo que dibuja el
// navegador (fase 4.2), «Combina con», conteos y los datos ya calculados que reciben las tarjetas y las fichas. Lee
// el índice de fotos y los 30 productos, así que los componentes de cliente no lo importan: reciben sus datos por
// props (`datosTarjeta`, `fotosPorColor`) y usan las ayudas puras de lib/producto.ts y lib/filtros.ts.

import fotosCatalogo from '@/data/fotos-catalogo.json';
import { CATEGORIAS } from '@/data/categorias';
import { PRODUCTOS, type Categoria, type Color, type Etiqueta, type Producto } from '@/data/catalogo';
import type { ColocacionDiseno } from '@/lib/diseno-ejemplo';
import { NOMBRE_ETIQUETA, colorPorDefecto, fotoPrincipal, textoMaterial, textoPrecio, tieneEstudio } from './producto';

export * from './producto';
export * from './filtros';
export type { ColocacionDiseno } from '@/lib/diseno-ejemplo';

export const PRODUCTOS_ACTIVOS = PRODUCTOS.filter((p) => p.activo).sort((a, b) => a.orden - b.orden);

export function conteoPorCategoria(): Record<Categoria, number> {
  const conteo = Object.fromEntries(CATEGORIAS.map((c) => [c.id, 0])) as Record<Categoria, number>;
  for (const p of PRODUCTOS_ACTIVOS) conteo[p.categoria] += 1;
  return conteo;
}

/** Personalización de ejemplo que lleva una foto: el logo y la estrella de [MARCA] (Atomic 150 y Austral) o el diseño «Tu logo aquí». */
export type Ejemplo = 'marca' | 'tu-logo-aqui';

export interface FotosProducto {
  delante: string;
  detras?: string;
  /** Anchos publicados de cada lado, el grande primero (fase 4.4: 1200 y 800 px; lib/fotos.ts). */
  anchos?: number[];
  anchosDetras?: number[];
  real: boolean; // foto real de ese color por delante (si no, la foto base recoloreada)
  realDetras?: boolean; // lo mismo por detrás (fase 4.1: la trasera puede ser de otro color, como en Shura)
  ejemplo: Ejemplo | null;
  /** Dónde dibuja el navegador el diseño de ejemplo (fase 4.2); sin él, la foto se enseña limpia (o ya lo trae). */
  diseno?: ColocacionDiseno;
  disenoDetras?: ColocacionDiseno;
}

interface EntradaIndice {
  delante: string;
  detras?: string;
  anchos?: number[];
  anchosDetras?: number[];
  real?: boolean;
  realDetras?: boolean;
  ejemplo?: Ejemplo | null;
  diseno?: ColocacionDiseno;
  disenoDetras?: ColocacionDiseno;
}

// Índice escrito por scripts/fotos/preparar-fotos-catalogo.py (Atomic 150 y Austral) y
// scripts/fotos/preparar-fotos-productos.py (los otros 28): una foto limpia por producto, color y lado, y la colocación
// del diseño de ejemplo.
const INDICE = fotosCatalogo as unknown as Record<string, Record<string, EntradaIndice>>;

/**
 * Fotos con las que se enseña un producto en un color (decisión del equipo, 12/10/2026): la del índice, real si existe
 * foto de ese color y recoloreada si no, más la colocación del diseño de ejemplo. Si el color no está en el índice, la
 * foto real del color o la principal.
 */
export function fotosDe(p: Producto, color: Color = colorPorDefecto(p)): FotosProducto | undefined {
  const entrada = INDICE[p.slug]?.[color.nombre];
  if (entrada) {
    return {
      delante: entrada.delante,
      detras: entrada.detras,
      anchos: entrada.anchos,
      anchosDetras: entrada.detras ? entrada.anchosDetras : undefined,
      real: entrada.real ?? false,
      realDetras: entrada.detras ? (entrada.realDetras ?? false) : undefined,
      ejemplo: entrada.ejemplo ?? null,
      diseno: entrada.diseno,
      disenoDetras: entrada.disenoDetras,
    };
  }
  if (color.fotoDelante) return { delante: color.fotoDelante, detras: color.fotoDetras, real: true, realDetras: color.fotoDetras ? true : undefined, ejemplo: null };
  const principal = fotoPrincipal(p);
  return principal ? { ...principal, real: false, ejemplo: null } : undefined;
}

/** Las fotos de cada color de un producto, por nombre de color (lo que recibe la ficha). */
export function fotosPorColor(p: Producto): Record<string, FotosProducto | undefined> {
  return Object.fromEntries(p.colores.map((c) => [c.nombre, fotosDe(p, c)]));
}

/** Color de la foto base de un producto (la real): para decir «Foto en natural» cuando el color elegido no se simula. */
export function colorDeLaFoto(p: Producto): Color | undefined {
  const indice = INDICE[p.slug];
  if (indice) {
    const real = p.colores.find((c) => indice[c.nombre]?.real);
    if (real) return real;
  }
  return p.colores.find((c) => c.porDefecto && c.fotoDelante) ?? p.colores.find((c) => c.fotoDelante);
}

/** Datos de una tarjeta de producto, calculados en el servidor para que la tarjeta (cliente) no cargue el catálogo. */
export interface ColorTarjeta {
  nombre: string;
  hex: string;
  hexSecundario?: string;
  fotos?: FotosProducto;
}

export interface DatosTarjeta {
  slug: string;
  nombre: string;
  tipo: string;
  categoria: Categoria;
  destacado: boolean;
  etiquetas: Etiqueta[];
  chips: string[]; // nombres públicos de las etiquetas
  activo: boolean;
  orden: number;
  precio: string;
  desde: boolean; // el precio es «Desde X € / ud»
  material: string;
  conEstudio: boolean;
  colores: ColorTarjeta[];
  colorInicial: string;
  /** Colocación del diseño común a los colores (las fotos de cada color solo la llevan cuando es distinta). */
  diseno?: { delante?: ColocacionDiseno; detras?: ColocacionDiseno };
}

function mismaColocacion(a?: ColocacionDiseno, b?: ColocacionDiseno): boolean {
  return a === b || (Boolean(a && b) && JSON.stringify(a) === JSON.stringify(b));
}

export function datosTarjeta(p: Producto): DatosTarjeta {
  const precio = textoPrecio(p);
  const inicial = colorPorDefecto(p);
  const base = fotosDe(p, inicial);
  const diseno = base?.diseno || base?.disenoDetras ? { delante: base.diseno, detras: base.disenoDetras } : undefined;
  return {
    slug: p.slug,
    nombre: p.nombre,
    tipo: p.tipo,
    categoria: p.categoria,
    destacado: p.destacado,
    etiquetas: p.etiquetas,
    chips: p.etiquetas.map((e) => NOMBRE_ETIQUETA[e]),
    activo: p.activo,
    orden: p.orden,
    precio,
    desde: precio.startsWith('Desde'),
    material: textoMaterial(p),
    conEstudio: tieneEstudio(p),
    colores: p.colores.map((c) => {
      const fotos = fotosDe(p, c);
      if (fotos && diseno) {
        // la colocación común no se repite en cada color (solo los bicolores de Freya tienen otra base)
        if (mismaColocacion(fotos.diseno, diseno.delante)) delete fotos.diseno;
        if (mismaColocacion(fotos.disenoDetras, diseno.detras)) delete fotos.disenoDetras;
      }
      return { nombre: c.nombre, hex: c.hex, hexSecundario: c.hexSecundario, fotos };
    }),
    colorInicial: inicial.nombre,
    diseno,
  };
}

const PREFERENCIA_COMBINA: Record<Categoria, Categoria[]> = {
  'camisetas-polos': ['camisetas-polos', 'sudaderas', 'gorras'],
  sudaderas: ['camisetas-polos', 'sudaderas', 'gorras'],
  gorras: ['camisetas-polos', 'sudaderas', 'bolsas'],
  bolsas: ['camisetas-polos', 'goodies', 'gorras'],
  goodies: ['goodies', 'bolsas', 'camisetas-polos'],
};

/** Tres productos relacionados: uno por categoría preferida, primero los destacados y luego el siguiente en orden. */
export function combinaCon(p: Producto, n = 3): Producto[] {
  const elegidos: Producto[] = [];
  for (const categoria of PREFERENCIA_COMBINA[p.categoria]) {
    const candidatos = PRODUCTOS_ACTIVOS.filter((x) => x.categoria === categoria && x.slug !== p.slug && !elegidos.includes(x));
    if (!candidatos.length) continue;
    const destacado = candidatos.find((x) => x.destacado);
    // en la misma categoría, el siguiente por orden (circular) para que no se repita siempre el mismo
    const siguiente = candidatos.find((x) => x.orden > p.orden) ?? candidatos[0];
    elegidos.push(categoria === p.categoria ? (p.destacado ? siguiente : (destacado ?? siguiente)) : (destacado ?? siguiente));
    if (elegidos.length >= n) break;
  }
  return elegidos.slice(0, n);
}
