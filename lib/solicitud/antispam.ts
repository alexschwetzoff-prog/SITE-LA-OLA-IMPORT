import 'server-only';

// Antispam sin terceros (fase 6): campo trampa, tiempo mínimo de rellenado y límite de envíos por IP en memoria.
// La memoria es la de cada instancia del servidor (en Netlify o Vercel, cada instancia de la función): es un freno, no una garantía.

import { CAMPO_INICIO, CAMPO_TRAMPA, TIEMPO_MINIMO_MS } from './comun';

const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 5;
const DIA_MS = 24 * 60 * 60 * 1000;
const MAX_POR_DIA = 20;
const MAX_IPS = 5000;

const envios = new Map<string, number[]>();

export function ipDe(cabeceras: Headers): string {
  const reenviada = cabeceras.get('x-forwarded-for');
  if (reenviada) return reenviada.split(',')[0].trim();
  return cabeceras.get('x-real-ip') ?? 'desconocida';
}

/** El campo trampa va oculto: si llega con algo, lo ha rellenado un robot. */
export function esRobot(fd: FormData): boolean {
  const trampa = fd.get(CAMPO_TRAMPA);
  return typeof trampa === 'string' && trampa.trim() !== '';
}

/** Ha pasado el tiempo mínimo desde que se cargó el formulario (y la hora de carga es creíble). */
export function tiempoSuficiente(fd: FormData, ahora = Date.now()): boolean {
  const crudo = fd.get(CAMPO_INICIO);
  const inicio = typeof crudo === 'string' ? Number(crudo) : NaN;
  if (!Number.isFinite(inicio)) return false;
  const transcurrido = ahora - inicio;
  return transcurrido >= TIEMPO_MINIMO_MS && transcurrido <= DIA_MS;
}

/** Anota un intento de envío de esta IP y dice si se permite. Cuenta los intentos, no solo los envíos correctos. */
export function anotarEnvio(ip: string, ahora = Date.now()): { permitido: boolean; esperaMinutos?: number } {
  const previos = (envios.get(ip) ?? []).filter((t) => ahora - t < DIA_MS);
  const recientes = previos.filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAX_POR_VENTANA) {
    return { permitido: false, esperaMinutos: Math.max(1, Math.ceil((VENTANA_MS - (ahora - recientes[0])) / 60000)) };
  }
  if (previos.length >= MAX_POR_DIA) return { permitido: false, esperaMinutos: 60 };
  previos.push(ahora);
  envios.set(ip, previos);
  if (envios.size > MAX_IPS) {
    // Sin sitio: se olvida la IP más antigua (la primera que entró en el mapa).
    const primera = envios.keys().next().value;
    if (primera !== undefined) envios.delete(primera);
  }
  return { permitido: true };
}
