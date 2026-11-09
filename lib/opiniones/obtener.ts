// Lectura de las opiniones en el servidor (fase 10): el CSV publicado de la pestaña «Web» de la hoja de respuestas
// del formulario, cuya dirección va en la variable de entorno OPINIONES_CSV_URL (solo del servidor: nunca
// NEXT_PUBLIC_, nunca en el código). Se cachea con revalidación cada hora (ISR con `use cache` + cacheLife, que es
// como se cachea con cacheComponents en Next 16) y se corta a los 5 s. Si falta la variable, falla la red o el CSV
// no vale, devuelve una lista vacía y lo anota en el log: nunca rompe el build ni la página.

import 'server-only';
import { cacheLife } from 'next/cache';
import { opinionesDesdeCsv, type Opinion } from './opiniones';

export const REVALIDAR_SEGUNDOS = 3600;
const TIEMPO_MAXIMO_MS = 5000;

export async function obtenerOpiniones(): Promise<Opinion[]> {
  'use cache';
  cacheLife({ stale: 300, revalidate: REVALIDAR_SEGUNDOS, expire: 86400 });
  const url = process.env.OPINIONES_CSV_URL;
  if (!url) {
    console.error('[opiniones] falta la variable OPINIONES_CSV_URL: no se enseñan opiniones');
    return [];
  }
  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS), headers: { accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8' } });
    if (!respuesta.ok) throw new Error(`respuesta HTTP ${respuesta.status}`);
    const opiniones = opinionesDesdeCsv(await respuesta.text());
    console.log(`[opiniones] ${opiniones.length} opiniones publicables leídas de la hoja`);
    return opiniones;
  } catch (error) {
    console.error('[opiniones] no se han podido leer las opiniones de la hoja:', error instanceof Error ? error.message : error);
    return [];
  }
}
