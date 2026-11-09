'use client';

// Estado del estudio (sección 5 de la spec): prenda, color, logos, posiciones y capturas.
// Todo vive en el navegador; nada sale de aquí hasta que el cliente envía su diseño.
// Fase 10: dos logos, uno delantero y otro trasero (opcional: sin él, la espalda lleva el mismo logo que delante).
// Cada colocación (como mucho una delante y una detrás) se dibuja con el logo de su lado y se coloca y dimensiona
// por separado.

import { create } from 'zustand';
import { colorPorDefecto, type Color, type Posicion, type Producto } from '@/data/catalogo';
import type { LogoProcesado } from './logo';
import { getSilueta, type Lado, type PosicionSilueta, type Silueta } from './siluetas';

export type Paso = 'color' | 'logo' | 'posicion' | 'tamano' | 'envio';

export interface Colocacion {
  posicion: Posicion;
  anchoCm: number; // ancho del logo en cm (el alto sale de la proporción del logo de ese lado)
  dx: number; // desplazamiento en cm respecto al ancla, dentro de la zona
  dz: number;
}

export interface Captura {
  lado: Lado;
  url: string; // data URL PNG de 1200 × 1500
}

export type PorLado<T> = Record<Lado, T>;

export interface EstadoEstudio {
  producto: Producto;
  silueta: Silueta;
  color: Color;
  /** El logo subido para cada lado; detrás puede faltar (entonces se usa el delantero). */
  logos: PorLado<LogoProcesado | null>;
  logosOriginales: PorLado<HTMLCanvasElement | null>; // antes de quitar el fondo, para poder deshacer
  fondoQuitado: PorLado<boolean>;
  colocaciones: Colocacion[]; // como mucho una delante y una detrás
  activa: Posicion | null; // posición seleccionada en el panel
  lado: Lado; // qué foto se ve ahora: delante o detrás
  paso: Paso;
  fotoLista: boolean; // la foto delantera ya se ha dibujado
  arrastrando: boolean;
  capturas: Captura[];
  capturando: boolean;
  mostrarZona: boolean;
  aviso: string | null; // mensaje breve al cambiar de prenda (por ejemplo, una posición que se pierde)

  setProducto: (p: Producto) => void;
  setColor: (c: Color) => void;
  setLogo: (logo: LogoProcesado | null, lado?: Lado) => void;
  setFondoQuitado: (canvas: HTMLCanvasElement | null, lado?: Lado) => void;
  alternarPosicion: (p: Posicion) => void;
  setActiva: (p: Posicion | null) => void;
  setAncho: (p: Posicion, anchoCm: number) => void;
  setDesplazamiento: (p: Posicion, dx: number, dz: number) => void;
  setLado: (l: Lado) => void;
  setPaso: (p: Paso) => void;
  setFotoLista: (v: boolean) => void;
  setArrastrando: (v: boolean) => void;
  setCapturas: (c: Captura[]) => void;
  setCapturando: (v: boolean) => void;
  setMostrarZona: (v: boolean) => void;
  setAviso: (a: string | null) => void;
}

export function posicionSilueta(silueta: Silueta, p: Posicion): PosicionSilueta {
  return silueta.posiciones[p] as PosicionSilueta;
}

/** El logo que se dibuja en un lado: el suyo o, detrás sin logo propio, el delantero. */
export function logoDeLado(logos: PorLado<LogoProcesado | null>, lado: Lado): LogoProcesado | null {
  return logos[lado] ?? (lado === 'detras' ? logos.delante : null);
}

/** Proporción alto/ancho del logo (1 si no hay logo). */
export function proporcionLogo(logo: LogoProcesado | null): number {
  return logo ? logo.alto / logo.ancho : 1;
}

/** Proporción del logo que lleva una posición (la del logo de su lado). */
export function proporcionEn(silueta: Silueta, logos: PorLado<LogoProcesado | null>, p: Posicion): number {
  return proporcionLogo(logoDeLado(logos, posicionSilueta(silueta, p).lado));
}

/** Limita el ancho al máximo de la posición teniendo en cuenta el alto máximo y la proporción del logo. */
export function anchoMaximo(pos: PosicionSilueta, proporcion: number): number {
  const [maxAncho, maxAlto] = pos.maxCm;
  return Math.min(maxAncho, maxAlto / proporcion);
}

