'use client';

// Estado de la cuenta en el navegador (zustand): sesión, precios (solo cuentas validadas), favoritos y número de líneas
// del carrito. Todo viene de los route handlers /api/yo y /api/precios (privados, sin caché) y de Server Actions: aquí
// no hay ningún precio incrustado ni en el HTML ni en el JavaScript.
import { create } from 'zustand';
import { alternarFavorito as accionFavorito, anadirAlCarrito, fusionarFavoritos } from '@/lib/cuenta/acciones-tienda';
import type { FilaPrecio } from '@/lib/carrito/calculo';

export type EstadoSesion = 'cargando' | 'anonimo' | 'pendiente' | 'validada' | 'rechazada';
export interface Fav {
  producto_slug: string;
  variante: string;
}
export interface LineaPendiente {
  slug: string;
  /** Nombre para el aviso «ajouté au panier» (no viaja a la base). */
  nombre?: string;
  variante: string;
  talla: string;
  cantidad: number;
  personalizacion?: { tecnica?: string; posiciones?: string[]; logo_ref?: string } | null;
}
export type MotivoAviso = 'carrito' | 'favorito' | 'precio';

const CLAVE_FAVORITOS = 'laola:favoritos';
const CLAVE_PENDIENTE = 'laola:pendiente-carrito';

const leer = <T,>(clave: string, defecto: T): T => {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : defecto;
  } catch {
    return defecto;
  }
};
const escribir = (clave: string, valor: unknown) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
};

/** La línea que viaja al servidor: sin el nombre (solo sirve para el aviso en pantalla). */
const sinNombre = (l: LineaPendiente) => ({ slug: l.slug, variante: l.variante, talla: l.talla, cantidad: l.cantidad, personalizacion: l.personalizacion ?? null });

interface Almacen {
  estado: EstadoSesion;
  rol?: 'cliente' | 'admin';
  nombre?: string;
  precios: FilaPrecio[];
  tasaIva: number | null;
  favoritos: Fav[];
  lineasCarrito: number;
  aviso: { motivo: MotivoAviso } | null;
  avisoCarrito: string | null;
  cargar: (forzar?: boolean) => Promise<void>;
  esFavorito: (slug: string, variante: string) => boolean;
  alternarFavorito: (slug: string, variante: string) => Promise<void>;
  anadir: (linea: LineaPendiente) => Promise<{ ok: boolean }>;
  cerrarAviso: () => void;
  limpiarAvisoCarrito: () => void;
}

let enCurso: Promise<void> | null = null;

export const useCuenta = create<Almacen>((set, get) => ({
  estado: 'cargando',
  precios: [],
  tasaIva: null,
  favoritos: [],
  lineasCarrito: 0,
  aviso: null,
  avisoCarrito: null,

  cargar: (forzar = false) => {
    if (enCurso && !forzar) return enCurso;
    enCurso = (async () => {
      try {
        const yo = await (await fetch('/api/yo', { cache: 'no-store', credentials: 'same-origin' })).json();
        if (yo.estado === 'anonimo') {
          set({ estado: 'anonimo', rol: undefined, nombre: undefined, precios: [], tasaIva: null, favoritos: leer<Fav[]>(CLAVE_FAVORITOS, []), lineasCarrito: 0 });
          return;
        }
        const validada = yo.estado === 'validada' || yo.rol === 'admin';
        let precios: FilaPrecio[] = [];
        let tasaIva: number | null = null;
        if (validada) {
          const p = await (await fetch('/api/precios', { cache: 'no-store', credentials: 'same-origin' })).json();
          precios = p.precios ?? [];
          tasaIva = p.tasaIva ?? null;
        }
        set({
          estado: yo.estado,
          rol: yo.rol,
          nombre: yo.nombre,
          precios,
          tasaIva,
          favoritos: validada ? (yo.favoritos ?? []) : leer<Fav[]>(CLAVE_FAVORITOS, []),
          lineasCarrito: yo.carrito ?? 0,
        });
        if (validada) await posValidacion(set, get);
      } catch {
        set({ estado: 'anonimo' });
      } finally {
        enCurso = null;
      }
    })();
    return enCurso;
  },

  esFavorito: (slug, variante) => get().favoritos.some((f) => f.producto_slug === slug && f.variante === variante),

  alternarFavorito: async (slug, variante) => {
    const { estado, favoritos } = get();
    const ya = favoritos.some((f) => f.producto_slug === slug && f.variante === variante);
    const nuevos = ya ? favoritos.filter((f) => !(f.producto_slug === slug && f.variante === variante)) : [...favoritos, { producto_slug: slug, variante }];
    set({ favoritos: nuevos }); // actualización optimista
    if (estado !== 'validada') {
      escribir(CLAVE_FAVORITOS, nuevos); // visitante o cuenta pendiente: se guardan en este navegador
      return;
    }
    const r = await accionFavorito({ slug, variante });
    if (!r.ok) set({ favoritos }); // deshacer
  },

  anadir: async (linea) => {
    const { estado } = get();
    if (estado !== 'validada') {
      escribir(CLAVE_PENDIENTE, linea); // no se pierde lo que estaba eligiendo
      set({ aviso: { motivo: 'carrito' } });
      return { ok: false };
    }
    const r = await anadirAlCarrito(sinNombre(linea));
    if (r.ok) await get().cargar(true);
    return { ok: r.ok };
  },

  cerrarAviso: () => set({ aviso: null }),
  limpiarAvisoCarrito: () => set({ avisoCarrito: null }),
}));

/** Tras iniciar sesión con una cuenta validada: fusiona los favoritos del navegador y retoma lo que se iba a añadir. */
async function posValidacion(set: (p: Partial<Almacen>) => void, get: () => Almacen) {
  const locales = leer<Fav[]>(CLAVE_FAVORITOS, []);
  if (locales.length) {
    await fusionarFavoritos(locales.map((f) => ({ slug: f.producto_slug, variante: f.variante })));
    localStorage.removeItem(CLAVE_FAVORITOS);
  }
  let cambio = locales.length > 0;
  const pendiente = leer<LineaPendiente | null>(CLAVE_PENDIENTE, null);
  if (pendiente) {
    localStorage.removeItem(CLAVE_PENDIENTE);
    const r = await anadirAlCarrito(sinNombre(pendiente));
    if (r.ok) {
      cambio = true;
      set({ avisoCarrito: pendiente.nombre ?? pendiente.slug });
    }
  }
  if (cambio) {
    const yo = await (await fetch('/api/yo', { cache: 'no-store', credentials: 'same-origin' })).json();
    set({ favoritos: yo.favoritos ?? get().favoritos, lineasCarrito: yo.carrito ?? 0 });
  }
}
