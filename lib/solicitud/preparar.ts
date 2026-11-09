'use client';

// Prepara en el navegador lo que acompaña a la solicitud (panier /projet o devis /devis): la cesta sin capturas, los
// logos originales de cada diseño (IndexedDB: el delantero y, si lo hay, el trasero), sus capturas (IndexedDB o, si no están, las
// reducidas de la cesta) pasadas a JPEG, y los archivos sueltos del formulario; todo dentro del límite por envío
// (MAX_ENVIO_BYTES). Las capturas se comprimen por niveles hasta caber; los logos originales no se tocan salvo que
// ellos solos no quepan (entonces el más pesado va como copia PNG reducida y se avisa en el email al equipo).

import { idCaptura, leerArchivo, leerLogo } from '@/lib/logos-db';
import type { ItemPresupuesto } from '@/lib/presupuesto';
import { CLAVE_ARCHIVOS, LADOS, MAX_ENVIO_BYTES, claveCaptura, claveLogo, formatoBytes, nombreLogo, sufijoArchivo, type Lado, type LineaCesta } from './comun';

export interface ArchivoEnvio {
  clave: string;
  archivo: File;
}
export interface EnvioPreparado {
  lineas: LineaCesta[];
  archivos: ArchivoEnvio[];
  avisos: string[];
  total: number;
}
export type ResultadoPreparacion = EnvioPreparado | { error: string };

/** Niveles de compresión de las capturas: [lado mayor en px, calidad JPEG]. */
const NIVELES: [number, number][] = [
  [1200, 0.88],
  [1200, 0.8],
  [960, 0.78],
  [800, 0.74],
  [600, 0.7],
];
const LADO_LOGO_REDUCIDO = 1600;
const RASTER = new Set(['image/png', 'image/jpeg', 'image/webp']);

/** La línea de la cesta tal como viaja al servidor: sin las capturas en data URL. */
export function lineaDe(item: ItemPresupuesto): LineaCesta {
  return {
    id: item.id,
    slug: item.slug,
    nombre: item.nombre,
    tipo: item.tipo,
    color: { nombre: item.color.nombre, hex: item.color.hex, ...(item.color.hexSecundario ? { hexSecundario: item.color.hexSecundario } : {}) },
    tramo: item.tramo,
    ...(item.posiciones?.length ? { posiciones: item.posiciones.map((p) => ({ posicion: p.posicion, nombre: p.nombre })) } : {}),
    ...(item.diseno
      ? {
          diseno: {
            fecha: item.diseno.fecha,
            logo: item.diseno.logo,
            logoId: item.diseno.logoId ?? null,
            ...(item.diseno.logoDetras ? { logoDetras: item.diseno.logoDetras, logoIdDetras: item.diseno.logoIdDetras ?? null } : {}),
            colocaciones: item.diseno.colocaciones.map((c) => ({ posicion: c.posicion, nombre: c.nombre, ...(c.lado ? { lado: c.lado } : {}), anchoCm: c.anchoCm, altoCm: c.altoCm })),
          },
        }
      : {}),
  };
}

async function cargarImagen(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(blob);
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Impossible de lire l’image.'));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Vuelve a dibujar una imagen con un lado máximo, en el formato y calidad pedidos (fondo blanco para JPEG). */
async function redibujar(blob: Blob, ladoMax: number, tipo: 'image/jpeg' | 'image/png', calidad?: number): Promise<Blob | null> {
  try {
    const img = await cargarImagen(blob);
    const ancho = 'naturalWidth' in img ? img.naturalWidth : img.width;
    const alto = 'naturalHeight' in img ? img.naturalHeight : img.height;
    if (!ancho || !alto) return null;
    const escala = Math.min(1, ladoMax / Math.max(ancho, alto));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(ancho * escala));
    canvas.height = Math.max(1, Math.round(alto * escala));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (tipo === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if ('close' in img) img.close();
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, calidad));
  } catch {
    return null;
  }
}

async function blobDeDataUrl(url: string): Promise<Blob | null> {
  try {
    return await (await fetch(url)).blob();
  } catch {
    return null;
  }
}

interface CapturaOriginal {
  indice: number;
  lado: Lado;
  blob: Blob;
}

/** Las capturas de un diseño: las grandes de IndexedDB si siguen ahí; si no, las reducidas que guarda la cesta. */
async function capturasDe(item: ItemPresupuesto, indice: number): Promise<CapturaOriginal[]> {
  const d = item.diseno;
  if (!d) return [];
  const salida: CapturaOriginal[] = [];
  for (const lado of LADOS) {
    const grande = await leerArchivo(idCaptura(d.fecha, lado));
    const blob = grande ?? (await blobDeDataUrl(d.capturas.find((c) => c.lado === lado)?.url ?? ''));
    if (blob && blob.size) salida.push({ indice, lado, blob });
  }
  return salida;
}

