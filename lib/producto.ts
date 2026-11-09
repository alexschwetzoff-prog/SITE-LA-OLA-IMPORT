// Ayudas puras sobre un producto: nombres públicos, precio, material, títulos SEO. Sin datos del catálogo ni índice
// de fotos, así valen en el servidor y en el navegador sin arrastrar data/catalogo.ts al JS de la página.

import { CATEGORIAS, ETIQUETAS } from '@/data/categorias';
import type { Categoria, Color, Etiqueta, Posicion, Producto } from '@/data/catalogo';

export const NOMBRE_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.nombre])) as Record<Categoria, string>;
export const NOMBRE_ETIQUETA = Object.fromEntries(ETIQUETAS.map((e) => [e.id, e.nombre])) as Record<Etiqueta, string>;

/** Nombre público de cada posición de impresión y en qué lado va. */
export const POSICIONES: Record<Posicion, { nombre: string; lado: string }> = {
  corazon: { nombre: 'Corazón', lado: 'Delante' },
  centro_pecho: { nombre: 'Centro del pecho', lado: 'Delante' },
  frontal_a4: { nombre: 'Frontal A4', lado: 'Delante' },
  espalda_a4: { nombre: 'Espalda A4', lado: 'Detrás' },
  espalda_a3: { nombre: 'Espalda A3', lado: 'Detrás' },
  frontal_gorra: { nombre: 'Frontal', lado: 'Delante' },
  cara_a: { nombre: 'Cara A', lado: 'Una cara' },
  cara_b: { nombre: 'Cara B', lado: 'La otra cara' },
  zona_marcaje: { nombre: 'Zona de marcaje', lado: '' },
};

export function colorPorDefecto(p: Pick<Producto, 'colores'>): Color {
  return p.colores.find((c) => c.porDefecto) ?? p.colores[0];
}

/** Foto principal: la del color por defecto o, si no tiene, la primera disponible. */
export function fotoPrincipal(p: Pick<Producto, 'colores'>): { delante: string; detras?: string } | undefined {
  const color = p.colores.find((c) => c.porDefecto && c.fotoDelante) ?? p.colores.find((c) => c.fotoDelante);
  return color?.fotoDelante ? { delante: color.fotoDelante, detras: color.fotoDetras } : undefined;
}

/** Texto público del precio: "Desde X € / ud", "Consultar precio" o "Consultar disponibilidad". */
export function textoPrecio(p: Pick<Producto, 'estado' | 'precioDesde'>): string {
  if (p.estado === 'consultar-disponibilidad') return 'Consultar disponibilidad';
  if (p.precioDesde === null) return 'Consultar precio';
  const n = p.precioDesde.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Desde ${n} € / ud`;
}

export function tieneEstudio(p: Pick<Producto, 'visor'>): boolean {
  return p.visor !== 'ninguno';
}

export function esGoodie(p: Pick<Producto, 'categoria'>): boolean {
  return p.categoria === 'goodies';
}

/** «100 % algodón · 150 g/m²», «Acero inoxidable, acabado mate · 790 ml». */
export function textoMaterial(p: Pick<Producto, 'material' | 'gramaje' | 'medidas'>): string {
  const partes = [p.material];
  if (p.gramaje) partes.push(`${p.gramaje} g/m²`);
  if (p.medidas) partes.push(p.medidas);
  return partes.join(' · ');
}

/** Sustantivo y género del tipo de producto, para los títulos SEO y los textos («Camiseta … personalizada»). */
export function sustantivo(p: Pick<Producto, 'tipo'>): { nombre: string; femenino: boolean } {
  const primera = p.tipo.split(' ')[0];
  const generos: Record<string, boolean> = {
    Camiseta: true,
    Polo: false,
    Sudadera: true,
    Gorra: true,
    Bolsa: true,
    Bidón: false,
    Taza: true,
    Libreta: true,
    Bolígrafo: false,
    Memoria: true,
    Llavero: false,
    Multiherramienta: true,
    Navaja: true,
  };
  const nombre = primera === 'Memoria' ? 'Memoria USB' : primera;
  return { nombre, femenino: generos[primera] ?? true };
}

/** «Camiseta Atomic 150 personalizada con tu logo» (sección 4 de la spec). */
export function tituloSeo(p: Pick<Producto, 'tipo' | 'nombre'>): string {
  const { nombre, femenino } = sustantivo(p);
  return `${nombre} ${p.nombre} personalizad${femenino ? 'a' : 'o'} con tu logo`;
}

export function descripcionSeo(p: Pick<Producto, 'tipo' | 'nombre' | 'material' | 'gramaje' | 'medidas' | 'estado' | 'precioDesde'>): string {
  const { nombre, femenino } = sustantivo(p);
  const articulo = femenino ? 'la' : 'el';
  const precio = textoPrecio(p);
  const condiciones = precio.startsWith('Desde') ? `${precio} sin IVA, pedidos desde 25 unidades.` : `${precio}. Pedidos desde 25 unidades.`;
  return `Pon tu logo en ${articulo} ${nombre.toLowerCase()} ${p.nombre}: ${textoMaterial(p)}. ${condiciones} Presupuesto en 24 h laborables.`;
}
