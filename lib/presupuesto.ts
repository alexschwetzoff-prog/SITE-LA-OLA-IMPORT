'use client';

// Cesta de presupuesto (fase 4): varios productos con su color, cantidad aproximada y, si vienen del estudio, su
// diseño, guardados en el navegador (localStorage) y precargados en /proyecto. Desde la fase 6 el formulario la envía
// por email (lib/solicitud/preparar.ts) y la vacía solo después de un envío correcto. Nada sale del navegador desde aquí.

import { useSyncExternalStore } from 'react';
import type { Posicion } from '@/data/catalogo';
import { borrarArchivosDiseno } from './logos-db';
import { TRAMOS, TRAMO_POR_DEFECTO, nombreTramo, textoPosicionesLinea, type Tramo } from './solicitud/comun';

export { TRAMOS, TRAMO_POR_DEFECTO, nombreTramo, type Tramo };

export const CLAVE_PRESUPUESTO = 'laola:presupuesto';
/** Clave que escribe el estudio al pulsar «Ajouter au panier» (components/estudio/Panel.tsx). */
export const CLAVE_DISENO = 'laola:diseno';

export interface ColocacionDiseno {
  posicion: Posicion;
  nombre: string;
  lado?: 'delante' | 'detras'; // fase 10: qué logo lleva (el delantero o el trasero)
  anchoCm: number;
  altoCm: number;
}

export interface LogoCesta {
  nombre: string;
  ancho: number;
  alto: number;
  vectorial: boolean;
  fondoQuitado: boolean;
}

/** Diseño hecho en el estudio, tal como lo guarda Panel.tsx en sessionStorage (capturas reducidas para la cesta). */
export interface DisenoCesta {
  fecha: string; // identifica el diseño (no se añade dos veces)
  logo: LogoCesta; // el logo delantero
  logoId?: string | null; // clave del archivo original del logo delantero en IndexedDB (lib/logos-db.ts)
  logoDetras?: LogoCesta; // fase 10: el logo trasero, si subió otro
  logoIdDetras?: string | null;
  colocaciones: ColocacionDiseno[];
  capturas: { lado: 'delante' | 'detras'; url: string }[]; // JPEG reducidas; las de 1200 × 1500 siguen en sessionStorage
}

/** Posición de la personalización elegida en la ficha antes de añadir (fase 4.1, obligatoria en prendas, gorras y bolsas). */
export interface PosicionCesta {
  posicion: Posicion;
  nombre: string; // nombre público de la posición (lib/producto.ts, POSICIONES)
}

export interface ItemPresupuesto {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  color: { nombre: string; hex: string; hexSecundario?: string };
  tramo: Tramo;
  posiciones?: PosicionCesta[]; // dónde va la personalización (los diseños del estudio llevan las suyas en `diseno`)
  foto?: string; // foto con la que se enseña en la cesta
  diseno?: DisenoCesta;
  anadido: string; // ISO
}

const VACIO: ItemPresupuesto[] = [];
let cache: ItemPresupuesto[] | null = null;
const oyentes = new Set<() => void>();

function esItem(x: unknown): x is ItemPresupuesto {
  if (!x || typeof x !== 'object') return false;
  const i = x as Record<string, unknown>;
  return typeof i.id === 'string' && typeof i.slug === 'string' && typeof i.nombre === 'string' && typeof i.tramo === 'string' && typeof i.color === 'object';
}