export async function prepararEnvio(items: ItemPresupuesto[], sueltos: File[]): Promise<ResultadoPreparacion> {
  const avisos: string[] = [];
  const lineas = items.map(lineaDe);

  for (const f of sueltos) {
    if (f.size > MAX_ENVIO_BYTES) {
      return { error: `« ${f.name} » pèse ${formatoBytes(f.size)} et le maximum par envoi est de ${formatoBytes(MAX_ENVIO_BYTES)}. Retirez-le et envoyez-le-nous ensuite par WhatsApp ou par email.` };
    }
  }

  // Logos originales (IndexedDB; el delantero y, si lo hay, el trasero) y capturas de cada diseño del estudio.
  const logos: { indice: number; lado: Lado; archivo: File }[] = [];
  const capturas: CapturaOriginal[] = [];
  for (let i = 0; i < items.length; i++) {
    const d = items[i].diseno;
    if (!d) continue;
    const pares: [Lado, string | null | undefined, { nombre: string } | undefined][] = [
      ['delante', d.logoId, d.logo],
      ['detras', d.logoIdDetras, d.logoDetras],
    ];
    for (const [lado, id, meta] of pares) {
      if (!meta) continue;
      const logo = id ? await leerLogo(id) : null;
      if (logo) logos.push({ indice: i, lado, archivo: logo });
      else avisos.push(`Le fichier du logo ${nombreLogo(lado)} de « ${items[i].nombre} » (${meta.nombre}) n’était plus dans le navigateur du client : demandez-le-lui.`);
    }
    capturas.push(...(await capturasDe(items[i], i)));
  }

  // Lo que no se comprime: logos y archivos sueltos. Si no cabe, se reduce el logo más pesado (solo como último recurso).
  let fijo = logos.reduce((s, l) => s + l.archivo.size, 0) + sueltos.reduce((s, f) => s + f.size, 0);
  if (fijo > MAX_ENVIO_BYTES) {
    for (const l of [...logos].sort((a, b) => b.archivo.size - a.archivo.size)) {
      if (fijo <= MAX_ENVIO_BYTES) break;
      if (!RASTER.has(l.archivo.type)) continue;
      const reducido = await redibujar(l.archivo, LADO_LOGO_REDUCIDO, 'image/png');
      if (!reducido || reducido.size >= l.archivo.size) continue;
      const nombre = l.archivo.name.replace(/\.[^.]+$/, '') + '-reducido.png';
      avisos.push(`Le logo ${nombreLogo(l.lado)} d’origine « ${l.archivo.name} » pèse ${formatoBytes(l.archivo.size)} et ne tenait pas dans l’envoi : une copie PNG de ${LADO_LOGO_REDUCIDO} px est jointe. Demandez l’original au client.`);
      fijo -= l.archivo.size - reducido.size;
      l.archivo = new File([reducido], nombre, { type: 'image/png' });
    }
    if (fijo > MAX_ENVIO_BYTES) {
      return { error: `Vos fichiers pèsent ${formatoBytes(fijo)} et le maximum par envoi est de ${formatoBytes(MAX_ENVIO_BYTES)}. Retirez-en un et envoyez-le-nous ensuite par WhatsApp ou par email.` };
    }
  }

  // Capturas: JPEG sobre blanco, de más a menos calidad hasta que el envío quepa.
  let comprimidas: { indice: number; lado: Lado; archivo: File }[] = [];
  let nivel = -1;
  for (let n = 0; n < NIVELES.length && capturas.length; n++) {
    const [lado, calidad] = NIVELES[n];
    const intento = await Promise.all(
      capturas.map(async (c) => {
        const blob = await redibujar(c.blob, lado, 'image/jpeg', calidad);
        return blob ? { indice: c.indice, lado: c.lado, archivo: new File([blob], `visuel-${sufijoArchivo(c.lado)}.jpg`, { type: 'image/jpeg' }) } : null;
      }),
    );
    const listas = intento.filter((x): x is NonNullable<typeof x> => x !== null);
    const peso = listas.reduce((s, c) => s + c.archivo.size, 0);
    if (fijo + peso <= MAX_ENVIO_BYTES) {
      comprimidas = listas;
      nivel = n;
      break;
    }
  }
  if (capturas.length && nivel < 0) {
    avisos.push('Les captures du visuel ne tenaient pas dans l’envoi, même compressées : seul le logo est joint.');
  } else if (nivel > 0) {
    avisos.push(`Les captures du visuel sont compressées (${NIVELES[nivel][0]} px) pour que l’envoi tienne dans ${formatoBytes(MAX_ENVIO_BYTES)}.`);
  }

  const archivos: ArchivoEnvio[] = [
    ...logos.map((l) => ({ clave: claveLogo(l.indice, l.lado), archivo: l.archivo })),
    ...comprimidas.map((c) => ({ clave: claveCaptura(c.indice, c.lado), archivo: c.archivo })),
    ...sueltos.map((f) => ({ clave: CLAVE_ARCHIVOS, archivo: f })),
  ];
  const total = archivos.reduce((s, a) => s + a.archivo.size, 0);
  return { lineas, archivos, avisos, total };
}
