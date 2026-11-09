// Procesado del logo en el navegador (sección 5 de la spec): PNG, JPG o SVG se rasterizan en un canvas,
// el SVG se pinta como imagen (nunca se inserta en la página) y nada sale del navegador hasta enviar.

export const FORMATOS_LOGO = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;
export const MAX_LADO_PX = 2048; // resolución máxima del canvas del logo (nitidez suficiente para un A3 en pantalla)
export const MAX_BYTES_LOGO = 20 * 1024 * 1024;

export interface LogoProcesado {
  canvas: HTMLCanvasElement;
  ancho: number; // px del canvas
  alto: number;
  anchoOriginal: number; // px del archivo (en SVG, el tamaño rasterizado)
  altoOriginal: number;
  vectorial: boolean;
  nombre: string;
  archivo?: File; // el archivo original, tal cual: se guarda en el navegador al enviar el diseño (fase 4)
}

function esSvg(archivo: File): boolean {
  return archivo.type === 'image/svg+xml' || /\.svg$/i.test(archivo.name);
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Impossible de lire l’image.'));
    img.src = url;
  });
}

/** Rasteriza el archivo en un canvas de como mucho MAX_LADO_PX de lado. */
export async function procesarLogo(archivo: File): Promise<LogoProcesado> {
  if (archivo.size > MAX_BYTES_LOGO) throw new Error('Le fichier dépasse 20 Mo.');
  const svg = esSvg(archivo);
  if (!svg && !FORMATOS_LOGO.includes(archivo.type as (typeof FORMATOS_LOGO)[number])) {
    throw new Error('Format non pris en charge pour l’aperçu : utilisez un fichier PNG, JPG ou SVG.');
  }
  const url = URL.createObjectURL(archivo);
  try {
    const img = await cargarImagen(url);
    let anchoOriginal = img.naturalWidth;
    let altoOriginal = img.naturalHeight;
    if (!anchoOriginal || !altoOriginal) {
      // SVG sin width/height: se asume un lado de 1024 px manteniendo la proporción del viewBox.
      anchoOriginal = img.width || 1024;
      altoOriginal = img.height || 1024;
    }
    // Un SVG se rasteriza grande para que sea nítido en cualquier tamaño.
    let ancho = anchoOriginal;
    let alto = altoOriginal;
    const objetivo = svg ? MAX_LADO_PX : Math.min(MAX_LADO_PX, Math.max(ancho, alto));
    const escala = objetivo / Math.max(ancho, alto);
    ancho = Math.max(1, Math.round(ancho * escala));
    alto = Math.max(1, Math.round(alto * escala));
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Votre navigateur ne permet pas de traiter les images.');
    ctx.drawImage(img, 0, 0, ancho, alto);
    return {
      canvas,
      ancho,
      alto,
      anchoOriginal: svg ? ancho : anchoOriginal,
      altoOriginal: svg ? alto : altoOriginal,
      vectorial: svg,
      nombre: archivo.name,
      archivo,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Quita el fondo blanco: hace transparente el blanco (y casi blanco) conectado con los bordes de la imagen,
 * así el blanco de dentro del logo se conserva. Devuelve un canvas nuevo.
 */
export function quitarFondoBlanco(origen: HTMLCanvasElement, tolerancia = 28): HTMLCanvasElement {
  const { width: w, height: h } = origen;
  const salida = document.createElement('canvas');
  salida.width = w;
  salida.height = h;
  const ctx = salida.getContext('2d', { willReadFrequently: true });
  if (!ctx) return origen;
  ctx.drawImage(origen, 0, 0);
  const imagen = ctx.getImageData(0, 0, w, h);
  const d = imagen.data;
  const visitado = new Uint8Array(w * h);
  const pila: number[] = [];
  const umbral = 255 - tolerancia;
  const esFondo = (i: number) => {
    const o = i * 4;
    return d[o + 3] > 0 && d[o] >= umbral && d[o + 1] >= umbral && d[o + 2] >= umbral;
  };
  const empujar = (i: number) => {
    if (!visitado[i] && esFondo(i)) {
      visitado[i] = 1;
      pila.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    empujar(x);
    empujar((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    empujar(y * w);
    empujar(y * w + w - 1);
  }
  while (pila.length) {
    const i = pila.pop() as number;
    const x = i % w;
    const y = (i - x) / w;
    d[i * 4 + 3] = 0;
    if (x > 0) empujar(i - 1);
    if (x < w - 1) empujar(i + 1);
    if (y > 0) empujar(i - w);
    if (y < h - 1) empujar(i + w);
  }
  // Suaviza el borde: los píxeles casi blancos pegados al fondo quedan semitransparentes.
  for (let i = 0; i < w * h; i++) {
    if (visitado[i]) continue;
    const o = i * 4;
    const x = i % w;
    const y = (i - x) / w;
    const vecinoFondo =
      (x > 0 && visitado[i - 1]) || (x < w - 1 && visitado[i + 1]) || (y > 0 && visitado[i - w]) || (y < h - 1 && visitado[i + w]);
    if (!vecinoFondo) continue;
    const min = Math.min(d[o], d[o + 1], d[o + 2]);
    if (min >= umbral - tolerancia) {
      const t = (255 - min) / (tolerancia * 2);
      d[o + 3] = Math.round(d[o + 3] * Math.min(1, Math.max(0.15, t)));
    }
  }
  ctx.putImageData(imagen, 0, 0);
  return salida;
}

/** Recorta la transparencia sobrante alrededor del logo para que el tamaño en cm sea el del dibujo. */
export function recortarTransparente(origen: HTMLCanvasElement): HTMLCanvasElement {
  const { width: w, height: h } = origen;
  const ctx = origen.getContext('2d', { willReadFrequently: true });
  if (!ctx) return origen;
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0 || (x0 === 0 && y0 === 0 && x1 === w - 1 && y1 === h - 1)) return origen;
  const salida = document.createElement('canvas');
  salida.width = x1 - x0 + 1;
  salida.height = y1 - y0 + 1;
  salida.getContext('2d')?.drawImage(origen, x0, y0, salida.width, salida.height, 0, 0, salida.width, salida.height);
  return salida;
}

/** Píxeles por cm que tendrá el logo al tamaño elegido; a 150 ppp un A4 pide unos 1.240 × 1.754 px. */
export function resolucionPpp(logo: Pick<LogoProcesado, 'anchoOriginal' | 'vectorial'>, anchoCm: number): number | null {
  if (logo.vectorial) return null;
  return (logo.anchoOriginal / anchoCm) * 2.54;
}

export const PPP_MINIMO = 150;