/** Recorta el desplazamiento para que el logo entero quede dentro de la zona permitida. */
export function limitarDesplazamiento(pos: PosicionSilueta, anchoCm: number, proporcion: number, dx: number, dz: number) {
  const altoCm = anchoCm * proporcion;
  const { zona, ancla } = pos;
  const xMin = zona.xMin + anchoCm / 2 - ancla.x;
  const xMax = zona.xMax - anchoCm / 2 - ancla.x;
  const zMin = zona.zMin + altoCm / 2 - ancla.z;
  const zMax = zona.zMax - altoCm / 2 - ancla.z;
  return {
    dx: xMin > xMax ? 0 : Math.min(xMax, Math.max(xMin, dx)),
    dz: zMin > zMax ? 0 : Math.min(zMax, Math.max(zMin, dz)),
  };
}

/** Posiciones que admite un producto y tiene medidas su silueta. */
export function posicionesDe(producto: Producto, silueta: Silueta): Posicion[] {
  return producto.posiciones.map((p) => p.posicion).filter((p) => Boolean(silueta.posiciones[p]));
}

/** La posición por defecto de un lado (corazón delante, espalda A4 detrás) entre las que admite el producto. */
export function posicionPorDefecto(producto: Producto, silueta: Silueta, lado: Lado): Posicion | null {
  const admitidas = posicionesDe(producto, silueta).filter((p) => posicionSilueta(silueta, p).lado === lado);
  const preferida: Posicion = lado === 'delante' ? 'corazon' : 'espalda_a4';
  return admitidas.includes(preferida) ? preferida : (admitidas[0] ?? null);
}

/** Vuelve a ajustar cada colocación a la proporción del logo de su lado (al cambiar un logo o de prenda). */
function ajustar(colocaciones: Colocacion[], silueta: Silueta, logos: PorLado<LogoProcesado | null>): Colocacion[] {
  return colocaciones.map((c) => {
    const pos = posicionSilueta(silueta, c.posicion);
    const prop = proporcionEn(silueta, logos, c.posicion);
    const anchoCm = Math.min(c.anchoCm, anchoMaximo(pos, prop));
    return { ...c, anchoCm, ...limitarDesplazamiento(pos, anchoCm, prop, c.dx, c.dz) };
  });
}

