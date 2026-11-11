'use client';

// Visor 2D del estudio: la foto real de la prenda (delante o detrás), recortada sin fondo, sobre un único escenario
// claro con una sombra de contacto, con el logo dibujado encima siguiendo el sombreado de la tela para que parezca
// impreso y no pegado. La escala cm → px de cada foto viene calibrada con el largo de la ficha técnica
// (data/siluetas). Al cambiar de color, Surfi cruza el lienzo (lib/surfi.ts) y la
// escena nueva aparece detrás de él en abanico mientras da la vuelta al marco (`poligonoBarrido`, `progresoCambio`);
// si la foto nueva no está cargada, cambio directo.
// Sin 3D: decisión del equipo del 11/10/2026.

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useStore } from 'zustand';
import type { Posicion } from '@/data/catalogo';
import { logoDeLado, posicionSilueta, proporcionEn, type Captura, type Colocacion, type PorLado, type StoreEstudio } from '@/lib/estudio/store';
import { cmAFoto, fotoACm, fotosDelLado, fuenteFoto, type FotoCalibrada, type Lado } from '@/lib/estudio/siluetas';
import { CAMBIO_SURFI, DURACION_SURFI, movimientoReducido, poligonoBarrido, progresoCambio, surfiDesactive, type Reveal } from '@/lib/surfi';
import { elementosDe, type RefsSurfi } from '@/components/producto/Surfi';

export type FuncionCapturar = () => Promise<Captura[]>;

interface Props {
  store: StoreEstudio;
  fotos: Record<Lado, FotoCalibrada>; // fotos del color elegido (real o recoloreada), con su calibración
  capturarRef: RefObject<FuncionCapturar | null>;
  /** Surfi, qui révèle la couleur (components/producto/Surfi.tsx), monté au-dessus du lienzo. */
  surfiRef?: RefObject<RefsSurfi | null>;
}

const ANCHO_CAPTURA = 1200;
const ALTO_CAPTURA = 1500;
const FUERZA_SOMBRA = 0.9; // cuánto sigue el logo las luces y sombras de la tela (0 = pegatina plana)
const PASO_TECLADO_CM = 0.5;
const SOMBRA_CONTACTO = 'rgba(11, 15, 31, 0.16)'; // encre, muy suave, bajo la prenda

interface Encaje {
  x: number;
  y: number;
  escala: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Luminancia suavizada de la foto tal y como está dibujada en el lienzo (en píxeles del lienzo). */
interface MapaLuz {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  datos: Float32Array;
}

function encajar(foto: FotoCalibrada, ancho: number, alto: number, margen: number): Encaje {
  const escala = Math.min((ancho * (1 - 2 * margen)) / foto.ancho, (alto * (1 - 2 * margen)) / foto.alto);
  return { escala, x: (ancho - foto.ancho * escala) / 2, y: (alto - foto.alto * escala) / 2 };
}

function desenfocar(datos: Float32Array, ancho: number, alto: number, radio: number): Float32Array {
  if (radio < 1) return datos;
  const tmp = new Float32Array(datos.length);
  const out = new Float32Array(datos.length);
  const n = 2 * radio + 1;
  for (let y = 0; y < alto; y++) {
    let suma = 0;
    const fila = y * ancho;
    for (let x = -radio; x <= radio; x++) suma += datos[fila + Math.min(ancho - 1, Math.max(0, x))];
    for (let x = 0; x < ancho; x++) {
      tmp[fila + x] = suma / n;
      suma += datos[fila + Math.min(ancho - 1, x + radio + 1)] - datos[fila + Math.max(0, x - radio)];
    }
  }
  for (let x = 0; x < ancho; x++) {
    let suma = 0;
    for (let y = -radio; y <= radio; y++) suma += tmp[Math.min(alto - 1, Math.max(0, y)) * ancho + x];
    for (let y = 0; y < alto; y++) {
      out[y * ancho + x] = suma / n;
      suma += tmp[Math.min(alto - 1, y + radio + 1) * ancho + x] - tmp[Math.max(0, y - radio) * ancho + x];
    }
  }
  return out;
}

function mapaDeLuz(ctx: CanvasRenderingContext2D, foto: FotoCalibrada, enc: Encaje): MapaLuz {
  const x = Math.max(0, Math.floor(enc.x));
  const y = Math.max(0, Math.floor(enc.y));
  const ancho = Math.min(ctx.canvas.width - x, Math.ceil(foto.ancho * enc.escala));
  const alto = Math.min(ctx.canvas.height - y, Math.ceil(foto.alto * enc.escala));
  const d = ctx.getImageData(x, y, ancho, alto).data;
  const lum = new Float32Array(ancho * alto);
  // fuera de la prenda (alfa 0, el escenario) la luz se toma como la media de la tela: no tira del logo en el borde
  let suma = 0;
  let n = 0;
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    if (d[i + 3] > 32) {
      lum[j] = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      suma += lum[j];
      n++;
    } else lum[j] = -1;
  }
  const media = n ? suma / n : 0.5;
  for (let j = 0; j < lum.length; j++) if (lum[j] < 0) lum[j] = media;
  return { x, y, ancho, alto, datos: desenfocar(lum, ancho, alto, Math.max(1, Math.round(2 * enc.escala))) };
}

