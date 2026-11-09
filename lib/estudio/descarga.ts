// « Télécharger mon visuel » : un seul PNG avec la capture devant et la capture derrière, signé La Ola Import (logo
// et slogan), pour que le client le montre à ses associés ou à son équipe. Composé dans le navigateur.

import { SITE } from '@/lib/site';
import type { Captura } from './store';

/** Logo transparent de La Ola Import (480 × 270, 16:9). */
const LOGO = '/marca/logo-la-ola-import.png';
const MARGEN = 40;
const PIE = 200;
const MARINE = '#00063D';
const ARDOISE = '#5A6785';

function cargar(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    img.src = src;
  });
}

export interface ResumenDiseno {
  producto: string;
  color: string;
  posiciones: string[]; // « Cœur · 8 cm », ...
}

/** Nom du fichier téléchargé : « la-ola-import-atomic-150-bleu-marine.png » (sans accents ni espaces). */
export function nombreArchivoDescarga(slug: string, color: string): string {
  const limpio = color
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `la-ola-import-${slug}${limpio ? `-${limpio}` : ''}.png`;
}

/** Compose le PNG : les deux captures côte à côte, un pied avec le logo, les données du visuel et la signature. */
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
  canvas.width = MARGEN + Math.max(1, imagenes.length) * (anchoCaptura + MARGEN);
  canvas.height = MARGEN + altoCaptura + PIE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Votre navigateur ne permet pas de composer l’image.');
  const fuente = getComputedStyle(document.body).fontFamily || 'sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = 'top';

  imagenes.forEach((img, i) => {
    const x = MARGEN + i * (anchoCaptura + MARGEN);
    ctx.drawImage(img, x, MARGEN, anchoCaptura, altoCaptura);
    // libellé de la vue
    ctx.fillStyle = 'rgba(0, 6, 61, 0.75)';
    ctx.font = `600 30px ${fuente}`;
    ctx.fillText(capturas[i].lado === 'delante' ? 'Devant' : 'Derrière', x + 24, MARGEN + 20);
    // logo discret dans le coin de chaque capture (proportions d'origine)
    if (logo) {
      const alto = 72;
      const ancho = (logo.naturalWidth / logo.naturalHeight) * alto;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(logo, x + anchoCaptura - ancho - 20, MARGEN + altoCaptura - alto - 16, ancho, alto);
      ctx.globalAlpha = 1;
    }
  });

  // pied : logo, données du visuel et signature
  const yPie = MARGEN + altoCaptura + 30;
  let xTexto = MARGEN;
  if (logo) {
    const alto = 126;
    const ancho = (logo.naturalWidth / logo.naturalHeight) * alto;
    ctx.drawImage(logo, MARGEN - 8, yPie, ancho, alto);
    xTexto = MARGEN + ancho + 24;
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = MARINE;
  ctx.font = `700 40px ${fuente}`;
  ctx.fillText(`${resumen.producto} · ${resumen.color}`, xTexto, yPie + 4);
  ctx.fillStyle = ARDOISE;
  ctx.font = `400 28px ${fuente}`;
  ctx.fillText(resumen.posiciones.length ? resumen.posiciones.join(' · ') : 'Sans logo', xTexto, yPie + 56);
  ctx.fillStyle = MARINE;
  ctx.font = `600 26px ${fuente}`;
  ctx.fillText(`${SITE.nombre} · ${SITE.lema}`, xTexto, yPie + 100);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Impossible de créer l’image PNG.'))), 'image/png');
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
