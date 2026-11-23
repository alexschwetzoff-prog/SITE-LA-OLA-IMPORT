// Fonctions pures sur un produit : noms publics, prix, matière, titres SEO. Sans les données du catalogue ni l'index
// des photos : elles servent côté serveur comme dans le navigateur sans embarquer data/catalogo.ts.

import { CATEGORIAS, ETIQUETAS } from '@/data/categorias';
import type { Categoria, Color, Etiqueta, Posicion, Producto } from '@/data/catalogo';
import { TEXTOS } from '@/lib/site';

export const NOMBRE_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.nombre])) as Record<Categoria, string>;
export const NOMBRE_ETIQUETA = Object.fromEntries(ETIQUETAS.map((e) => [e.id, e.nombre])) as Record<Etiqueta, string>;

/** Nom public de chaque position de marquage et le côté où elle se trouve. */
export const POSICIONES: Record<Posicion, { nombre: string; lado: string }> = {
  corazon: { nombre: 'Cœur', lado: 'Devant' },
  centro_pecho: { nombre: 'Centre poitrine', lado: 'Devant' },
  frontal_a4: { nombre: 'Devant A4', lado: 'Devant' },
  espalda_a4: { nombre: 'Dos A4', lado: 'Dos' },
  espalda_a3: { nombre: 'Dos A3', lado: 'Dos' },
  frontal_gorra: { nombre: 'Devant casquette', lado: 'Devant' },
  cara_a: { nombre: 'Face A', lado: 'Une face' },
  cara_b: { nombre: 'Face B', lado: 'L’autre face' },
  zona_marcaje: { nombre: 'Zone de marquage', lado: '' },
};

export function colorPorDefecto(p: Pick<Producto, 'colores'>): Color {
  return p.colores.find((c) => c.porDefecto) ?? p.colores[0];
}

/** Foto principal: la del color por defecto o, si no tiene, la primera disponible. */
export function fotoPrincipal(p: Pick<Producto, 'colores'>): { delante: string; detras?: string } | undefined {
  const color = p.colores.find((c) => c.porDefecto && c.fotoDelante) ?? p.colores.find((c) => c.fotoDelante);
  return color?.fotoDelante ? { delante: color.fotoDelante, detras: color.fotoDetras } : undefined;
}

/** Le produit affiche-t-il un vrai prix (« À partir de … ») ? Aujourd'hui non : tous les prix sont à null. */
export function conPrecio(p: Pick<Producto, 'estado' | 'precioDesde'>): boolean {
  return p.estado !== 'consultar-disponibilidad' && p.precioDesde !== null;
}

/** Texte public du prix : « Consulter le prix » tant que precioDesde est null, ou « Consulter la disponibilité ». */
export function textoPrecio(p: Pick<Producto, 'estado' | 'precioDesde'>): string {
  if (p.estado === 'consultar-disponibilidad') return 'Consulter la disponibilité';
  if (p.precioDesde === null) return TEXTOS.precio;
  const n = p.precioDesde.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `À partir de ${n} € / pièce`;
}

export function tieneEstudio(p: Pick<Producto, 'visor'>): boolean {
  return p.visor !== 'ninguno';
}

export function esGoodie(p: Pick<Producto, 'categoria'>): boolean {
  return p.categoria === 'goodies';
}

/** « 100 % coton · 150 g/m² », « Acier inoxydable, finition mate · 790 ml ». */
export function textoMaterial(p: Pick<Producto, 'material' | 'gramaje' | 'medidas'>): string {
  const partes = [p.material];
  if (p.gramaje) partes.push(`${p.gramaje} g/m²`);
  if (p.medidas) partes.push(p.medidas);
  return partes.join(' · ');
}

// Nom court et genre de chaque type de produit (début de `tipo`), pour les titres SEO (« Casquette … personnalisée »).
const NOMS_TYPE: [prefixe: string, feminin: boolean][] = [
  ['T-shirt', false],
  ['Polo', false],
  ['Débardeur', false],
  ['Sweat', false],
  ['Casquette', true],
  ['Tote bag', false],
  ['Gourde', true],
  ['Mug', false],
  ['Carnet', false],
  ['Stylo', false],
  ['Clé USB', true],
  ['Porte-clés', false],
  ['Outil multifonction', false],
  ['Couteau multifonction', false],
];

/** Nom court et genre du type de produit (« T-shirt », « Casquette »…). */
export function sustantivo(p: Pick<Producto, 'tipo'>): { nombre: string; femenino: boolean } {
  const trouve = NOMS_TYPE.find(([prefixe]) => p.tipo.startsWith(prefixe));
  if (trouve) return { nombre: trouve[0], femenino: trouve[1] };
  return { nombre: p.tipo.split(' ')[0], femenino: false };
}

/** « T-shirt Atomic 150 personnalisé avec votre logo ». */
export function tituloSeo(p: Pick<Producto, 'tipo' | 'nombre'>): string {
  const { nombre, femenino } = sustantivo(p);
  return `${nombre} ${p.nombre} personnalisé${femenino ? 'e' : ''} avec votre logo`;
}

/** Description SEO : personnalisation dans l'atelier de Monteux, matière, prix sur devis. Aucune promesse (délai, minimum). */
export function descripcionSeo(p: Pick<Producto, 'tipo' | 'nombre' | 'material' | 'gramaje' | 'medidas' | 'estado' | 'precioDesde'>): string {
  const { femenino } = sustantivo(p);
  const e = femenino ? 'e' : '';
  const prix =
    p.estado === 'consultar-disponibilidad'
      ? 'Disponibilité à confirmer : demandez-nous.'
      : conPrecio(p)
        ? `${textoPrecio(p)}, devis sur mesure selon la quantité et la technique.`
        : 'Prix sur devis, selon la quantité et la technique.';
  return `${p.tipo} ${p.nombre} personnalisé${e} avec votre logo dans notre atelier de Monteux (Vaucluse). ${textoMaterial(p)}. ${prix}`;
}