function luzEn(mapa: MapaLuz, x: number, y: number): number {
  const i = Math.min(mapa.ancho - 1, Math.max(0, x - mapa.x));
  const j = Math.min(mapa.alto - 1, Math.max(0, y - mapa.y));
  return mapa.datos[j * mapa.ancho + i];
}

/** Dibuja el logo en su rectángulo multiplicado por la luz relativa de la tela: sigue pliegues y sombras. */
function dibujarCalco(ctx: CanvasRenderingContext2D, logo: HTMLCanvasElement, rect: Rect, luz: MapaLuz) {
  const w = Math.max(1, Math.round(rect.w));
  const h = Math.max(1, Math.round(rect.h));
  const x0 = Math.round(rect.x);
  const y0 = Math.round(rect.y);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(logo, 0, 0, w, h);
  const img = octx.getImageData(0, 0, w, h);
  const d = img.data;
  let suma = 0;
  let n = 0;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (d[(j * w + i) * 4 + 3] > 8) {
        suma += luzEn(luz, x0 + i, y0 + j);
        n++;
      }
    }
  }
  const media = n ? Math.max(0.03, suma / n) : 0.5;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const o = (j * w + i) * 4;
      if (d[o + 3] === 0) continue;
      const f = Math.min(1.3, Math.max(0.45, 1 + (luzEn(luz, x0 + i, y0 + j) / media - 1) * FUERZA_SOMBRA));
      d[o] = Math.min(255, d[o] * f);
      d[o + 1] = Math.min(255, d[o + 1] * f);
      d[o + 2] = Math.min(255, d[o + 2] * f);
    }
  }
  octx.putImageData(img, 0, 0);
  ctx.drawImage(off, x0, y0);
}

