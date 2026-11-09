// Fotos de producto en varios tamaños (fase 4.4): cada foto del catálogo se publica procesada una sola vez en WebP
// de alta calidad a su tamaño grande (1200 px, o el del original si es menor: nunca se amplía) y a 800 px, y el
// navegador elige con `srcset`. No pasan por next/image: así no se vuelven a comprimir (la conversión a AVIF del
// optimizador aplanaba la textura de las prendas oscuras y, en algún negro, aclaraba el tono).
//
// Convención de nombres (scripts/fotos/recolor.py, guardar_webp_tamanos): `foto.webp` es el archivo grande y
// `foto-800.webp` el pequeño; `anchos` (del índice data/fotos-catalogo.json) lista los tamaños que existen, el
// grande primero. Módulo sin datos del catálogo: vale en el servidor y en el navegador.

export interface FuenteFoto {
  src: string;
  /** Anchos publicados, el grande primero (por ejemplo [1200, 800]). Sin él, solo existe `src`. */
  anchos?: number[];
}

/** Ruta del archivo de un ancho concreto. */
export function srcDeAncho(src: string, ancho: number, anchos: number[] | undefined): string {
  if (!anchos?.length || ancho === anchos[0]) return src;
  const punto = src.lastIndexOf('.');
  return punto < 0 ? `${src}-${ancho}` : `${src.slice(0, punto)}-${ancho}${src.slice(punto)}`;
}

/** Anchos que puede usar un sitio: todos los publicados, o solo los que no pasan de `anchoMaximo` (las tarjetas, de
 * 325 px CSS como mucho, no necesitan la foto de 1200; si ninguno cabe, el menor). */
export function anchosPara(foto: FuenteFoto, anchoMaximo?: number): number[] | undefined {
  const anchos = foto.anchos;
  if (!anchos?.length || !anchoMaximo) return anchos;
  const caben = anchos.filter((a) => a <= anchoMaximo);
  return caben.length ? caben : [Math.min(...anchos)];
}

/** `src` del archivo más grande que cabe en `anchoMaximo` (el grande si no hay límite). */
export function srcPara(foto: FuenteFoto, anchoMaximo?: number): string {
  const anchos = anchosPara(foto, anchoMaximo);
  if (!anchos?.length) return foto.src;
  return srcDeAncho(foto.src, Math.max(...anchos), foto.anchos);
}

/** `srcset` con los tamaños publicados que caben en `anchoMaximo` (undefined si solo queda uno). */
export function srcsetDe(foto: FuenteFoto, anchoMaximo?: number): string | undefined {
  const anchos = anchosPara(foto, anchoMaximo);
  if (!anchos || anchos.length < 2) return undefined;
  return anchos.map((a) => `${srcDeAncho(foto.src, a, foto.anchos)} ${a}w`).join(', ');
}

/** Ancho (px) del archivo mayor que se usa, para los atributos width/height del <img> (las fotos son cuadradas). */
export function anchoDe(foto: FuenteFoto, porDefecto = 600, anchoMaximo?: number): number {
  const anchos = anchosPara(foto, anchoMaximo);
  return anchos?.length ? Math.max(...anchos) : porDefecto;
}

/** El archivo más pequeño que cubre `anchoNecesario` píxeles de dispositivo (o el grande si ninguno llega). */
export function srcParaAncho(foto: FuenteFoto, anchoNecesario: number): string {
  const anchos = foto.anchos;
  if (!anchos || anchos.length < 2) return foto.src;
  const candidatos = [...anchos].sort((a, b) => a - b);
  const elegido = candidatos.find((a) => a >= anchoNecesario) ?? candidatos[candidatos.length - 1];
  return srcDeAncho(foto.src, elegido, anchos);
}

/**
 * Precarga fotos con el mismo `srcset` y `sizes` que usará el <img>, para que el navegador elija la misma candidata
 * y el revelado del color no enseñe nunca un hueco.
 */
export function precargarFotos(fotos: FuenteFoto[], sizes: string, anchoMaximo?: number) {
  if (typeof window === 'undefined') return;
  for (const foto of fotos) {
    const img = new window.Image();
    const srcset = srcsetDe(foto, anchoMaximo);
    if (srcset) {
      img.sizes = sizes;
      img.srcset = srcset;
    }
    img.src = srcPara(foto, anchoMaximo);
  }
}
