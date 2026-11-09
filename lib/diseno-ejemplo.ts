// Motif d'exemple dessiné dans le navigateur : « Votre logo ici » (public/marca/tu-logo-aqui.png), sur tous les
// produits, Atomic 150 et Austral compris (les fichiers de logo de l'ancienne marque ont été retirés). Il est posé en
// calque au-dessus de la photo du produit, à la résolution réelle de l'écran (devicePixelRatio compris), avec le même
// ombrage de tissu que le studio : le motif est multiplié par la lumière relative du tissu sous lui.
// [à refaire] L'image actuelle porte encore le texte espagnol « tu logo AQUÍ » : il faut une version « Votre logo ici ».
//
// La colocación (centro, ancho y giro en píxeles de la foto original, la capucha que lo tapa por detrás y el tamaño
// de la foto) la calcula scripts/fotos/preparar-fotos-productos.py (y preparar-fotos-catalogo.py) y viaja en
// data/fotos-catalogo.json. Sin JavaScript, la foto se ve limpia, sin el diseño.

// Un seul motif aujourd'hui. Les anciens identifiants 'marca-logo' et 'marca-estrella' (logo et étoile de la marque de
// la base) ne sont plus servis : data/fotos-catalogo.json pointe sur 'tu-logo-aqui' partout.
export type Marca = 'tu-logo-aqui';

export interface ColocacionDiseno {
  x: number; // centro, en px de la foto original
  y: number;
  ancho: number; // ancho del diseño, en px de la foto original
  giro?: number; // grados, en sentido antihorario
  marca: Marca;
  /** Polígono (px de la foto original) de la capucha vista por detrás: la foto vuelve a cubrir el diseño ahí. */
  capucha?: number[][];
  /** Tamaño de la foto original (la que se ve puede ser otra candidata del srcset). */
  lienzo?: [number, number];
}

/** Rectángulo (px CSS, relativo al lienzo) donde se ve la foto completa. */
export interface RectFoto {
  x: number;
  y: number;
  w: number;
  h: number;
}

const RUTAS: Record<Marca, string> = {
  'tu-logo-aqui': '/marca/tu-logo-aqui.png',
};

const FUERZA_SOMBRA = 0.9; // cuánto sigue el diseño la luz de la tela (igual que el visor del estudio)
const UMBRAL_BLANCO = 135; // luminancia media bajo el diseño por debajo de la cual va la versión blanca (fase 4.4: 135, revisado con docs/revision-colores/diseno-claro-oscuro.csv; antes 118)
const DPR_MAXIMO = 4; // zoom del navegador al 200 % en una pantalla 2×

const cacheMarca = new Map<Marca, Promise<HTMLImageElement>>();
// El diseño ya escalado a cada tamaño (sin sombrear): las tarjetas lo piden a tamaños parecidos muchas veces.
const cacheEscalado = new Map<string, Promise<CanvasImageSource>>();
// Pirámide de mitades de cada archivo de marca (la reserva cuando no hay createImageBitmap con reescalado).
const cachePiramide = new Map<Marca, (HTMLImageElement | HTMLCanvasElement)[]>();
let reescaladoFueraDelHilo: boolean | null = null;