export function crearStoreEstudio(producto: Producto, colorInicial: Color) {
  const silueta = getSilueta(producto.silueta ?? 'camiseta-unisex');
  const corazon = posicionPorDefecto(producto, silueta, 'delante') ?? posicionesDe(producto, silueta)[0];
  const inicial = posicionSilueta(silueta, corazon);
  return create<EstadoEstudio>((set) => ({
    producto,
    silueta,
    color: colorInicial,
    logos: { delante: null, detras: null },
    logosOriginales: { delante: null, detras: null },
    fondoQuitado: { delante: false, detras: false },
    colocaciones: [{ posicion: corazon, anchoCm: inicial.porDefectoCm, dx: 0, dz: 0 }],
    activa: corazon,
    lado: 'delante',
    paso: 'color',
    fotoLista: false,
    arrastrando: false,
    capturas: [],
    capturando: false,
    mostrarZona: false,
    aviso: null,

    // Cambiar de prenda conserva los logos, las posiciones compatibles y el tamaño (recortado a los máximos nuevos).
    setProducto: (p) =>
      set((s) => {
        if (p.slug === s.producto.slug) return {};
        const sil = getSilueta(p.silueta ?? 'camiseta-unisex');
        const admitidas = posicionesDe(p, sil);
        const perdidas = s.colocaciones.filter((c) => !admitidas.includes(c.posicion));
        const colocaciones = ajustar(
          s.colocaciones.filter((c) => admitidas.includes(c.posicion)),
          sil,
          s.logos,
        );
        const color = p.colores.find((c) => c.nombre === s.color.nombre) ?? colorPorDefecto(p);
        const activa = s.activa && admitidas.includes(s.activa) ? s.activa : (colocaciones[0]?.posicion ?? null);
        const aviso = perdidas.length
          ? `${p.nombre} n’accepte pas l’emplacement ${perdidas.map((c) => posicionSilueta(s.silueta, c.posicion).nombre).join(' ni ')} : il a été retiré de votre visuel.`
          : null;
        return {
          producto: p,
          silueta: sil,
          color,
          colocaciones,
          activa,
          lado: activa ? posicionSilueta(sil, activa).lado : 'delante',
          fotoLista: false,
          capturas: [],
          aviso,
        };
      }),
    setColor: (color) => set({ color, capturas: [], fotoLista: false }),
    setLogo: (logo, lado = 'delante') =>
      set((s) => {
        const logos = { ...s.logos, [lado]: logo };
        const logosOriginales = { ...s.logosOriginales, [lado]: logo ? logo.canvas : null };
        const fondoQuitado = { ...s.fondoQuitado, [lado]: false };
        // Con un logo nuevo, se ajusta cada colocación a la proporción del logo de su lado.
        let colocaciones = ajustar(s.colocaciones, s.silueta, logos);
        let activa = s.activa;
        if (logo && !colocaciones.some((c) => posicionSilueta(s.silueta, c.posicion).lado === lado)) {
          // un logo nuevo para un lado sin posición: la posición por defecto de ese lado
          const p = posicionPorDefecto(s.producto, s.silueta, lado);
          if (p) {
            const pos = posicionSilueta(s.silueta, p);
            const anchoCm = Math.min(pos.porDefectoCm, anchoMaximo(pos, proporcionLogo(logo)));
            colocaciones = [...colocaciones, { posicion: p, anchoCm, dx: 0, dz: 0 }];
            activa = p;
          }
        }
        if (logo) activa = colocaciones.find((c) => posicionSilueta(s.silueta, c.posicion).lado === lado)?.posicion ?? activa ?? corazon;
        return { logos, logosOriginales, fondoQuitado, colocaciones, activa, capturas: [], lado: logo ? lado : s.lado };
      }),
    setFondoQuitado: (canvas, lado = 'delante') =>
      set((s) => {
        const logo = s.logos[lado];
        const original = s.logosOriginales[lado];
        if (!logo || !original) return {};
        if (canvas) return { logos: { ...s.logos, [lado]: { ...logo, canvas } }, fondoQuitado: { ...s.fondoQuitado, [lado]: true }, capturas: [] };
        return { logos: { ...s.logos, [lado]: { ...logo, canvas: original } }, fondoQuitado: { ...s.fondoQuitado, [lado]: false }, capturas: [] };
      }),
    alternarPosicion: (p) =>
      set((s) => {
        const pos = posicionSilueta(s.silueta, p);
        const existe = s.colocaciones.some((c) => c.posicion === p);
        if (existe) {
          const colocaciones = s.colocaciones.filter((c) => c.posicion !== p);
          return { colocaciones, activa: s.activa === p ? (colocaciones[0]?.posicion ?? null) : s.activa, capturas: [] };
        }
        // Máximo una posición por lado: la nueva sustituye a la del mismo lado.
        const prop = proporcionEn(s.silueta, s.logos, p);
        const anchoCm = Math.min(pos.porDefectoCm, anchoMaximo(pos, prop));
        const colocaciones = s.colocaciones.filter((c) => posicionSilueta(s.silueta, c.posicion).lado !== pos.lado);
        colocaciones.push({ posicion: p, anchoCm, dx: 0, dz: 0 });
        return { colocaciones, activa: p, lado: pos.lado, capturas: [] };
      }),
    setActiva: (p) => set((s) => (p ? { activa: p, lado: posicionSilueta(s.silueta, p).lado } : { activa: null })),
    setAncho: (p, anchoCm) =>
      set((s) => {
        const pos = posicionSilueta(s.silueta, p);
        const prop = proporcionEn(s.silueta, s.logos, p);
        const ancho = Math.max(2, Math.min(anchoMaximo(pos, prop), anchoCm));
        return {
          colocaciones: s.colocaciones.map((c) => (c.posicion === p ? { ...c, anchoCm: ancho, ...limitarDesplazamiento(pos, ancho, prop, c.dx, c.dz) } : c)),
          capturas: [],
        };
      }),
    setDesplazamiento: (p, dx, dz) =>
      set((s) => {
        const pos = posicionSilueta(s.silueta, p);
        const prop = proporcionEn(s.silueta, s.logos, p);
        return {
          colocaciones: s.colocaciones.map((c) => (c.posicion === p ? { ...c, ...limitarDesplazamiento(pos, c.anchoCm, prop, dx, dz) } : c)),
          capturas: [],
        };
      }),
    setLado: (lado) => set({ lado }),
    setPaso: (paso) => set({ paso, mostrarZona: paso === 'posicion' || paso === 'tamano' }),
    setFotoLista: (fotoLista) => set({ fotoLista }),
    setArrastrando: (arrastrando) => set({ arrastrando }),
    setCapturas: (capturas) => set({ capturas }),
    setCapturando: (capturando) => set({ capturando }),
    setMostrarZona: (mostrarZona) => set({ mostrarZona }),
    setAviso: (aviso) => set({ aviso }),
  }));
}

export type StoreEstudio = ReturnType<typeof crearStoreEstudio>;