function dibujarZona(ctx: CanvasRenderingContext2D, r: Rect, escala: number) {
  ctx.save();
  ctx.setLineDash([8 * escala, 6 * escala]);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3 * escala;
  ctx.strokeStyle = 'rgba(11, 15, 31, 0.45)';
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.lineWidth = 1.5 * escala;
  ctx.strokeStyle = 'rgba(63, 230, 242, 0.95)';
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

/** Sombra de contacto muy suave bajo el bajo de la prenda (solo en el escenario, no en las capturas). */
function dibujarSombraContacto(ctx: CanvasRenderingContext2D, foto: FotoCalibrada, enc: Encaje) {
  const cx = enc.x + foto.centroX * enc.escala;
  const cy = enc.y + foto.bajoY * enc.escala - 2 * enc.escala;
  const rx = foto.ancho * enc.escala * 0.3;
  const ry = foto.alto * enc.escala * 0.028;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, SOMBRA_CONTACTO);
  g.addColorStop(0.6, 'rgba(11, 15, 31, 0.07)');
  g.addColorStop(1, 'rgba(11, 15, 31, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

interface Escena {
  lado: Lado;
  foto: FotoCalibrada;
  src: string; // el archivo del recorte que se dibuja (fase 4.4: 800 o 1200 px según el tamaño del lienzo)
  imagen: HTMLImageElement;
  colocaciones: Colocacion[];
  /** El logo de cada lado (fase 10); detrás sin logo propio, el delantero. */
  logos: PorLado<HTMLCanvasElement | null>;
  proporcionDe: (p: Posicion) => number;
  posicionDe: (p: Posicion) => ReturnType<typeof posicionSilueta>;
  zona: Posicion | null; // posición cuya zona permitida se dibuja
}

function rectDeColocacion(esc: Escena, enc: Encaje, c: Colocacion): Rect {
  const pos = esc.posicionDe(c.posicion);
  const centro = cmAFoto(esc.foto, esc.lado, pos.ancla.x + c.dx, pos.ancla.z + c.dz);
  const w = c.anchoCm * esc.foto.pxPorCm * enc.escala;
  const h = w * esc.proporcionDe(c.posicion);
  return { x: enc.x + centro.x * enc.escala - w / 2, y: enc.y + centro.y * enc.escala - h / 2, w, h };
}

function rectDeZona(esc: Escena, enc: Encaje, p: Posicion): Rect {
  const pos = esc.posicionDe(p);
  const a = cmAFoto(esc.foto, esc.lado, pos.zona.xMin, pos.zona.zMax);
  const b = cmAFoto(esc.foto, esc.lado, pos.zona.xMax, pos.zona.zMin);
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  return { x: enc.x + x0 * enc.escala, y: enc.y + a.y * enc.escala, w: (x1 - x0) * enc.escala, h: (b.y - a.y) * enc.escala };
}

/** Dibuja la escena completa en un lienzo: fondo (o escenario transparente con sombra), foto, logos y, si toca, la zona punteada. */
function dibujarEscena(ctx: CanvasRenderingContext2D, esc: Escena, enc: Encaje, fondo: string | null, cacheLuz?: { clave: string; mapa: MapaLuz | null }) {
  const { width: W, height: H } = ctx.canvas;
  ctx.clearRect(0, 0, W, H);
  if (fondo) {
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, W, H);
  } else {
    dibujarSombraContacto(ctx, esc.foto, enc);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(esc.imagen, enc.x, enc.y, esc.foto.ancho * enc.escala, esc.foto.alto * enc.escala);
  const visibles = esc.colocaciones.filter((c) => esc.posicionDe(c.posicion).lado === esc.lado);
  const logo = esc.logos[esc.lado] ?? (esc.lado === 'detras' ? esc.logos.delante : null);
  if (logo && visibles.length) {
    const clave = `${esc.lado}|${esc.src}|${W}x${H}|${fondo ?? ''}`;
    let mapa = cacheLuz && cacheLuz.clave === clave ? cacheLuz.mapa : null;
    if (!mapa) {
      mapa = mapaDeLuz(ctx, esc.foto, enc);
      if (cacheLuz) {
        cacheLuz.clave = clave;
        cacheLuz.mapa = mapa;
      }
    }
    for (const c of visibles) dibujarCalco(ctx, logo, rectDeColocacion(esc, enc, c), mapa);
  }
  if (esc.zona && esc.posicionDe(esc.zona).lado === esc.lado) dibujarZona(ctx, rectDeZona(esc, enc, esc.zona), enc.escala);
}

/** Reloj de la animación (fuera del componente: el revelado se calcula en los fotogramas, no al renderizar). */
function ahora(): number {
  return performance.now();
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    img.src = src;
  });
}

/** Revelación en marcha: la escena anterior congelada y el momento en que empezó. */
interface Revelacion {
  inicio: number;
  anterior: HTMLCanvasElement;
  control: Reveal | null;
  reducido: boolean;
}

