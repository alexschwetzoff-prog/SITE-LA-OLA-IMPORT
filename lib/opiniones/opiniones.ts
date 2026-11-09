// Opiniones de clientes (fase 10): de las filas del CSV publicado de la pestaña «Web» de la hoja de respuestas del
// formulario a la lista que enseñan la home y /opiniones. Funciones puras (sin red ni React): se prueban en
// lib/opiniones/opiniones.test.ts.
//
// Contrato de columnas (cabecera exacta): empresa, opinion, mostrar_nombre, publicar, fecha.
//   - mostrar_nombre y publicar valen SI o NO (se admiten SI/Sí/si/NO/no, sin distinguir mayúsculas ni tildes).
//   - fecha es opcional, en formato yyyy-mm-dd.
// Una fila se publica solo si publicar = SI y la opinión no está vacía; cualquier duda se resuelve a favor de la
// privacidad (sin publicar, sin nombre). Ninguna otra columna sale de aquí.

import { parsearCsv } from './csv';

export interface Opinion {
  /** Nombre que se enseña: el de la empresa si lo ha autorizado; si no, «Cliente de [MARCA]». */
  nombre: string;
  /** La opinión en texto plano (sin caracteres de control), como mucho MAX_CARACTERES. */
  texto: string;
  /** yyyy-mm-dd, si la fila la trae y es válida. */
  fecha?: string;
}

export const NOMBRE_ANONIMO = 'Cliente de [MARCA]';
export const MAX_CARACTERES = 500;
export const MAX_NOMBRE = 80;
const COLUMNAS = ['empresa', 'opinion', 'mostrar_nombre', 'publicar', 'fecha'] as const;
type Columna = (typeof COLUMNAS)[number];

/** «SI» / «Sí» / «si» → true; cualquier otra cosa (NO, vacío, dudosa) → false. */
export function esSi(valor: string | undefined): boolean {
  if (!valor) return false;
  const limpio = valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
  return limpio === 'si';
}

/** Texto plano: sin caracteres de control (salvo el salto de línea), espacios compactados, saltos de línea de más fuera. */
export function limpiarTexto(valor: string | undefined, maximo: number): string {
  if (!valor) return '';
  let texto = valor.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '');
  texto = texto
    .split('\n')
    .map((linea) => linea.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (texto.length > maximo) texto = texto.slice(0, maximo - 1).trimEnd() + '…';
  return texto;
}

/** yyyy-mm-dd de verdad (una fecha que existe), o undefined. */
export function fechaValida(valor: string | undefined): string | undefined {
  const v = valor?.trim() ?? '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return undefined;
  const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(Date.UTC(a, mes - 1, d));
  if (fecha.getUTCFullYear() !== a || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== d) return undefined;
  return v;
}

/** Las opiniones publicables del CSV, ordenadas por fecha descendente (sin fecha, al final). Con un CSV sin las
 * columnas obligatorias (opinion y publicar), ninguna. */
export function opinionesDesdeCsv(csv: string): Opinion[] {
  const filas = parsearCsv(csv);
  if (!filas.length) return [];
  const cabecera = filas[0].map((c) => c.trim().toLowerCase());
  const indice = Object.fromEntries(COLUMNAS.map((col) => [col, cabecera.indexOf(col)])) as Record<Columna, number>;
  if (indice.opinion < 0 || indice.publicar < 0) return [];
  const campo = (fila: string[], col: Columna): string | undefined => (indice[col] >= 0 ? fila[indice[col]] : undefined);
  const salida: Opinion[] = [];
  for (const fila of filas.slice(1)) {
    if (!esSi(campo(fila, 'publicar'))) continue;
    const texto = limpiarTexto(campo(fila, 'opinion'), MAX_CARACTERES);
    if (!texto) continue;
    const empresa = limpiarTexto(campo(fila, 'empresa'), MAX_NOMBRE).replace(/\n/g, ' ');
    const nombre = esSi(campo(fila, 'mostrar_nombre')) && empresa ? empresa : NOMBRE_ANONIMO;
    const fecha = fechaValida(campo(fila, 'fecha'));
    salida.push(fecha ? { nombre, texto, fecha } : { nombre, texto });
  }
  // orden estable: fecha descendente; sin fecha, al final en su orden de llegada
  return salida
    .map((o, i) => ({ o, i }))
    .sort((a, b) => {
      if (a.o.fecha && b.o.fecha) return b.o.fecha.localeCompare(a.o.fecha) || a.i - b.i;
      if (a.o.fecha) return -1;
      if (b.o.fecha) return 1;
      return a.i - b.i;
    })
    .map(({ o }) => o);
}
