// Siluetas del estudio: anclas, tamaños máximos y zonas permitidas por posición, y las fotos de cada prenda con su
// calibración (píxeles por cm medidos con el largo de la ficha técnica). Los JSON viven en data/siluetas/ y los
// genera scripts/fotos/preparar-fotos-estudio.py. Unidades: cm sobre la prenda de talla M; x lateral desde el
// centro (+x = izquierda del que la lleva), z altura desde el bajo.

import type { Posicion } from '@/data/catalogo';
import camisetaUnisex from '@/data/siluetas/camiseta-unisex.json';
import polo from '@/data/siluetas/polo.json';
import { srcParaAncho } from '@/lib/fotos';

export type Lado = 'delante' | 'detras';

export interface PosicionSilueta {
  lado: Lado;
  nombre: string;
  ancla: { x: number; z: number }; // centro por defecto del logo
  maxCm: [ancho: number, alto: number];
  porDefectoCm: number; // ancho inicial
  zona: { xMin: number; xMax: number; zMin: number; zMax: number }; // rectángulo donde puede moverse el logo entero
}

export interface FotoCalibrada {
  src: string; // recorte de la prenda sin fondo (WebP con transparencia, fase 4.2): el estudio la dibuja sobre su escenario
  anchos?: number[]; // tamaños publicados del recorte, el grande primero (fase 4.4: 1200 y 800 px; lib/fotos.ts)
  ancho: number; // px de la foto (la grande: la calibración va en sus píxeles)
  alto: number;
  pxPorCm: number; // escala medida con el largo de la ficha (HPS → bajo)
  centroX: number; // px: eje vertical de la prenda
  bajoY: number; // px: fila del bajo (z = 0)
  hpsY: number; // px: punto más alto del hombro (z = largo de la ficha)
}

export interface FotosSilueta {
  base: Record<Lado, FotoCalibrada>; // la prenda en blanco: origen de los recoloreados y foto del color Blanco
  reales: Record<string, Record<Lado, FotoCalibrada>>; // fotos reales de otros colores, por nombre de color
  recoloreadas: Record<string, Record<Lado, string>>; // foto blanca teñida a cada color sin foto real (misma calibración que la base)
}

export interface Silueta {
  id: string;
  posiciones: Partial<Record<Posicion, PosicionSilueta>>;
  fotos: FotosSilueta;
}

const SILUETAS: Record<string, Silueta> = {
  'camiseta-unisex': camisetaUnisex as unknown as Silueta,
  polo: polo as unknown as Silueta,
};

export function getSilueta(id: string): Silueta {
  const s = SILUETAS[id];
  if (!s) throw new Error(`Silueta desconocida: ${id}`);
  return s;
}

export type OrigenFoto = 'real' | 'recoloreada';

/** Fotos (delante y detrás) con las que se ve un color: la real si existe, si no la blanca recoloreada. */
export function fotosDeColor(silueta: Silueta, nombreColor: string): { fotos: Record<Lado, FotoCalibrada>; origen: OrigenFoto } {
  const real = silueta.fotos.reales[nombreColor];
  if (real) return { fotos: real, origen: 'real' };
  const base = silueta.fotos.base;
  if (nombreColor === 'Blanco') return { fotos: base, origen: 'real' };
  const rec = silueta.fotos.recoloreadas[nombreColor];
  if (rec) {
    return {
      fotos: { delante: { ...base.delante, src: rec.delante }, detras: { ...base.detras, src: rec.detras } },
      origen: 'recoloreada',
    };
  }
  return { fotos: base, origen: 'recoloreada' };
}

/** Archivo del recorte que cubre `anchoNecesario` píxeles de dispositivo (fase 4.4: 800 en móvil, 1200 en escritorio). */
export function fuenteFoto(foto: FotoCalibrada, anchoNecesario: number): string {
  return srcParaAncho(foto, anchoNecesario);
}

/** Todas las fotos de un lado (blanco, reales y recoloreadas): para precargarlas y que el cambio de color no espere. */
export function fotosDelLado(silueta: Silueta, lado: Lado, anchoNecesario = Infinity): string[] {
  const base = silueta.fotos.base[lado];
  const srcs = [
    fuenteFoto(base, anchoNecesario),
    ...Object.values(silueta.fotos.reales).map((r) => fuenteFoto(r[lado], anchoNecesario)),
    ...Object.values(silueta.fotos.recoloreadas).map((r) => fuenteFoto({ ...base, src: r[lado] }, anchoNecesario)),
  ];
  return Array.from(new Set(srcs));
}

/** Convierte un punto de la prenda (cm) a píxeles de la foto. Detrás, la izquierda del que la lleva queda a la izquierda. */
export function cmAFoto(foto: FotoCalibrada, lado: Lado, xCm: number, zCm: number): { x: number; y: number } {
  const signo = lado === 'delante' ? 1 : -1;
  return { x: foto.centroX + signo * xCm * foto.pxPorCm, y: foto.bajoY - zCm * foto.pxPorCm };
}

export function fotoACm(foto: FotoCalibrada, lado: Lado, xPx: number, yPx: number): { x: number; z: number } {
  const signo = lado === 'delante' ? 1 : -1;
  return { x: (signo * (xPx - foto.centroX)) / foto.pxPorCm, z: (foto.bajoY - yPx) / foto.pxPorCm };
}