export default function Visor2D({ store, fotos, capturarRef, surfiRef }: Props) {
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const imagenes = useRef<Partial<Record<string, HTMLImageElement>>>({});
  const cacheLuz = useRef<{ clave: string; mapa: MapaLuz | null }>({ clave: '', mapa: null });
  const arrastre = useRef<{ posicion: Posicion; dx0: number; dz0: number; x0: number; z0: number } | null>(null);
  const avisado = useRef(false);
  const pendiente = useRef(0);
  const revelacion = useRef<Revelacion | null>(null);
  const ultimaFoto = useRef<{ lado: Lado; src: string } | null>(null);
  // Píxeles de dispositivo que ocupa la foto en el lienzo (fase 4.4): decide si se carga el recorte de 800 o el de 1200.
  const [anchoLienzo, setAnchoLienzo] = useState(0);
  const anchoNecesario = anchoLienzo || 1200;

  const silueta = useStore(store, (s) => s.silueta);
  const lado = useStore(store, (s) => s.lado);
  const srcDelante = fuenteFoto(fotos.delante, anchoNecesario);
  const srcDetras = fuenteFoto(fotos.detras, anchoNecesario);
  const colocaciones = useStore(store, (s) => s.colocaciones);
  const logos = useStore(store, (s) => s.logos);
  const activa = useStore(store, (s) => s.activa);
  const mostrarZona = useStore(store, (s) => s.mostrarZona);
  const fotoLista = useStore(store, (s) => s.fotoLista);

  const escenaActual = (ladoEscena: Lado, ancho = anchoNecesario): Escena | null => {
    const src = fuenteFoto(fotos[ladoEscena], ancho);
    const imagen = imagenes.current[src];
    if (!imagen) return null;
    const s = store.getState();
    return {
      lado: ladoEscena,
      foto: fotos[ladoEscena],
      src,
      imagen,
      colocaciones: s.colocaciones,
      logos: { delante: s.logos.delante?.canvas ?? null, detras: s.logos.detras?.canvas ?? null },
      proporcionDe: (p) => proporcionEn(silueta, s.logos, p),
      posicionDe: (p) => posicionSilueta(silueta, p),
      zona: s.mostrarZona && s.activa ? s.activa : null,
    };
  };

  const encajeActual = (esc: Escena, lienzo: HTMLCanvasElement) => encajar(esc.foto, lienzo.width, lienzo.height, 0.03);

  const terminarRevelacion = () => {
    const r = revelacion.current;
    if (!r) return;
    revelacion.current = null;
    r.control?.cancelar();
  };

  const dibujar = () => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return;
    const esc = escenaActual(lado);
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    if (!esc || !ctx) return;
    const r = revelacion.current;
    if (r) {
      // la scène précédente entière et, par-dessus, la nouvelle révélée par le volet derrière Surfi (ou en fondu)
      const t = ahora() - r.inicio;
      const p = r.reducido ? Math.min(1, t / DURACION_SURFI.fundido) : progresoCambio(t);
      const nueva = document.createElement('canvas');
      nueva.width = lienzo.width;
      nueva.height = lienzo.height;
      const nctx = nueva.getContext('2d', { willReadFrequently: true });
      if (!nctx) return;
      dibujarEscena(nctx, esc, encajeActual(esc, nueva), null, cacheLuz.current);
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.drawImage(r.anterior, 0, 0);
      if (p > 0 && r.reducido) {
        ctx.globalAlpha = p;
        ctx.drawImage(nueva, 0, 0);
        ctx.globalAlpha = 1;
      } else if (p > 0) {
        // éventail dévoilé derrière Surfi pendant son tour du cadre (même géométrie que la fiche produit)
        const pts = poligonoBarrido(p, lienzo.width, lienzo.height);
        if (pts.length > 2) {
          ctx.save();
          ctx.beginPath();
          pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(nueva, 0, 0);
          ctx.restore();
        }
      }
      const total = r.reducido ? DURACION_SURFI.fundido : CAMBIO_SURFI.fin;
      if (t < total) pedirDibujo();
      else {
        revelacion.current = null; // Surfi finit de sortir ; le lienzo montre déjà la nouvelle scène entière
        pedirDibujo();
      }
    } else {
      dibujarEscena(ctx, esc, encajeActual(esc, lienzo), null, cacheLuz.current);
    }
    ultimaFoto.current = { lado, src: esc.src };
    if (!store.getState().fotoLista) {
      if (!avisado.current && typeof performance !== 'undefined') performance.mark('estudio:primer-render');
      avisado.current = true;
      store.getState().setFotoLista(true);
    }
  };

  const pedirDibujo = () => {
    if (pendiente.current) return;
    pendiente.current = requestAnimationFrame(() => {
      pendiente.current = 0;
      dibujar();
    });
  };

  // Cambio de color (otra foto para el lado que se ve): si la foto nueva está cargada y la anterior dibujada, Surfi
  // da su remolino y la escena nueva se funde; si llega otro cambio durante la animación, se cancela y empieza la
  // nueva al instante.
  useEffect(() => {
    const lienzo = lienzoRef.current;
    const anterior = ultimaFoto.current;
    const src = lado === 'delante' ? srcDelante : srcDetras;
    if (!lienzo || !anterior || anterior.lado !== lado || anterior.src === src) return;
    const imagenNueva = imagenes.current[src];
    terminarRevelacion();
    if (!imagenNueva || !lienzo.width || document.hidden) return; // sin foto cargada (o pestaña oculta): cambio directo
    const copia = document.createElement('canvas');
    copia.width = lienzo.width;
    copia.height = lienzo.height;
    copia.getContext('2d')?.drawImage(lienzo, 0, 0);
    const elementos = elementosDe(surfiRef?.current);
    const reducido = movimientoReducido() || surfiDesactive() || !elementos;
    const r: Revelacion = { inicio: ahora(), anterior: copia, control: null, reducido };
    revelacion.current = r;
    if (elementos && !reducido) {
      void import('@/lib/surfi').then(({ revelar }) => {
        if (revelacion.current !== r) return;
        r.inicio = ahora();
        r.control = revelar({ surfi: elementos, capa: null, reducido });
      });
    }
    pedirDibujo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcDelante, srcDetras, lado]);

  // Carga de las dos fotos del color (la trasera también, para que el cambio de vista sea inmediato).
  useEffect(() => {
    let vivo = true;
    for (const src of [srcDelante, srcDetras]) {
      if (imagenes.current[src]) continue;
      cargarImagen(src)
        .then((img) => {
          if (!vivo) return;
          imagenes.current[src] = img;
          pedirDibujo();
        })
        .catch(() => {});
    }
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcDelante, srcDetras]);

  // Precarga de las fotos de todos los colores del lado que se ve, después de la carga inicial (fase 4.2).
  useEffect(() => {
    if (!fotoLista) return;
    let vivo = true;
    const t = window.setTimeout(() => {
      for (const src of fotosDelLado(silueta, lado, anchoNecesario)) {
        if (imagenes.current[src]) continue;
        cargarImagen(src)
          .then((img) => {
            if (vivo) imagenes.current[src] = img;
          })
          .catch(() => {});
      }
    }, 600);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [fotoLista, silueta, lado, anchoNecesario]);

  // Tamaño del lienzo = tamaño del contenedor × densidad de píxeles; se redibuja al cambiar.
  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo?.parentElement) return;
    const observador = new ResizeObserver(() => {
      const r = lienzo.parentElement?.getBoundingClientRect();
      if (!r) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      lienzo.width = Math.max(1, Math.round(r.width * dpr));
      lienzo.height = Math.max(1, Math.round(r.height * dpr));
      // la foto ocupa como mucho el 94 % del lado menor del lienzo (encajar, margen 0,03)
      setAnchoLienzo(Math.round(0.94 * Math.min(lienzo.width, lienzo.height)));
      terminarRevelacion();
      pedirDibujo();
    });
    observador.observe(lienzo.parentElement);
    return () => observador.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cualquier cambio de estado visible redibuja (en el siguiente fotograma).
  useEffect(() => {
    pedirDibujo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lado, colocaciones, logos, activa, mostrarZona, srcDelante, srcDetras, fotoLista]);

  // Capturas de 1200 × 1500 delante y detrás, sobre blanco, con el mismo dibujo que el visor.
  useEffect(() => {
    capturarRef.current = async () => {
      // las capturas (1200 × 1500) se hacen siempre con el recorte grande
      const grandes = [fuenteFoto(fotos.delante, Infinity), fuenteFoto(fotos.detras, Infinity)];
      const faltan = grandes.filter((src) => !imagenes.current[src]);
      await Promise.all(
        faltan.map((src) =>
          cargarImagen(src).then((img) => {
            imagenes.current[src] = img;
          }),
        ),
      );
      const salida: Captura[] = [];
      for (const l of ['delante', 'detras'] as const) {
        const esc = escenaActual(l, Infinity);
        if (!esc) continue;
        const lienzo = document.createElement('canvas');
        lienzo.width = ANCHO_CAPTURA;
        lienzo.height = ALTO_CAPTURA;
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        if (!ctx) continue;
        dibujarEscena(ctx, { ...esc, zona: null }, encajar(esc.foto, ANCHO_CAPTURA, ALTO_CAPTURA, 0), '#ffffff');
        salida.push({ lado: l, url: lienzo.toDataURL('image/png') });
      }
      return salida;
    };
    return () => {
      capturarRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturarRef, srcDelante, srcDetras, silueta, fotos]);

  // Arrastre del logo activo dentro de su zona (ratón, dedo o lápiz) y ajuste fino con el teclado.
  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return;

    const puntoLienzo = (ev: PointerEvent) => {
      const r = lienzo.getBoundingClientRect();
      return { x: ((ev.clientX - r.left) / r.width) * lienzo.width, y: ((ev.clientY - r.top) / r.height) * lienzo.height };
    };

    const colocacionBajo = (p: { x: number; y: number }) => {
      const s = store.getState();
      const esc = escenaActual(s.lado);
      if (!esc || !s.activa || !logoDeLado(s.logos, s.lado)) return null;
      const col = s.colocaciones.find((c) => c.posicion === s.activa);
      if (!col || esc.posicionDe(col.posicion).lado !== s.lado) return null;
      const enc = encajeActual(esc, lienzo);
      const r = rectDeColocacion(esc, enc, col);
      const margen = 6;
      if (p.x < r.x - margen || p.x > r.x + r.w + margen || p.y < r.y - margen || p.y > r.y + r.h + margen) return null;
      const cm = fotoACm(esc.foto, esc.lado, (p.x - enc.x) / enc.escala, (p.y - enc.y) / enc.escala);
      return { col, cm };
    };

    const alBajar = (ev: PointerEvent) => {
      if (ev.button !== 0 && ev.pointerType === 'mouse') return;
      const golpe = colocacionBajo(puntoLienzo(ev));
      if (!golpe) return;
      ev.preventDefault();
      lienzo.setPointerCapture(ev.pointerId);
      arrastre.current = { posicion: golpe.col.posicion, dx0: golpe.col.dx, dz0: golpe.col.dz, x0: golpe.cm.x, z0: golpe.cm.z };
      const s = store.getState();
      s.setArrastrando(true);
      s.setMostrarZona(true);
      lienzo.style.cursor = 'grabbing';
    };

    const alMover = (ev: PointerEvent) => {
      const a = arrastre.current;
      if (!a) {
        lienzo.style.cursor = colocacionBajo(puntoLienzo(ev)) ? 'grab' : 'default';
        return;
      }
      const s = store.getState();
      const esc = escenaActual(s.lado);
      if (!esc) return;
      const enc = encajeActual(esc, lienzo);
      const p = puntoLienzo(ev);
      const cm = fotoACm(esc.foto, esc.lado, (p.x - enc.x) / enc.escala, (p.y - enc.y) / enc.escala);
      s.setDesplazamiento(a.posicion, a.dx0 + (cm.x - a.x0), a.dz0 + (cm.z - a.z0));
    };

    const alSoltar = (ev: PointerEvent) => {
      if (!arrastre.current) return;
      arrastre.current = null;
      const s = store.getState();
      s.setArrastrando(false);
      s.setMostrarZona(s.paso === 'posicion' || s.paso === 'tamano');
      lienzo.style.cursor = 'grab';
      if (lienzo.hasPointerCapture(ev.pointerId)) lienzo.releasePointerCapture(ev.pointerId);
    };

    const alTeclear = (ev: KeyboardEvent) => {
      const s = store.getState();
      const col = s.colocaciones.find((c) => c.posicion === s.activa);
      if (!col || !logoDeLado(s.logos, posicionSilueta(s.silueta, col.posicion).lado)) return;
      const paso = ev.shiftKey ? PASO_TECLADO_CM * 4 : PASO_TECLADO_CM;
      const delta: Record<string, [number, number]> = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, paso], ArrowDown: [0, -paso] };
      const d = delta[ev.key];
      if (!d) return;
      ev.preventDefault();
      // Detrás, la izquierda de la pantalla es la izquierda del que la lleva: se invierte x.
      const signo = s.lado === 'detras' ? -1 : 1;
      s.setDesplazamiento(col.posicion, col.dx + d[0] * signo, col.dz + d[1]);
      s.setMostrarZona(true);
    };

    lienzo.addEventListener('pointerdown', alBajar);
    lienzo.addEventListener('pointermove', alMover);
    lienzo.addEventListener('pointerup', alSoltar);
    lienzo.addEventListener('pointercancel', alSoltar);
    lienzo.addEventListener('keydown', alTeclear);
    return () => {
      lienzo.removeEventListener('pointerdown', alBajar);
      lienzo.removeEventListener('pointermove', alMover);
      lienzo.removeEventListener('pointerup', alSoltar);
      lienzo.removeEventListener('pointercancel', alSoltar);
      lienzo.removeEventListener('keydown', alTeclear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, silueta, srcDelante, srcDetras, fotos]);

  return (
    <canvas
      ref={lienzoRef}
      tabIndex={0}
      role="img"
      aria-label={`Photo du vêtement vu ${lado === 'delante' ? 'de face' : 'de dos'} avec votre logo. Faites glisser le logo ou déplacez-le avec les flèches du clavier.`}
      className="h-full w-full touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-bleu-600"
    />
  );
}