function leer(): ItemPresupuesto[] {
  if (cache) return cache;
  try {
    const crudo = localStorage.getItem(CLAVE_PRESUPUESTO);
    const datos: unknown = crudo ? JSON.parse(crudo) : [];
    cache = Array.isArray(datos) ? datos.filter(esItem) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function escribir(items: ItemPresupuesto[]) {
  cache = items;
  try {
    localStorage.setItem(CLAVE_PRESUPUESTO, JSON.stringify(items));
  } catch {
    // sin sitio: la cesta sigue viva en memoria durante la sesión
  }
  oyentes.forEach((f) => f());
}

function suscribir(f: () => void) {
  oyentes.add(f);
  const alCambiarStorage = (e: StorageEvent) => {
    if (e.key === CLAVE_PRESUPUESTO || e.key === null) {
      cache = null;
      f();
    }
  };
  window.addEventListener('storage', alCambiarStorage);
  return () => {
    oyentes.delete(f);
    window.removeEventListener('storage', alCambiarStorage);
  };
}

/** La cesta, sincronizada con localStorage. En el servidor y hasta hidratar, vacía. */
export function usePresupuesto(): ItemPresupuesto[] {
  return useSyncExternalStore(suscribir, leer, () => VACIO);
}

function idNuevo(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function anadirAlPresupuesto(item: Omit<ItemPresupuesto, 'id' | 'anadido'>): ItemPresupuesto {
  const nuevo: ItemPresupuesto = { ...item, id: idNuevo(), anadido: new Date().toISOString() };
  escribir([...leer(), nuevo]);
  return nuevo;
}

export function quitarDelPresupuesto(id: string) {
  const item = leer().find((i) => i.id === id);
  if (item?.diseno) void borrarArchivosDiseno(item.diseno.fecha, item.diseno.logoId, item.diseno.logoIdDetras);
  escribir(leer().filter((i) => i.id !== id));
}

export function cambiarTramo(id: string, tramo: Tramo) {
  escribir(leer().map((i) => (i.id === id ? { ...i, tramo } : i)));
}

/** Vacía la cesta y borra del navegador los logos y capturas de sus diseños (tras un envío correcto). */
export function vaciarPresupuesto() {
  for (const item of leer()) {
    if (item.diseno) void borrarArchivosDiseno(item.diseno.fecha, item.diseno.logoId, item.diseno.logoIdDetras);
  }
  escribir([]);
}

/** «Corazón + Espalda A4»: las posiciones de una línea de la cesta (las del estudio o las elegidas en la ficha). */
export function textoPosiciones(item: Pick<ItemPresupuesto, 'posiciones' | 'diseno'>): string {
  return textoPosicionesLinea(item);
}

/** Reduce una captura del estudio (PNG de 1200 × 1500) a un JPEG pequeño que quepa en la cesta. */
function reducirCaptura(url: string, ancho = 480): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = ancho;
      canvas.height = Math.round((ancho * img.naturalHeight) / img.naturalWidth);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(url);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

interface DisenoGuardado {
  fecha: string;
  producto: { slug: string; nombre: string };
  color: { nombre: string; hex: string };
  logo: DisenoCesta['logo'];
  logoId?: string | null;
  logoDetras?: DisenoCesta['logoDetras'];
  logoIdDetras?: string | null;
  colocaciones: ColocacionDiseno[];
  capturas: { lado: 'delante' | 'detras'; url: string }[];
}

/**
 * Pasa a la cesta el diseño que el estudio dejó en sessionStorage («Ajouter au panier»), una sola vez por diseño.
 * Devuelve el elemento añadido o null si no había nada nuevo. Las capturas grandes se quedan en sessionStorage
 * para que el formulario de la fase 6 las adjunte si siguen ahí.
 */
let importacionEnCurso: Promise<ItemPresupuesto | null> | null = null;

export function importarDisenoDelEstudio(datosDe: (slug: string) => { tipo: string; foto?: string } | undefined): Promise<ItemPresupuesto | null> {
  // Una sola importación a la vez: si el efecto se lanza dos veces seguidas (React en modo estricto), la segunda
  // espera a la primera y ya ve el diseño en la cesta (sin esto se añadía dos veces).
  const previa = importacionEnCurso ?? Promise.resolve(null);
  const actual = previa.then(() => importar(datosDe));
  const enCola = actual.catch(() => null);
  importacionEnCurso = enCola;
  void enCola.then(() => {
    if (importacionEnCurso === enCola) importacionEnCurso = null;
  });
  return actual;
}

async function importar(datosDe: (slug: string) => { tipo: string; foto?: string } | undefined): Promise<ItemPresupuesto | null> {
  let diseno: DisenoGuardado | null = null;
  try {
    const crudo = sessionStorage.getItem(CLAVE_DISENO);
    diseno = crudo ? (JSON.parse(crudo) as DisenoGuardado) : null;
  } catch {
    diseno = null;
  }
  if (!diseno?.fecha || !diseno.producto?.slug) return null;
  if (leer().some((i) => i.diseno?.fecha === diseno?.fecha)) return null;
  const capturas = (await Promise.all((diseno.capturas ?? []).map(async (c) => ({ lado: c.lado, url: await reducirCaptura(c.url) })))).filter((c) => c.url);
  const datos = datosDe(diseno.producto.slug);
  return anadirAlPresupuesto({
    slug: diseno.producto.slug,
    nombre: diseno.producto.nombre,
    tipo: datos?.tipo ?? 'Vêtement personnalisé dans le studio',
    color: { nombre: diseno.color.nombre, hex: diseno.color.hex },
    tramo: TRAMO_POR_DEFECTO,
    foto: capturas[0]?.url || datos?.foto,
    diseno: {
      fecha: diseno.fecha,
      logo: diseno.logo,
      logoId: diseno.logoId ?? null,
      ...(diseno.logoDetras ? { logoDetras: diseno.logoDetras, logoIdDetras: diseno.logoIdDetras ?? null } : {}),
      colocaciones: diseno.colocaciones ?? [],
      capturas,
    },
  });
}
