// Dibujo del logo sobre una foto de prenda siguiendo la luz de la tela, para la vista rápida de la home
// («Pruébalo con tu logo»). Es la misma idea que el visor del estudio (components/estudio/Visor2D.tsx), en una
// versión mínima y sin estado: la foto ya dibujada en el lienzo, el logo en su rectángulo, multiplicado por la
// luminancia relativa de la tela bajo él.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FUERZA_SOMBRA = 0.9;

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

/** Dibuja `logo` en `rect` sobre lo que ya hay en `ctx`, oscurecido o aclarado según la luz de la tela. */
export function dibujarLogoSombreado(ctx: CanvasRenderingContext2D, logo: HTMLCanvasElement, rect: Rect) {
  const w = Math.max(1, Math.round(rect.w));
  const h = Math.max(1, Math.round(rect.h));
  const x0 = Math.round(rect.x);
  const y0 = Math.round(rect.y);
  if (x0 < 0 || y0 < 0 || x0 + w > ctx.canvas.width || y0 + h > ctx.canvas.height) {
    ctx.drawImage(logo, x0, y0, w, h);
    return;
  }
  // luz de la tela bajo el logo, con un margen para suavizar
  const margen = 4;
  const lx = Math.max(0, x0 - margen);
  const ly = Math.max(0, y0 - margen);
  const lw = Math.min(ctx.canvas.width - lx, w + 2 * margen);
  const lh = Math.min(ctx.canvas.height - ly, h + 2 * margen);
  const tela = ctx.getImageData(lx, ly, lw, lh).data;
  const lum = new Float32Array(lw * lh);
  for (let i = 0, j = 0; i < tela.length; i += 4, j++) lum[j] = (0.299 * tela[i] + 0.587 * tela[i + 1] + 0.114 * tela[i + 2]) / 255;
  const luz = desenfocar(lum, lw, lh, 2);

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
  const luzEn = (i: number, j: number) => luz[(j + y0 - ly) * lw + (i + x0 - lx)];
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (d[(j * w + i) * 4 + 3] > 8) {
        suma += luzEn(i, j);
        n++;
      }
    }
  }
  const media = n ? Math.max(0.03, suma / n) : 0.5;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const o = (j * w + i) * 4;
      if (d[o + 3] === 0) continue;
      const f = Math.min(1.3, Math.max(0.45, 1 + (luzEn(i, j) / media - 1) * FUERZA_SOMBRA));
      d[o] = Math.min(255, d[o] * f);
      d[o + 1] = Math.min(255, d[o + 1] * f);
      d[o + 2] = Math.min(255, d[o + 2] * f);
    }
  }
  octx.putImageData(img, 0, 0);
  ctx.drawImage(off, x0, y0);
}