export function cargarMarca(marca: Marca): Promise<HTMLImageElement> {
  let p = cacheMarca.get(marca);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Impossible de charger ${RUTAS[marca]}`));
      img.src = RUTAS[marca];
    });
    cacheMarca.set(marca, p);
  }
  return p;
}

export function dprActual(): number {
  return Math.min(DPR_MAXIMO, Math.max(1, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1));
}

function tamano(origen: HTMLImageElement | HTMLCanvasElement): [number, number] {
  return origen instanceof HTMLImageElement ? [origen.naturalWidth, origen.naturalHeight] : [origen.width, origen.height];
}

/**
 * Reduce por pasos (mitades) hasta el tamaño pedido: los trazos finos no se pierden al bajar mucho de golpe. Las
 * mitades se guardan por archivo de marca (fase 4.4), así cada tarjeta solo dibuja un paso, no toda la cadena.
 */
export function reducirConCalidad(origen: HTMLImageElement | HTMLCanvasElement, ancho: number, alto: number, marca?: Marca): HTMLCanvasElement {
  const piramide = (marca && cachePiramide.get(marca)) || [origen];
  if (marca && !cachePiramide.has(marca)) cachePiramide.set(marca, piramide);
  let actual = piramide[piramide.length - 1];
  let [w, h] = tamano(actual);
  while (w > 2 * ancho && h > 2 * alto) {
    w = Math.floor(w / 2);
    h = Math.floor(h / 2);
    const paso = document.createElement('canvas');
    paso.width = w;
    paso.height = h;
    const ctx = paso.getContext('2d');
    if (!ctx) break;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(actual, 0, 0, w, h);
    actual = paso;
    if (marca) piramide.push(paso);
  }
  // el nivel más pequeño que aún es mayor que el tamaño pedido
  for (let k = piramide.length - 1; k >= 0; k--) {
    const [pw, ph] = tamano(piramide[k]);
    if (pw >= ancho && ph >= alto) {
      actual = piramide[k];
      break;
    }
  }
  const salida = document.createElement('canvas');
  salida.width = Math.max(1, Math.round(ancho));
  salida.height = Math.max(1, Math.round(alto));
  const ctx = salida.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(actual, 0, 0, salida.width, salida.height);
  }
  return salida;
}

/**
 * El archivo de marca al tamaño pedido. Con `createImageBitmap` el reescalado lo hace el navegador fuera del hilo
 * principal (fase 4.4: reducir el logo de 1400 px en el hilo principal eran tareas largas en cada tarjeta); si el
 * navegador no admite el reescalado (devuelve el tamaño original), la reserva es la pirámide de mitades cacheada.
 */
export function escalarMarca(marca: Marca, imagen: HTMLImageElement, ancho: number, alto: number): Promise<CanvasImageSource> {
  const clave = `${marca}|${ancho}x${alto}`;
  const guardado = cacheEscalado.get(clave);
  if (guardado) return guardado;
  const reserva = () => Promise.resolve<CanvasImageSource>(reducirConCalidad(imagen, ancho, alto, marca));
  let promesa: Promise<CanvasImageSource>;
  if (reescaladoFueraDelHilo === false || typeof createImageBitmap !== 'function') promesa = reserva();
  else {
    promesa = createImageBitmap(imagen, { resizeWidth: ancho, resizeHeight: alto, resizeQuality: 'high' })
      .then((bitmap) => {
        if (bitmap.width === ancho && bitmap.height === alto) {
          reescaladoFueraDelHilo = true;
          return bitmap as CanvasImageSource;
        }
        reescaladoFueraDelHilo = false; // el navegador ignora el reescalado
        bitmap.close();
        return reserva();
      })
      .catch(() => {
        reescaladoFueraDelHilo = false;
        return reserva();
      });
  }
  if (cacheEscalado.size > 24) cacheEscalado.delete(cacheEscalado.keys().next().value as string);
  cacheEscalado.set(clave, promesa);
  return promesa;
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

/**
 * Dibuja el diseño de ejemplo en `lienzo` (que cubre el mismo recuadro que la foto `rect`, en px CSS) a `dpr`
 * píxeles por px CSS. `foto` es la imagen ya cargada (cualquier tamaño: se escala desde `colocacion.lienzo`).
 * Devuelve la versión usada ('negro' | 'blanco' | 'marca').
 */
export async function dibujarDiseno(lienzo: HTMLCanvasElement, foto: HTMLImageElement, marca: HTMLImageElement, colocacion: ColocacionDiseno, rect: RectFoto, dpr: number): Promise<'negro' | 'blanco' | 'marca'> {
  const [anchoOrig, altoOrig] = colocacion.lienzo ?? [600, 600];
  const esc = (rect.w / anchoOrig) * dpr; // px de dispositivo por px de la foto original
  const cx = (rect.x + (colocacion.x * rect.w) / anchoOrig) * dpr;
  const cy = (rect.y + (colocacion.y * rect.h) / altoOrig) * dpr;
  const w = Math.max(2, Math.round(colocacion.ancho * esc));
  const h = Math.max(2, Math.round((w * marca.naturalHeight) / marca.naturalWidth));
  const giro = ((colocacion.giro ?? 0) * Math.PI) / 180;

  // El diseño a su tamaño (reescalado fuera del hilo principal cuando se puede, y cacheado por marca y tamaño).
  const escalado = await escalarMarca(colocacion.marca, marca, w, h);
  const ctx = lienzo.getContext('2d');
  if (!ctx) return 'negro';
  ctx.clearRect(0, 0, lienzo.width, lienzo.height);

  // Luz de la tela bajo el diseño: la zona de la foto (con margen) a la resolución del lienzo.
  const margen = Math.ceil(4 * esc) + 2;
  const diag = Math.ceil(Math.hypot(w, h));
  const zw = diag + 2 * margen;
  const zh = diag + 2 * margen;
  const zx = Math.round(cx - zw / 2);
  const zy = Math.round(cy - zh / 2);
  const muestra = document.createElement('canvas');
  muestra.width = zw;
  muestra.height = zh;
  const mctx = muestra.getContext('2d', { willReadFrequently: true });
  if (!mctx) return 'negro';
  // región de la foto (en px naturales) que cae bajo la muestra
  const sx = ((zx / dpr - rect.x) / rect.w) * foto.naturalWidth;
  const sy = ((zy / dpr - rect.y) / rect.h) * foto.naturalHeight;
  const sw = (zw / dpr / rect.w) * foto.naturalWidth;
  const sh = (zh / dpr / rect.h) * foto.naturalHeight;
  mctx.fillStyle = '#ffffff';
  mctx.fillRect(0, 0, zw, zh);
  mctx.drawImage(foto, sx, sy, sw, sh, 0, 0, zw, zh);
  const d = mctx.getImageData(0, 0, zw, zh).data;
  const lum = new Float32Array(zw * zh);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) lum[j] = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
  const luz = desenfocar(lum, zw, zh, Math.max(1, Math.round(1.5 * esc)));

  // « Votre logo ici » passe en blanc si le tissu est foncé.
  const capa = document.createElement('canvas');
  capa.width = w;
  capa.height = h;
  const cctx = capa.getContext('2d', { willReadFrequently: true });
  if (!cctx) return 'negro';
  cctx.drawImage(escalado, 0, 0, w, h);
  const img = cctx.getImageData(0, 0, w, h);
  const p = img.data;
  // luminancia media bajo los píxeles opacos del diseño (sin giro: aproximación suficiente para elegir la versión)
  let suma = 0;
  let n = 0;
  const ox = Math.round((zw - w) / 2);
  const oy = Math.round((zh - h) / 2);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (p[(j * w + i) * 4 + 3] > 8) {
        suma += luz[(j + oy) * zw + (i + ox)];
        n++;
      }
    }
  }
  const media = n ? Math.max(0.03, suma / n) : 0.5;
  // Tissu foncé sous le motif (décidé par la luminosité réelle de la zone, devant et dos) : le motif passe en blanc.
  const oscura = colocacion.marca === 'tu-logo-aqui' && media * 255 < UMBRAL_BLANCO;
  const version: 'negro' | 'blanco' | 'marca' = colocacion.marca === 'tu-logo-aqui' ? (oscura ? 'blanco' : 'negro') : 'marca';
  if (oscura) {
    for (let o = 0; o < p.length; o += 4) {
      p[o] = 255;
      p[o + 1] = 255;
      p[o + 2] = 255;
    }
  }
  // sombreado de tela: el diseño se oscurece o aclara con la luz relativa bajo cada píxel
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const o = (j * w + i) * 4;
      if (p[o + 3] === 0) continue;
      const f = Math.min(1.3, Math.max(0.45, 1 + (luz[(j + oy) * zw + (i + ox)] / media - 1) * FUERZA_SOMBRA));
      p[o] = Math.min(255, p[o] * f);
      p[o + 1] = Math.min(255, p[o + 1] * f);
      p[o + 2] = Math.min(255, p[o + 2] * f);
    }
  }
  cctx.putImageData(img, 0, 0);

  ctx.save();
  ctx.translate(cx, cy);
  if (giro) ctx.rotate(-giro);
  ctx.drawImage(capa, -w / 2, -h / 2);
  ctx.restore();

  // Por detrás, en las sudaderas con capucha, la capucha tapa la parte alta del diseño: la foto vuelve encima.
  if (colocacion.capucha && colocacion.capucha.length > 2) {
    ctx.save();
    ctx.beginPath();
    colocacion.capucha.forEach(([px, py], k) => {
      const X = (rect.x + (px * rect.w) / anchoOrig) * dpr;
      const Y = (rect.y + (py * rect.h) / altoOrig) * dpr;
      if (k === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.closePath();
    ctx.clip();
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(foto, rect.x * dpr, rect.y * dpr, rect.w * dpr, rect.h * dpr);
    ctx.restore();
  }
  return version;
}

/**
 * Rectángulo (px CSS de maquetación, relativo al recuadro `caja`) donde `img` enseña su foto con object-fit: contain,
 * y el zoom efectivo (zoom de CSS o del navegador) con el que se está viendo, para dibujar a los píxeles reales.
 * Se usan las medidas de maquetación (offset/client) y no getBoundingClientRect, que cambia con el zoom de CSS.
 */
export function rectDeImagen(img: HTMLImageElement, caja: HTMLElement): (RectFoto & { zoom: number }) | null {
  const estilo = getComputedStyle(img);
  const pl = parseFloat(estilo.paddingLeft) || 0;
  const pr = parseFloat(estilo.paddingRight) || 0;
  const pt = parseFloat(estilo.paddingTop) || 0;
  const pb = parseFloat(estilo.paddingBottom) || 0;
  const cw = img.clientWidth - pl - pr;
  const ch = img.clientHeight - pt - pb;
  if (cw <= 0 || ch <= 0) return null;
  const nw = img.naturalWidth || cw;
  const nh = img.naturalHeight || ch;
  const escala = Math.min(cw / nw, ch / nh);
  const w = nw * escala;
  const h = nh * escala;
  // posición de la imagen dentro de la caja (ambas en px de maquetación)
  const ri = img.getBoundingClientRect();
  const rc = caja.getBoundingClientRect();
  const zoom = img.offsetWidth ? ri.width / img.offsetWidth : 1;
  const x = (ri.left - rc.left) / zoom + pl + (cw - w) / 2;
  const y = (ri.top - rc.top) / zoom + pt + (ch - h) / 2;
  return { x, y, w, h, zoom: zoom || 1 };
}
