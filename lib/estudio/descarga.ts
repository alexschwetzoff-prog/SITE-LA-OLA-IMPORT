// «Descargar mi diseño»: un solo PNG con la captura delantera y la trasera y la marca [MARCA], para que el
// cliente lo enseñe a socios o equipo (sección 5 de la spec). Se compone en el navegador.

import type { Captura } from './store';

const LOGO = '/marca/logo-marca.png';
const MARGEN = 40;
const PIE = 170;

function cargar(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se ha podido cargar ${src}`));
    img.src = src;
  });
}

export interface ResumenDiseno {
  producto: string;
  color: string;
  posiciones: string[]; // "Corazón · 8 cm", ...
}

/** Compone el PNG de descarga: las dos capturas lado a lado, un pie con el logo y los datos, y una marca discreta. */
export async function componerDescarga(capturas: Captura[], resumen: ResumenDiseno): Promise<Blob> {
  const imagenes = await Promise.all(capturas.map((c) => cargar(c.url)));
  let logo: HTMLImageElement | null = null;
  try {
    logo = await cargar(LOGO);
  } catch {
    logo = null;
  }
  const anchoCaptura = imagenes[0]?.naturalWidth ?? 1200;
  const altoCaptura = imagenes[0]?.naturalHeight ?? 1500;
  const canvas = document.createElement('canvas');
  canvas.width = MARGEN + imagenes.length * (anchoCaptura + MARGEN);
  canvas.height = MARGEN + altoCaptura + PIE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no permite componer la imagen.');
  const fuente = getComputedStyle(document.body).fontFamily || 'sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  imagenes.forEach((img, i) => {
    const x = MARGEN + i * (anchoCaptura + MARGEN);
    ctx.drawImage(img, x, MARGEN, anchoCaptura, altoCaptura);
    // etiqueta de la vista
    ctx.fillStyle = 'rgba(11, 15, 31, 0.7)';
    ctx.font = `600 30px ${fuente}`;
    ctx.textBaseline = 'top';
    ctx.fillText(capturas[i].lado === 'delante' ? 'Delante' : 'Detrás', x + 24, MARGEN + 20);
    // marca discreta en la esquina de cada captura
    if (logo) {
      const alto = 56;
      const ancho = (logo.naturalWidth / logo.naturalHeight) * alto;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(logo, x + anchoCaptura - ancho - 24, MARGEN + altoCaptura - alto - 20, ancho, alto);
      ctx.globalAlpha = 1;
    }
  });

  // pie: logo, datos del diseño y web
  const yPie = MARGEN + altoCaptura + 36;
  let xTexto = MARGEN;
  if (logo) {
    const alto = 84;
    const ancho = (logo.naturalWidth / logo.naturalHeight) * alto;
    ctx.drawImage(logo, MARGEN, yPie, ancho, alto);
    xTexto = MARGEN + ancho + 36;
  }
  ctx.fillStyle = '#111111';
  ctx.font = `600 40px ${fuente}`;
  ctx.fillText(`${resumen.producto} · ${resumen.color}`, xTexto, yPie + 2);
  ctx.fillStyle = '#555555';
  ctx.font = `400 28px ${fuente}`;
  ctx.fillText(resumen.posiciones.length ? resumen.posiciones.join(' · ') : 'Sin logo', xTexto, yPie + 54);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#8a8a8a';
  ctx.font = `600 28px ${fuente}`;
  ctx.fillText('Diseñado en el estudio de [MARCA] · dominio-pendiente.example', canvas.width - MARGEN, yPie + 54);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se ha podido generar el PNG.'))), 'image/png');
  });
}

export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
