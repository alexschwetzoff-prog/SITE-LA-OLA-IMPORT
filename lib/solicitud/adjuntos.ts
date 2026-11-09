import 'server-only';

// Recoge los archivos del envío (logos y capturas de cada diseño del estudio, más los archivos sueltos del
// formulario), comprueba tipos y tamaños y los deja listos para adjuntar al email del equipo. Dos logos por diseño,
// adjuntos como logo-avant y logo-arriere con su extensión original (con varios diseños, visuel-N-…).

import { CLAVE_ARCHIVOS, MAX_CORREO_BYTES, MAX_ENVIO_BYTES, claveCaptura, claveLogo, formatoBytes, nombreLogo, sufijoArchivo, type Lado, type LineaCesta } from './comun';

export type CategoriaAdjunto = 'logo' | 'captura' | 'archivo';

export interface Adjunto {
  nombre: string;
  tipo: string;
  contenido: Buffer;
  tamano: number;
  categoria: CategoriaAdjunto;
  /** Índice de la línea de la cesta a la que pertenece (logos y capturas). */
  linea?: number;
  /** Capturas: la vista; logos: el delantero o el trasero (fase 10). */
  lado?: Lado;
  /** Identificador para incrustarlo en el HTML del email (capturas). */
  cid?: string;
}

const EXTENSIONES = new Set(['png', 'jpg', 'jpeg', 'svg', 'pdf', 'ai', 'webp']);
const TIPOS_POR_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  ai: 'application/postscript',
  webp: 'image/webp',
};
const MAX_ARCHIVOS_SUELTOS = 10;

function extensionDe(nombre: string): string {
  return nombre.toLowerCase().split('.').pop() ?? '';
}

/** Nombre seguro para el adjunto: sin rutas, sin caracteres raros, con su extensión. */
export function nombreSeguro(nombre: string, porDefecto = 'archivo'): string {
  const limpio = nombre
    .split(/[\\/]/)
    .pop()!
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return limpio && limpio !== '.' ? limpio : porDefecto;
}

function esArchivo(x: FormDataEntryValue | null): x is File {
  return x instanceof File && x.size > 0;
}

async function aAdjunto(archivo: File, base: Omit<Adjunto, 'nombre' | 'tipo' | 'contenido' | 'tamano'>, nombre: string): Promise<Adjunto> {
  const ext = extensionDe(nombre);
  const tipo = archivo.type && archivo.type !== 'application/octet-stream' ? archivo.type : (TIPOS_POR_EXTENSION[ext] ?? 'application/octet-stream');
  return { ...base, nombre, tipo, contenido: Buffer.from(await archivo.arrayBuffer()), tamano: archivo.size };
}

export type ResultadoAdjuntos = { adjuntos: Adjunto[]; total: number } | { error: string };

/**
 * Lee los archivos del FormData. Los índices de logo y capturas son los de la línea en la cesta. Rechaza extensiones
 * no permitidas y envíos por encima del límite (con un margen pequeño sobre lo que el navegador ya comprueba).
 */
export async function recogerAdjuntos(fd: FormData, lineas: LineaCesta[]): Promise<ResultadoAdjuntos> {
  const adjuntos: Adjunto[] = [];
  const disenos = lineas.filter((l) => l.diseno).length;
  for (let i = 0; i < lineas.length; i++) {
    const diseno = lineas[i].diseno;
    if (!diseno) continue;
    const n = i + 1;
    for (const lado of ['delante', 'detras'] as const) {
      const logo = fd.get(claveLogo(i, lado));
      if (!esArchivo(logo)) continue;
      const original = nombreSeguro(logo.name || (lado === 'delante' ? diseno.logo.nombre : (diseno.logoDetras?.nombre ?? '')), 'logo.png');
      const ext = extensionDe(original);
      if (!EXTENSIONES.has(ext)) return { error: `Le logo ${nombreLogo(lado)} « ${original} » n’est pas au format PNG, JPG, SVG, PDF ou AI.` };
      const nombre = `${disenos > 1 ? `visuel-${n}-` : ''}logo-${lado === 'delante' ? 'avant' : 'arriere'}.${ext}`;
      adjuntos.push(await aAdjunto(logo, { categoria: 'logo', linea: i, lado }, nombre));
    }
    for (const lado of ['delante', 'detras'] as const) {
      const captura = fd.get(claveCaptura(i, lado));
      if (!esArchivo(captura)) continue;
      const ext = captura.type === 'image/png' ? 'png' : 'jpg';
      adjuntos.push(await aAdjunto(captura, { categoria: 'captura', linea: i, lado, cid: `captura-${i}-${lado}` }, `visuel-${n}-${sufijoArchivo(lado)}.${ext}`));
    }
  }
  const sueltos = fd.getAll(CLAVE_ARCHIVOS).filter(esArchivo).slice(0, MAX_ARCHIVOS_SUELTOS);
  for (const archivo of sueltos) {
    const nombre = nombreSeguro(archivo.name);
    if (!EXTENSIONES.has(extensionDe(nombre))) return { error: `Le fichier « ${nombre} » n’est pas au format PNG, JPG, SVG, PDF ou AI.` };
    adjuntos.push(await aAdjunto(archivo, { categoria: 'archivo' }, nombre));
  }
  const total = adjuntos.reduce((s, a) => s + a.tamano, 0);
  if (total > MAX_ENVIO_BYTES * 1.1) {
    return { error: `Vos fichiers pèsent ${formatoBytes(total)} et le maximum par envoi est de ${formatoBytes(MAX_ENVIO_BYTES)}. Retirez-en un et envoyez-le-nous ensuite par WhatsApp ou par email.` };
  }
  if (total > MAX_CORREO_BYTES) {
    return { error: `Vos fichiers pèsent ${formatoBytes(total)} : c’est trop pour un email (${formatoBytes(MAX_CORREO_BYTES)} maximum).` };
  }
  return { adjuntos, total };
}
